import { BadRequestException, Body, Controller, Get, Param, Post, Put, Delete, Query, Request } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CustomerDetailsService } from './customer-details.service';
import { CreateCustomerDetailsDto } from './dto/create-customer-details.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Customer Details')
@Controller('customer-details')
@ApiBearerAuth()
export class CustomerDetailsController {

  constructor(
    private service: CustomerDetailsService,
    private readonly tenantAccess: TenantAccessService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new customer details' })
  @ApiResponse({ status: 201, description: 'Customer details created successfully' })
  async create(@Body() dto: CreateCustomerDetailsDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    return this.service.create(dto, userId);
  }

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all customer details or filter by customer_id' })
  async findAll(@Query('customer_id') customerId: string | undefined, @Request() req: any) {
    if (!customerId) throw new BadRequestException('customer_id is required');
    await this.tenantAccess.assertCustomerAccess(customerId, req.user.id);
    return this.service.findByCustomerId(customerId);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get customer details by id' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerDetailAccess(id, req.user.id);
    return this.service.findOne(BigInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: 'Customer details updated successfully' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDetailsDto>, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertCustomerDetailAccess(id, userId);
    if (dto.customer_id) await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    return this.service.update(BigInt(id), dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer details' })
  @ApiResponse({ status: 200, description: 'Customer details deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerDetailAccess(id, req.user.id);
    return this.service.remove(BigInt(id));
  }

}
