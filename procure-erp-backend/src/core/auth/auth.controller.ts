import { Controller, Post, Body, Req, Res, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

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
   * レート制限: 10リクエスト/分（デフォルトよりも厳しく）
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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

      // Cookie 設定 - アクセストークン
      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',  // アプリケーション全体でアクセス可能
        maxAge: loginDto.rememberMe
          ? 4 * 60 * 60 * 1000  // 4時間（JWTの有効期限と合わせる）
          : 4 * 60 * 60 * 1000, // 4時間
      });

      if (result.refreshToken) {
        // リフレッシュトークンのCookie設定を強化
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || true, // 開発環境でもSecure推奨
          sameSite: 'strict',
          path: '/api/auth',  // 認証エンドポイントのみに制限
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30日
        });
      }

      this.logger.log(`Login succeeded for user: ${loginDto.username}`);
      
      // レスポンスからリフレッシュトークンを削除（セキュリティ強化）
      // クライアントはCookieから取得するため、レスポンスボディに含める必要はない
      return {
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          // リフレッシュトークンをレスポンスボディから除外
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
   * レート制限: 30リクエスト/分（デフォルトよりも緩く）
   */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ user: any; accessToken: string }>> {
    this.logger.log('Token refresh request received');

    try {
      // Cookieからリフレッシュトークンを取得（リクエストボディより優先）
      const cookieRefreshToken = request.cookies['refresh_token'];
      const tokenToUse = cookieRefreshToken || refreshTokenDto.refreshToken;
      
      if (!tokenToUse) {
        return {
          status: 'error',
          error: {
            code: 'REFRESH_TOKEN_MISSING',
            message: 'リフレッシュトークンが見つかりません',
          },
        };
      }
      
      const result = await this.authService.refreshToken(tokenToUse);

      if (!result.success) {
        return {
          status: 'error',
          error: {
            code: result.code ?? 'TOKEN_REFRESH_FAILED',
            message: result.message ?? 'トークンの更新に失敗しました',
          },
        };
      }

      // アクセストークンのCookie設定
      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || true,
        sameSite: 'strict',
        path: '/',
        maxAge: 4 * 60 * 60 * 1000, // 4時間
      });

      if (result.refreshToken) {
        // リフレッシュトークンのCookie設定を強化
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || true,
          sameSite: 'strict',
          path: '/api/auth',  // 認証エンドポイントのみに制限
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30日
        });
      }

      // リフレッシュトークンをレスポンスボディから除外
      return {
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          // リフレッシュトークンは含めない
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
   * レート制限を適用しない
   */
  @SkipThrottle()
  async logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiResponse<{ message: string }>> {
    // トークンCookieを削除（すべてのパラメータを一致させる）
    response.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || true,
      sameSite: 'strict',
      path: '/',
    });
    
    // リフレッシュトークンCookieを削除（パスを指定）
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || true,
      sameSite: 'strict',
      path: '/api/auth',
    });

    this.logger.log('User logged out');

    return {
      status: 'success',
      data: {
        message: 'ログアウトしました',
      },
    };
  }
}