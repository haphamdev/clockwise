import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, body, query, params } = req;
    const userId = (req as unknown as Record<string, unknown>).user
      ? ((req as unknown as Record<string, unknown>).user as { id?: string }).id
      : 'anonymous';

    const input: Record<string, unknown> = {};
    if (Object.keys(params).length) input.params = params;
    if (Object.keys(query).length) input.query = query;
    if (body && Object.keys(body).length) input.body = body;

    this.logger.log(
      `→ ${method} ${originalUrl} user=${userId} ${Object.keys(input).length ? JSON.stringify(input) : ''}`,
    );

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const res = context.switchToHttp().getResponse<Response>();
          const ms = Date.now() - start;
          this.logger.log(
            `← ${method} ${originalUrl} ${res.statusCode} ${ms}ms ${JSON.stringify(data)}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = err?.getStatus?.() ?? err?.status ?? 500;
          const detail =
            err instanceof HttpException
              ? JSON.stringify(err.getResponse())
              : (err.message ?? err);
          this.logger.warn(
            `← ${method} ${originalUrl} ${status} ${ms}ms ${detail}`,
          );
        },
      }),
    );
  }
}
