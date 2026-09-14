import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter
{
  private readonly logger =
    new Logger(HttpExceptionFilter.name);

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const context =
      host.switchToHttp();

    const request =
      context.getRequest<Request>();

    const response =
      context.getResponse<Response>();

    const method =
      request.method;

    const url =
      request.originalUrl ||
      request.url;

    let status =
      HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      'Internal server error.';

    let responseBody:
      | string
      | Record<string, unknown>
      | undefined;

    if (
      exception instanceof HttpException
    ) {
      status =
        exception.getStatus();

      const exceptionResponse =
        exception.getResponse();

      if (
        typeof exceptionResponse ===
        'string'
      ) {
        message =
          exceptionResponse;

        responseBody =
          exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse ===
          'object'
      ) {
        responseBody =
          exceptionResponse as Record<
            string,
            unknown
          >;

        const exceptionMessage =
          (
            exceptionResponse as Record<
              string,
              unknown
            >
          ).message;

        if (
          typeof exceptionMessage ===
          'string'
        ) {
          message =
            exceptionMessage;
        } else if (
          Array.isArray(
            exceptionMessage,
          )
        ) {
          message =
            exceptionMessage.join(', ');
        } else {
          message =
            exception.message;
        }
      } else {
        message =
          exception.message;
      }
    } else if (
      exception instanceof Error
    ) {
      message =
        exception.message ||
        'Internal server error.';
    }

    const stack =
      exception instanceof Error
        ? exception.stack
        : undefined;

    this.logger.error(
      [
        '',
        '========== HTTP ERROR ==========',
        `Method: ${method}`,
        `URL: ${url}`,
        `Status: ${status}`,
        `Error: ${message}`,
        stack
          ? `Stack:\n${stack}`
          : 'Stack: unavailable',
        '================================',
      ].join('\n'),
    );

    if (
      status >=
      HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      response.status(status).json({
        statusCode: status,
        message:
          'Internal server error.',
      });

      return;
    }

    if (
      responseBody !== undefined
    ) {
      response
        .status(status)
        .json(responseBody);

      return;
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}