// src/config/config.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,

      // 追加: 参照する .env ファイルの優先順を配列で指定
      // 例）本番は .env → .env.production、開発は .env → .env.local
      envFilePath: ['.env', '.env.local', `.env.${process.env.NODE_ENV}`],

      // （任意）${VAR_NAME} の変数展開を有効化
      expandVariables: true,

      // 環境変数のスキーマ検証
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        // アプリ基本設定
        PORT: Joi.number().default(3001),

        // DB
        DATABASE_URL: Joi.string().required(),

        // JWT
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('4h'),
        JWT_REFRESH_EXPIRATION: Joi.string().default('30d'),

        // CORS
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),

        // ログ
        LOG_LEVEL: Joi.string().default('debug'),
      }),
    }),
  ],
})
export class ConfigModule {}
