import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateCustomerDetailsDto } from './dto/create-customer-details.dto';
import { BaseService } from 'src/common/services/base.service';

@Injectable()
export class CustomerDetailsService extends BaseService<any> {
  protected readonly logger = new Logger(CustomerDetailsService.name);
  protected readonly modelName = 'CustomerDetails';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private async resolveCourseId(customerId: bigint, subject: string) {
    const customer = await this.prisma.customers.findUnique({
      where: { customer_id: customerId },
      select: { client_id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const course = await this.prisma.courses.findFirst({
      where: {
        client_id: customer.client_id,
        course_name: subject.trim(),
      },
      select: { course_id: true, client_id: true },
    });

    return {
      clientId: customer.client_id,
      courseId: course?.course_id ?? null,
    };
  }

  private async syncStudentFromDetail(
    detail: {
      cd_id: bigint;
      customer_id: bigint;
      first_name: string;
      last_name?: string | null;
      subject: string;
      registration_date: Date;
      amount: any;
      is_active: boolean;
      deactivate_date?: Date | null;
    },
    userId: string,
  ) {
    const { clientId, courseId } = await this.resolveCourseId(detail.customer_id, detail.subject);
    const displayName = `${detail.first_name} ${detail.last_name || ''}`.trim();

    return this.prisma.students.upsert({
      where: { legacy_cd_id: detail.cd_id },
      create: {
        legacy_cd_id: detail.cd_id,
        customer_id: detail.customer_id,
        client_id: clientId,
        course_id: courseId,
        first_name: detail.first_name,
        last_name: detail.last_name || '',
        display_name: displayName,
        subject: detail.subject,
        admission_date: detail.registration_date,
        fee_amount: detail.amount,
        status: detail.is_active ? 'active' : 'inactive',
        is_active: detail.is_active,
        deactivate_date: detail.deactivate_date ?? null,
        created_id: userId,
        updated_id: userId,
      },
      update: {
        customer_id: detail.customer_id,
        client_id: clientId,
        course_id: courseId,
        first_name: detail.first_name,
        last_name: detail.last_name || '',
        display_name: displayName,
        subject: detail.subject,
        admission_date: detail.registration_date,
        fee_amount: detail.amount,
        status: detail.is_active ? 'active' : 'inactive',
        is_active: detail.is_active,
        deactivate_date: detail.deactivate_date ?? null,
        updated_id: userId,
        updated_at: new Date(),
      },
      select: { student_id: true },
    });
  }

  private serializeDetail(detail: any, studentId?: bigint | null) {
    return {
      ...detail,
      cd_id: detail.cd_id.toString(),
      customer_id: detail.customer_id.toString(),
      student_id: studentId ? studentId.toString() : null,
    };
  }

  async create(dto: CreateCustomerDetailsDto, userId: string) {
    try {
      this.logOperation('Creating customer detail', { customer_id: dto.customer_id });

      const customerId = this.validateBigInt(dto.customer_id, 'customer_id');

      const detail = await this.prisma.customer_details.create({
        data: {
          first_name: dto.first_name.trim(),
          last_name: this.sanitizeString(dto.last_name) || '',
          subject: dto.subject.trim(),
          registration_date: new Date(dto.registration_date),
          deactivate_date: dto.deactivate_date ? new Date(dto.deactivate_date) : null,
          amount: dto.amount,
          is_active: dto.is_active ?? true,
          customer_id: customerId,
          created_id: userId,
          updated_id: userId,
        },
      });

      const student = await this.syncStudentFromDetail(detail, userId);

      this.logOperation('Customer detail created', { id: detail.cd_id });

      return this.serializeDetail(detail, student.student_id);
    } catch (error) {
      this.handleError('Create customer detail', error);
    }
  }

  async findAll() {
    try {
      this.logOperation('Finding all customer details');
      const details = await this.prisma.customer_details.findMany({
        include: { payment_details: true },
      });
      const students = await this.prisma.students.findMany({
        where: { legacy_cd_id: { in: details.map((detail) => detail.cd_id) } },
        select: { student_id: true, legacy_cd_id: true },
      });
      const studentMap = new Map(students.map((student) => [student.legacy_cd_id?.toString(), student.student_id]));
      return details.map((detail) => this.serializeDetail(detail, studentMap.get(detail.cd_id.toString()) || null));
    } catch (error) {
      this.handleError('Find all customer details', error);
    }
  }

  async findByCustomerId(customerId: string) {
    try {
      this.logOperation('Finding customer details by customer ID', { customerId });
      const details = await this.prisma.customer_details.findMany({
        where: { customer_id: this.validateBigInt(customerId, 'customer_id') },
        orderBy: { created_at: 'desc' },
      });
      const students = await this.prisma.students.findMany({
        where: { legacy_cd_id: { in: details.map((detail) => detail.cd_id) } },
        select: { student_id: true, legacy_cd_id: true },
      });
      const studentMap = new Map(students.map((student) => [student.legacy_cd_id?.toString(), student.student_id]));
      return details.map((detail) => this.serializeDetail(detail, studentMap.get(detail.cd_id.toString()) || null));
    } catch (error) {
      this.handleError('Find customer details by customer ID', error);
    }
  }

  async findOne(id: bigint) {
    try {
      this.logOperation('Finding customer detail by ID', { id: id.toString() });
      const data = await this.prisma.customer_details.findUnique({
        where: { cd_id: id },
      });
      if (!data) throw new NotFoundException('Customer detail not found');
      const student = await this.prisma.students.findUnique({
        where: { legacy_cd_id: id },
        select: { student_id: true },
      });
      return this.serializeDetail(data, student?.student_id || null);
    } catch (error) {
      this.handleError('Find customer detail', error);
    }
  }

  async update(id: bigint, dto: Partial<CreateCustomerDetailsDto>, userId: string) {
    try {
      this.logOperation('Updating customer detail', { id: id.toString() });

      await this.findOne(id);

      const updateData: any = { updated_id: userId };

      if (dto.first_name !== undefined) updateData.first_name = dto.first_name.trim();
      if (dto.last_name !== undefined) updateData.last_name = this.sanitizeString(dto.last_name) || '';
      if (dto.subject !== undefined) updateData.subject = dto.subject.trim();
      if (dto.registration_date !== undefined) updateData.registration_date = new Date(dto.registration_date);
      if (dto.deactivate_date !== undefined) updateData.deactivate_date = dto.deactivate_date ? new Date(dto.deactivate_date) : null;
      if (dto.amount !== undefined) updateData.amount = dto.amount;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
      if (dto.customer_id !== undefined) updateData.customer_id = this.validateBigInt(dto.customer_id, 'customer_id');

      const updated = await this.prisma.customer_details.update({
        where: { cd_id: id },
        data: updateData,
      });

      const student = await this.syncStudentFromDetail(updated, userId);

      this.logOperation('Customer detail updated', { id: id.toString() });

      return this.serializeDetail(updated, student.student_id);
    } catch (error) {
      this.handleError('Update customer detail', error);
    }
  }

  async remove(id: bigint) {
    try {
      this.logOperation('Deleting customer detail', { id: id.toString() });
      await this.findOne(id);
      const deleted = await this.prisma.customer_details.delete({
        where: { cd_id: id },
      });
      await this.prisma.students.deleteMany({
        where: { legacy_cd_id: id },
      });
      this.logOperation('Customer detail deleted', { id: id.toString() });
      return this.serializeDetail(deleted, null);
    } catch (error) {
      this.handleError('Delete customer detail', error);
    }
  }
}
