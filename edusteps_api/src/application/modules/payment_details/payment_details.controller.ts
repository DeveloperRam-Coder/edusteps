import { BadRequestException, Controller, Post, Body, Get, Param, Put, Delete, Request, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentDetailsService } from './payment_details.service';
import { CreatePaymentDetailsDto } from './dto/payment-details.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags("Payment-Details")
@Controller('payment-details')
@ApiBearerAuth()
export class PaymentDetailsController {
  constructor(
    private service: PaymentDetailsService,
    private readonly tenantAccess: TenantAccessService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create Payment Details' })
  @ApiResponse({ status: 200, description: 'Payment details created successfully' })
  async create(@Body() dto: CreatePaymentDetailsDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertClientAccess(dto.client_id, userId);
    await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    await this.tenantAccess.assertCustomerDetailAccess(dto.cd_id, userId);
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payment details' })
  async findAll(@Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.findByClientId(clientId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get payments by customer ID' })
  async findByCustomerId(@Param('customerId') customerId: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerAccess(customerId, req.user.id);
    return this.service.findByCustomerId(customerId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get payments by client ID' })
  async findByClientId(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.findByClientId(clientId);
  }

  @Get('cd/:cdId')
  @ApiOperation({ summary: 'Get payments by customer detail ID' })
  async findByCustomerDetail(@Param('cdId') cdId: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerDetailAccess(cdId, req.user.id);
    return this.service.findByCustomerDetail(cdId);
  }

  @Get('revenue/:clientId')
  @ApiOperation({ summary: 'Calculate revenue for client' })
  async calculateRevenue(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.calculateRevenue(clientId);
  }

  @Get('quick-view/:id')
  @ApiOperation({ summary: 'Get quick-view payload for a payment' })
  @ApiResponse({ status: 200, description: 'Quick-view payload returned' })
  async getQuickView(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertPaymentAccess(id, req.user.id);
    return this.service.getQuickView(id);
  }

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Generate invoice HTML for a payment' })
  @ApiResponse({ status: 200, description: 'Invoice HTML returned' })
  async generatePdfInvoice(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertPaymentAccess(id, req.user.id);
    return this.service.generatePdfInvoice(id);
  }

  @Get('summary/:cdId')
  @ApiOperation({ summary: 'Get payment summary for enrollment' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved successfully' })
  async getPaymentSummary(@Param('cdId') cdId: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerDetailAccess(cdId, req.user.id);
    return this.service.getPaymentSummary(cdId);
  }

  @Get('customer-due/:customerId')
  @ApiOperation({ summary: 'Get customer due summary with enrollment statuses' })
  @ApiResponse({ status: 200, description: 'Customer due summary retrieved successfully' })
  async getCustomerDueSummary(@Param('customerId') customerId: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerAccess(customerId, req.user.id);
    return this.service.getCustomerDueSummary(customerId);
  }

  @Get('collection-summary/:clientId')
  @ApiOperation({ summary: 'Get payment collection performance summary' })
  @ApiResponse({ status: 200, description: 'Collection summary retrieved successfully' })
  async getCollectionSummary(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.getPaymentCollectionSummary(clientId);
  }

  @Get('aged-outstanding/:clientId')
  @ApiOperation({ summary: 'Get aged outstanding buckets (today / upcoming / 1-7d / 8-30d / >30d overdue)' })
  @ApiResponse({ status: 200, description: 'Aged outstanding report retrieved successfully' })
  async getAgedOutstanding(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.service.getAgedOutstandingByClient(clientId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update payment details' })
  @ApiResponse({ status: 200, description: 'Payment details updated successfully' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePaymentDetailsDto>, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertPaymentAccess(id, userId);
    if (dto.client_id) await this.tenantAccess.assertClientAccess(dto.client_id, userId);
    if (dto.customer_id) await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    if (dto.cd_id) await this.tenantAccess.assertCustomerDetailAccess(dto.cd_id, userId);
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment details' })
  @ApiResponse({ status: 200, description: 'Payment details deleted successfully' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertPaymentAccess(id, req.user.id);
    return this.service.delete(id);
  }

}
