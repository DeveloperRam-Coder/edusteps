import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { FeeReminderService } from './fee-reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Fee Reminders')
@Controller('fee-reminders')
@UseGuards(JwtAuthGuard)
export class FeeReminderController {
  constructor(
    private readonly feeReminderService: FeeReminderService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Post('generate/:clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-generate reminders for all active enrollments' })
  @ApiResponse({ status: 200, description: 'Reminders generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateReminders(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.feeReminderService.generateReminders(Number(clientId));
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manual reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer or detail not found' })
  async createManualReminder(@Body() dto: CreateReminderDto, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(dto.client_id, req.user.id);
    await this.tenantAccess.assertCustomerAccess(dto.customer_id, req.user.id);
    await this.tenantAccess.assertCustomerDetailAccess(dto.cd_id, req.user.id);
    return this.feeReminderService.createManualReminder(dto);
  }

  @Post('send/:reminderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a specific reminder' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async sendReminder(@Param('reminderId') reminderId: string, @Request() req: any) {
    await this.tenantAccess.assertReminderAccess(reminderId, req.user.id);
    return this.feeReminderService.sendReminder(Number(reminderId));
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all reminders for a client' })
  @ApiResponse({ status: 200, description: 'Reminders retrieved successfully' })
  async getReminders(
    @Param('clientId') clientId: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.feeReminderService.getReminders(Number(clientId), status);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get reminders for a specific customer' })
  @ApiResponse({ status: 200, description: 'Customer reminders retrieved successfully' })
  async getCustomerReminders(@Param('customerId') customerId: string, @Request() req: any) {
    await this.tenantAccess.assertCustomerAccess(customerId, req.user.id);
    return this.feeReminderService.getCustomerReminders(Number(customerId));
  }

  @Delete(':reminderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a reminder' })
  @ApiResponse({ status: 200, description: 'Reminder cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async cancelReminder(@Param('reminderId') reminderId: string, @Request() req: any) {
    await this.tenantAccess.assertReminderAccess(reminderId, req.user.id);
    return this.feeReminderService.cancelReminder(Number(reminderId));
  }
}
