// src/common/notifications/interfaces/notification-payload.interface.ts

/**
 * 通知のペイロード（内容）を定義するインターフェース
 */
export interface NotificationPayload {
    /**
     * 通知の件名
     */
    subject: string;
    
    /**
     * 通知の本文メッセージ
     */
    message: string;
    
    /**
     * 通知の重要度
     */
    severity: 'low' | 'medium' | 'high';
    
    /**
     * 追加メタデータ（任意）
     */
    metadata?: Record<string, any>;
  }