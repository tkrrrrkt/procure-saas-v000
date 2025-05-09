// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/mfa/dto/mfa.dto.ts

import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTotpDto {
  @ApiProperty({ description: 'MFA認証アプリから取得した6桁のコード', example: '123456' })
  @IsNotEmpty({ message: 'コードは必須です' })
  @IsString({ message: 'コードは文字列で入力してください' })
  @Length(6, 6, { message: 'コードは6桁である必要があります' })
  token: string;
}

export class SetupMfaDto {
  @ApiProperty({ description: 'MFA設定時に生成されたシークレット', example: 'JBSWY3DPEHPK3PXP' })
  @IsNotEmpty({ message: 'シークレットは必須です' })
  @IsString({ message: 'シークレットは文字列で入力してください' })
  secret: string;

  @ApiProperty({ description: 'MFA認証アプリから取得した6桁のコード', example: '123456' })
  @IsNotEmpty({ message: 'コードは必須です' })
  @IsString({ message: 'コードは文字列で入力してください' })
  @Length(6, 6, { message: 'コードは6桁である必要があります' })
  token: string;
}

export class VerifyRecoveryCodeDto {
  @ApiProperty({ description: 'リカバリーコード', example: 'ABCD-1234-EFGH-5678' })
  @IsNotEmpty({ message: 'リカバリーコードは必須です' })
  @IsString({ message: 'リカバリーコードは文字列で入力してください' })
  code: string;
}