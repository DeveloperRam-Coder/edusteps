import { Injectable } from '@nestjs/common';
import { GenericPrismaRepository } from './generic-prisma.repository';
import { ICourseRepository } from 'src/core/interfaces/course-repository.interface';
import { Course } from 'src/core/entities/course.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaCourseRepository extends GenericPrismaRepository<Course> implements ICourseRepository {
  protected modelName = 'courses';
  protected primaryKeyName = 'course_id';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(course: Course): Promise<any> {
    const created = await this.prisma.courses.create({
      data: {
        client_id: course.clientId,
        course_name: course.courseName,
        description: course.description,
        rate: course.rate,
        rate_type: course.rateType,
        priority_no: course.priorityNo,
        created_id: course.createdId,
        updated_id: course.updatedId,
      },
    });
    return this.mapToCourse(created);
  }

  async findById(id: string): Promise<Course | null> {
    const found = await this.prisma.courses.findUnique({
      where: { course_id: BigInt(id) },
    });
    if (!found) return null;
    return this.mapToCourse(found);
  }

  async findAll(): Promise<Course[]> {
    const list = await this.prisma.courses.findMany();
    return list.map(course => this.mapToCourse(course));
  }

  async update(id: string, course: Partial<Course>): Promise<Course> {
    const updated = await this.prisma.courses.update({
      where: { course_id: BigInt(id) },
      data: {
        course_name: course.courseName,
        description: course.description,
        rate: course.rate,
        rate_type: course.rateType,
        priority_no: course.priorityNo,
        updated_id: course.updatedId,
      },
    });
    return this.mapToCourse(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.courses.delete({
      where: { course_id: BigInt(id) },
    });
  }

  async findByClientId(clientId: bigint): Promise<Course[]> {
    const list = await this.prisma.courses.findMany({
      where: { client_id: clientId },
    });
    return list.map(course => this.mapToCourse(course));
  }

  async findByRateType(rateType: string): Promise<Course[]> {
    const list = await this.prisma.courses.findMany({
      where: { rate_type: rateType as any },
    });
    return list.map(course => this.mapToCourse(course));
  }

  async findByPriorityRange(minPriority: number, maxPriority: number): Promise<Course[]> {
    const list = await this.prisma.courses.findMany({
      where: {
        priority_no: { gte: minPriority, lte: maxPriority },
      },
    });
    return list.map(course => this.mapToCourse(course));
  }

  private mapToCourse(data: any): Course {
    return new Course(
      data.course_id,
      data.client_id,
      data.course_name,
      Number(data.rate),
      data.rate_type,
      data.priority_no,
      data.created_id,
      data.updated_id,
      data.description,
      data.created_at,
      data.updated_at,
    );
  }
}