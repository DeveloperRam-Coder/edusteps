import { Injectable, Logger } from '@nestjs/common';
import { PrismaCourseRepository } from 'src/infrastructure/repositories/prisma-course.repository';
import { Course } from 'src/core/entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseService } from 'src/common/services/base.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class CourseService extends BaseService<Course> {
  protected readonly logger = new Logger(CourseService.name);
  protected readonly modelName = 'Course';

  constructor(
    prisma: PrismaService,
    private readonly courseRepository: PrismaCourseRepository
  ) {
    super(prisma);
  }

  async create(createCourseDto: CreateCourseDto, createdId: string): Promise<Course> {
    try {
      this.logOperation('Creating course', { courseName: createCourseDto.courseName });

      const clientId = this.validateBigInt(createCourseDto.clientId, 'clientId');

      const payload: any = {
        clientId,
        courseName: createCourseDto.courseName.trim(),
        description: this.sanitizeString(createCourseDto.description),
        rate: createCourseDto.rate,
        rateType: createCourseDto.rateType,
        priorityNo: createCourseDto.priorityNo,
        createdId,
        updatedId: createdId,
      };

      const created = await this.courseRepository.create(payload as unknown as Course);
      this.logOperation('Course created', { id: created.courseId });
      return created;
    } catch (error) {
      this.handleError('Create course', error);
    }
  }

  async findAll(): Promise<Course[]> {
    try {
      this.logOperation('Finding all courses');
      return await this.courseRepository.findAll();
    } catch (error) {
      this.handleError('Find all courses', error);
    }
  }

  async findById(id: string): Promise<Course | null> {
    try {
      this.logOperation('Finding course by ID', { id });
      return await this.courseRepository.findById(id);
    } catch (error) {
      this.handleError('Find course by ID', error);
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, updatedId: string): Promise<Course> {
    try {
      this.logOperation('Updating course', { id });

      const payload: Partial<Course & { updatedId?: string }> = {
        ...(updateCourseDto.courseName !== undefined && { courseName: updateCourseDto.courseName.trim() }),
        ...(updateCourseDto.description !== undefined && { description: this.sanitizeString(updateCourseDto.description) }),
        ...(updateCourseDto.rate !== undefined && { rate: updateCourseDto.rate }),
        ...(updateCourseDto.rateType !== undefined && { rateType: updateCourseDto.rateType as Course['rateType'] }),
        ...(updateCourseDto.priorityNo !== undefined && { priorityNo: updateCourseDto.priorityNo }),
        updatedId,
      };

      const updated = await this.courseRepository.update(id, payload);
      this.logOperation('Course updated', { id });
      return updated;
    } catch (error) {
      this.handleError('Update course', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logOperation('Deleting course', { id });
      await this.courseRepository.delete(id);
      this.logOperation('Course deleted', { id });
    } catch (error) {
      this.handleError('Delete course', error);
    }
  }

  async findByClientId(clientId: bigint | number): Promise<Course[]> {
    try {
      const cid = typeof clientId === 'number' ? BigInt(clientId) : clientId;
      this.logOperation('Finding courses by client ID', { clientId: cid.toString() });
      return await this.courseRepository.findByClientId(cid);
    } catch (error) {
      this.handleError('Find courses by client ID', error);
    }
  }

  async findByRateType(rateType: string): Promise<Course[]> {
    try {
      this.logOperation('Finding courses by rate type', { rateType });
      return await this.courseRepository.findByRateType(rateType);
    } catch (error) {
      this.handleError('Find courses by rate type', error);
    }
  }

  async findByPriorityRange(minPriority: number, maxPriority: number): Promise<Course[]> {
    try {
      this.logOperation('Finding courses by priority range', { minPriority, maxPriority });
      return await this.courseRepository.findByPriorityRange(minPriority, maxPriority);
    } catch (error) {
      this.handleError('Find courses by priority range', error);
    }
  }

  async getAnalytics(id: string) {
    try {
      this.logOperation('Fetching course analytics', { id });

      const course = await this.prisma.courses.findUnique({
        where: { course_id: BigInt(id) },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      const details = await this.prisma.customer_details.findMany({
        where: { subject: course.course_name },
        orderBy: { created_at: 'desc' },
      });

      const detailIds = details.map((detail) => detail.cd_id);
      const customerIds = [...new Set(details.map((detail) => detail.customer_id.toString()))];

      const customers = customerIds.length
        ? await this.prisma.customers.findMany({
            where: {
              customer_id: { in: customerIds.map((customerId) => BigInt(customerId)) },
            },
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              mobile: true,
              email: true,
            },
          })
        : [];

      const customerMap = new Map<string, { name: string; mobile: string | null; email: string | null }>();
      for (const customer of customers) {
        customerMap.set(customer.customer_id.toString(), {
          name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
          mobile: customer.mobile,
          email: customer.email,
        });
      }

      const payments = detailIds.length
        ? await this.prisma.payment_details.findMany({
            where: {
              client_id: course.client_id,
              cd_id: { in: detailIds },
            },
            select: {
              cd_id: true,
              paid_amount: true,
              paid_on: true,
            },
            orderBy: { paid_on: 'desc' },
          })
        : [];

      const attendance = await this.prisma.attendances.findMany({
        where: {
          client_id: course.client_id,
          course_id: course.course_id,
        },
        select: {
          status: true,
          date: true,
        },
      });

      const paidByCd = new Map<string, number>();
      for (const payment of payments) {
        const key = payment.cd_id.toString();
        paidByCd.set(key, (paidByCd.get(key) || 0) + Number(payment.paid_amount || 0));
      }

      const presentLikeCount = attendance.filter(
        (item) => item.status === 'present' || item.status === 'late',
      ).length;
      const attendanceRate = attendance.length > 0 ? (presentLikeCount / attendance.length) * 100 : 0;

      const activeStudents = details.filter((detail) => detail.is_active).length;
      const totalStudents = details.length;
      const courseRevenue = payments.reduce((sum, payment) => sum + Number(payment.paid_amount || 0), 0);

      return {
        course: {
          course_id: course.course_id.toString(),
          client_id: course.client_id.toString(),
          course_name: course.course_name,
          description: course.description,
          rate: Number(course.rate),
          rate_type: course.rate_type,
          priority_no: course.priority_no,
        },
        metrics: {
          active_students: activeStudents,
          total_students: totalStudents,
          course_revenue: courseRevenue,
          attendance_rate: Math.round(attendanceRate * 100) / 100,
          total_sessions: 0,
        },
        students: details.map((detail) => {
          const customer = customerMap.get(detail.customer_id.toString());
          return {
            cd_id: detail.cd_id.toString(),
            customer_id: detail.customer_id.toString(),
            student_name: `${detail.first_name} ${detail.last_name || ''}`.trim(),
            subject: detail.subject,
            amount: Number(detail.amount),
            is_active: detail.is_active,
            registration_date: detail.registration_date,
            total_paid: paidByCd.get(detail.cd_id.toString()) || 0,
            balance_due: Math.max(Number(detail.amount) - (paidByCd.get(detail.cd_id.toString()) || 0), 0),
            parent_name: customer?.name || 'Unknown',
            parent_mobile: customer?.mobile || null,
            parent_email: customer?.email || null,
          };
        }),
      };
    } catch (error) {
      this.handleError('Get course analytics', error);
    }
  }
}
