import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@Global()
@Module({
  providers: [PrismaService, TenantAccessService],
  exports: [PrismaService, TenantAccessService],
})
export class PrismaModule {}
