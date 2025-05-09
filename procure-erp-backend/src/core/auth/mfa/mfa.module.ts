// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/mfa/mfa.module.ts

import { Module } from '@nestjs/common';
import { TotpService } from './totp.service';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  ],
  controllers: [MfaController],
  providers: [TotpService, MfaService, PrismaService],
  exports: [TotpService, MfaService],
})
export class MfaModule {}