import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
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
