// src/common/pipes/validation.pipe.ts

import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException,
  ValidationError,
  ValidationPipe as NestValidationPipe
} from '@nestjs/common';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = this.formatErrors(errors);
        return new BadRequestException({
          status: 'error',
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値の検証に失敗しました',
            details: formattedErrors,
          }
        });
      },
    });
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints;
      
      if (constraints) {
        result[property] = Object.values(constraints);
      }
      
      // ネストされたバリデーションエラーの処理
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children);
        Object.keys(childErrors).forEach(key => {
          const nestedKey = `${property}.${key}`;
          result[nestedKey] = childErrors[key];
        });
      }
    });
    
    return result;
  }
}