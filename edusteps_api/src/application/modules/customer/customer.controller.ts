import { BadRequestException, Controller, Get, Post, Body, Param, Put, Delete, Query, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerService } from './customer.service';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly tenantAccess: TenantAccessService,
  ) { }

  @Get('search')
  @ApiOperation({ summary: 'Search customers by name or mobile' })
  async search(@Query('q') q: string, @Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.customerService.search(q || '', clientId);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Get customers by client ID' })
  async findByClientId(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.customerService.findByClientId(BigInt(clientId));
  }

  @Get('by-mobile/:mobile')
  @ApiOperation({ summary: 'Get customers by mobile number' })
  async findByMobileNo(@Param('mobile') mobile: string, @Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const customers = await this.customerService.findByMobile(mobile);
    return (customers || []).filter((customer: any) => String(customer.client_id) === String(clientId));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async create(@Body() createCustomerDto: CreateCustomerDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertClientAccess(createCustomerDto.clientId, userId);
    return this.customerService.create(createCustomerDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of all customers' })
  async findAll(@Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.customerService.findByClientId(BigInt(clientId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async findById(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerAccess(id, req.user.id);
    return this.customerService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertCustomerAccess(id, userId);
    return this.customerService.update(id, updateCustomerDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  async delete(@Param('id') id: string, @Request() req: any) {
    try {
      await this.tenantAccess.assertCustomerAccess(id, req.user.id);
      await this.customerService.delete(id);
      return { success: true, message: 'Customer deleted successfully' };
    }
    catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Customer with id ${id} not found`);
      }
      throw error;
    }
  }
}
