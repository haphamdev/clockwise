import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from './app.exception';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as {
        message: string | string[];
      };
      response.status(status).json({
        statusCode: status,
        error: HttpStatus[status],
        code: exception.code,
        message: body.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as Record<string, unknown>).message;
      response.status(status).json({
        statusCode: status,
        error: HttpStatus[status],
        code: 'UNHANDLED',
        message,
      });
      return;
    }

    this.logger.error('Unhandled exception', exception);
    response.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
