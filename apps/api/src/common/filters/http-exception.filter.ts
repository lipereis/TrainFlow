import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "object" && body !== null && "code" in body) {
        const shaped = body as { code: string; message?: string };
        response.status(status).json({
          code: shaped.code,
          message: shaped.message ?? exception.message,
        });
        return;
      }
      response.status(status).json({
        code: status === HttpStatus.UNAUTHORIZED ? "UNAUTHORIZED" : "FORBIDDEN",
        message:
          typeof body === "string" ? body : exception.message || "Request failed",
      });
      return;
    }

    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
