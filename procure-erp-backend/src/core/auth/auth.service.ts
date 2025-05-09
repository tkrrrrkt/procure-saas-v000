import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  private readonly useMockDb: boolean;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    this.useMockDb = process.env.USE_MOCK_DB === 'true';
  }

  /**
   * Validate user credentials.
   */
  async validateUser(username: string, password: string): Promise<{ id: string; username: string; role: string; tenant_id?: string } | null> {
    try {
      let user = await this.prismaService.empAccount.findFirst({
        where: { emp_account_cd: username },
      });

      // Fallback to mock DB
      if (!user && this.useMockDb) {
        if (username === 'test' && password === 'test') {
          return { id: '3', username: 'test', role: 'USER' };
        }
        if (username === 'admin' && password === 'password') {
          return { id: '1', username: 'admin', role: 'ADMIN' };
        }
      }

      if (!user || !user.password_hash) return null;

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) return null;

      return {
        id: user.emp_account_id,
        username: user.emp_account_cd,
        role: user.role,
        tenant_id: user.tenant_id,
      };
    } catch (error) {
      // Log & swallow to prevent auth leakage
      console.error('validateUser error:', error);
      return null;
    }
  }

  /**
   * Login – returns JWT & user info inside a TokenResponseDto
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      return {
        success: false,
        message: 'ユーザー名またはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
        user: null,
        accessToken: null,
        refreshToken: null,
      };
    }

    const payload = { 
      sub: user.id, 
      username: user.username, 
      role: user.role,
      tenant_id: user.tenant_id 
    };

    const accessToken = this.jwtService.sign(payload, { 
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '4h') 
    });
    
    const refreshToken = loginDto.rememberMe 
      ? this.jwtService.sign(
          { sub: user.id },
          { 
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '30d') 
          }
        ) 
      : null;

    return {
      success: true,
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Generate new JWTs using a refresh token.
   */
  async refreshToken(token: string): Promise<RefreshTokenResponseDto> {
    try {
      // リフレッシュトークンを検証（JWT_REFRESH_SECRETで署名されている）
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      
      // ユーザー情報を取得
      const user = await this.prismaService.empAccount.findUnique({
        where: { emp_account_id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('無効なユーザーです');
      }

      // 新しいペイロードを作成
      const payload = { 
        sub: user.emp_account_id, 
        username: user.emp_account_cd, 
        role: user.role,
        tenant_id: user.tenant_id
      };

      // 新しいトークンを発行
      const accessToken = this.jwtService.sign(payload, { 
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '4h') 
      });
      
      const refreshToken = this.jwtService.sign(
        { sub: user.emp_account_id },
        { 
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '30d') 
        }
      );

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.emp_account_id,
          username: user.emp_account_cd,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`トークンのリフレッシュに失敗しました: ${error.message}`);
      
      return {
        success: false,
        message: 'リフレッシュトークンが無効です',
        code: 'INVALID_REFRESH_TOKEN',
        accessToken: null,
        refreshToken: null,
        user: null,
      };
    }
  }

  /**
   * Logout by blacklisting the token.
   * This is a new method for token invalidation.
   */
  async logout(token: string) {
    try {
      // トークンをブラックリストに追加
      await this.tokenBlacklistService.blacklistToken(token);
      return { success: true };
    } catch (error) {
      this.logger.error(`ログアウト処理に失敗しました: ${error.message}`);
      return { 
        success: false, 
        message: 'ログアウト処理に失敗しました',
        code: 'LOGOUT_FAILED' 
      };
    }
  }
}