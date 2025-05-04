import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { UtilsModule } from './shared/utils/utils.module';
import { FiltersModule } from './shared/filters/filters.module';
import { UsersModule } from './modules/users/users.module';
import { HealthCheckModule } from './modules/health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule, DatabaseModule, UtilsModule, FiltersModule, UsersModule, HealthCheckModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
