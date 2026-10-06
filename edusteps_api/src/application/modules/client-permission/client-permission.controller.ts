import { BadRequestException, Controller, Get, Post, Body, Param, Delete, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ClientPermissionService } from './client-permission.service';
import { CreateClientPermissionDto } from './dto/create-client-permisson.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Client Permissions')
@Controller('client-permissions')
@ApiBearerAuth()
export class ClientPermissionController {
  constructor(
    private readonly service: ClientPermissionService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a client permission' })
  async create(@Body() dto: CreateClientPermissionDto, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(dto.clientId, req.user.id);
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all client permissions' })
  async findAll(@Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.findByClientId(BigInt(clientId));
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all permissions of a client' })
  @ApiParam({ name: 'clientId', example: 1 })
  async findByClient(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.findByClientId(BigInt(clientId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertClientPermissionAccess(id, req.user.id);
    return this.service.delete(BigInt(id));
  }
}
