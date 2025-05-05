// src/common/interceptors/transform.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // すでにApiResponse形式の場合はそのまま返す
        if (data && typeof data === 'object' && 'status' in data) {
          return data;
        }
        
        // それ以外は成功レスポンスとして整形
        return {
          status: 'success',
          data,
        } as ApiResponse<T>;
      }),
    );
  }
}