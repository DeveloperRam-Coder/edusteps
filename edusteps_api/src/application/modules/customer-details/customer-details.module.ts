import { Module } from '@nestjs/common';
import { CustomerDetailsService } from './customer-details.service';
import { CustomerDetailsController } from './customer-details.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@Module({
  imports: [PrismaModule],
  providers: [CustomerDetailsService, TenantAccessService],
  controllers: [CustomerDetailsController]
})
export class CustomerDetailsModule {}
