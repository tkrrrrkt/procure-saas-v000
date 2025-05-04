import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private useMockDb: boolean;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    this.useMockDb = process.env.USE_MOCK_DB === 'true';
    console.log(`PrismaService: モックDBの使用: ${this.useMockDb}`);
  }

  async onModuleInit() {
    if (!this.useMockDb) {
      try {
        await this.$connect();
        console.log('PrismaService: データベース接続が確立されました');
      } catch (error) {
        console.error('PrismaService: データベース接続エラー:', error);
        console.log('PrismaService: モックデータを使用します');
        this.useMockDb = true;
      }
    } else {
      console.log('PrismaService: モックデータを使用するため、データベース接続をスキップします');
    }
  }

  async onModuleDestroy() {
    if (!this.useMockDb) {
      await this.$disconnect();
      console.log('PrismaService: データベース接続が切断されました');
    }
  }
}
