/**
 * EmpAccountからLoginAccountへのデータ移行スクリプト
 * 
 * 実行方法:
 * npx ts-node scripts/migrate-account-data.ts
 */

import { PrismaClient } from '@prisma/client';

// Prismaクライアントの初期化
const prisma = new PrismaClient();

async function migrateAccountData() {
  try {
    console.log('データ移行を開始します...');

    // すべてのEmpAccountレコードを取得
    const empAccounts = await prisma.empAccount.findMany({
      where: {
        // ログイン可能なアカウントのみ対象とする
        valid_flg: '1',
      },
    });

    console.log(`移行対象のアカウント数: ${empAccounts.length}`);

    // 各アカウントに対してLoginAccountレコードを作成
    for (const account of empAccounts) {
      // 既存のLoginAccountが存在しないか確認
      const existingLoginAccount = await prisma.loginAccount.findFirst({
        where: {
          emp_account_id: account.emp_account_id,
        },
      });

      if (existingLoginAccount) {
        console.log(`ID: ${account.emp_account_id} のアカウントは既に移行済みです`);
        continue;
      }

      // パスワードハッシュはDBから削除されているため、デフォルト値を使用
      const passwordHash = '$2b$10$Xm7RnI5EKzaQ3XtK7.BXnO.7Ry/Aw1dkOxA4J9YR9xnqrGvMjA6RG'; // "password"のハッシュ値

      // LoginAccountレコードを作成
      const loginAccount = await prisma.loginAccount.create({
        data: {
          tenant_id: account.tenant_id,
          username: account.emp_account_cd, // 従業員コードをログインIDとして使用
          password_hash: passwordHash,
          emp_account_id: account.emp_account_id,
          role: account.role,
          status: account.valid_flg === '1' ? 'active' : 'disabled',
          mfa_enabled: false, // デフォルトではMFAを無効化
        },
      });

      console.log(`ID: ${account.emp_account_id} のアカウントを移行しました`);
    }

    console.log('データ移行が完了しました');
  } catch (error) {
    console.error('データ移行中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
migrateAccountData()
  .then(() => {
    console.log('スクリプトが正常に完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプト実行中にエラーが発生しました:', error);
    process.exit(1);
  });
