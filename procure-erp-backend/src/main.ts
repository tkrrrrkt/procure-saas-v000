import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from './common/pipes/validation.pipe'; 
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // CORS設定 - 環境変数を使用
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // APIプレフィックス設定
  app.setGlobalPrefix('api');
  
  // カスタムバリデーションパイプのグローバル設定
  app.useGlobalPipes(new ValidationPipe());
  
  // cookieParserミドルウェアの設定（既存設定を保持）
  app.use(cookieParser());
  
  // ポート設定（環境変数を使用）
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`アプリケーションが起動しました: ${await app.getUrl()}`);
}
bootstrap();