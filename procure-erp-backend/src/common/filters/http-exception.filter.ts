// src/common/filters/http-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ApiResponse<null> = {
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '内部サーバーエラーが発生しました',
      },
    };
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        const error = exceptionResponse as Record<string, any>;
        errorResponse.error = {
          code: error.code || this.getErrorCodeFromStatus(status),
          message: error.message || '処理に失敗しました',
          details: error.details,
        };
      } else {
        errorResponse.error = {
          code: this.getErrorCodeFromStatus(status),
          message: exceptionResponse as string,
        };
      }
    }
    
    // エラーログ記録（本番環境ではより詳細なロギングを実装）
    console.error(`エラー発生: ${request.method} ${request.url}`, exception);
    
    response.status(status).json(errorResponse);
  }
  
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED: return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN: return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND: return 'NOT_FOUND';
      case HttpStatus.UNPROCESSABLE_ENTITY: return 'VALIDATION_ERROR';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}