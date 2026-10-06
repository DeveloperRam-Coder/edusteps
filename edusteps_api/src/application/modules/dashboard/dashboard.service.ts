import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getStats(clientId: string) {
    const cId = BigInt(clientId);
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    try {
      // Validate that client exists
      const clientExists = await this.prisma.clients.findUnique({
        where: { client_id: cId },
      });
      if (!clientExists) {
        throw new Error('Client not found');
      }
      // Execute all queries in parallel for better performance
      const [
        totalCustomers,
        newCustomersThisMonth,
        lastMonthCustomers,
        revenueData,
        activeEnrollments,
        totalAttendanceRecords,
        presentAttendanceCount,
        absentAttendanceCount,
        lateAttendanceCount,
      ] = await Promise.all([
        // Total customers
        this.prisma.customers.count({
          where: { client_id: cId },
        }),

        // Customers joined this month
        this.prisma.customers.count({
          where: {
            client_id: cId,
            created_at: { gte: firstDayOfMonth },
          },
        }),

        // Last month customers for growth calculation
        this.prisma.customers.count({
          where: {
            client_id: cId,
            created_at: {
              gte: firstDayOfLastMonth,
              lt: firstDayOfMonth,
            },
          },
        }),

        // Total revenue
        this.prisma.payment_details.aggregate({
          where: { client_id: cId },
          _sum: { paid_amount: true },
        }),

        // Active enrollments
        this.prisma.enrollments.count({
          where: { client_id: cId, status: 'active' },
        }),

        // Attendance counts for this month
        this.prisma.attendances.count({
          where: {
            client_id: cId,
            date: { gte: firstDayOfMonth },
          },
        }),
        this.prisma.attendances.count({
          where: {
            client_id: cId,
            date: { gte: firstDayOfMonth },
            status: 'present',
          },
        }),
        this.prisma.attendances.count({
          where: {
            client_id: cId,
            date: { gte: firstDayOfMonth },
            status: 'absent',
          },
        }),
        this.prisma.attendances.count({
          where: {
            client_id: cId,
            date: { gte: firstDayOfMonth },
            status: 'late',
          },
        }),
      ]);

      // Calculate growth percentage — guard against division-by-zero
      let growth = 'No data yet';
      if (lastMonthCustomers > 0) {
        const percentage = ((newCustomersThisMonth - lastMonthCustomers) / lastMonthCustomers) * 100;
        growth = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}% vs last month`;
      } else if (newCustomersThisMonth > 0) {
        growth = '+100% (first activity)';
      } else if (totalCustomers > 0) {
        growth = 'No new this month';
      }

      // Calculate attendance metrics
      const attendanceRate = totalAttendanceRecords > 0
        ? ((presentAttendanceCount + lateAttendanceCount) / totalAttendanceRecords) * 100
        : 0;

      return {
        totalCustomers,
        newCustomersThisMonth,
        activeEnrollments,
        totalRevenue: revenueData._sum.paid_amount || 0,
        growth,
        attendance: {
          total_records: totalAttendanceRecords,
          present_count: presentAttendanceCount,
          absent_count: absentAttendanceCount,
          late_count: lateAttendanceCount,
          attendance_rate: Math.round(attendanceRate * 100) / 100,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard stats', error);
      throw error;
    }
  }

  async getRevenueChart(clientId: string) {
    const cId = BigInt(clientId);
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    try {
      // Single query to get all payments from last 6 months
      const payments = await this.prisma.payment_details.findMany({
        where: {
          client_id: cId,
          paid_on: { gte: sixMonthsAgo },
        },
        select: {
          paid_on: true,
          paid_amount: true,
        },
      });

      // Aggregate by month in memory (much faster than 6 separate queries)
      const monthlyRevenue = new Map<string, number>();

      // Initialize all 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyRevenue.set(key, 0);
      }

      // Aggregate payments by month
      payments.forEach((payment) => {
        const date = new Date(payment.paid_on);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        const current = monthlyRevenue.get(key) || 0;
        monthlyRevenue.set(key, current + Number(payment.paid_amount));
      });

      // Convert to array format
      return Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    } catch (error) {
      this.logger.error('Error fetching revenue chart', error);
      throw error;
    }
  }

  async getActivity(clientId: string) {
    const cId = BigInt(clientId);

    try {
      // Fetch recent customers and payments in parallel
      const [recentCustomers, recentPayments] = await Promise.all([
        this.prisma.customers.findMany({
          where: { client_id: cId },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: {
            first_name: true,
            last_name: true,
            created_at: true,
          },
        }),

        this.prisma.payment_details.findMany({
          where: { client_id: cId },
          include: {
            customers: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
            customer_details: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        }),
      ]);

      // Combine, deduplicate, and sort activities
      const rawActivities = [
        ...recentCustomers.map((c) => ({
          type: 'customer' as const,
          message: `New customer: ${c.first_name} ${c.last_name || ''}`,
          time: c.created_at,
          icon: 'UserPlus',
          student_name: `${c.first_name} ${c.last_name || ''}`.trim(),
          payer_name: undefined as string | undefined,
        })),
        ...recentPayments.map((p) => ({
          type: 'payment' as const,
          message: `Payment received: ₹${p.paid_amount} from ${p.customers.first_name}`,
          time: p.created_at,
          icon: 'IndianRupee',
          payer_name: `${p.customers.first_name} ${p.customers.last_name || ''}`.trim(),
          student_name: p.customer_details
            ? `${p.customer_details.first_name} ${p.customer_details.last_name || ''}`.trim()
            : undefined,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      // Deduplicate: same type + same timestamp (to ms) + same name = duplicate
      const seen = new Set<string>();
      const activities = rawActivities.filter((a) => {
        const key = `${a.type}__${new Date(a.time).getTime()}__${(a.payer_name || a.student_name || '').toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10);

      return activities;
    } catch (error) {
      this.logger.error('Error fetching activity', error);
      throw error;
    }
  }
}
