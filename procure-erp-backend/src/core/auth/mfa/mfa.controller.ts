// /mnt/c/21_procure-saas/procure-erp-backend/src/core/auth/mfa/mfa.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MfaService } from './mfa.service';
import { VerifyTotpDto, SetupMfaDto, VerifyRecoveryCodeDto } from './dto/mfa.dto';
import { Request } from 'express';
import { ApiResponse as AppResponse } from '../../../common/interfaces/api-response.interface';
import { PrivilegedOperation } from '../../../common/decorators/privileged-operation.decorator';

@ApiTags('mfa')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @ApiOperation({ summary: 'MFA設定の初期化', description: 'ユーザー用のMFA設定を初期化し、QRコードとシークレットを取得します' })
  @ApiResponse({
    status: 200,
    description: 'MFA設定初期化成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            secret: { type: 'string', example: 'JBSWY3DPEHPK3PXP' },
            qrCodeDataUrl: { type: 'string', example: 'data:image/png;base64,...' },
            recoveryCodes: {
              type: 'array',
              items: { type: 'string' },
              example: ['ABCD-1234-EFGH-5678', '...']
            }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @PrivilegedOperation('MFA設定の初期化')
  @Get('setup')
  async setupMfa(@Req() req): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const result = await this.mfaService.setupMfa(userId);

    return {
      status: 'success',
      data: result,
    };
  }

  @ApiOperation({ summary: 'MFAの有効化', description: 'MFAを有効化し、リカバリーコードを生成します' })
  @ApiResponse({
    status: 200,
    description: 'MFA有効化成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            recoveryCodes: {
              type: 'array',
              items: { type: 'string' },
              example: ['ABCD-1234-EFGH-5678', '...']
            }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @PrivilegedOperation('MFA機能の有効化')
  @Post('enable')
  async enableMfa(
    @Req() req,
    @Body() setupMfaDto: SetupMfaDto,
  ): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const result = await this.mfaService.enableMfa(
      userId,
      setupMfaDto.token,
      setupMfaDto.secret,
    );

    return {
      status: 'success',
      data: result,
    };
  }

  @ApiOperation({ summary: 'MFAの無効化', description: 'ユーザーのMFAを無効化します' })
  @ApiResponse({
    status: 200,
    description: 'MFA無効化成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            disabled: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @PrivilegedOperation('MFA機能の無効化')
  @Post('disable')
  async disableMfa(@Req() req): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const result = await this.mfaService.disableMfa(userId);

    return {
      status: 'success',
      data: result,
    };
  }

  @ApiOperation({ summary: 'MFAトークンの検証', description: 'MFA認証アプリから取得したトークンを検証します' })
  @ApiResponse({
    status: 200,
    description: 'MFAトークン検証成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            verified: { type: 'boolean', example: true },
            mfaToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'MFAトークン検証失敗',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_MFA_TOKEN' },
            message: { type: 'string', example: '無効なMFAトークンです' }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @PrivilegedOperation('MFAトークン検証')
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyMfa(
    @Req() req,
    @Body() verifyTotpDto: VerifyTotpDto,
  ): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const isValid = await this.mfaService.verifyMfaToken(userId, verifyTotpDto.token);

    if (!isValid) {
      return {
        status: 'error',
        error: {
          code: 'INVALID_MFA_TOKEN',
          message: '無効なMFAトークンです',
        },
      };
    }

    // MFA検証後の一時トークンを生成
    const mfaVerifiedToken = this.mfaService.generateMfaVerifiedToken(userId);

    return {
      status: 'success',
      data: {
        verified: true,
        mfaToken: mfaVerifiedToken,
      },
    };
  }

  @ApiOperation({ summary: 'リカバリーコードの使用', description: 'リカバリーコードを使用してMFA認証をパスします' })
  @ApiResponse({
    status: 200,
    description: 'リカバリーコード検証成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            verified: { type: 'boolean', example: true },
            mfaToken: { type: 'string', example: 'eyJhbGciOiJIUzI1...' }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @PrivilegedOperation('リカバリーコード検証')
  @HttpCode(HttpStatus.OK)
  @Post('recovery')
  async verifyRecoveryCode(
    @Req() req,
    @Body() verifyRecoveryCodeDto: VerifyRecoveryCodeDto,
  ): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const isValid = await this.mfaService.verifyRecoveryCode(
      userId,
      verifyRecoveryCodeDto.code,
    );

    if (!isValid) {
      return {
        status: 'error',
        error: {
          code: 'INVALID_RECOVERY_CODE',
          message: '無効なリカバリーコードです',
        },
      };
    }

    // MFA検証後の一時トークンを生成
    const mfaVerifiedToken = this.mfaService.generateMfaVerifiedToken(userId);

    return {
      status: 'success',
      data: {
        verified: true,
        mfaToken: mfaVerifiedToken,
      },
    };
  }

  @ApiOperation({ summary: 'MFA状態の確認', description: 'ユーザーのMFA設定状態を取得します' })
  @ApiResponse({
    status: 200,
    description: 'MFA状態取得成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            lastUsed: { type: 'string', example: '2023-04-01T12:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getMfaStatus(@Req() req): Promise<AppResponse<any>> {
    const userId = req.user.login_account_id || req.user.sub;
    const status = await this.mfaService.getMfaStatus(userId);

    return {
      status: 'success',
      data: status,
    };
  }
}