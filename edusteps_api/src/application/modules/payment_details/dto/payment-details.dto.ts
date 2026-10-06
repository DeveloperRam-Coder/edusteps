import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PAYMENT_MODE_VALUES } from 'src/common/utils/payment';

export class CreatePaymentDetailsDto {

  @ApiProperty({ example: "1" })
  @IsString()
  customer_id: string;

  @ApiProperty({ example: "2" })
  @IsString()
  cd_id: string;

  @ApiProperty({ example: "3" })
  @IsString()
  client_id: string;

  @ApiProperty({ example: "5000.00" })
  @IsString()
  paid_amount: string;   

  @ApiProperty({ example: "100.00", required: false })
  @IsOptional()
  @IsString()
  discount_amount?: string;

  @ApiProperty({ example: "UPI", required: false, enum: PAYMENT_MODE_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_MODE_VALUES)
  payment_mode?: string;

  @ApiProperty({ example: "TXN123", required: false })
  @IsOptional()
  @IsString()
  transaction_ref?: string;
}
