import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPrismaService {
  private mockData = {
    empAccount: [
      {
        emp_account_id: '1',
        emp_account_cd: 'admin',
        password_hash: '$2b$10$oScl0wNVfcZoOSJR1XHliubLCKCxksqceXyzz5VjXrWvnKXcu1DFC', // 'admin'
        role: 'ADMIN',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        emp_account_id: '2',
        emp_account_cd: 'user',
        password_hash: '$2b$10$oScl0wNVfcZoOSJR1XHliubLCKCxksqceXyzz5VjXrWvnKXcu1DFC', // 'user'
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        emp_account_id: '3',
        emp_account_cd: 'test',
        password_hash: '$2b$10$9OOFy5W.Vz6RkKKZ5bAocOiEIxT4PoWxE8J/3q0NQGw4TKIFQSyOO',
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
  };

  constructor() {
    console.log('MockPrismaService: モックデータサービスが初期化されました');
  }

  async $connect() {
    console.log('MockPrismaService: $connect called - モック接続を確立しました');
    return Promise.resolve();
  }

  async $disconnect() {
    console.log('MockPrismaService: $disconnect called - モック接続を切断しました');
    return Promise.resolve();
  }

  async findUnique(args: any) {
    const { where, select } = args;
    const model = Object.keys(where)[0].split('_')[0];
    const value = Object.values(where)[0];
    
    console.log(`MockPrismaService: findUnique called for ${model} with ${JSON.stringify(where)}`);
    
    const result = this.mockData[model]?.find(item => item[Object.keys(where)[0]] === value);
    console.log(`MockPrismaService: findUnique result:`, result ? '見つかりました' : '見つかりませんでした');
    return result || null;
  }

  async findFirst(args: any) {
    const { where } = args;
    
    console.log(`MockPrismaService: findFirst called with ${JSON.stringify(where)}`);
    
    if (where && where.emp_account_cd) {
      const account = this.mockData.empAccount.find(account => account.emp_account_cd === where.emp_account_cd);
      console.log(`MockPrismaService: Found account for ${where.emp_account_cd}:`, account ? 'アカウントが見つかりました' : 'アカウントが見つかりません');
      if (account) {
        console.log(`MockPrismaService: Account details - ID: ${account.emp_account_id}, Role: ${account.role}, Hash length: ${account.password_hash.length}`);
      }
      return account || null;
    }
    
    return null;
  }

  async findMany(args: any) {
    const model = Object.keys(args)[0];
    console.log(`MockPrismaService: findMany called for ${model}`);
    return this.mockData[model] || [];
  }

  async create(args: any) {
    const { data } = args;
    const model = Object.keys(args)[0];
    
    console.log(`MockPrismaService: create called for ${model} with ${JSON.stringify(data)}`);
    
    const newItem = {
      ...data,
      id: String(this.mockData[model].length + 1),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    this.mockData[model].push(newItem);
    return newItem;
  }

  async update(args: any) {
    const { where, data } = args;
    const model = Object.keys(args)[0];
    
    console.log(`MockPrismaService: update called for ${model} with ${JSON.stringify(where)}`);
    
    const index = this.mockData[model].findIndex(item => item.id === where.id);
    if (index !== -1) {
      this.mockData[model][index] = {
        ...this.mockData[model][index],
        ...data,
        updated_at: new Date(),
      };
      return this.mockData[model][index];
    }
    return null;
  }

  async delete(args: any) {
    const { where } = args;
    const model = Object.keys(args)[0];
    
    console.log(`MockPrismaService: delete called for ${model} with ${JSON.stringify(where)}`);
    
    const index = this.mockData[model].findIndex(item => item.id === where.id);
    if (index !== -1) {
      const deleted = this.mockData[model][index];
      this.mockData[model].splice(index, 1);
      return deleted;
    }
    return null;
  }

  get empAccount() {
    return {
      findFirst: (args: any) => this.findFirst(args),
      findUnique: (args: any) => this.findUnique(args),
      findMany: (args: any) => this.findMany({ model: 'empAccount' }),
      create: (args: any) => this.create({ ...args, model: 'empAccount' }),
      update: (args: any) => this.update({ ...args, model: 'empAccount' }),
      delete: (args: any) => this.delete({ ...args, model: 'empAccount' }),
    };
  }
}
