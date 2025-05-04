import { Module, Global, Provider } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MockPrismaService } from './mock/mock-prisma.service';

const useMockDb = process.env.USE_MOCK_DB === 'true';
console.log(`DatabaseModule: モックDBの使用: ${useMockDb}`);

const prismaProvider: Provider = {
  provide: PrismaService,
  useClass: useMockDb ? MockPrismaService : PrismaService,
};

@Global()
@Module({
  providers: [
    prismaProvider,
    {
      provide: 'PRISMA_SERVICE',
      useExisting: PrismaService,
    },
  ],
  exports: [
    PrismaService,
    'PRISMA_SERVICE',
  ],
})
export class DatabaseModule {
  constructor(private prismaService: PrismaService) {
    console.log(`DatabaseModule: ${useMockDb ? 'MockPrismaService' : 'PrismaService'}が初期化されました`);
  }
}
