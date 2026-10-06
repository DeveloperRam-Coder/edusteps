import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
 
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
