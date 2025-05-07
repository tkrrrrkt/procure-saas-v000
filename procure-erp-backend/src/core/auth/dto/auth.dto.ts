import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'user123', 
    description: 'ユーザーログイン用のアカウントコードまたはユーザー名',
    required: true
  })
  @IsString()
  @IsNotEmpty({ message: 'ユーザー名を入力してください' })
  username: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'ユーザーアカウントのパスワード',
    required: true,
    minLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: 'パスワードを入力してください' })
  password: string;

  @ApiProperty({ 
    example: false, 
    description: 'ログイン状態を長期間保持するかどうか（リフレッシュトークンの発行）',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  rememberMe: boolean;
}

export interface TokenResponseDto {
  success: boolean;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
  accessToken: string | null;
  refreshToken?: string | null;
}