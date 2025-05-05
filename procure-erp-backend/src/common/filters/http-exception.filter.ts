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
      
      // デバッグ用：例外レスポンスの構造を確認
      console.log('Exception response structure:', JSON.stringify(exceptionResponse, null, 2));
      
      if (typeof exceptionResponse === 'object') {
        const error = exceptionResponse as Record<string, any>;
        
        // バリデーションエラーの特別処理
        if (status === 422 || status === 400) {
          // ValidationPipeから返される構造を確認
          if (error.error && error.error.details) {
            // すでに適切な形式になっている場合
            errorResponse.error = error.error;
          } else if (error.status === 'error' && error.error) {
            // 新しいバリデーションパイプの形式
            errorResponse.error = error.error;
          } else {
            // その他のケース（旧形式など）
            errorResponse.error = {
              code: 'VALIDATION_ERROR',
              message: '入力値の検証に失敗しました',
              details: error.details || error.message || error,
            };
          }
        } else {
          // その他のHTTPエラー
          errorResponse.error = {
            code: error.code || this.getErrorCodeFromStatus(status),
            message: error.message || '処理に失敗しました',
            details: error.details,
          };
        }
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