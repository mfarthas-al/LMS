import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtpModule } from './modules/otp/otp.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { VideoAccessModule } from './modules/video-access/video-access.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Locally the single .env lives at the repo root; in containers env vars are injected directly.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'], validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    OtpModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    VideoAccessModule,
    MaterialsModule,
    EnrollmentsModule,
    PaymentsModule,
    StorageModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
  ],
  providers: [
    // Secure by default: every route needs a valid JWT unless marked @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
