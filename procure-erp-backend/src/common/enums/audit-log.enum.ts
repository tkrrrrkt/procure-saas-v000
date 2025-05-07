// src/common/enums/audit-log.enum.ts

/**
 * 監査ログの重要度を定義する列挙型
 */
export enum AuditLogSeverity {
    LOW = 'LOW',       // 低：通常の操作（読み取りなど）
    MEDIUM = 'MEDIUM', // 中：データ更新操作
    HIGH = 'HIGH'      // 高：重要データの変更、特権操作、潜在的なセキュリティイベント
  }
  
  /**
   * 監査ログのタイプを定義する列挙型
   */
  export enum AuditLogType {
    AUTHENTICATION = 'AUTHENTICATION',   // 認証関連操作
    DATA_ACCESS = 'DATA_ACCESS',         // データアクセス操作
    DATA_CREATION = 'DATA_CREATION',     // データ作成操作
    DATA_MODIFICATION = 'DATA_MODIFICATION', // データ更新操作
    DATA_DELETION = 'DATA_DELETION',     // データ削除操作
    PRIVILEGED_OPERATION = 'PRIVILEGED_OPERATION', // 特権操作
    SYSTEM_OPERATION = 'SYSTEM_OPERATION' // システム操作
  }