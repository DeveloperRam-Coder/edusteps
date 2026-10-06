import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceByDate(clientId: number, date: string) {
    try {
      this.logger.log(`Fetching attendance for client ${clientId} on ${date}`);
      const targetDate = new Date(date);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const attendance = await this.prisma.attendances.findMany({
        where: {
          client_id: BigInt(clientId),
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          customers: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              mobile: true,
            },
          },
          courses: {
            select: {
              course_id: true,
              course_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      this.logger.log(`Found ${attendance.length} attendance records`);
      return attendance.map(record => ({
        attendance_id: Number(record.attendance_id),
        customer_id: Number(record.customer_id),
        course_id: record.course_id ? Number(record.course_id) : null,
        client_id: Number(record.client_id),
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        marked_by: record.marked_by,
        customer: record.customers
          ? { ...record.customers, customer_id: Number(record.customers.customer_id) }
          : null,
        course: record.courses
          ? { ...record.courses, course_id: Number(record.courses.course_id) }
          : null,
      }));
    } catch (error) {
      this.logger.error('Error fetching attendance:', error);
      return [];
    }
  }

  async markAttendance(
    customerId: number,
    clientId: number,
    date: string,
    status: string,
    userId: string,
    remarks?: string,
    courseId?: number,
    studentId?: number,
  ) {
    try {
      this.logger.log(`Marking attendance for customer ${customerId} on ${date} as ${status} by user ${userId}`);
      this.logger.log(`Input types: customerId=${typeof customerId}, clientId=${typeof clientId}, userId=${typeof userId}, studentId=${typeof studentId}`);
      
      const targetDate = new Date(date);
      
      // Ensure all numeric IDs are numbers
      const customerIdNum = Number(customerId);
      const clientIdNum = Number(clientId);
      const courseIdNum = courseId ? Number(courseId) : null;
      const studentIdNum = studentId ? Number(studentId) : null;
      
      if (isNaN(customerIdNum) || isNaN(clientIdNum)) {
        throw new Error('Invalid ID format: IDs must be numbers');
      }

      // Validate customer belongs to client
      const customer = await this.prisma.customers.findUnique({
        where: { customer_id: BigInt(customerIdNum) },
      });
      if (!customer || customer.client_id.toString() !== clientIdNum.toString()) {
        throw new Error('Customer does not belong to this client');
      }

      // Validate course belongs to client if provided
      if (courseIdNum) {
        const course = await this.prisma.courses.findUnique({
          where: { course_id: BigInt(courseIdNum) },
        });
        if (!course || course.client_id.toString() !== clientIdNum.toString()) {
          throw new Error('Course does not belong to this client');
        }
      }

      // Validate student belongs to client if provided
      if (studentIdNum) {
        const student = await this.prisma.students.findUnique({
          where: { student_id: BigInt(studentIdNum) },
        });
        if (!student || student.client_id.toString() !== clientIdNum.toString()) {
          throw new Error('Student does not belong to this client');
        }
      }

      // Check if attendance already exists for this customer on this date
      // Match all columns of the unique constraint: customer_id, student_id, client_id, date
      const existingStart = new Date(targetDate);
      existingStart.setUTCHours(0, 0, 0, 0);
      const existingEnd = new Date(targetDate);
      existingEnd.setUTCHours(23, 59, 59, 999);

      const existing = await this.prisma.attendances.findFirst({
        where: {
          customer_id: BigInt(customerIdNum),
          client_id: BigInt(clientIdNum),
          date: { gte: existingStart, lte: existingEnd },
          student_id: studentIdNum ? BigInt(studentIdNum) : null,
        },
      });

      if (existing) {
        this.logger.log(`Updating existing attendance record ${existing.attendance_id}`);
        // Update existing attendance
        const updated = await this.prisma.attendances.update({
          where: { attendance_id: existing.attendance_id },
          data: {
            status: status as any,
            remarks: remarks,
            marked_by: userId,
            ...(courseIdNum && { course_id: BigInt(courseIdNum) }),
            updated_at: new Date(),
            updated_id: userId,
          },
        });

        return {
          attendance_id: Number(updated.attendance_id),
          customer_id: Number(updated.customer_id),
          course_id: updated.course_id ? Number(updated.course_id) : null,
          client_id: Number(updated.client_id),
          date: updated.date,
          status: updated.status,
          remarks: updated.remarks,
          marked_by: updated.marked_by,
        };
      }

      this.logger.log('Creating new attendance record');
      // Create new attendance record
      const created = await this.prisma.attendances.create({
        data: {
          customer_id: BigInt(customerIdNum),
          client_id: BigInt(clientIdNum),
          date: targetDate,
          status: status as any,
          remarks: remarks,
          marked_by: userId,
          created_id: userId,
          updated_id: userId,
          student_id: studentIdNum ? BigInt(studentIdNum) : null,
          ...(courseIdNum && { course_id: BigInt(courseIdNum) }),
        },
      });

      this.logger.log(`Created attendance record ${created.attendance_id}`);
      return {
        attendance_id: Number(created.attendance_id),
        customer_id: Number(created.customer_id),
        course_id: created.course_id ? Number(created.course_id) : null,
        client_id: Number(created.client_id),
        date: created.date,
        status: created.status,
        remarks: created.remarks,
        marked_by: created.marked_by,
      };
    } catch (error) {
      this.logger.error('Error marking attendance:', error.message);
      throw error;
    }
  }

  async updateAttendance(
    attendanceId: number,
    status: string | undefined,
    remarks: string | undefined,
    userId: string,
  ) {
    try {
      this.logger.log(`Updating attendance record ${attendanceId} by user ${userId}`);
      
      const existing = await this.prisma.attendances.findUnique({
        where: { attendance_id: BigInt(attendanceId) },
      });

      if (!existing) {
        throw new NotFoundException(`Attendance record ${attendanceId} not found`);
      }

      const updated = await this.prisma.attendances.update({
        where: { attendance_id: BigInt(attendanceId) },
        data: {
          ...(status && { status: status as any }),
          ...(remarks !== undefined && { remarks }),
          updated_at: new Date(),
          updated_id: userId,
        },
      });

      return {
        attendance_id: Number(updated.attendance_id),
        customer_id: Number(updated.customer_id),
        course_id: updated.course_id ? Number(updated.course_id) : null,
        client_id: Number(updated.client_id),
        date: updated.date,
        status: updated.status,
        remarks: updated.remarks,
        marked_by: updated.marked_by,
      };
    } catch (error) {
      this.logger.error('Error updating attendance:', error);
      throw error;
    }
  }

  async deleteAttendance(attendanceId: number) {
    try {
      this.logger.log(`Deleting attendance record ${attendanceId}`);
      
      const existing = await this.prisma.attendances.findUnique({
        where: { attendance_id: BigInt(attendanceId) },
      });

      if (!existing) {
        throw new NotFoundException(`Attendance record ${attendanceId} not found`);
      }

      await this.prisma.attendances.delete({
        where: { attendance_id: BigInt(attendanceId) },
      });

      this.logger.log(`Deleted attendance record ${attendanceId}`);
    } catch (error) {
      this.logger.error('Error deleting attendance:', error);
      throw error;
    }
  }

  async bulkMarkAttendance(attendances: any[], userId: string) {
    try {
      this.logger.log(`Bulk marking ${attendances.length} attendance records`);
      
      const results = [];
      for (const attendance of attendances) {
        const result = await this.markAttendance(
          attendance.customer_id,
          attendance.client_id,
          attendance.date,
          attendance.status,
          userId,
          attendance.remarks,
          attendance.course_id,
          attendance.student_id,
        );
        results.push(result);
      }

      this.logger.log(`Successfully marked ${results.length} attendance records`);
      return results;
    } catch (error) {
      this.logger.error('Error bulk marking attendance:', error);
      throw error;
    }
  }

  async getAttendanceByCustomer(customerId: number, clientId: number, startDate?: string, endDate?: string) {
    try {
      this.logger.log(`Fetching attendance for customer ${customerId}`);
      
      const where: any = {
        customer_id: BigInt(customerId),
        client_id: BigInt(clientId),
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const attendance = await this.prisma.attendances.findMany({
        where,
        include: {
          courses: {
            select: {
              course_id: true,
              course_name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      return attendance.map(record => ({
        attendance_id: Number(record.attendance_id),
        customer_id: Number(record.customer_id),
        course_id: record.course_id ? Number(record.course_id) : null,
        client_id: Number(record.client_id),
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        marked_by: record.marked_by,
        course: record.courses,
      }));
    } catch (error) {
      this.logger.error('Error fetching customer attendance:', error);
      return [];
    }
  }

  async getAttendanceStatistics(clientId: number, startDate?: string, endDate?: string) {
    try {
      this.logger.log(`Fetching attendance statistics for client ${clientId}`);
      
      const where: any = {
        client_id: BigInt(clientId),
      };

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const attendances = await this.prisma.attendances.findMany({
        where,
      });

      const totalRecords = attendances.length;
      const presentCount = attendances.filter(a => a.status === 'present').length;
      const absentCount = attendances.filter(a => a.status === 'absent').length;
      const lateCount = attendances.filter(a => a.status === 'late').length;
      const excusedCount = attendances.filter(a => a.status === 'excused').length;

      const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

      return {
        total_records: totalRecords,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        excused_count: excusedCount,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        period: { start: startDate, end: endDate },
      };
    } catch (error) {
      this.logger.error('Error fetching attendance statistics:', error);
      throw error;
    }
  }

  async getAttendanceSummaryByCustomer(clientId: number) {
    try {
      this.logger.log(`Fetching attendance summary by customer for client ${clientId}`);

      const customers = await this.prisma.customers.findMany({
        where: { client_id: BigInt(clientId) },
        select: {
          customer_id: true,
          first_name: true,
          last_name: true,
          mobile: true,
        },
      });

      // Single query for all attendance records — avoids N+1
      const allAttendances = await this.prisma.attendances.findMany({
        where: { client_id: BigInt(clientId) },
        select: { customer_id: true, status: true },
      });

      const attendanceByCustomer = new Map<string, typeof allAttendances>();
      for (const record of allAttendances) {
        const key = record.customer_id.toString();
        if (!attendanceByCustomer.has(key)) attendanceByCustomer.set(key, []);
        attendanceByCustomer.get(key)!.push(record);
      }

      const summaries = customers.map((customer) => {
        const attendances = attendanceByCustomer.get(customer.customer_id.toString()) || [];
        const totalDays = attendances.length;
        const presentDays = attendances.filter(a => a.status === 'present').length;
        const absentDays = attendances.filter(a => a.status === 'absent').length;
        const lateDays = attendances.filter(a => a.status === 'late').length;
        const excusedDays = attendances.filter(a => a.status === 'excused').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;

        return {
          customer_id: Number(customer.customer_id),
          customer_name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
          mobile: customer.mobile,
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          excused_days: excusedDays,
          attendance_percentage: Math.round(attendancePercentage * 100) / 100,
        };
      });

      return summaries.sort((a, b) => b.attendance_percentage - a.attendance_percentage);
    } catch (error) {
      this.logger.error('Error fetching attendance summary:', error);
      throw error;
    }
  }

  async getMonthlyAttendanceReport(clientId: number, year: number, month: number) {
    try {
      this.logger.log(`Fetching monthly attendance report for client ${clientId}, ${year}-${month}`);
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendances = await this.prisma.attendances.findMany({
        where: {
          client_id: BigInt(clientId),
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          customers: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      const dailyStats = new Map<string, any>();

      for (let day = 1; day <= endDate.getDate(); day++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dailyStats.set(dateKey, {
          date: dateKey,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }

      attendances.forEach(attendance => {
        const dateKey = attendance.date.toISOString().split('T')[0];
        const stats = dailyStats.get(dateKey);
        if (stats) {
          stats.total++;
          if (attendance.status === 'present') stats.present++;
          if (attendance.status === 'absent') stats.absent++;
          if (attendance.status === 'late') stats.late++;
          if (attendance.status === 'excused') stats.excused++;
        }
      });

      return {
        year,
        month,
        daily_stats: Array.from(dailyStats.values()),
        summary: {
          total_records: attendances.length,
          present_count: attendances.filter(a => a.status === 'present').length,
          absent_count: attendances.filter(a => a.status === 'absent').length,
          late_count: attendances.filter(a => a.status === 'late').length,
          excused_count: attendances.filter(a => a.status === 'excused').length,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching monthly attendance report:', error);
      throw error;
    }
  }
}
