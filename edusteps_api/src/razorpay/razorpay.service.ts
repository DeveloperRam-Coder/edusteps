import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayService {
    private razorpay: Razorpay;
    private readonly logger = new Logger(RazorpayService.name);

    constructor(private configService: ConfigService) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!keyId || !keySecret) {
            this.logger.warn('Razorpay credentials not configured. Payment gateway disabled.');
            return;
        }

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        this.logger.log('Razorpay service initialized');
    }

    /**
     * Create a Razorpay order for payment
     */
    async createOrder(amount: number, receiptId: string, metadata: any = {}) {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.');
        }

        try {
            const numericAmount = Number(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                throw new BadRequestException(`Invalid amount: ${amount}. Amount must be a positive number.`);
            }

            const options = {
                amount: Math.round(numericAmount * 100), // Convert to paise
                currency: 'INR',
                receipt: receiptId,
                notes: metadata,
            };

            this.logger.log(`Creating Razorpay order: amount=${options.amount} paise, receipt=${receiptId}`);
            const order = await this.razorpay.orders.create(options);
            this.logger.log(`Razorpay order created: ${order.id}`);
            return order;
        } catch (error: any) {
            this.logger.error('Error creating Razorpay order:', error?.message || error);
            if (error instanceof BadRequestException) throw error;
            const detail = error?.error?.description || error?.message || 'Unknown Razorpay error';
            throw new BadRequestException(`Failed to create payment order: ${detail}`);
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string,
    ): boolean {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay is not configured');
        }

        try {
            const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
            if (!keySecret) {
                this.logger.error('Razorpay key secret not configured');
                return false;
            }

            const generatedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            const isValid = generatedSignature === signature;
            this.logger.log(
                `Payment signature verification: ${isValid ? 'SUCCESS' : 'FAILED'}`,
            );
            return isValid;
        } catch (error) {
            this.logger.error('Error verifying payment signature:', error);
            return false;
        }
    }

    /**
     * Fetch payment details from Razorpay
     */
    async fetchPayment(paymentId: string) {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay is not configured');
        }

        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            this.logger.error('Error fetching payment:', error);
            throw new BadRequestException('Failed to fetch payment details');
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(body: string, signature: string): boolean {
        if (!this.razorpay) {
            throw new BadRequestException('Razorpay is not configured');
        }

        try {
            const webhookSecret = this.configService.get<string>(
                'RAZORPAY_WEBHOOK_SECRET',
            );
            if (!webhookSecret) {
                this.logger.warn('Webhook secret not configured');
                return false;
            }

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(body)
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            this.logger.error('Error verifying webhook signature:', error);
            return false;
        }
    }
}
