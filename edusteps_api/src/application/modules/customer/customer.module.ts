import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { PrismaCustomerRepository } from 'src/infrastructure/repositories/prisma-customer.repository';
import { CustomerController } from './customer.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [CustomerService, PrismaCustomerRepository, TenantAccessService],
  exports: [CustomerService],
})
export class CustomerModule {}