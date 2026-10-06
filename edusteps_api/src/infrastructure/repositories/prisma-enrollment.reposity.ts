import { Injectable } from '@nestjs/common';
import { GenericPrismaRepository } from './generic-prisma.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Enrollment } from 'src/core/entities/enrollment.entity';
import { IEnrollmentRepository } from 'src/core/interfaces/enrollment-repository.interface';

@Injectable()
export class PrismaEnrollmentRepository
  extends GenericPrismaRepository<Enrollment>
  implements IEnrollmentRepository
{
  protected modelName = 'enrollments';
  protected primaryKeyName = 'enrollment_id';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(data: Enrollment): Promise<Enrollment> {
    const created = await this.prisma.enrollments.create({
      data: {
        customer_id: BigInt(data.customerId),
        course_id: BigInt(data.courseId),
        enrolled_at: data.enrolledAt,
        status: data.status as any,
        client_id: BigInt(data.clientId),
        created_id: data.createdId,
        updated_id: data.updatedId,
      },
    });

    return this.mapToEnrollment(created);
  }

  async findById(id: string): Promise<Enrollment | null> {
    const found = await this.prisma.enrollments.findUnique({
      where: { enrollment_id: BigInt(id) },
    });

    return found ? this.mapToEnrollment(found) : null;
  }

  async findAll(): Promise<Enrollment[]> {
    const list = await this.prisma.enrollments.findMany({
      include: {
        courses: true,
        customers: true,
      },
    });
    return list.map(e => this.mapToEnrollment(e));
  }

  async update(id: string, partial: Partial<Enrollment>): Promise<Enrollment> {
    const updated = await this.prisma.enrollments.update({
      where: { enrollment_id: BigInt(id) },
      data: {
        customer_id: partial.customerId ? BigInt(partial.customerId) : undefined,
        course_id: partial.courseId ? BigInt(partial.courseId) : undefined,
        enrolled_at: partial.enrolledAt,
        status: partial.status as any,
        client_id: partial.clientId ? BigInt(partial.clientId) : undefined,
        updated_id: partial.updatedId,
      },
    });

    return this.mapToEnrollment(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.enrollments.delete({
      where: { enrollment_id: BigInt(id) },
    });
  }

  private mapToEnrollment(data: any): Enrollment {
    return new Enrollment(
      data.enrollment_id,
      data.customer_id,
      data.course_id,
      data.enrolled_at,
      data.status,
      data.client_id,
      data.created_id,
      data.updated_id,
      data.created_at,
      data.updated_at,
    );
  }
}
