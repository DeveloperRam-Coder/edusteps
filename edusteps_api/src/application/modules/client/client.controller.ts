import { Controller, Get, Post, Body, Param, Put, Delete, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly tenantAccess: TenantAccessService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: CreateClientDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    return this.clientService.create(createClientDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of all clients' })
  findAll(@Request() req: any) {
    return this.clientService.findAccessible(req.user.id);
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Get client by email' })
  findByEmail(@Param('email') email: string, @Request() req: any) {
    return this.clientService.findAccessibleByEmail(email, req.user.id);
  }

  @Get('by-phone/:phone')
  @ApiOperation({ summary: 'Get clients by phone' })
  findByPhone(@Param('phone') phone: string, @Request() req: any) {
    return this.clientService.findAccessibleByPhone(phone, req.user.id);
  }

  @Get('by-name')
  @ApiOperation({ summary: 'Get clients by name' })
  findByName(@Query('name') name: string, @Request() req: any) {
    return this.clientService.findAccessibleByName(name, req.user.id);
  }

  @Get('by-user/check')
  @ApiOperation({ summary: 'Check if current user has a business details (client) record' })
  @ApiResponse({ status: 200, description: 'Client details or null' })
  async findByCurrentUser(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      return { exists: false, client: null };
    }
    const client = await this.clientService.findByUserId(userId);
    return { exists: !!client, client };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findById(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(id, req.user.id);
    return this.clientService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertClientAccess(id, userId);
    return this.clientService.update(id, updateClientDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertClientAccess(id, userId);
    await this.clientService.delete(id);
    return { success: true, message: 'Client deleted successfully' };
  }
}
