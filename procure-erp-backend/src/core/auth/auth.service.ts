import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto, TokenResponseDto } from './dto/auth.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly useMockDb: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {
    this.useMockDb = process.env.USE_MOCK_DB === 'true';
  }

  /**
   * Validate user credentials.
   */
  async validateUser(username: string, password: string): Promise<{ id: string; username: string; role: string } | null> {
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

    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '4h' });
    const refreshToken = loginDto.rememberMe ? this.jwtService.sign(payload, { expiresIn: '30d' }) : null;

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
      const decoded = this.jwtService.verify(token);
      const payload = { sub: decoded.sub, username: decoded.username, role: decoded.role };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '4h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

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
        user: null,
      };
    }
  }
}
