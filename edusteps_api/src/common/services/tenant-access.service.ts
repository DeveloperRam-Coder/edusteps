import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class TenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertClientAccess(clientId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(clientId, 'client');

    const client = await this.prisma.clients.findFirst({
      where: {
        client_id: id,
        OR: [
          { created_id: userId },
          { client_permission: { some: { user_id: userId } } },
        ],
      },
      select: { client_id: true },
    });

    if (!client) {
      throw new ForbiddenException('You do not have permission to access this client');
    }

    return id;
  }

  async assertCustomerAccess(customerId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(customerId, 'customer');
    const customer = await this.prisma.customers.findUnique({
      where: { customer_id: id },
      select: { client_id: true },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    await this.assertClientAccess(customer.client_id, userId);
    return customer.client_id;
  }

  async assertCourseAccess(courseId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(courseId, 'course');
    const course = await this.prisma.courses.findUnique({
      where: { course_id: id },
      select: { client_id: true },
    });

    if (!course) throw new NotFoundException('Course not found');
    await this.assertClientAccess(course.client_id, userId);
    return course.client_id;
  }

  async assertPaymentAccess(paymentId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(paymentId, 'payment');
    const payment = await this.prisma.payment_details.findUnique({
      where: { id },
      select: { client_id: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    await this.assertClientAccess(payment.client_id, userId);
    return payment.client_id;
  }

  async assertCustomerDetailAccess(customerDetailId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(customerDetailId, 'customer detail');
    const detail = await this.prisma.customer_details.findUnique({
      where: { cd_id: id },
      select: { customer_id: true },
    });

    if (!detail) throw new NotFoundException('Customer detail not found');
    return this.assertCustomerAccess(detail.customer_id, userId);
  }

  async assertAttendanceAccess(attendanceId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(attendanceId, 'attendance');
    const attendance = await this.prisma.attendances.findUnique({
      where: { attendance_id: id },
      select: { client_id: true },
    });

    if (!attendance) throw new NotFoundException('Attendance record not found');
    await this.assertClientAccess(attendance.client_id, userId);
    return attendance.client_id;
  }

  async assertReminderAccess(reminderId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(reminderId, 'reminder');
    const reminder = await this.prisma.fee_reminders.findUnique({
      where: { reminder_id: id },
      select: { client_id: true },
    });

    if (!reminder) throw new NotFoundException('Reminder not found');
    await this.assertClientAccess(reminder.client_id, userId);
    return reminder.client_id;
  }

  async assertEnrollmentAccess(enrollmentId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(enrollmentId, 'enrollment');
    const enrollment = await this.prisma.enrollments.findUnique({
      where: { enrollment_id: id },
      select: { client_id: true },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    await this.assertClientAccess(enrollment.client_id, userId);
    return enrollment.client_id;
  }

  async assertClientPermissionAccess(permissionId: string | number | bigint, userId: string): Promise<bigint> {
    const id = this.toBigInt(permissionId, 'client permission');
    const permission = await this.prisma.client_permission.findUnique({
      where: { permission_id: id },
      select: { client_id: true },
    });

    if (!permission) throw new NotFoundException('Client permission not found');
    await this.assertClientAccess(permission.client_id, userId);
    return permission.client_id;
  }

  private toBigInt(value: string | number | bigint, label: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new NotFoundException(`Invalid ${label} id`);
    }
  }
}
