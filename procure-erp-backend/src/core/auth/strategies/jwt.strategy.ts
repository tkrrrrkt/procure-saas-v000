import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'testSecretKey',
    });
  }

  async validate(payload: any) {
    try {
      const { sub: userId } = payload;
      
      const user = await this.prismaService.empAccount.findUnique({
        where: { emp_account_id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('認証に失敗しました');
      }

      const { password_hash, ...result } = user;
      
      return {
        id: user.emp_account_id,
        username: user.emp_account_cd,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('認証に失敗しました');
    }
  }
}
