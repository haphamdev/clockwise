import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

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
        typeof body === "string"
          ? body
          : (body as Record<string, unknown>).message;
      response.status(status).json({
        statusCode: status,
        error: HttpStatus[status],
        code: "UNHANDLED",
        message,
      });
      return;
    }

    // Express body-parser PayloadTooLargeError
    // This is NOT a NestJS HttpException, so it's not caught by the branch above.
    if (
      typeof exception === "object" &&
      exception !== null &&
      (exception as Record<string, unknown>).type === "entity.too.large"
    ) {
      const length = (exception as Record<string, unknown>).length;
      this.logger.warn(`Payload too large: ${length} bytes`);
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: "PAYLOAD_TOO_LARGE",
        code: ErrorCode.COMMON.PAYLOAD_TOO_LARGE,
        message: "Request body is too large. Maximum file size is 5MB.",
      });
      return;
    }

    this.logger.error("Unhandled exception", exception);
    response.status(500).json({
      statusCode: 500,
      error: "INTERNAL_SERVER_ERROR",
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  }
}
