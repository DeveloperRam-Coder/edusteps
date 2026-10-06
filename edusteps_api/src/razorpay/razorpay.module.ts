import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { PaymentDetailsModule } from '../application/modules/payment_details/payment_details.module';

@Module({
    imports: [ConfigModule, PaymentDetailsModule],
    controllers: [RazorpayController],
    providers: [RazorpayService],
    exports: [RazorpayService],
})
export class RazorpayModule { }
