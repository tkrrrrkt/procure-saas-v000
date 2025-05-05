import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';

/**
 * Authentication controller
 *
 * All endpoints return a unified ApiResponse structure.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ user: any; accessToken: string; refreshToken?: string }>> {
    this.logger.log(`Login request received for user: ${loginDto.username}`);

    try {
      // AuthService に委譲
      const result = await this.authService.login(loginDto);

      if (!result.success) {
        this.logger.warn(`Invalid credentials for user: ${loginDto.username}`);
        return {
          status: 'error',
          error: {
            code: result.code ?? 'INVALID_CREDENTIALS',
            message: result.message ?? 'ユーザー名またはパスワードが正しくありません',
          },
        };
      }

      // Cookie 設定
      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: loginDto.rememberMe
          ? 7 * 24 * 60 * 60 * 1000 // 7 days
          : 24 * 60 * 60 * 1000,   // 24 hours
      });

      if (result.refreshToken) {
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      this.logger.log(`Login succeeded for user: ${loginDto.username}`);
      return {
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error) {
      this.logger.error('Login error', error instanceof Error ? error.stack : undefined);
      return {
        status: 'error',
        error: {
          code: 'LOGIN_FAILED',
          message: 'ログインに失敗しました',
        },
      };
    }
  }

  /**
   * Refresh JWT tokens using a refresh token.
   */
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ user: any; accessToken: string; refreshToken?: string }>> {
    this.logger.log('Token refresh request received');

    try {
      const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);

      if (!result.success) {
        return {
          status: 'error',
          error: {
            code: result.code ?? 'TOKEN_REFRESH_FAILED',
            message: result.message ?? 'トークンの更新に失敗しました',
          },
        };
      }

      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      if (result.refreshToken) {
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }

      return {
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      };
    } catch (error) {
      this.logger.error('Token refresh error', error instanceof Error ? error.stack : undefined);
      return {
        status: 'error',
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'トークンの更新に失敗しました',
        },
      };
    }
  }

  /**
   * Logout endpoint – clears authentication cookies.
   */
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ message: string }>> {
    response.clearCookie('token');
    response.clearCookie('refresh_token');

    this.logger.log('User logged out');

    return {
      status: 'success',
      data: {
        message: 'ログアウトしました',
      },
    };
  }
}
