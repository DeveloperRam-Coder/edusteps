import { Module } from '@nestjs/common';
import { PaymentDetailsController } from './payment_details.controller';
import { PaymentDetailsService } from './payment_details.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentDetailsController],
  providers: [PaymentDetailsService, TenantAccessService],
  exports: [PaymentDetailsService]
})
export class PaymentDetailsModule { }
