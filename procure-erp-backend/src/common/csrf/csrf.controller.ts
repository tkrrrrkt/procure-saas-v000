// src/common/csrf/csrf.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('csrf')
@Controller('csrf')
export class CsrfController {
  @ApiOperation({ summary: 'CSRFトークン取得', description: 'CSRFトークンを生成して返します' })
  @ApiResponse({ 
    status: 200, 
    description: 'CSRFトークン取得成功', 
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'a1b2c3d4e5f6...' }
      }
    }
  })
  @Get('token')
  getToken(@Res({ passthrough: true }) res: Response) {
    // 新しいCSRFトークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    
    // Cookieに保存
    res.cookie('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // レスポンスボディでも返す（フロントエンドでヘッダー設定用）
    return { token };
  }
}