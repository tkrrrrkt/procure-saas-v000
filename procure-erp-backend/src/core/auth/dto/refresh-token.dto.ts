// src/core/auth/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from '../../../common/validation/validation-messages';

export class RefreshTokenDto {
  @IsNotEmpty({ message: ValidationMessages.required('リフレッシュトークン') })
  @IsString()
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
  message?: string;
  code?: string;
}