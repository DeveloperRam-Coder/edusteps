import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Enrollment')
@Controller('enrollments')
@ApiBearerAuth()
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment created successfully' })
  async create(@Body() dto: CreateEnrollmentDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertClientAccess(dto.client_id, userId);
    await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    await this.tenantAccess.assertCourseAccess(dto.course_id, userId);
    return this.enrollmentService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all enrollments' })
  async findAll(@Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.enrollmentService.findByClientId(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertEnrollmentAccess(id, req.user.id);
    return this.enrollmentService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update enrollment' })
  async update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertEnrollmentAccess(id, userId);
    if (dto.client_id) await this.tenantAccess.assertClientAccess(dto.client_id, userId);
    if (dto.customer_id) await this.tenantAccess.assertCustomerAccess(dto.customer_id, userId);
    if (dto.course_id) await this.tenantAccess.assertCourseAccess(dto.course_id, userId);
    return this.enrollmentService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete enrollment' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertEnrollmentAccess(id, req.user.id);
    await this.enrollmentService.delete(id);
    return { success: true, message: 'Enrollment deleted successfully' };
  }
}
