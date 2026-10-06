import { BadRequestException, Controller, Get, Post, Body, Param, Put, Delete, Query, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { TenantAccessService } from 'src/common/services/tenant-access.service';

@ApiTags('Courses')
@Controller('courses')
@ApiBearerAuth()
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly tenantAccess: TenantAccessService,
  ) { }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Get courses by client ID' })
  async findByClientId(@Param('clientId') clientId: string, @Request() req: any) {
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.courseService.findByClientId(BigInt(clientId));
  }

  @Get('by-rate-type/:rateType')
  @ApiOperation({ summary: 'Get courses by rate type' })
  async findByRateType(@Param('rateType') rateType: string, @Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const courses = await this.courseService.findByClientId(BigInt(clientId));
    return courses.filter((course: any) => course.rateType === rateType || course.rate_type === rateType);
  }

  @Get('by-priority')
  @ApiOperation({ summary: 'Get courses by priority range' })
  async findByPriorityRange(@Query('min') min: number, @Query('max') max: number, @Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    const courses = await this.courseService.findByClientId(BigInt(clientId));
    return courses.filter((course: any) => {
      const priority = Number(course.priorityNo ?? course.priority_no);
      return priority >= Number(min) && priority <= Number(max);
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 200, description: 'Course created successfully' })
  async create(@Body() createCourseDto: CreateCourseDto, @Request() req: any) {
    const userId = req.user?.id || 'a010c4d2-8d91-4bc9-9ee5-05f6707395bc';
    await this.tenantAccess.assertClientAccess(createCourseDto.clientId, userId);
    return this.courseService.create(createCourseDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'List of all courses' })
  async findAll(@Query('clientId') clientId: string | undefined, @Request() req: any) {
    if (!clientId) throw new BadRequestException('clientId is required');
    await this.tenantAccess.assertClientAccess(clientId, req.user.id);
    return this.courseService.findByClientId(BigInt(clientId));
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get course analytics by ID' })
  async getAnalytics(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertCourseAccess(id, req.user.id);
    return this.courseService.getAnalytics(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findById(@Param('id') id: string, @Request() req: any) {
    await this.tenantAccess.assertCourseAccess(id, req.user.id);
    return this.courseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update course' })
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto, @Request() req: any) {
    const userId = req.user?.id || 'system';
    await this.tenantAccess.assertCourseAccess(id, userId);
    return this.courseService.update(id, updateCourseDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course' })
  async delete(@Param('id') id: string, @Request() req: any) {
    try {
      await this.tenantAccess.assertCourseAccess(id, req.user.id);
      await this.courseService.delete(id);
      return { success: true, message: 'Course deleted successfully' };
    }
    catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Course with id ${id} not found`);
      }
      throw error;
    }
  }
}
