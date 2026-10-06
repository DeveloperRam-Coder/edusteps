import { IsNotEmpty, IsString, IsOptional, IsEmail, IsNumberString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'First name must be at least 3 characters' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName?: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsNumberString()
  @MinLength(10, { message: 'Mobile must be 10 digits' })
  @MaxLength(10, { message: 'Mobile must be 10 digits' })
  mobile: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;  // nullable — student may not have an email address

  @ApiProperty({ example: 'New York, USA', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  address?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumberString()
  clientId: string;
}
