import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName: string | null = null;
    const extra: Record<string, any> = {};

    // ─── 1. Nest HttpException (UnauthorizedException, HealthCheckError, etc.) ──
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;

        // Preserve ALL response fields first (status, details, errors, info,
        // error name, etc.) — Terminus HealthCheckError returns {status:'error', info:{}, error:{}}
        for (const key of Object.keys(resp)) {
          if (key === 'message' || key === 'statusCode') continue;
          extra[key] = resp[key];
        }

        if (resp.message !== undefined) {
          message = resp.message;
        }
        if (resp.errors !== undefined) {
          extra.errors = resp.errors;
        }
        if (resp.error !== undefined) {
          errorName = resp.error;
        }
      }

      // ── Terminus HealthCheckError — keep original structured response intact,
      //    just inject timestamp/path for debugging (never overwrite Terminus fields)
      if (errorName === 'HealthCheckError' || extra.status === 'error' || extra.details) {
        const terminusResp = exceptionResponse as any;
        response.status(status).json({
          ...terminusResp,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        });
        this.logger.warn(
          `Health check failed ${request.method} ${request.url} status=${status}`,
        );
        return;
      }
    }
    // ─── 2. Plain JavaScript Error (uncaught from libraries, Prisma, etc.) ───
    else if (exception instanceof Error) {
      errorName = exception.name;
      message = exception.message;

      // Prisma-specific error code mapping
      const prismaCode = (exception as any).code;
      if (typeof prismaCode === 'string') {
        switch (prismaCode) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message =
              `Duplicate entry: ${(exception as any).meta?.target?.join(', ') || 'field'} already exists`;
            break;
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Record not found';
            break;
          case 'P2003':
            status = HttpStatus.BAD_REQUEST;
            message = 'Foreign key constraint failed';
            break;
          case 'P2014':
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid relation';
            break;
          default:
            // Other Prisma errors → keep 500 but expose actual code to admin
            extra.prismaCode = prismaCode;
            if ((exception as any).meta) extra.prismaMeta = (exception as any).meta;
            message = 'Database error occurred';
        }
      }
    }
    // ─── 3. Unknown / non-Error thrown values (strings, numbers, nulls) ─────
    else {
      message = String(exception ?? 'Unknown error');
      extra.raw = exception;
    }

    const errorResponse: Record<string, any> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errorName && { error: errorName }),
      ...(Object.keys(extra).length > 0 && extra),
    };

    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'error';
    if (level === 'error') {
      this.logger.error(
        `${request.method} ${request.url} status=${status}`,
        JSON.stringify(errorResponse),
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} status=${status} msg=${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
