// src/common/interceptors/audit-log.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';
import { PRIVILEGED_OPERATION_KEY } from '../decorators/privileged-operation.decorator';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

/**
 * リクエスト、レスポンスを監査ログに記録するインターセプター
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // HTTPリクエストのコンテキストを取得
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    
    // リクエスト情報の抽出
    const { method, originalUrl, ip, headers, params, query, body } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    
    // 認証済みユーザー情報の取得（存在する場合）
    const user = request.user || {};
    
    // 特権操作かどうかの確認
    const privilegedMeta = this.getPrivilegedOperationMetadata(context);
    const isPrivileged = !!privilegedMeta;
    
    // リクエスト開始時刻
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap({
        next: async (data) => {
          // 正常レスポンス時の処理
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          
          // レスポンスのステータスコード取得
          const response = httpContext.getResponse<Response>();
          const statusCode = response.statusCode || 200;
          
          // リソース情報の抽出
          const { resource, resourceId } = this.extractResourceInfo(originalUrl, params);
          
          // ユーザー情報の安全な抽出
          const userId = this.extractUserId(user);
          const userRole = this.extractUserRole(user);
          const tenantId = this.extractTenantId(user);
          
          // 監査ログ作成
          await this.auditLogService.createLog({
            userId,
            userRole,
            action: `${method} ${originalUrl}`,
            resource,
            resourceId,
            ipAddress: this.normalizeIp(ip),
            userAgent,
            requestParams: params,
            requestQuery: query,
            requestBody: body,
            responseStatus: statusCode,
            executionTime,
            timestamp: new Date(),
            tenantId,
            isPrivileged,
            privilegeDetails: isPrivileged && privilegedMeta ? privilegedMeta.description : undefined,
          });
        },
        error: async (error) => {
          // エラー発生時の処理
          const endTime = Date.now();
          const executionTime = endTime - startTime;
          
          // リソース情報の抽出
          const { resource, resourceId } = this.extractResourceInfo(originalUrl, params);
          
          // エラーステータスコードの特定
          let statusCode = 500;
          if (error.status) {
            statusCode = error.status;
          } else if (error.response && error.response.statusCode) {
            statusCode = error.response.statusCode;
          }
          
          // ユーザー情報の安全な抽出
          const userId = this.extractUserId(user);
          const userRole = this.extractUserRole(user);
          const tenantId = this.extractTenantId(user);
          
          // 監査ログ作成（エラー情報含む）
          await this.auditLogService.createLog({
            userId,
            userRole,
            action: `${method} ${originalUrl} [ERROR]`,
            resource,
            resourceId,
            ipAddress: this.normalizeIp(ip),
            userAgent,
            requestParams: params,
            requestQuery: query,
            requestBody: body,
            responseStatus: statusCode,
            executionTime,
            timestamp: new Date(),
            tenantId,
            isPrivileged,
            privilegeDetails: isPrivileged && privilegedMeta ? privilegedMeta.description : undefined,
          });
        }
      }),
    );
  }
  
  /**
   * ユーザーIDを安全に抽出する
   */
  private extractUserId(user: any): string {
    if (!user || typeof user !== 'object') {
      return 'anonymous';
    }
    
    // 複数の可能性のあるプロパティ名をチェック
    return user.id || user.sub || user.emp_account_id || user.userId || 'anonymous';
  }
  
  /**
   * ユーザーロールを安全に抽出する
   */
  private extractUserRole(user: any): string {
    if (!user || typeof user !== 'object') {
      return 'anonymous';
    }
    
    return user.role || 'anonymous';
  }
  
  /**
   * テナントIDを安全に抽出する
   */
  private extractTenantId(user: any): string | undefined {
    if (!user || typeof user !== 'object') {
      return undefined;
    }
    
    return user.tenantId || user.tenant_id;
  }
  
  /**
   * URLからリソース情報を抽出
   */
  private extractResourceInfo(url: string, params: any): { resource: string; resourceId?: string } {
    try {
      // APIプレフィックスを削除
      let path = url.replace(/^\/api\//, '');
      
      // クエリパラメータを削除
      path = path.split('?')[0];
      
      // パスの構成要素を取得
      const pathParts = path.split('/').filter(Boolean);
      
      // リソース名は通常最初のパート
      const resource = pathParts[0] || 'unknown';
      
      // リソースIDはパラメータから取得を試みる
      let resourceId: string | undefined;
      
      // パラメータからIDを特定
      if (params && typeof params === 'object') {
        const idParam = Object.keys(params).find(key => 
          key === 'id' || key.endsWith('Id') || key.endsWith('_id')
        );
        if (idParam) {
          resourceId = String(params[idParam]);
        }
      }
      
      // パラメータからIDが見つからない場合はURLから推測
      if (!resourceId && pathParts.length > 1) {
        // 2番目のパスセグメントがIDの場合が多い
        const potentialId = pathParts[1];
        // UUIDっぽいか数字のみの場合はIDとして扱う
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId) ||
            /^\d+$/.test(potentialId)) {
          resourceId = potentialId;
        }
      }
      
      return { resource, resourceId };
    } catch (error) {
      this.logger.warn('リソース情報の抽出に失敗しました', error);
      return { resource: 'unknown' };
    }
  }
  
  /**
   * 特権操作のメタデータを取得
   */
  private getPrivilegedOperationMetadata(context: ExecutionContext): { description: string } | undefined {
    try {
      const handler = context.getHandler();
      return this.reflector.get(PRIVILEGED_OPERATION_KEY, handler);
    } catch (error) {
      this.logger.warn('特権操作メタデータの取得に失敗しました', error);
      return undefined;
    }
  }
  
  /**
   * IPアドレスを正規化
   */
  private normalizeIp(ip: string): string {
    if (!ip) return 'unknown';
    
    try {
      // X-Forwarded-For等で取得した場合のカンマ区切りの最初のIPを取得
      return ip.split(',')[0].trim();
    } catch (error) {
      return 'unknown';
    }
  }
}