import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { UserModule } from './application/modules/user/user.module';
import { AuthModule } from './application/modules/auth/auth.module';
import { CourseModule } from './application/modules/course/course.module';
import { ClientModule } from './application/modules/client/client.module';
import { CustomerModule } from './application/modules/customer/customer.module';
import { EnrollmentModule } from './application/modules/enrollment/enrollment.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { ClientPermissionModule } from './application/modules/client-permission/client-permission.module';
import { CustomerDetailsModule } from './application/modules/customer-details/customer-details.module';
import { PaymentDetailsModule } from './application/modules/payment_details/payment_details.module';
import { DashboardModule } from './application/modules/dashboard/dashboard.module';
import { GlobalJwtAuthGuard } from './application/modules/auth/guards/global-jwt-auth.guard';
import { HealthModule } from './application/modules/health/health.module';
import { FeeReminderModule } from './application/modules/fee-reminder/fee-reminder.module';
import { AttendanceModule } from './application/modules/attendance/attendance.module';
import { PreferencesModule } from './application/modules/preferences/preferences.module';
import { SupportModule } from './application/modules/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 1000 },
      { name: 'strict', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    UserModule,
    AuthModule,
    CourseModule,
    ClientModule,
    CustomerModule,
    EnrollmentModule,
    RazorpayModule,
    ClientPermissionModule,
    CustomerDetailsModule,
    PaymentDetailsModule,
    DashboardModule,
    HealthModule,
    FeeReminderModule,
    AttendanceModule,
    PreferencesModule,
    SupportModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        setHeaders: (res: any) => {
          // Allow any origin to load uploaded assets (avatars, etc.)
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Access-Control-Allow-Origin', '*');
        },
      },
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: GlobalJwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
