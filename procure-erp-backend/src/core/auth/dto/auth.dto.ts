// src/core/auth/dto/auth.dto.ts

import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'ユーザー名は文字列で入力してください' })
  @MinLength(3, { message: 'ユーザー名は最低3文字以上必要です' })
  @MaxLength(50, { message: 'ユーザー名は最大50文字までです' })
  username: string;

  @IsString({ message: 'パスワードは文字列で入力してください' })
  @MinLength(4, { message: 'パスワードは最低6文字以上必要です' })
  password: string;

  @IsBoolean({ message: 'ログイン状態の保持は真偽値で指定してください' })
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