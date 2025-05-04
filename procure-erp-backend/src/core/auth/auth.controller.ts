import { Controller, Post, Body, Res, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    try {
      console.log('=== ログインリクエスト受信 ===');
      console.log('リクエスト詳細:', { 
        username: loginDto.username, 
        passwordLength: loginDto.password?.length || 0,
        rememberMe: loginDto.rememberMe 
      });
      console.log('リクエストヘッダー:', JSON.stringify(response.req.headers));
      
      const validationResult = await this.authService.validateUser(loginDto.username, loginDto.password);
      console.log('ユーザー検証結果:', validationResult ? '成功' : '失敗');
      if (validationResult) {
        console.log('検証成功ユーザー情報:', JSON.stringify(validationResult));
      }
      
      if (!validationResult) {
        console.log('ユーザー検証に失敗しました。ログイン処理を中止します。');
        return { 
          success: false, 
          message: 'ユーザー名またはパスワードが正しくありません', 
          code: 'INVALID_CREDENTIALS',
          user: null
        };
      }
      
      const result = await this.authService.login(loginDto);
      console.log('認証結果:', { success: !!result, hasUser: !!result.user });
      
      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: loginDto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      });
      console.log('アクセストークンCookie設定完了');
      
      if (result.refreshToken) {
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30日間
        });
        console.log('リフレッシュトークンCookie設定完了');
      }
      
      console.log('ログイン成功レスポンス送信');
      return { 
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('ログインエラー詳細:', error);
      return { 
        success: false, 
        message: 'ログインに失敗しました', 
        code: 'LOGIN_FAILED',
        user: null // nullユーザーを明示的に返す
      };
    }
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Res({ passthrough: true }) response: Response) {
    try {
      const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
      
      response.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24時間
      });
      
      if (result.refreshToken) {
        response.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30日間
        });
      }
      
      return { 
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { 
        success: false, 
        message: 'トークンの更新に失敗しました', 
        code: 'TOKEN_REFRESH_FAILED',
        user: null
      };
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    response.clearCookie('refresh_token');
    
    return { 
      success: true,
      message: 'ログアウトしました'
    };
  }
}
