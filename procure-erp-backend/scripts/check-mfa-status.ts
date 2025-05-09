// MFA状態確認用のデバッグスクリプト
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMfaStatus() {
  try {
    // すべてのログインアカウントを取得
    const accounts = await prisma.loginAccount.findMany({
      select: {
        id: true,
        username: true,
        mfa_enabled: true,
        mfa_secret: true,
        mfa_last_used: true,
        emp_account_id: true,
        empAccount: {
          select: {
            emp_account_id: true,
            emp_account_cd: true,
            email: true
          }
        }
      }
    });

    console.log('=== LoginAccount MFA Status ===');
    accounts.forEach(account => {
      console.log(`Username: ${account.username}`);
      console.log(`ID: ${account.id}`);
      console.log(`MFA Enabled: ${account.mfa_enabled}`);
      console.log(`MFA Secret Exists: ${account.mfa_secret ? 'Yes' : 'No'}`);
      console.log(`MFA Last Used: ${account.mfa_last_used}`);
      console.log(`Employee ID: ${account.emp_account_id}`);
      console.log(`Employee Code: ${account.empAccount?.emp_account_cd}`);
      console.log('----------------------------');
    });

    // 接続を閉じる
    await prisma.$disconnect();
  } catch (error) {
    console.error('エラーが発生しました:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// スクリプト実行
checkMfaStatus();

// スクリプト実行
checkMfaStatus();
