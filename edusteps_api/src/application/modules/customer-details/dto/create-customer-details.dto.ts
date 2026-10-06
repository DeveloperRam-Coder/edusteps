import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateCustomerDetailsDto {
  @ApiProperty({ example: 'Ravi' })
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Kumar', required: false })
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'Maths' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  registration_date: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @IsDateString()
  deactivate_date?: string;

  @ApiProperty({
    example: 1,
    description: 'Customer ID (BigInt as number)',
  })
  @IsNumber()
  @Type(() => Number)
  customer_id: number;
}