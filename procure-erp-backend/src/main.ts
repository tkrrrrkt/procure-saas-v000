import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from './common/pipes/validation.pipe'; 
import { Logger } from '@nestjs/common';
import helmet from 'helmet';  // デフォルトインポートに変更
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Helmetミドルウェアを適用（セキュリティヘッダーを追加）
  app.use(helmet({
    // CSPは個別に設定するため、Helmetのデフォルト設定を無効化
    contentSecurityPolicy: false,
    // XSSフィルタリングを強制
    xssFilter: true,
    // HTTPを強制的にHTTPSにリダイレクト（本番環境のみ）
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 15552000, // 180日
      includeSubDomains: true,
      preload: true
    } : false,
    // フレーム内での表示を禁止（クリックジャッキング対策）
    frameguard: {
      action: 'deny'
    },
    // MIMEタイプのスニッフィングを防止
    noSniff: true,
    // Referrer情報を制限
    referrerPolicy: { 
      policy: 'strict-origin-when-cross-origin' 
    }
  }));
  
  // CORS設定 - 環境変数を使用
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });
  
  // APIプレフィックス設定
  app.setGlobalPrefix('api');
  
  // カスタムバリデーションパイプのグローバル設定
  app.useGlobalPipes(new ValidationPipe());
  
  // cookieParserミドルウェアの設定（既存設定を保持）
  app.use(cookieParser());
  
  // CSPミドルウェアの設定
  app.use((req, res, next) => {
    // コンテンツセキュリティポリシーの設定
    res.header('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // スタイルはインラインも許可（UI frameworks用）
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'", // クリックジャッキング対策
    ].join('; '));
    
    next();
  });
  
  // Swagger設定
  const config = new DocumentBuilder()
    .setTitle('購買管理SaaS API')
    .setDescription('購買管理システム向けのRESTful APIインターフェース')
    .setVersion('1.0')
    .addTag('auth', '認証関連API')
    .addTag('users', 'ユーザー管理API')
    .addTag('organizations', '組織管理API')
    .addTag('purchase-requests', '購買依頼API')
    .addTag('purchase-orders', '発注管理API')
    .addTag('vendors', 'ベンダー管理API')
    .addTag('inventory', '在庫管理API')
    .addTag('receiving', '入荷管理API')
    .addTag('invoice-matching', '請求書照合API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWTアクセストークンを入力してください',
        in: 'header',
      },
      'access-token', // この名前は後でコントローラーで参照できます
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Swaggerのセキュリティ設定（本番環境ではBasic認証などで保護することも検討）
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: '購買管理SaaS API Documentation',
  });
  
  // *** 追加：Expressミドルウェアでリクエストをロギング（デバッグ用） ***
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      logger.debug(`リクエスト: ${req.method} ${req.path}`);
    }
    next();
  });
  
  // ポート設定（環境変数を使用）
  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`アプリケーションが起動しました: ${await app.getUrl()}`);
  logger.log(`Swaggerドキュメントは次のURLで利用可能です: ${await app.getUrl()}/api-docs`);
}
bootstrap();