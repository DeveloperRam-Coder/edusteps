import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
    @IsNumber()
    @Type(() => Number)
    amount: number;

    @IsString()
    cd_id: string;

    @IsString()
    customer_id: string;

    @IsOptional()
    metadata?: any;
}

export class VerifyPaymentDto {
    @IsString()
    razorpay_order_id: string;

    @IsString()
    razorpay_payment_id: string;

    @IsString()
    razorpay_signature: string;

    @IsString()
    cd_id: string;

    @IsString()
    customer_id: string;

    @IsString()
    client_id: string;

    @IsNumber()
    @Type(() => Number)
    paid_amount: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    discount_amount?: number;
}
