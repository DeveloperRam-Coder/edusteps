import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, TenantAccessService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
