import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class UpdateClientPermissionDto{
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId?:string
}