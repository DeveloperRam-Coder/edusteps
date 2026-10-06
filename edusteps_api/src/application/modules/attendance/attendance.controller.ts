import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, UpdateAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Attendance')
@Controller('attendance')
@ApiBearerAuth()
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  // ── Specific named routes MUST come before wildcard :clientId ──

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get attendance records by customer ID' })
  async getCustomerAttendance(
    @Param('customerId') customerId: string,
    @Query('clientId') clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    await this.tenantAccess.assertCustomerAccess(customerId, req.user.id);
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    try {
      const data = await this.attendanceService.getAttendanceByCustomer(
        Number(customerId),
        Number(clientId),
        startDate,
        endDate,
      );
      return { data, success: true };
    } catch (error) {
      return { data: [], success: false, error: error.message };
    }
  }

  @Get('statistics/:clientId')
  @ApiOperation({ summary: 'Get attendance statistics for a client' })
  async getAttendanceStatistics(
    @Param('clientId') clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const data = await this.attendanceService.getAttendanceStatistics(
      Number(clientId),
      startDate,
      endDate,
    );
    return { data, success: true };
  }

  @Get('summary/:clientId')
  @ApiOperation({ summary: 'Get attendance summary by customer' })
  async getAttendanceSummaryByCustomer(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const data = await this.attendanceService.getAttendanceSummaryByCustomer(Number(clientId));
    return { data, success: true };
  }

  @Get('monthly-report/:clientId')
  @ApiOperation({ summary: 'Get monthly attendance report' })
  async getMonthlyAttendanceReport(
    @Param('clientId') clientId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req?: any,
  ) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const data = await this.attendanceService.getMonthlyAttendanceReport(
      Number(clientId),
      Number(year),
      Number(month),
    );
    return { data, success: true };
  }

  // ── Wildcard route last ──

  @Get(':clientId')
  @ApiOperation({ summary: 'Get attendance records by client ID and date' })
  async getAttendance(
    @Param('clientId') clientId: string,
    @Query('date') date: string,
    @Request() req?: any,
  ) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    try {
      const data = await this.attendanceService.getAttendanceByDate(
        Number(clientId),
        date || new Date().toISOString().split('T')[0],
      );
      return { data, success: true };
    } catch (error) {
      return { data: [], success: false, error: error.message };
    }
  }

  @Post()
  @ApiOperation({ summary: 'Mark attendance for a student' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async markAttendance(@Body() body: MarkAttendanceDto, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(body.client_id, req.user.id);
    await this.tenantAccess.assertCustomerAccess(body.customer_id, req.user.id);
    if (body.course_id) await this.tenantAccess.assertCourseAccess(body.course_id, req.user.id);
    try {
      const data = await this.attendanceService.markAttendance(
        body.customer_id,
        body.client_id,
        body.date,
        body.status,
        req.user.id,
        body.remarks,
        body.course_id,
        body.student_id,
      );
      return { data, success: true, message: 'Attendance marked successfully' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to mark attendance', error: error.message };
    }
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk mark attendance for multiple students' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkMarkAttendance(@Body() body: BulkMarkAttendanceDto, @Request() req: any) {
    for (const attendance of body.attendances) {
      await this.tenantAccess.assertClientAccess(attendance.client_id, req.user.id);
      await this.tenantAccess.assertCustomerAccess(attendance.customer_id, req.user.id);
      if (attendance.course_id) await this.tenantAccess.assertCourseAccess(attendance.course_id, req.user.id);
    }
    const data = await this.attendanceService.bulkMarkAttendance(body.attendances, req.user.id);
    return { data, success: true, count: data.length };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attendance record' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateAttendance(@Param('id') id: string, @Body() body: UpdateAttendanceDto, @Request() req: any) {
    await this.tenantAccess.assertAttendanceAccess(id, req.user.id);
    const data = await this.attendanceService.updateAttendance(
      Number(id),
      body.status,
      body.remarks,
      req.user.id,
    );
    return { data, success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attendance record' })
  async deleteAttendance(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertAttendanceAccess(id, req.user.id);
    await this.attendanceService.deleteAttendance(Number(id));
    return { success: true, message: 'Attendance record deleted successfully' };
  }
}
