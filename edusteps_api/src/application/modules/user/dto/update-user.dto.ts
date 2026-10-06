import { IsOptional, IsString, IsEmail, IsNumberString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsNumberString()
  mobile?: string;

  @ApiProperty({ example: '/uploads/avatars/abc.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
