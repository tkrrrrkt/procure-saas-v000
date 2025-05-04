import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 組織の作成
  const organization = await prisma.organization.create({
    data: {
      name: '株式会社サンプル',
      code: 'SAMPLE',
      address: '東京都渋谷区',
      phone: '03-1234-5678',
      email: 'info@sample.co.jp',
      website: 'https://www.sample.co.jp',
      description: 'サンプル組織の説明',
      status: 'ACTIVE',
      timezone: 'Asia/Tokyo',
      language: 'ja',
      currency: 'JPY',
    },
  });

  // 組織変更履歴の作成
  const orgHistory = await prisma.orgHistory.create({
    data: {
      tenant_id: organization.id,
      org_history_cd: 'INIT',
      valid_from: new Date(),
      org_change_name: '初期組織構成',
    },
  });

  // 部門の作成
  const salesDept = await prisma.department.create({
    data: {
      tenant_id: organization.id,
      department_cd: 'SALES',
    },
  });

  const devDept = await prisma.department.create({
    data: {
      tenant_id: organization.id,
      department_cd: 'DEV',
    },
  });

  // 部門バージョンの作成
  const salesDeptVersion = await prisma.departmentVersion.create({
    data: {
      tenant_id: organization.id,
      department_id: salesDept.department_id,
      org_history_id: orgHistory.org_history_id,
      valid_from: new Date(),
      department_name: '営業部',
      department_short_name: '営業',
      department_kana_name: 'エイギョウブ',
      department_level: 1,
      department_symbol: 'S',
      budget_target_flg: '1',
    },
  });

  const devDeptVersion = await prisma.departmentVersion.create({
    data: {
      tenant_id: organization.id,
      department_id: devDept.department_id,
      org_history_id: orgHistory.org_history_id,
      valid_from: new Date(),
      department_name: '開発部',
      department_short_name: '開発',
      department_kana_name: 'カイハツブ',
      department_level: 1,
      department_symbol: 'D',
      budget_target_flg: '1',
    },
  });

  // 社員の作成
  const yamada = await prisma.empAccount.create({
    data: {
      tenant_id: organization.id,
      emp_account_cd: 'EMP001',
      emp_name: '山田 太郎',
      emp_kana_name: 'ヤマダ タロウ',
      email: 'yamada@sample.co.jp',
      password_hash: '$2b$10$YourHashedPasswordHere',
      role: 'ADMIN',
      valid_flg: '1',
    },
  });

  const suzuki = await prisma.empAccount.create({
    data: {
      tenant_id: organization.id,
      emp_account_cd: 'EMP002',
      emp_name: '鈴木 花子',
      emp_kana_name: 'スズキ ハナコ',
      email: 'suzuki@sample.co.jp',
      password_hash: '$2b$10$YourHashedPasswordHere',
      role: 'USER',
      valid_flg: '1',
    },
  });

  const tanaka = await prisma.empAccount.create({
    data: {
      tenant_id: organization.id,
      emp_account_cd: 'EMP003',
      emp_name: '田中 一郎',
      emp_kana_name: 'タナカ イチロウ',
      email: 'tanaka@sample.co.jp',
      password_hash: '$2b$10$YourHashedPasswordHere',
      role: 'USER',
      valid_flg: '1',
    },
  });

  // 部門配属の作成
  const employeeDepartments = await Promise.all([
    prisma.employeeDepartment.create({
      data: {
        tenant_id: organization.id,
        emp_account_id: yamada.emp_account_id,
        department_id: salesDept.department_id,
        valid_from: new Date(),
        valid_flg: '1',
      },
    }),
    prisma.employeeDepartment.create({
      data: {
        tenant_id: organization.id,
        emp_account_id: suzuki.emp_account_id,
        department_id: devDept.department_id,
        valid_from: new Date(),
        valid_flg: '1',
      },
    }),
    prisma.employeeDepartment.create({
      data: {
        tenant_id: organization.id,
        emp_account_id: tanaka.emp_account_id,
        department_id: salesDept.department_id,
        valid_from: new Date(),
        valid_flg: '1',
      },
    }),
  ]);

  console.log('シードデータが正常に作成されました:', {
    organization,
    orgHistory,
    departments: {
      sales: {
        department: salesDept,
        version: salesDeptVersion,
      },
      development: {
        department: devDept,
        version: devDeptVersion,
      },
    },
    employees: {
      yamada,
      suzuki,
      tanaka,
    },
    employeeDepartments,
  });
}

main()
  .catch((e) => {
    console.error('シードデータの作成中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 