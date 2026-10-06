import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'Cannot access payment history' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ enum: ['billing', 'technical', 'account', 'feature', 'other'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['billing', 'technical', 'account', 'feature', 'other'])
  category: string;

  @ApiProperty({ example: 'When I click on payment history...' })
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  message: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'], required: false })
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;
}
