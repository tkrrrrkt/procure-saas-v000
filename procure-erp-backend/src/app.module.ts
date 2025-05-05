import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CommonModule }  from './common/common.module';
import { ConfigModule }  from './config/config.module';   // ← 自作 ConfigModule を import

// 機能モジュール
import { AuthModule }    from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { UtilsModule }    from './shared/utils/utils.module';
import { FiltersModule }  from './shared/filters/filters.module';
import { UsersModule }    from './modules/users/users.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';

@Module({
  imports: [
    CommonModule,          // Interceptor & Filter
    ConfigModule,          // ← forRoot() 呼び出しは不要
    AuthModule,
    DatabaseModule,
    UtilsModule,
    FiltersModule,
    UsersModule,
    HealthCheckModule,
  ],
  controllers: [AppController],
  providers:   [AppService],
})
export class AppModule {}
