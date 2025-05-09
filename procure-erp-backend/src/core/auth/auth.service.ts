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
  async validateUser(username: string, password: string): Promise<{ id: string; username: string; role: string; tenant_id?: string; login_account_id?: string } | null> {
    try {
      // LoginAccountテーブルからユーザー検索
      let loginAccount = await this.prismaService.loginAccount.findFirst({
        where: { username: username },
        include: {
          empAccount: true // 関連する従業員情報も取得
        }
      });

      // Fallback to mock DB
      if (!loginAccount && this.useMockDb) {
        if (username === 'test' && password === 'test') {
          return { id: '3', username: 'test', role: 'USER', login_account_id: '3' };
        }
        if (username === 'admin' && password === 'password') {
          return { id: '1', username: 'admin', role: 'ADMIN', login_account_id: '1' };
        }
      }

      // 後方互換性のため、もしLoginAccountにないなら従来のEmpAccountを検索
      if (!loginAccount) {
        const empAccount = await this.prismaService.empAccount.findFirst({
          where: { emp_account_cd: username },
        });

        // 古いスキーマでは一時的に動作させる（移行期間中のみ）
        if (empAccount && this.useMockDb) {
          // この部分は移行が完了したら削除
          const isPasswordValid = await bcrypt.compare(password, "dummy_hash"); // ダミーハッシュで検証
          if (password === 'test123') {
            return {
              id: empAccount.emp_account_id,
              username: empAccount.emp_account_cd,
              role: empAccount.role,
              tenant_id: empAccount.tenant_id,
            };
          }
        }
        
        return null;
      }

      // パスワード検証
      const isPasswordValid = await bcrypt.compare(password, loginAccount.password_hash);
      if (!isPasswordValid) return null;

      // アカウント状態チェック
      if (loginAccount.status !== 'active') {
        this.logger.warn(`Inactive account tried to login: ${username}`);
        return null;
      }

      // 関連付けられた従業員情報があるか
      if (loginAccount.empAccount) {
        // 従業員情報がある場合
        return {
          id: loginAccount.empAccount.emp_account_id, // 従業員IDを返す
          username: loginAccount.username,
          role: loginAccount.role,
          tenant_id: loginAccount.tenant_id,
          login_account_id: loginAccount.id, // LoginAccountのIDも含める
        };
      } else {
        // 従業員情報がない場合（システムアカウントなど）
        return {
          id: loginAccount.id, // LoginAccountのIDを代用
          username: loginAccount.username,
          role: loginAccount.role,
          tenant_id: loginAccount.tenant_id,
          login_account_id: loginAccount.id,
        };
      }
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
      tenant_id: user.tenant_id,
      login_account_id: user.login_account_id // LoginAccountのIDも含める
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
      
      // JWT内のsubフィールドがユーザーID
      const userId = decoded.sub;
      
      // ユーザー情報を取得（優先順位：LoginAccountから取得 → エラー時はfallback）
      let userData = null;
      
      // まずLoginAccountからユーザーを検索
      const loginAccount = await this.prismaService.loginAccount.findFirst({
        where: { 
          OR: [
            { id: userId }, // LoginAccountのIDで検索
            { emp_account_id: userId } // または関連付けられた従業員IDで検索
          ]
        },
        include: {
          empAccount: true
        }
      });
      
      if (loginAccount) {
        // LoginAccountが見つかった場合
        if (loginAccount.empAccount) {
          // 従業員情報がある場合
          userData = {
            id: loginAccount.empAccount.emp_account_id,
            username: loginAccount.username,
            role: loginAccount.role,
            tenant_id: loginAccount.tenant_id,
            login_account_id: loginAccount.id,
          };
        } else {
          // 従業員情報がない場合
          userData = {
            id: loginAccount.id,
            username: loginAccount.username,
            role: loginAccount.role,
            tenant_id: loginAccount.tenant_id,
            login_account_id: loginAccount.id,
          };
        }
      } else {
        // 旧システムとの互換性のため、EmpAccountからも検索
        const empAccount = await this.prismaService.empAccount.findUnique({
          where: { emp_account_id: userId },
        });
        
        if (empAccount) {
          userData = {
            id: empAccount.emp_account_id,
            username: empAccount.emp_account_cd,
            role: empAccount.role,
            tenant_id: empAccount.tenant_id
          };
        }
      }
      
      // ユーザーが見つからない場合はエラー
      if (!userData) {
        throw new UnauthorizedException('無効なユーザーです');
      }

      // 新しいペイロードを作成
      const payload = { 
        sub: userData.id, 
        username: userData.username, 
        role: userData.role,
        tenant_id: userData.tenant_id,
        login_account_id: userData.login_account_id // 追加
      };

      // 新しいトークンを発行
      const accessToken = this.jwtService.sign(payload, { 
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '4h') 
      });
      
      const refreshToken = this.jwtService.sign(
        { sub: userData.id },
        { 
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '30d') 
        }
      );

      // リフレッシュトークン使用を記録
      if (userData.login_account_id) {
        await this.prismaService.loginAccount.update({
          where: { id: userData.login_account_id },
          data: { last_login: new Date() },
        });
      }

      return {
        success: true,
        accessToken,
        refreshToken,
        user: userData,
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