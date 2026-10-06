import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: 1, description: 'Client ID' })
  client_id: bigint;

  @ApiProperty({ example: 'ABC Corporation' })
  name: string;

  @ApiProperty({ example: '9876543210', required: false })
  phone?: string;

  @ApiProperty({ example: 'business@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  address?: string;

  @ApiProperty({ required: false })
  payment_provider_account_id?: string;

  @ApiProperty({ example: false })
  requires_master_config: boolean;

  @ApiProperty()
  created_id: string;

  @ApiProperty({ required: false })
  updated_id?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
