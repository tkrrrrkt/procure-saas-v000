// src/common/services/audit-log.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditLogSeverity, AuditLogType } from '../enums/audit-log.enum';
import { AuditLogData } from '../interfaces/audit-log.interface';

/**
 * 監査ログを管理するサービス
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly isPrismaReady = true;

  constructor(private readonly prisma: PrismaService) {}
  
  /**
   * 監査ログを作成して保存します
   * @param logData 監査ログデータ
   */
  async createLog(logData: AuditLogData): Promise<void> {
    try {
      // ログの重要度が指定されていない場合は判定
      const severity = logData.severity || this.determineSeverity(logData);
      
      // ログタイプが指定されていない場合は判定
      const logType = logData.logType || this.determineLogType(logData);
      
      // リクエストデータの機密情報をマスク処理
      const sanitizedParams = this.sanitizeData(logData.requestParams);
      const sanitizedQuery = this.sanitizeData(logData.requestQuery);
      const sanitizedBody = this.sanitizeData(logData.requestBody);
      
      if (this.isPrismaReady) {
        // 監査ログをデータベースに保存
        await this.prisma.auditLog.create({
          data: {
            tenant_id: logData.tenantId,
            user_id: logData.userId,
            user_role: logData.userRole || 'unknown',
            action: logData.action,
            resource: logData.resource,
            resource_id: logData.resourceId,
            ip_address: logData.ipAddress,
            user_agent: logData.userAgent,
            request_params: sanitizedParams,
            request_query: sanitizedQuery,
            request_body: sanitizedBody,
            response_status: logData.responseStatus,
            severity: severity,
            log_type: logType,
            execution_time: logData.executionTime,
            timestamp: logData.timestamp,
            is_privileged: logData.isPrivileged || false,
            privilege_details: logData.privilegeDetails,
          },
        });
      }
      
      // 高重要度のログはコンソールにも出力
      if (severity === AuditLogSeverity.HIGH) {
        // ログ出力用に機密データが確実にマスクされたコピーを作成
        const logOutput = {
          ...logData,
          requestParams: sanitizedParams,
          requestQuery: sanitizedQuery,
          requestBody: sanitizedBody,
          severity,
          logType
        };
        
        this.logger.warn(
          `高重要度の監査イベント: ${logData.action} by ${logData.userId || 'anonymous'} (${logData.ipAddress})`, 
          { logData: logOutput }
        );
      }
    } catch (error) {
      // ログ保存に失敗してもアプリケーションの動作は止めない
      this.logger.error('監査ログの保存に失敗しました', error);
      
      // フォールバック：コンソールにログを出力
      const sanitizedData = {
        ...logData,
        requestParams: this.sanitizeData(logData.requestParams),
        requestQuery: this.sanitizeData(logData.requestQuery),
        requestBody: this.sanitizeData(logData.requestBody)
      };
      
      this.logger.log(
        `監査ログ(フォールバック): ${logData.action} by ${logData.userId || 'anonymous'} (${logData.ipAddress})`,
        sanitizedData
      );
    }
  }
  
  /**
   * ログデータの重要度を判定
   */
  private determineSeverity(logData: AuditLogData): AuditLogSeverity {
    // 特権操作は常に高重要度
    if (logData.isPrivileged) {
      return AuditLogSeverity.HIGH;
    }
    
    // 認証関連や削除操作は高重要度
    if (logData.action.toUpperCase().includes('LOGIN') ||
        logData.action.toUpperCase().includes('AUTH') ||
        logData.action.toUpperCase().includes('DELETE') ||
        (logData.resource && logData.resource.includes('admin'))) {
      return AuditLogSeverity.HIGH;
    }
    
    // 更新操作は中重要度
    if (logData.action.toUpperCase().includes('UPDATE') ||
        logData.action.toUpperCase().includes('CREATE') ||
        logData.action.toUpperCase().includes('PATCH')) {
      return AuditLogSeverity.MEDIUM;
    }
    
    // それ以外は低重要度
    return AuditLogSeverity.LOW;
  }
  
  /**
   * ログデータのタイプを判定
   */
  private determineLogType(logData: AuditLogData): AuditLogType {
    // 特権操作
    if (logData.isPrivileged) {
      return AuditLogType.PRIVILEGED_OPERATION;
    }
    
    // 認証関連操作
    if ((logData.resource && logData.resource.includes('auth')) || 
        logData.action.toUpperCase().includes('LOGIN') ||
        logData.action.toUpperCase().includes('LOGOUT')) {
      return AuditLogType.AUTHENTICATION;
    }
    
    // データ操作タイプを判定
    const actionUpper = logData.action.toUpperCase();
    if (actionUpper.includes('GET') || actionUpper.includes('READ')) {
      return AuditLogType.DATA_ACCESS;
    } else if (actionUpper.includes('POST') || actionUpper.includes('CREATE')) {
      return AuditLogType.DATA_CREATION;
    } else if (actionUpper.includes('PUT') || actionUpper.includes('PATCH') || actionUpper.includes('UPDATE')) {
      return AuditLogType.DATA_MODIFICATION;
    } else if (actionUpper.includes('DELETE')) {
      return AuditLogType.DATA_DELETION;
    }
    
    // それ以外はシステム操作
    return AuditLogType.SYSTEM_OPERATION;
  }
  
  /**
   * 機密データのマスキング
   */
  private sanitizeData(data: any): any {
    if (!data) return null;
    
    try {
      // オブジェクトをディープコピー
      const sanitized = JSON.parse(JSON.stringify(data));
      
      // 機密フィールドのマスキング
      const sensitiveFields = [
        'password', 'passwd', 'pass', 'pwd', 
        'password_hash', 'passwordHash',
        'token', 'refreshToken', 'refresh_token', 'access_token', 'accessToken',
        'apiKey', 'api_key', 'key', 'secret',
        'credit_card', 'creditCard', 'card', 
        'cvv', 'cvc', 'securityCode',
        'ssn', 'socialSecurity'
      ];
      
      this.maskSensitiveData(sanitized, sensitiveFields);
      
      return sanitized;
    } catch (error) {
      // JSONシリアライズできない場合は安全のためnullを返す
      this.logger.warn('データのサニタイズに失敗しました', error);
      return null;
    }
  }
  
  /**
   * 再帰的に機密データをマスク
   */
  private maskSensitiveData(obj: any, sensitiveFields: string[]): void {
    if (!obj || typeof obj !== 'object') return;
    
    // 配列の場合は各要素を再帰的に処理
    if (Array.isArray(obj)) {
      obj.forEach(item => this.maskSensitiveData(item, sensitiveFields));
      return;
    }
    
    Object.keys(obj).forEach(key => {
      // 大文字小文字を区別せずに比較
      const keyLower = key.toLowerCase();
      
      // キー名によるマスキング
      if (sensitiveFields.some(field => keyLower === field.toLowerCase() || keyLower.includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } 
      // 値の簡易パターンチェック（パスワードっぽい値など）
      else if (typeof obj[key] === 'string') {
        // クレジットカード番号形式チェック
        if (/^(?:\d{4}[- ]?){3}\d{4}$/.test(obj[key])) {
          obj[key] = '[REDACTED]';
        }
        // JWT形式チェック
        else if (/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(obj[key])) {
          obj[key] = '[REDACTED]';
        }
      }
      // オブジェクトや配列は再帰的に処理
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.maskSensitiveData(obj[key], sensitiveFields);
      }
    });
  }
}