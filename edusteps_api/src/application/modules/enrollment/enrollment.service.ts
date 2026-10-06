import { Injectable, Logger } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaEnrollmentRepository } from 'src/infrastructure/repositories/prisma-enrollment.reposity';
import { Enrollment } from 'src/core/entities/enrollment.entity';
import { BaseService } from 'src/common/services/base.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class EnrollmentService extends BaseService<Enrollment> {
  protected readonly logger = new Logger(EnrollmentService.name);
  protected readonly modelName = 'Enrollment';

  constructor(
    prisma: PrismaService,
    private readonly repo: PrismaEnrollmentRepository
  ) {
    super(prisma);
  }

  async create(dto: CreateEnrollmentDto, userId: string) {
    try {
      this.logOperation('Creating enrollment', { customer_id: dto.customer_id, course_id: dto.course_id });

      const customerId = this.validateBigInt(dto.customer_id, 'customer_id');
      const courseId = this.validateBigInt(dto.course_id, 'course_id');
      const clientId = this.validateBigInt(dto.client_id, 'client_id');

      // Validate customer belongs to client
      const customer = await this.prisma.customers.findUnique({
        where: { customer_id: customerId },
      });
      if (!customer || customer.client_id.toString() !== clientId.toString()) {
        throw new Error('Customer does not belong to this client');
      }

      // Validate course belongs to client
      const course = await this.prisma.courses.findUnique({
        where: { course_id: courseId },
      });
      if (!course || course.client_id.toString() !== clientId.toString()) {
        throw new Error('Course does not belong to this client');
      }

      const enrollment = new Enrollment(
        BigInt(0),
        customerId,
        courseId,
        new Date(),
        dto.status || 'active',
        clientId,
        userId,
        userId,
        new Date(),
        new Date(),
      );

      const created = await this.repo.create(enrollment);
      this.logOperation('Enrollment created', { id: created.enrollmentId });
      return created;
    } catch (error) {
      this.handleError('Create enrollment', error);
    }
  }

  async findAll() {
    try {
      this.logOperation('Finding all enrollments');
      return await this.repo.findAll();
    } catch (error) {
      this.handleError('Find all enrollments', error);
    }
  }

  async findByClientId(clientId: string | number | bigint) {
    try {
      const cId = this.validateBigInt(clientId, 'client_id');
      this.logOperation('Finding enrollments by client ID', { clientId: cId.toString() });
      return await this.prisma.enrollments.findMany({
        where: { client_id: cId },
        include: {
          courses: true,
          customers: true,
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      this.handleError('Find enrollments by client ID', error);
    }
  }

  async findById(id: string) {
    try {
      this.logOperation('Finding enrollment by ID', { id });
      return await this.repo.findById(id);
    } catch (error) {
      this.handleError('Find enrollment by ID', error);
    }
  }

  async update(id: string, dto: UpdateEnrollmentDto, userId: string) {
    try {
      this.logOperation('Updating enrollment', { id });

      const updateData: any = {
        ...dto,
        updatedId: userId,
      };

      if (dto.customer_id) {
        updateData.customer_id = this.validateBigInt(dto.customer_id, 'customer_id');
      }
      if (dto.course_id) {
        updateData.course_id = this.validateBigInt(dto.course_id, 'course_id');
      }
      if (dto.client_id) {
        updateData.client_id = this.validateBigInt(dto.client_id, 'client_id');
      }

      const updated = await this.repo.update(id, updateData);
      this.logOperation('Enrollment updated', { id });
      return updated;
    } catch (error) {
      this.handleError('Update enrollment', error);
    }
  }

  async delete(id: string) {
    try {
      this.logOperation('Deleting enrollment', { id });
      await this.repo.delete(id);
      this.logOperation('Enrollment deleted', { id });
    } catch (error) {
      this.handleError('Delete enrollment', error);
    }
  }
}
