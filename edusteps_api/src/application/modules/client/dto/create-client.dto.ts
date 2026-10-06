import { IsNotEmpty, IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'ABC Corporation' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'client@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123 Main St, City, Country', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'acc_123456789', required: false })
  @IsOptional()
  @IsString()
  paymentProviderAccountId?: string;

  @ApiProperty({ example: false, required: false, description: 'Whether this institute uses structured master course/fee configuration' })
  @IsOptional()
  @IsBoolean()
  requiresMasterConfig?: boolean;
}