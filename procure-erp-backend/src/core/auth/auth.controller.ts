import { Controller, Post, Body, Req, Res, Logger, Get } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse as SwaggerResponse, 
  ApiBearerAuth, 
  ApiBody, 
  ApiCookieAuth 
} from '@nestjs/swagger';

/**
 * Authentication controller
 *
 * All endpoints return a unified ApiResponse structure.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   * レート制限: 10リクエスト/分（デフォルトよりも厳しく）
   */
  @ApiOperation({ summary: 'ユーザーログイン', description: 'ユーザー名とパスワードでログイン認証を行い、JWTトークンを発行します' })
  @ApiBody({ type: LoginDto })
  @SwaggerResponse({ 
    status: 200, 
    description: 'ログイン成功', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: { 
          type: 'object',
          properties: {
            user: { 
              type: 'object', 
              properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                username: { type: 'string', example: 'user123' },
                role: { type: 'string', example: 'USER' }
              }
            },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' }
          }
        }
      }
    }
  })
  @SwaggerResponse({ 
    status: 401, 
    description: '認証失敗', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: { 
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_CREDENTIALS' },
            message: { type: 'string', example: 'ユーザー名またはパスワードが正しくありません' }
          }
        }
      }
    }
  })
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
  @ApiOperation({ summary: 'トークンのリフレッシュ', description: 'リフレッシュトークンを使用して新しいアクセストークンを取得します' })
  @ApiCookieAuth('refresh_token')
  @ApiBody({ type: RefreshTokenDto, required: false, description: 'Cookieがない場合にリクエストボディでリフレッシュトークンを指定可能' })
  @SwaggerResponse({ 
    status: 200, 
    description: 'トークンリフレッシュ成功', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: { 
          type: 'object',
          properties: {
            user: { 
              type: 'object', 
              properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                username: { type: 'string', example: 'user123' },
                role: { type: 'string', example: 'USER' }
              }
            },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' }
          }
        }
      }
    }
  })
  @SwaggerResponse({ 
    status: 401, 
    description: 'リフレッシュトークンが無効', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: { 
          type: 'object',
          properties: {
            code: { type: 'string', example: 'TOKEN_REFRESH_FAILED' },
            message: { type: 'string', example: 'トークンの更新に失敗しました' }
          }
        }
      }
    }
  })
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
  @ApiOperation({ summary: 'ログアウト', description: '認証用Cookieを削除してログアウト状態にします' })
  @ApiCookieAuth('token')
  @SwaggerResponse({ 
    status: 200, 
    description: 'ログアウト成功', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: { 
          type: 'object',
          properties: {
            message: { type: 'string', example: 'ログアウトしました' }
          }
        }
      }
    }
  })
  @SkipThrottle()
  @Post('logout')
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

  /**
   * Check auth status endpoint
   */
  @ApiOperation({ summary: '認証状態の確認', description: '現在のユーザーの認証状態を確認します' })
  @ApiBearerAuth('access-token')
  @SwaggerResponse({ 
    status: 200, 
    description: '認証状態確認成功', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: { 
          type: 'object',
          properties: {
            authenticated: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @SwaggerResponse({ 
    status: 401, 
    description: '未認証', 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: { 
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: '認証されていません' }
          }
        }
      }
    }
  })
  @SkipThrottle()
  @Get('check')
  async checkAuth(
    @Req() request: Request,
  ): Promise<ApiResponse<{ authenticated: boolean }>> {
    // JWTストラテジーで認証されていればtrueが返る
    // 実際の実装ではJWTGuardを使用する
    const isAuthenticated = !!request.cookies['token'];

    return {
      status: 'success',
      data: {
        authenticated: isAuthenticated
      },
    };
  }
}