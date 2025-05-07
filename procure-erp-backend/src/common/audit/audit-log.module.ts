// src/common/audit/audit-log.module.ts

import { Module } from '@nestjs/common';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogInterceptor } from '../interceptors/audit-log.interceptor';
import { PrismaService } from '../../core/database/prisma.service';

@Module({
  providers: [
    AuditLogService,
    AuditLogInterceptor,
    PrismaService,
  ],
  exports: [
    AuditLogService,
    AuditLogInterceptor,
  ],
})
export class AuditLogModule {}