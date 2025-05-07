// src/common/csrf/csrf.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Res({ passthrough: true }) response: Response) {
    const token = crypto.randomBytes(32).toString('hex');
    
    response.cookie('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return { token };
  }
}