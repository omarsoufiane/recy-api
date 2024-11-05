import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenTelemetryModule } from 'nestjs-otel';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuditModule } from './modules/audit/audit.module';
import { CalculatorModule } from './modules/calculator';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './modules/logger/logger.module';
import { MailModule } from './modules/mail/mail.module';
import { RecyclingReportModule } from './modules/recycling-report';
import { UploadModule } from './modules/upload/upload.module';
import { UserModule } from './modules/user/user.module';
import { Web3Module } from './modules/web3/web3.module';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    apiMetrics: {
      enable: true,
    },
  },
});

@Module({
  imports: [
    OpenTelemetryModuleConfig,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    Web3Module,
    UploadModule,
    LoggerModule,
    CalculatorModule,
    MailModule,
    RecyclingReportModule,
    AuditModule,
    UserModule,
    HealthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
