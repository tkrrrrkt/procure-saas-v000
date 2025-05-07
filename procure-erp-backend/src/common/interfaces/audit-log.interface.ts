// src/common/interfaces/audit-log.interface.ts

import { AuditLogSeverity, AuditLogType } from '../enums/audit-log.enum';

/**
 * 監査ログのエントリーを表すインターフェース
 */
export interface AuditLogEntry {
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  requestParams?: any;
  requestQuery?: any;
  requestBody?: any;
  responseStatus: number;
  executionTime: number;
  timestamp: Date;
  tenantId?: string;
  isPrivileged?: boolean;
  privilegeDetails?: string;
}

/**
 * 監査ログサービスに送信するデータの完全版インターフェース
 */
export interface AuditLogData extends AuditLogEntry {
  severity?: AuditLogSeverity;
  logType?: AuditLogType;
}