import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private useMockDb: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {
    this.useMockDb = process.env.USE_MOCK_DB === 'true';
    console.log(`AuthService: モックDBの使用: ${this.useMockDb}`);
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      console.log('=== ユーザー認証開始 ===');
      console.log(`ユーザー名: ${username}, パスワード長: ${password.length}`);
      console.log(`モックDB使用: ${this.useMockDb}`);
      
      let user;
      
      try {
        user = await this.prismaService.empAccount.findFirst({
          where: { emp_account_cd: username },
        });
      } catch (dbError) {
        console.error('データベース接続エラー:', dbError.message);
        
        if (this.useMockDb) {
          console.log('モックデータを使用してユーザーを検索します');
          
          if (username === 'test' && password === 'test') {
            console.log('テストユーザーが見つかりました');
            return {
              id: '3',
              username: 'test',
              role: 'USER'
            };
          }
          
          if (username === 'admin' && password === 'password') {
            console.log('管理者ユーザーが見つかりました');
            return {
              id: '1',
              username: 'admin',
              role: 'ADMIN'
            };
          }
        }
        
        console.log('ユーザーが見つかりませんでした');
        return null;
      }
      
      console.log('ユーザー検索結果:', user ? 'ユーザーが見つかりました' : 'ユーザーが見つかりません');

      if (!user) {
        console.log(`ユーザー "${username}" が見つかりませんでした`);
        return null;
      }

      if (!user.password_hash) {
        console.error('ユーザーにパスワードハッシュがありません:', username);
        return null;
      }

      console.log('パスワード比較:', { 
        inputPassword: password,
        hashLength: user.password_hash.length
      });
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('パスワード検証結果:', isPasswordValid ? '有効' : '無効');

      if (!isPasswordValid) {
        console.log(`ユーザー "${username}" のパスワードが無効です`);
        return null;
      }

      console.log(`ユーザー "${username}" の認証に成功しました`);
      const { password_hash: _, ...result } = user;
      return {
        id: user.emp_account_id,
        username: user.emp_account_cd,
        role: user.role
      };
    } catch (error) {
      console.error('ユーザー検証エラー:', error);
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    console.log('=== ログインリクエスト受信 ===');
    console.log('リクエスト詳細:', { 
      username: loginDto.username, 
      passwordLength: loginDto.password.length,
      rememberMe: loginDto.rememberMe 
    });
    
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      console.log('ユーザー検証結果: 失敗');
      console.log('ユーザー検証に失敗しました。ログイン処理を中止します。');
      
      return {
        success: false,
        message: 'ユーザー名またはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
        user: null,
        accessToken: null,
        refreshToken: null
      };
    }

    console.log('ユーザー検証結果: 成功');
    console.log('JWTトークンを生成します');
    
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '4h',
    });

    let refreshToken = null;
    if (loginDto.rememberMe) {
      refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
      });
    }

    console.log('ログイン処理が完了しました');
    
    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string): Promise<RefreshTokenResponseDto> {
    try {
      const decoded = this.jwtService.verify(token);
      
      const payload = {
        sub: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '4h',
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: decoded.sub,
          username: decoded.username,
          role: decoded.role,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'リフレッシュトークンが無効です',
        code: 'INVALID_REFRESH_TOKEN',
        accessToken: null,
        refreshToken: null,
        user: null
      };
    }
  }
}
