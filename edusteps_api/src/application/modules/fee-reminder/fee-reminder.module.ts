import { Module } from '@nestjs/common';
import { FeeReminderController } from './fee-reminder.controller';
import { FeeReminderService } from './fee-reminder.service';
import { WhatsAppSmsService } from './whatsapp-sms.service';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeReminderController],
  providers: [FeeReminderService, WhatsAppSmsService],
  exports: [FeeReminderService],
})
export class FeeReminderModule {}
