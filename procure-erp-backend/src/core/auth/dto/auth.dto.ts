import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
  
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export interface TokenResponseDto {
  success: boolean;
  accessToken: string | null;
  refreshToken?: string | null;
  message?: string;
  code?: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
}
