import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'リフレッシュトークン（Cookieに保存されていない場合に使用）',
    required: false
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export interface RefreshTokenResponseDto {
  success: boolean;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
}