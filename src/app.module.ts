import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppGuardsModule } from './app-guards/app-guards.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    LoggerModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    AppGuardsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
