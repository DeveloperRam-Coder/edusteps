import { IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReminderDto {
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsNumber({}, { message: 'Customer ID must be a number' })
  @Type(() => Number)
  customer_id: number;

  @IsNotEmpty({ message: 'Client ID is required' })
  @IsNumber({}, { message: 'Client ID must be a number' })
  @Type(() => Number)
  client_id: number;

  @IsNotEmpty({ message: 'Customer detail ID is required' })
  @IsNumber({}, { message: 'Customer detail ID must be a number' })
  @Type(() => Number)
  cd_id: number;

  @IsNotEmpty({ message: 'Due date is required' })
  @IsDateString({}, { message: 'Due date must be a valid date' })
  due_date: string;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Type(() => Number)
  amount_due: number;

  @IsOptional()
  @IsDateString({}, { message: 'Reminder date must be a valid date' })
  reminder_date?: string;
}
