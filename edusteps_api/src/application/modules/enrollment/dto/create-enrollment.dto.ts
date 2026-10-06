import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateEnrollmentDto {

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  customer_id: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  course_id: number;

  @ApiProperty({ required: false, default: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  client_id: number;
}
