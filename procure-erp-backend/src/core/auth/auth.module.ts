// src/core/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { DatabaseModule } from '../database/database.module';
import { ThrottlerModule } from '../../common/throttler/throttler.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisModule } from '../redis/redis.module';
import { MfaModule } from './mfa/mfa.module'; // MfaModuleをインポート

@Module({
  imports: [
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '4h'),
        },
      }),
    }),
    DatabaseModule,
    ThrottlerModule,
    MfaModule, // MfaModuleを追加
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    LocalStrategy,
    TokenBlacklistService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}