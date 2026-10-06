import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateClientPermissionDto{
  @ApiProperty({example:1})
  @IsNotEmpty()
  clientId:bigint;
  
  @ApiProperty({example:'user_123',required:false})
  @IsNotEmpty()
  @IsString()
  userId:string;

}