import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsEnum, MaxLength, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsNumberString()
  clientId: string;

  @ApiProperty({ example: 'Advanced NestJS' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'Course name must not exceed 255 characters' })
  courseName: string;

  @ApiProperty({ example: 'Learn advanced NestJS concepts', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({ example: 99.99 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({ example: 'per_hour', enum: ['per_hour', 'per_session', 'per_course', 'per_month'] })
  @IsNotEmpty()
  @IsEnum(['per_hour', 'per_session', 'per_course', 'per_month'])
  rateType: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  priorityNo: number;
}