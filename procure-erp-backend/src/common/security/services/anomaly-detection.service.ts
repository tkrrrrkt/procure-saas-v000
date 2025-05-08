// src/common/security/services/anomaly-detection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from '../../notifications/services/notification.service';
import { PrismaService } from '../../../core/database/prisma.service';

/**
 * 異常検知サービス
 * 監査ログを分析して異常を検出し、通知を送信する
 */
@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}
  
  /**
   * 15分ごとに異常検知を実行
   */
  @Cron('0 */15 * * * *') // 15分ごとに実行するクロン式
  async detectAnomalies() {
    this.logger.log('異常検知処理を開始します');
    
    // 以下のパターンをチェック
    await Promise.all([
      this.detectHighValuePurchases(),
      this.detectAuthenticationFailures(),
      this.detectUnusualAccess(),
    ]);
    
    this.logger.log('異常検知処理を完了しました');
  }
  
  /**
   * 高額購入の検出
   * ユーザーの過去の購入額平均と比較して異常に高額な購入を検出
   */
  private async detectHighValuePurchases() {
    this.logger.log('高額購入の検出を開始します');
    
    try {
      // 最近の購入記録を取得（過去1時間）
      const recentPurchases = await this.prisma.testOrder.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // 過去1時間
          },
          status: 'pending' // 承認待ち
        },
        include: {
          user: true // ユーザー情報も取得
        }
      });
      
      for (const purchase of recentPurchases) {
        // ユーザーの過去の平均購入額を取得（過去90日）
        const userStats = await this.prisma.$queryRaw<Array<{ avg_amount: number, max_amount: number }>>`
          SELECT AVG(total_amount) as avg_amount, MAX(total_amount) as max_amount
          FROM "test_orders"
          WHERE user_id = ${purchase.user_id}
            AND created_at >= ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
            AND created_at < ${new Date(Date.now() - 60 * 60 * 1000)}
            AND status = 'approved'
        `;
        
        const avgAmount = userStats[0]?.avg_amount || 0;
        const maxAmount = userStats[0]?.max_amount || 0;
        
        // 異常判定：平均の3倍以上かつ最大の1.5倍以上
        if (purchase.total_amount > avgAmount * 3 && purchase.total_amount > maxAmount * 1.5) {
          this.logger.warn(`高額購入を検出: ユーザー ${purchase.user.username} による ${purchase.total_amount}円の購入（平均: ${avgAmount}円）`);
          
          // 通知の対象者を取得（購買管理者など）
          const admins = await this.getAdministrators('purchase_admin');
          
          // 通知を送信
          await this.notificationService.sendNotification(
            ['email', 'slack', 'in-app'], // 利用可能なすべてのプロバイダーを使用
            admins,
            {
              subject: '【警告】異常な高額購入を検出',
              message: `ユーザー ${purchase.user.username} による通常より高額な購入が検出されました。\n\n` +
                       `購入金額: ${purchase.total_amount.toLocaleString()}円\n` +
                       `平均購入額: ${Math.round(avgAmount).toLocaleString()}円\n` +
                       `購入ID: ${purchase.id}\n\n` +
                       `この購入を確認してください。`,
              severity: 'high',
              metadata: {
                anomalyType: 'high_purchase',
                userId: purchase.user_id,
                orderId: purchase.id,
                amount: purchase.total_amount,
                avgAmount: avgAmount,
                timestamp: new Date().toISOString(),
              }
            }
          );
          
          // 異常ログをデータベースに記録
          await this.logAnomaly('high_purchase', 'high', purchase.user_id, {
            orderId: purchase.id,
            amount: purchase.total_amount,
            avgAmount: avgAmount,
          });
        }
      }
    } catch (error) {
      this.logger.error('高額購入の検出でエラーが発生しました', error.stack);
    }
  }
  
  /**
   * 認証失敗の異常検出
   * 短期間の連続ログイン失敗を検出
   */
  private async detectAuthenticationFailures() {
    this.logger.log('認証失敗の異常検出を開始します');
    
    try {
      // 監査ログから直近のログイン失敗を分析
      const failedLogins = await this.prisma.auditLog.groupBy({
        by: ['ip_address', 'user_id'],
        where: {
          action: {
            contains: 'login'
          },
          response_status: {
            gte: 400 // エラーステータス
          },
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // 過去30分
          }
        },
        _count: {
          id: true
        },
        having: {
          id: {
            _count: {
              gt: 5 // 5回以上の失敗
            }
          }
        }
      });
      
      for (const item of failedLogins) {
        this.logger.warn(`認証失敗の異常を検出: IP ${item.ip_address} からのユーザー ${item.user_id || '不明'} の連続ログイン失敗 (${item._count.id}回)`);
        
        // 通知の対象者を取得（セキュリティ管理者など）
        const admins = await this.getAdministrators('security_admin');
        
        // 通知を送信
        await this.notificationService.sendNotification(
          ['email', 'slack', 'in-app'],
          admins,
          {
            subject: '【警告】連続ログイン失敗を検出',
            message: `IP ${item.ip_address} から${item.user_id ? `ユーザー ${item.user_id} への` : ''}連続ログイン失敗が検出されました。\n\n` +
                     `失敗回数: ${item._count.id}回（過去30分）\n\n` +
                     `不正アクセスの可能性があります。確認してください。`,
            severity: 'high',
            metadata: {
              anomalyType: 'auth_failure',
              userId: item.user_id,
              ipAddress: item.ip_address,
              count: item._count.id,
              timestamp: new Date().toISOString(),
            }
          }
        );
        
        // 異常ログをデータベースに記録
        await this.logAnomaly('auth_failure', 'high', item.user_id, {
          ipAddress: item.ip_address,
          count: item._count.id,
        });
      }
    } catch (error) {
      this.logger.error('認証失敗の異常検出でエラーが発生しました', error.stack);
    }
  }
  
  /**
   * 異常なアクセスパターンの検出
   * 通常と異なる時間帯、場所、リソースへのアクセスを検出
   */
  private async detectUnusualAccess() {
    this.logger.log('異常なアクセスパターンの検出を開始します');
    
    try {
      // 過去2時間の監査ログを取得
      const recentLogs = await this.prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // 過去2時間
          },
          user_id: { not: null } // 認証済みユーザーのみ
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      // ユーザーごとのアクセスパターンを分析
      const userAccessMap = new Map<string, {
        resources: Set<string>,
        ipAddresses: Set<string>,
        timestamps: Date[]
      }>();
      
      for (const log of recentLogs) {
        if (!log.user_id) continue;
        
        if (!userAccessMap.has(log.user_id)) {
          userAccessMap.set(log.user_id, {
            resources: new Set<string>(),
            ipAddresses: new Set<string>(),
            timestamps: []
          });
        }
        
        const userAccess = userAccessMap.get(log.user_id);
        if (userAccess) {
          userAccess.resources.add(log.resource);
          userAccess.ipAddresses.add(log.ip_address);
          userAccess.timestamps.push(log.timestamp);
        }
      }
      
      // 各ユーザーの通常のアクセスパターンを取得（過去30日）
      for (const [userId, recentAccess] of userAccessMap.entries()) {
        // 過去のアクセスパターンを取得
        const pastUserActivity = await this.prisma.auditLog.findMany({
          where: {
            user_id: userId,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 過去30日
              lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2時間前まで
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });
        
        // 通常のアクセスリソースを集計
        const commonResources = new Set<string>();
        const ipFrequency: Record<string, number> = {};
        
        for (const log of pastUserActivity) {
          if (log.resource) {
            commonResources.add(log.resource);
          }
          
          if (log.ip_address) {
            ipFrequency[log.ip_address] = (ipFrequency[log.ip_address] || 0) + 1;
          }
        }
        
        // 通常使用しないリソースへのアクセス検出
        const unusualResources = Array.from(recentAccess.resources).filter(
          resource => !commonResources.has(resource)
        );
        
        // 新しいIPアドレスからのアクセス検出
        const unusualIps = Array.from(recentAccess.ipAddresses).filter(
          ip => !ipFrequency[ip]
        );
        
        if (unusualResources.length > 0 || unusualIps.length > 0) {
          // ユーザー情報を取得
          const user = await this.prisma.testUser.findUnique({
            where: { id: userId }
          });
          
          this.logger.warn(`異常なアクセスパターンを検出: ユーザー ${user?.username || userId}`);
          
          // 通知の対象者を取得
          const admins = await this.getAdministrators('security_admin');
          
          // 異常な内容をメッセージにまとめる
          let anomalyDetails = '';
          
          if (unusualResources.length > 0) {
            anomalyDetails += `■ 通常アクセスしないリソース:\n${unusualResources.join(', ')}\n\n`;
          }
          
          if (unusualIps.length > 0) {
            anomalyDetails += `■ 新しいIPアドレス:\n${unusualIps.join(', ')}\n\n`;
          }
          
          // 通知を送信
          await this.notificationService.sendNotification(
            ['email', 'slack', 'in-app'],
            admins,
            {
              subject: '【警告】異常なアクセスパターンを検出',
              message: `ユーザー ${user?.username || userId} による異常なアクセスパターンが検出されました。\n\n` +
                       anomalyDetails +
                       `アカウントが不正利用されている可能性があります。確認してください。`,
              severity: 'medium',
              metadata: {
                anomalyType: 'unusual_access',
                userId: userId,
                username: user?.username,
                unusualResources,
                unusualIps,
                timestamp: new Date().toISOString(),
              }
            }
          );
          
          // 異常ログをデータベースに記録
          await this.logAnomaly('unusual_access', 'medium', userId, {
            username: user?.username,
            unusualResources,
            unusualIps,
          });
        }
      }
    } catch (error) {
      this.logger.error('異常なアクセスパターンの検出でエラーが発生しました', error.stack);
    }
  }
  
  /**
   * 管理者ユーザーの取得
   * @param role 必要な権限ロール
   * @returns 管理者のユーザーID配列
   */
  private async getAdministrators(role: string = 'admin'): Promise<string[]> {
    try {
      const admins = await this.prisma.testUser.findMany({
        where: {
          role: {
            in: ['admin', role, 'super_admin']
          },
          is_active: true
        },
        select: {
          id: true,
          email: true
        }
      });
      
      // IDを返却（アプリ内通知用）
      return admins.map(admin => admin.id);
    } catch (error) {
      this.logger.error('管理者情報の取得に失敗しました', error.stack);
      return []; // エラー時は空配列
    }
  }
  
  /**
   * 異常ログをデータベースに記録
   * @param type 異常の種類
   * @param severity 重要度
   * @param userId 関連ユーザーID
   * @param details 詳細情報
   */
  private async logAnomaly(
    type: string,
    severity: 'low' | 'medium' | 'high',
    userId: string | null,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.anomalyLogRecord.create({
        data: {
          type,
          severity,
          user_id: userId,
          details,
          detected_at: new Date(),
          is_resolved: false
        }
      });
    } catch (error) {
      this.logger.error('異常ログの保存に失敗しました', error.stack);
    }
  }
}