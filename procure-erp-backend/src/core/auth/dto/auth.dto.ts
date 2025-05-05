// src/core/auth/dto/auth.dto.ts

import { IsString, IsBoolean, IsOptional, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ValidationMessages } from '../../../common/validation/validation-messages';

export class LoginDto {
  @IsNotEmpty({ message: ValidationMessages.required('ユーザー名') })
  @IsString({ message: ValidationMessages.pattern('ユーザー名') })
  @MinLength(3, { message: ValidationMessages.minLength('ユーザー名', 3) })
  @MaxLength(50, { message: ValidationMessages.maxLength('ユーザー名', 50) })
  username: string;

  @IsNotEmpty({ message: ValidationMessages.required('パスワード') })
  @IsString({ message: ValidationMessages.pattern('パスワード') })
  @MinLength(4, { message: ValidationMessages.minLength('パスワード', 4) })
  password: string;

  @IsBoolean({ message: ValidationMessages.boolean('ログイン状態の保持') })
  @IsOptional()
  rememberMe: boolean = false;
}

export interface TokenResponseDto {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
}