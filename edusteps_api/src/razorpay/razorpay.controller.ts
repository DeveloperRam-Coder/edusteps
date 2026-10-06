import {
    Controller,
    Post,
    Body,
    UseGuards,
    Headers,
    Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RazorpayService } from './razorpay.service';
import { PaymentDetailsService } from '../application/modules/payment_details/payment_details.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/razorpay.dto';
import { JwtAuthGuard } from '../application/modules/auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { mapRazorpayMethodToPaymentMode } from 'src/common/utils/payment';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Razorpay')
@Controller('razorpay')
export class RazorpayController {
    constructor(
        private razorpayService: RazorpayService,
        private paymentDetailsService: PaymentDetailsService,
        private readonly tenantAccess: TenantAccessService,
    ) { }

    @Post('create-order')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create Razorpay order for payment' })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
        await this.tenantAccess.assertCustomerAccess(dto.customer_id, req.user.id);
        await this.tenantAccess.assertCustomerDetailAccess(dto.cd_id, req.user.id);
        const receiptId = `receipt_${dto.cd_id}_${Date.now()}`;
        const metadata = {
            cd_id: dto.cd_id,
            customer_id: dto.customer_id,
        };

        const order = await this.razorpayService.createOrder(
            dto.amount,
            receiptId,
            metadata,
        );

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
        };
    }

    @Post('verify-payment')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify payment and create payment record' })
    @ApiResponse({ status: 200, description: 'Payment verified and recorded' })
    async verifyPayment(@Body() dto: VerifyPaymentDto, @Req() req: any) {
        await this.tenantAccess.assertClientAccess(dto.client_id, req.user.id);
        await this.tenantAccess.assertCustomerAccess(dto.customer_id, req.user.id);
        await this.tenantAccess.assertCustomerDetailAccess(dto.cd_id, req.user.id);
        // Verify signature
        const isValid = this.razorpayService.verifyPaymentSignature(
            dto.razorpay_order_id,
            dto.razorpay_payment_id,
            dto.razorpay_signature,
        );

        if (!isValid) {
            throw new Error('Invalid payment signature');
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await this.razorpayService.fetchPayment(
            dto.razorpay_payment_id,
        );

        // Create payment record
        const userId = req.user?.id || 'system';
        const payment = await this.paymentDetailsService.create(
            {
                customer_id: String(dto.customer_id),
                cd_id: String(dto.cd_id),
                client_id: dto.client_id,
                paid_amount: String(dto.paid_amount),
                discount_amount: String(dto.discount_amount || 0),
                payment_mode: mapRazorpayMethodToPaymentMode(paymentDetails?.method),
                transaction_ref: dto.razorpay_payment_id,
            },
            userId,
        );

        return {
            success: true,
            payment,
            razorpayPayment: paymentDetails,
        };
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Razorpay webhook endpoint' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        const body = JSON.stringify(req.body);

        // Verify webhook signature
        const isValid = this.razorpayService.verifyWebhookSignature(
            body,
            signature,
        );

        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        // Process webhook event
        const event = req.body;
        const sanitizeLog = (v: unknown) => String(v ?? '').replace(/[\r\n]/g, ' ');
        console.log('Razorpay webhook event:', sanitizeLog(event.event));

        // You can add custom logic here based on event type
        // e.g., payment.captured, payment.failed, refund.created, etc.

        return { status: 'ok' };
    }
}
