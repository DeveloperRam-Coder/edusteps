import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreatePaymentDetailsDto } from './dto/payment-details.dto';
import { BaseService } from 'src/common/services/base.service';
import { getPaymentStatus, normalizePaymentMode } from 'src/common/utils/payment';

@Injectable()
export class PaymentDetailsService extends BaseService<any> {
  protected readonly logger = new Logger(PaymentDetailsService.name);
  protected readonly modelName = 'PaymentDetails';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private decimalToNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  private getCustomerName(customer: { first_name: string; last_name?: string | null }) {
    return `${customer.first_name} ${customer.last_name || ''}`.trim();
  }

  private getStudentName(detail: { first_name: string; last_name?: string | null }) {
    return `${detail.first_name} ${detail.last_name || ''}`.trim();
  }

  private deriveMilestone(detail: { subject: string; registration_date: Date }, paymentCount: number, transactionRef?: string | null) {
    const ref = String(transactionRef || '').toLowerCase();
    if (ref.includes('book') || ref.includes('material')) {
      return 'Book / Material Charges';
    }

    if (paymentCount <= 1) {
      return 'Admission Fee';
    }

    return `${detail.registration_date.toLocaleDateString('en-IN', { month: 'long' })} Tuition Fee`;
  }

  private deriveDashboardStatus(input: {
    paidAmount: number;
    totalPaidForEnrollment: number;
    courseFee: number;
    transactionRef?: string | null;
    paymentMode?: string | null;
    isActive?: boolean;
  }) {
    const statusText = `${input.transactionRef || ''} ${input.paymentMode || ''}`.toLowerCase();
    if (statusText.includes('refund')) {
      return 'REFUNDED';
    }

    if (input.paidAmount < 0) {
      return 'REFUNDED';
    }

    if (!input.isActive && input.totalPaidForEnrollment < input.courseFee) {
      return 'PENDING_OVERDUE';
    }

    return input.totalPaidForEnrollment >= input.courseFee ? 'SUCCESSFUL' : 'PENDING_OVERDUE';
  }

  private async buildCourseMaps(clientId: bigint, subjects: string[]) {
    const courseNames = [...new Set(subjects.filter(Boolean))];
    if (courseNames.length === 0) {
      return {
        courseIdByName: new Map<string, string>(),
      };
    }

    const courses = await this.prisma.courses.findMany({
      where: {
        client_id: clientId,
        course_name: { in: courseNames },
      },
      select: {
        course_id: true,
        course_name: true,
      },
    });

    const courseIdByName = new Map<string, string>();
    for (const course of courses) {
      courseIdByName.set(course.course_name, course.course_id.toString());
    }

    return { courseIdByName };
  }

  private toPaymentListItem(
    payment: any,
    totalsByCd: Map<string, number>,
    paymentCountByCd: Map<string, number>,
    courseIdByName: Map<string, string>,
  ) {
    const customerName = this.getCustomerName(payment.customers);
    const studentName = this.getStudentName(payment.customer_details);
    const subject = payment.customer_details.subject;
    const cdKey = payment.cd_id.toString();
    const totalPaidForEnrollment = totalsByCd.get(cdKey) || 0;
    const paymentCount = paymentCountByCd.get(cdKey) || 0;
    const courseFee = this.decimalToNumber(payment.customer_details.amount);
    const paidAmount = this.decimalToNumber(payment.paid_amount);
    const discountAmount = this.decimalToNumber(payment.discount_amount);

    return {
      id: payment.id.toString(),
      customer_id: payment.customer_id.toString(),
      cd_id: payment.cd_id.toString(),
      client_id: payment.client_id.toString(),
      paid_amount: paidAmount,
      discount_amount: discountAmount,
      payment_mode: normalizePaymentMode(payment.payment_mode),
      transaction_ref: payment.transaction_ref,
      paid_on: payment.paid_on,
      created_at: payment.created_at,
      customer_name: customerName,
      customer_mobile: payment.customers.mobile,
      customer_email: payment.customers.email,
      student_name: studentName,
      subject,
      course_fee: courseFee,
      course_id: courseIdByName.get(subject) || null,
      milestone: this.deriveMilestone(payment.customer_details, paymentCount, payment.transaction_ref),
      enrollment_total_paid: totalPaidForEnrollment,
      enrollment_balance_due: Math.max(courseFee - totalPaidForEnrollment, 0),
      status: this.deriveDashboardStatus({
        paidAmount,
        totalPaidForEnrollment,
        courseFee,
        transactionRef: payment.transaction_ref,
        paymentMode: payment.payment_mode,
        isActive: payment.customer_details.is_active,
      }),
    };
  }

  async create(dto: CreatePaymentDetailsDto, userId: string) {
    try {
      this.logOperation('Creating payment', { customer_id: dto.customer_id });

      const customerId = this.validateBigInt(dto.customer_id, 'customer_id');
      const cdId = this.validateBigInt(dto.cd_id, 'cd_id');
      const clientId = this.validateBigInt(dto.client_id, 'client_id');

      // Validate customer belongs to client
      const customer = await this.prisma.customers.findUnique({
        where: { customer_id: customerId },
      });
      if (!customer || customer.client_id.toString() !== clientId.toString()) {
        throw new BadRequestException('Customer does not belong to this client');
      }

      // Validate customer detail belongs to customer
      const customerDetail = await this.prisma.customer_details.findUnique({
        where: { cd_id: cdId },
      });
      if (!customerDetail || customerDetail.customer_id.toString() !== customerId.toString()) {
        throw new BadRequestException('Customer detail does not belong to this customer');
      }

      const paidAmount = parseFloat(String(dto.paid_amount));
      const discountAmount = parseFloat(String(dto.discount_amount ?? '0'));

      if (isNaN(paidAmount) || paidAmount < 0) {
        throw new BadRequestException('Invalid paid amount');
      }
      if (isNaN(discountAmount) || discountAmount < 0) {
        throw new BadRequestException('Invalid discount amount');
      }

      // Sum all existing payments for this enrollment to get accurate lifecycle status
      const existingPayments = await this.prisma.payment_details.aggregate({
        where: { cd_id: cdId },
        _sum: { paid_amount: true },
      });
      const existingTotal = this.decimalToNumber(existingPayments._sum.paid_amount);
      const totalPaidForEnrollment = existingTotal + paidAmount;

      // Persist lifecycle status
      const status = this.deriveDashboardStatus({
        paidAmount,
        totalPaidForEnrollment,
        courseFee: this.decimalToNumber(customerDetail.amount),
        transactionRef: dto.transaction_ref,
        paymentMode: dto.payment_mode,
        isActive: customerDetail.is_active,
      });

      const payment = await this.prisma.payment_details.create({
        data: {
          customer_id: customerId,
          cd_id: cdId,
          client_id: clientId,
          paid_amount: paidAmount,
          discount_amount: discountAmount,
          payment_mode: normalizePaymentMode(dto.payment_mode),
          transaction_ref: this.sanitizeString(dto.transaction_ref),
          lifecycle_status: status,
          created_id: userId,
        },
      });

      this.logOperation('Payment created', { id: payment.id });

      return {
        ...payment,
        id: payment.id.toString(),
        customer_id: payment.customer_id.toString(),
        cd_id: payment.cd_id.toString(),
        client_id: payment.client_id.toString(),
      };
    } catch (error) {
      this.handleError('Create payment', error);
    }
  }

  async findAll() {
    try {
      this.logOperation('Finding all payments');
      const payments = await this.prisma.payment_details.findMany({
        include: {
          customers: {
            select: {
              first_name: true,
              last_name: true,
              mobile: true,
              email: true,
            },
          },
          customer_details: {
            select: {
              first_name: true,
              last_name: true,
              subject: true,
              amount: true,
              registration_date: true,
              is_active: true,
            },
          },
        },
        orderBy: { paid_on: 'desc' },
      });

      const subjects = payments.map((payment) => payment.customer_details.subject);
      // Group payments by client and build course maps per client
      const clientIds = [...new Set(payments.map((p) => p.client_id.toString()))];
      const courseIdByName = new Map<string, string>();
      for (const cid of clientIds) {
        const { courseIdByName: cidMap } = await this.buildCourseMaps(BigInt(cid), subjects);
        cidMap.forEach((v, k) => courseIdByName.set(k, v));
      }

      const totalsByCd = new Map<string, number>();
      const paymentCountByCd = new Map<string, number>();
      for (const payment of payments) {
        const key = payment.cd_id.toString();
        totalsByCd.set(key, (totalsByCd.get(key) || 0) + this.decimalToNumber(payment.paid_amount));
        paymentCountByCd.set(key, (paymentCountByCd.get(key) || 0) + 1);
      }

      return payments.map((payment) =>
        this.toPaymentListItem(payment, totalsByCd, paymentCountByCd, courseIdByName),
      );
    } catch (error) {
      this.handleError('Find all payments', error);
    }
  }

  async findByCustomerId(customerId: string) {
    const payments = await this.prisma.payment_details.findMany({
      where: { customer_id: BigInt(customerId) },
      orderBy: { paid_on: 'desc' }
    });
    return payments.map(p => ({
      ...p,
      id: p.id.toString(),
      customer_id: p.customer_id.toString(),
      cd_id: p.cd_id.toString(),
      client_id: p.client_id.toString(),
      payment_mode: normalizePaymentMode(p.payment_mode),
    }));
  }

  async findByClientId(clientId: string) {
    const clientBigInt = BigInt(clientId);
    const payments = await this.prisma.payment_details.findMany({
      where: { client_id: BigInt(clientId) },
      include: {
        customers: {
          select: {
            first_name: true,
            last_name: true,
            mobile: true,
            email: true,
          }
        },
        customer_details: {
          select: {
            first_name: true,
            last_name: true,
            subject: true,
            amount: true,
            registration_date: true,
            is_active: true,
          }
        }
      },
      orderBy: { paid_on: 'desc' }
    });

    const { courseIdByName } = await this.buildCourseMaps(
      clientBigInt,
      payments.map((payment) => payment.customer_details.subject),
    );

    const totalsByCd = new Map<string, number>();
    const paymentCountByCd = new Map<string, number>();
    for (const payment of payments) {
      const key = payment.cd_id.toString();
      totalsByCd.set(key, (totalsByCd.get(key) || 0) + this.decimalToNumber(payment.paid_amount));
      paymentCountByCd.set(key, (paymentCountByCd.get(key) || 0) + 1);
    }

    return payments.map((payment) =>
      this.toPaymentListItem(payment, totalsByCd, paymentCountByCd, courseIdByName),
    );
  }

  async findByCustomerDetail(cdId: string) {
    const payments = await this.prisma.payment_details.findMany({
      where: { cd_id: BigInt(cdId) },
      orderBy: { paid_on: 'desc' }
    });
    return payments.map(p => ({
      ...p,
      id: p.id.toString(),
      customer_id: p.customer_id.toString(),
      cd_id: p.cd_id.toString(),
      client_id: p.client_id.toString(),
      payment_mode: normalizePaymentMode(p.payment_mode),
    }));
  }

  async calculateRevenue(clientId: string) {
    const clientBigInt = BigInt(clientId);
    const result = await this.prisma.payment_details.aggregate({
      where: { client_id: clientBigInt },
      _sum: { paid_amount: true }
    });

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayResult = await this.prisma.payment_details.aggregate({
      where: {
        client_id: clientBigInt,
        paid_on: { gte: startOfToday }
      },
      _sum: { paid_amount: true }
    });

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthResult = await this.prisma.payment_details.aggregate({
      where: {
        client_id: clientBigInt,
        paid_on: { gte: startOfMonth }
      },
      _sum: { paid_amount: true }
    });

    const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const previousMonthResult = await this.prisma.payment_details.aggregate({
      where: {
        client_id: clientBigInt,
        paid_on: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth,
        },
      },
      _sum: { paid_amount: true },
    });

    const trendStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const trendPayments = await this.prisma.payment_details.findMany({
      where: {
        client_id: clientBigInt,
        paid_on: { gte: trendStartDate },
      },
      select: {
        paid_amount: true,
        paid_on: true,
      },
      orderBy: { paid_on: 'asc' },
    });

    const trendMap = new Map<string, { month: string; revenue: number }>();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      trendMap.set(key, {
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: 0,
      });
    }

    for (const payment of trendPayments) {
      const date = new Date(payment.paid_on);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = trendMap.get(key);
      if (!bucket) continue;
      bucket.revenue += this.decimalToNumber(payment.paid_amount);
    }

    const currentMonthRevenue = this.decimalToNumber(monthResult._sum.paid_amount);
    const previousMonthRevenue = this.decimalToNumber(previousMonthResult._sum.paid_amount);
    const growthPercentage = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0
        ? 100
        : 0;

    return {
      totalRevenue: this.decimalToNumber(result._sum.paid_amount),
      revenueToday: this.decimalToNumber(todayResult._sum.paid_amount),
      revenueThisMonth: currentMonthRevenue,
      previousMonthRevenue,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      trend: Array.from(trendMap.values()),
    };
  }

  async update(id: string, dto: Partial<CreatePaymentDetailsDto>, userId: string) {
    try {
      this.logOperation('Updating payment', { id });

      const updateData: any = {};

      if (dto.customer_id) updateData.customer_id = this.validateBigInt(dto.customer_id, 'customer_id');
      if (dto.cd_id) updateData.cd_id = this.validateBigInt(dto.cd_id, 'cd_id');
      if (dto.client_id) updateData.client_id = this.validateBigInt(dto.client_id, 'client_id');

      if (dto.paid_amount !== undefined) {
        const paidAmount = parseFloat(String(dto.paid_amount));
        if (isNaN(paidAmount) || paidAmount < 0) {
          throw new BadRequestException('Invalid paid amount');
        }
        updateData.paid_amount = paidAmount;
      }

      if (dto.discount_amount !== undefined) {
        const discountAmount = parseFloat(String(dto.discount_amount));
        if (isNaN(discountAmount) || discountAmount < 0) {
          throw new BadRequestException('Invalid discount amount');
        }
        updateData.discount_amount = discountAmount;
      }

      if (dto.payment_mode) updateData.payment_mode = normalizePaymentMode(dto.payment_mode);
      if (dto.transaction_ref !== undefined) updateData.transaction_ref = this.sanitizeString(dto.transaction_ref);

      const paymentId = this.validateBigInt(id, 'id');

      // Recalculate lifecycle status when amount fields change
      if (updateData.paid_amount !== undefined || updateData.cd_id !== undefined) {
        const existing = await this.prisma.payment_details.findUnique({
          where: { id: paymentId },
          select: { cd_id: true, paid_amount: true },
        });
        if (existing) {
          const cdId = updateData.cd_id ?? existing.cd_id;
          const newPaidAmount = updateData.paid_amount ?? this.decimalToNumber(existing.paid_amount);
          const customerDetail = await this.prisma.customer_details.findUnique({
            where: { cd_id: cdId },
            select: { amount: true, is_active: true },
          });
          if (customerDetail) {
            const siblingsTotal = await this.prisma.payment_details.aggregate({
              where: { cd_id: cdId, id: { not: paymentId } },
              _sum: { paid_amount: true },
            });
            const totalPaid = this.decimalToNumber(siblingsTotal._sum.paid_amount) + newPaidAmount;
            updateData.lifecycle_status = this.deriveDashboardStatus({
              paidAmount: newPaidAmount,
              totalPaidForEnrollment: totalPaid,
              courseFee: this.decimalToNumber(customerDetail.amount),
              transactionRef: dto.transaction_ref,
              paymentMode: dto.payment_mode,
              isActive: customerDetail.is_active,
            });
          }
        }
      }

      const payment = await this.prisma.payment_details.update({
        where: { id: paymentId },
        data: updateData,
      });

      this.logOperation('Payment updated', { id });

      return {
        ...payment,
        id: payment.id.toString(),
        customer_id: payment.customer_id.toString(),
        cd_id: payment.cd_id.toString(),
        client_id: payment.client_id.toString(),
      };
    } catch (error) {
      this.handleError('Update payment', error);
    }
  }

  async delete(id: string) {
    try {
      this.logOperation('Deleting payment', { id });

      const payment = await this.prisma.payment_details.delete({
        where: { id: this.validateBigInt(id, 'id') },
      });

      this.logOperation('Payment deleted', { id });

      return {
        ...payment,
        id: payment.id.toString(),
        customer_id: payment.customer_id.toString(),
        cd_id: payment.cd_id.toString(),
        client_id: payment.client_id.toString(),
      };
    } catch (error) {
      this.handleError('Delete payment', error);
    }
  }

  /**
   * Generates a PDF buffer server-side.
   * In a real implementation, use puppeteer or pdfkit here.
   */
  async generateInvoice(paymentId: string): Promise<{ buffer: Buffer; filename: string }> {
    const { html, invoiceNo, studentName } = await this.getInvoiceData(paymentId);

    // Placeholder: Integration with a PDF engine
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const buffer = await page.pdf({ format: 'A4' });

    return {
      buffer: Buffer.from(html), // Placeholder
      filename: `${invoiceNo}_${studentName.replace(/\s+/g, '_')}.pdf`
    };
  }

  /**
   * Returns invoice HTML payload for the frontend preview flow.
   */
  async generatePdfInvoice(paymentId: string) {
    const { html, invoiceNo, studentName } = await this.getInvoiceData(paymentId);

    return {
      html,
      invoiceNo,
      studentName,
    };
  }

  async getInvoiceData(paymentId: string) {
    const payment = await this.prisma.payment_details.findUnique({
      where: { id: BigInt(paymentId) },
      include: {
        customers: true,
        customer_details: true,
        clients: true,
      }
    });
    if (!payment) throw new Error('Payment not found');

    const invoiceNo = `INV-${payment.id.toString().padStart(6, '0')}`;
    const paidOn = new Date(payment.paid_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const milestone = this.deriveMilestone(
      payment.customer_details,
      await this.prisma.payment_details.count({ where: { cd_id: payment.cd_id } }),
      payment.transaction_ref,
    );

    const allPayments = await this.prisma.payment_details.findMany({
      where: { cd_id: payment.cd_id },
      select: {
        paid_amount: true,
        discount_amount: true,
      },
    });
    const courseFee = this.decimalToNumber(payment.customer_details.amount);
    const totalPaidForEnrollment = allPayments.reduce(
      (sum, item) => sum + this.decimalToNumber(item.paid_amount),
      0,
    );
    const balanceDue = Math.max(courseFee - totalPaidForEnrollment, 0);
    const invoiceStatus = getPaymentStatus(totalPaidForEnrollment, courseFee);
    const statusLabel = invoiceStatus === 'UNPAID'
      ? 'UNPAID'
      : invoiceStatus === 'PARTIAL'
        ? 'PARTIAL'
        : 'PAID';
    const statusColor = invoiceStatus === 'UNPAID'
      ? '#dc2626'
      : invoiceStatus === 'PARTIAL'
        ? '#d97706'
        : '#16a34a';
    const statusBg = invoiceStatus === 'UNPAID'
      ? '#fee2e2'
      : invoiceStatus === 'PARTIAL'
        ? '#fef3c7'
        : '#dcfce7';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice – ${invoiceNo}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .page-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #3b82f6;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      color: #64748b;
      font-size: 12px;
      margin-top: 4px;
      line-height: 1.4;
    }
    .invoice-header-right { text-align: right; }
    .invoice-badge-title { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; line-height: 1; }
    .invoice-no { font-size: 13px; font-weight: 600; color: #3b82f6; margin-top: 4px; }
    .status-pill {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}40;
    }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
    .info-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 16px 20px; }
    .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; }
    .card-name { font-size: 15px; font-weight: 700; color: #0f172a; }
    .card-detail { font-size: 12px; color: #475569; margin-top: 2px; }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-item { display: flex; gap: 6px; }
    .meta-item span.label { color: #3b82f6; font-weight: 600; }
    .meta-item span.val { color: #1e3a8a; font-weight: 700; }
    table.invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.invoice-table thead th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    table.invoice-table tbody td { padding: 12px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
    table.invoice-table tbody tr:nth-child(even) { background: #fafafa; }
    .summary-section { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; margin-top: 10px; }
    .payment-instructions { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; display: flex; gap: 16px; align-items: center; }
    .totals-table { width: 100%; border-collapse: collapse; }
    .totals-table td { padding: 6px 0; font-size: 13px; color: #475569; }
    .totals-table td.val { text-align: right; font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums; }
    .totals-table tr.grand-total td { padding-top: 10px; border-top: 2px solid #e2e8f0; font-size: 15px; font-weight: 800; color: #0f172a; }
    .totals-table tr.paid-row td { color: #16a34a; font-weight: 700; }
    .totals-table tr.due-row td { background: #fef2f2; padding: 8px; border-radius: 6px; color: #dc2626; font-weight: 800; font-size: 15px; }
    .legal-footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-text { color: #94a3b8; font-size: 11px; line-height: 1.4; max-width: 420px; }
    .signatory-box { text-align: right; }
    .signatory-line { width: 140px; border-bottom: 1.5px solid #0f172a; margin-bottom: 4px; display: inline-block; }
    .signatory-title { font-size: 11px; font-weight: 600; color: #475569; }
    @media print {
      @page { size: A4 portrait; margin: 10mm 12mm; }
      body, html { background: #ffffff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .page-wrapper { padding: 0 !important; width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="header">
      <div>
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:56px;height:56px;border-radius:14px;overflow:hidden;flex:0 0 56px;filter:drop-shadow(0 2px 6px rgba(29,78,216,0.25));">
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240' width='56' height='56'>
              <defs><linearGradient id='isBg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#2563eb'/><stop offset='100%' stop-color='#1e3a8a'/></linearGradient></defs>
              <rect x='0' y='0' width='240' height='240' rx='56' fill='url(#isBg)'/>
              <path d='M66 74 C70 64 80 58 92 58 C104 58 114 64 118 74 L114 124 L130 128 L128 182 L106 182 L108 130 L98 128 L92 182 L70 182 L70 128 L82 124 L78 74 Z' fill='#ffffff'/>
              <path d='M134 90 L182 90 L182 110 L154 110 L154 120 L172 120 C190 120 200 130 200 144 C200 158 190 172 172 172 L134 172 L134 152 L168 152 C174 152 178 150 178 144 C178 140 174 138 168 138 L154 138 L154 140 L134 140 Z' fill='#ffffff'/>
              <circle cx='86' cy='62' r='18' fill='#ffffff' opacity='0.95' stroke='#1e40af' stroke-width='2'/>
              <circle cx='76' cy='60' r='2.4' fill='#1e3a8a'/><circle cx='96' cy='60' r='2.4' fill='#1e3a8a'/>
              <path d='M73 70 C77 74 96 74 99 70' stroke='#1e3a8a' stroke-width='2' fill='none' stroke-linecap='round'/>
              <circle cx='160' cy='62' r='18' fill='#bfdbfe' opacity='0.95' stroke='#1e40af' stroke-width='2'/>
              <circle cx='150' cy='60' r='2.4' fill='#1e3a8a'/><circle cx='170' cy='60' r='2.4' fill='#1e3a8a'/>
              <path d='M147 70 C151 74 170 74 173 70' stroke='#1e3a8a' stroke-width='2' fill='none' stroke-linecap='round'/>
            </svg>
          </div>
          <div>
            <div class="brand-title">${payment.clients.name}</div>
            <div class="brand-sub">
              <div>${payment.clients.email || ''} ${payment.clients.phone ? '| Phone: ' + payment.clients.phone : ''}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="invoice-header-right">
        <div class="invoice-badge-title">INVOICE</div>
        <div class="invoice-no">#${invoiceNo}</div>
        <div><span class="status-pill">${statusLabel}</span></div>
      </div>
    </div>
    <div class="meta-bar" style="margin-top:20px;">
      <div class="meta-item"><span class="label">Issue Date:</span> <span class="val">${paidOn}</span></div>
      <div class="meta-item"><span class="label">Payment Mode:</span> <span class="val">${normalizePaymentMode(payment.payment_mode)}</span></div>
      ${payment.transaction_ref ? `<div class="meta-item"><span class="label">Ref No:</span> <span class="val">${payment.transaction_ref}</span></div>` : ''}
    </div>
    <div class="grid2">
      <div class="info-card">
        <div class="card-label">Billed To (Parent)</div>
        <div class="card-name">${payment.customers.first_name} ${payment.customers.last_name || ''}</div>
        <div class="card-detail">📞 ${payment.customers.mobile}</div>
        <div class="card-detail">✉ ${payment.customers.email}</div>
      </div>
      <div class="info-card">
        <div class="card-label">Student & Course Details</div>
        <div class="card-name">${payment.customer_details.first_name} ${payment.customer_details.last_name || ''}</div>
        <div class="card-detail">Subject: <strong>${payment.customer_details.subject}</strong></div>
        <div class="card-detail">Milestone: <strong>${milestone}</strong></div>
      </div>
    </div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 110px; text-align: right;">Course Fee</th>
          <th style="width: 100px; text-align: right;">Discount</th>
          <th style="width: 110px; text-align: right;">Net Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; color: #64748b; font-size: 12px;">1</td>
          <td><div style="font-weight: 600; color: #0f172a;">${milestone} — ${payment.customer_details.subject}</div></td>
          <td style="text-align: center; color: #334155;">1</td>
          <td style="text-align: right; color: #334155; font-variant-numeric: tabular-nums;">₹${courseFee.toLocaleString('en-IN')}</td>
          <td style="text-align: right; color: #059669; font-variant-numeric: tabular-nums;">${payment.discount_amount ? `-₹${Number(payment.discount_amount).toLocaleString('en-IN')}` : '—'}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums;">₹${(courseFee - Number(payment.discount_amount || 0)).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
    <div class="summary-section">
      <div class="payment-instructions">
        <div style="font-size: 11px; color: #475569;">
          <strong style="color:#0f172a; font-size:12px;">Payment Details</strong><br/>
          Mode: ${normalizePaymentMode(payment.payment_mode)}<br/>
          ${payment.transaction_ref ? `Reference: ${payment.transaction_ref}<br/>` : ''}
          Status: <strong style="color:${statusColor}">${statusLabel}</strong>
        </div>
      </div>
      <div>
        <table class="totals-table">
          <tr><td>Course Fee</td><td class="val">₹${courseFee.toLocaleString('en-IN')}</td></tr>
          ${payment.discount_amount ? `<tr><td style="color:#059669;">Discount</td><td class="val" style="color:#059669;">-₹${Number(payment.discount_amount).toLocaleString('en-IN')}</td></tr>` : ''}
          <tr class="grand-total"><td>Total Fee</td><td class="val">₹${(courseFee - Number(payment.discount_amount || 0)).toLocaleString('en-IN')}</td></tr>
          <tr class="paid-row"><td>Total Paid</td><td class="val">₹${totalPaidForEnrollment.toLocaleString('en-IN')}</td></tr>
          <tr class="due-row"><td>Balance Due</td><td class="val">₹${balanceDue.toLocaleString('en-IN')}</td></tr>
        </table>
      </div>
    </div>
    <div class="legal-footer">
      <div class="footer-text">Thank you for your payment to <strong>${payment.clients.name}</strong>. Computer generated digital invoice.</div>
      <div class="signatory-box"><div class="signatory-line"></div><div class="signatory-title">Authorized Signatory</div></div>
    </div>
  </div>
</body>
</html>`;
    return { html, invoiceNo, studentName: `${payment.customers.first_name} ${payment.customers.last_name || ''}`.trim() };
  }

  async getPaymentSummary(cdId: string) {
    // Get customer detail to fetch course fee
    const customerDetail = await this.prisma.customer_details.findUnique({
      where: { cd_id: BigInt(cdId) },
    });

    if (!customerDetail) {
      throw new Error('Customer detail not found');
    }

    // Get all payments for this enrollment
    const payments = await this.prisma.payment_details.findMany({
      where: { cd_id: BigInt(cdId) },
      orderBy: { paid_on: 'desc' },
    });

    // Calculate totals
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + Number(p.discount_amount), 0);
    const courseFee = Number(customerDetail.amount);
    const balanceDue = courseFee - totalPaid;

    // Determine status
    const status = getPaymentStatus(totalPaid, courseFee);

    return {
      courseFee,
      totalPaid,
      totalDiscount,
      balanceDue,
      paymentCount: payments.length,
      status,
      payments: payments.map(p => ({
        id: p.id.toString(),
        amount: Number(p.paid_amount),
        discount: Number(p.discount_amount),
        date: p.paid_on,
        mode: normalizePaymentMode(p.payment_mode),
        reference: p.transaction_ref,
      })),
    };
  }

  async getCustomerDueSummary(customerId: string) {
    const cid = BigInt(customerId);

    const details = await this.prisma.customer_details.findMany({
      where: { customer_id: cid },
      orderBy: { created_at: 'desc' },
    });

    if (details.length === 0) {
      return {
        customerId,
        totalFee: 0,
        totalPaid: 0,
        totalDue: 0,
        enrollments: [],
      };
    }

    const payments = await this.prisma.payment_details.findMany({
      where: { customer_id: cid },
      select: { cd_id: true, paid_amount: true },
    });

    const paidByCd = new Map<string, number>();
    for (const p of payments) {
      const cdId = p.cd_id.toString();
      paidByCd.set(cdId, (paidByCd.get(cdId) || 0) + Number(p.paid_amount || 0));
    }

    const enrollments = details.map((d) => {
      const courseFee = Number(d.amount || 0);
      const totalPaid = paidByCd.get(d.cd_id.toString()) || 0;
      const balanceDue = courseFee - totalPaid;
      return {
        cd_id: d.cd_id.toString(),
        courseFee,
        totalPaid,
        balanceDue,
        status: getPaymentStatus(totalPaid, courseFee),
      };
    });

    return {
      customerId,
      totalFee: enrollments.reduce((sum, e) => sum + e.courseFee, 0),
      totalPaid: enrollments.reduce((sum, e) => sum + e.totalPaid, 0),
      totalDue: enrollments.reduce((sum, e) => sum + e.balanceDue, 0),
      enrollments,
    };
  }

  async getQuickView(paymentId: string) {
    const payment = await this.prisma.payment_details.findUnique({
      where: { id: BigInt(paymentId) },
      include: {
        customers: true,
        customer_details: true,
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const siblings = await this.prisma.customer_details.findMany({
      where: { customer_id: payment.customer_id },
      orderBy: { created_at: 'desc' },
    });

    const siblingPayments = await this.prisma.payment_details.findMany({
      where: { customer_id: payment.customer_id },
      select: {
        cd_id: true,
        paid_amount: true,
        paid_on: true,
        transaction_ref: true,
      },
      orderBy: { paid_on: 'desc' },
    });

    const attendance = await this.prisma.attendances.findMany({
      where: {
        customer_id: payment.customer_id,
        client_id: payment.client_id,
      },
      select: {
        attendance_id: true,
        course_id: true,
        date: true,
        status: true,
      },
      orderBy: { date: 'desc' },
    });

    const { courseIdByName } = await this.buildCourseMaps(
      payment.client_id,
      siblings.map((detail) => detail.subject),
    );

    const totalsByCd = new Map<string, number>();
    const countByCd = new Map<string, number>();
    const lastPaymentByCd = new Map<string, { paid_on: Date; transaction_ref?: string | null }>();
    for (const item of siblingPayments) {
      const key = item.cd_id.toString();
      totalsByCd.set(key, (totalsByCd.get(key) || 0) + this.decimalToNumber(item.paid_amount));
      countByCd.set(key, (countByCd.get(key) || 0) + 1);
      if (!lastPaymentByCd.has(key)) {
        lastPaymentByCd.set(key, {
          paid_on: item.paid_on,
          transaction_ref: item.transaction_ref,
        });
      }
    }

    const latestAttendanceByCourseId = new Map<string, { date: Date; status: string }>();
    const fallbackAttendance = attendance[0]
      ? { date: attendance[0].date, status: attendance[0].status }
      : null;
    for (const record of attendance) {
      if (!record.course_id) continue;
      const key = record.course_id.toString();
      if (!latestAttendanceByCourseId.has(key)) {
        latestAttendanceByCourseId.set(key, { date: record.date, status: record.status });
      }
    }

    const students = siblings.map((detail) => {
      const detailId = detail.cd_id.toString();
      const courseId = courseIdByName.get(detail.subject) || null;
      const latestAttendance = courseId
        ? latestAttendanceByCourseId.get(courseId) || fallbackAttendance
        : fallbackAttendance;
      const totalPaid = totalsByCd.get(detailId) || 0;
      const courseFee = this.decimalToNumber(detail.amount);
      const milestone = this.deriveMilestone(
        detail,
        countByCd.get(detailId) || 0,
        lastPaymentByCd.get(detailId)?.transaction_ref,
      );

      return {
        cd_id: detailId,
        student_name: this.getStudentName(detail),
        subject: detail.subject,
        course_id: courseId,
        batch_timing: 'Not scheduled',
        attendance_status: latestAttendance?.status || 'not_marked',
        attendance_date: latestAttendance?.date || null,
        payment_status: getPaymentStatus(totalPaid, courseFee),
        amount_paid: totalPaid,
        balance_due: Math.max(courseFee - totalPaid, 0),
        milestone,
        is_active: detail.is_active,
      };
    });

    const activeCount = students.filter((student) => student.is_active).length;
    const overallAccountStatus =
      students.length === 0 ? 'No linked students' : activeCount > 0 ? 'Active' : 'Inactive';
    const selectedStudent = students.find((student) => student.cd_id === payment.cd_id.toString()) || students[0];

    return {
      payment: {
        id: payment.id.toString(),
        paid_amount: this.decimalToNumber(payment.paid_amount),
        discount_amount: this.decimalToNumber(payment.discount_amount),
        paid_on: payment.paid_on,
        payment_mode: normalizePaymentMode(payment.payment_mode),
        transaction_ref: payment.transaction_ref,
        milestone: selectedStudent?.milestone || this.deriveMilestone(payment.customer_details, 1, payment.transaction_ref),
      },
      customer_profile: {
        customer_id: payment.customer_id.toString(),
        name: this.getCustomerName(payment.customers),
        email: payment.customers.email,
        alternate_contact_number: payment.customers.mobile,
        overall_account_status: overallAccountStatus,
      },
      student_breakdown: students,
    };
  }
  private computeExpectedDueDate(lastPaidOn: Date, rateType: string | null | undefined, courseCreatedAt: Date): Date {
    if (!lastPaidOn) {
      const base = new Date(courseCreatedAt);
      base.setMonth(base.getMonth() + 1);
      return base;
    }
    const d = new Date(lastPaidOn);
    switch ((rateType || 'per_month').toLowerCase()) {
      case 'per_session': d.setDate(d.getDate() + 7); break;
      case 'per_course': d.setMonth(d.getMonth() + 3); break;
      case 'per_month':
      default: d.setMonth(d.getMonth() + 1);
    }
    return d;
  }

  private bucketizeAging(dueDate: Date, nowTs: number): 'today' | 'upcoming_7d' | 'overdue_1_7d' | 'overdue_8_30d' | 'overdue_gt_30d' | 'today_due' {
    const diffDays = Math.floor((nowTs - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today_due';
    if (diffDays < 0 && diffDays >= -7) return 'upcoming_7d';
    if (diffDays > 0 && diffDays <= 7) return 'overdue_1_7d';
    if (diffDays > 7 && diffDays <= 30) return 'overdue_8_30d';
    if (diffDays > 30) return 'overdue_gt_30d';
    return 'today';
  }

  async getAgedOutstandingByClient(clientId: string) {
    const cliId = BigInt(clientId);
    const now = new Date();
    const nowTs = now.getTime();
    const enrollments = await this.prisma.enrollments.findMany({
      where: { client_id: cliId, status: { not: 'cancelled' } },
      select: {
        enrollment_id: true, customer_id: true, course_id: true, status: true, enrolled_at: true,
        courses: { select: { course_name: true, rate_type: true, created_at: true } },
        customers: { select: { customer_id: true, first_name: true, last_name: true, mobile: true } },
      },
    });
    const custIds = enrollments.map(e => e.customer_id);
    const allCd = custIds.length > 0
      ? await this.prisma.customer_details.findMany({
          where: { customer_id: { in: custIds }, is_active: true },
          select: { cd_id: true, customer_id: true, first_name: true, last_name: true, subject: true, amount: true, is_active: true },
        })
      : [];
    const cdByCustomer = new Map<string, any[]>();
    for (const d of allCd) {
      const key = d.customer_id.toString();
      if (!cdByCustomer.has(key)) cdByCustomer.set(key, []);
      cdByCustomer.get(key)!.push(d);
    }
    const paymentsByCd = new Map<string, { totalPaid: number; lastPaidOn: Date | null; count: number }>();
    if (allCd.length > 0) {
      const cdIds = allCd.map(c => c.cd_id);
      const payments = await this.prisma.payment_details.findMany({ where: { cd_id: { in: cdIds }, client_id: cliId }, orderBy: { paid_on: 'asc' } });
      for (const p of payments) {
        const key = p.cd_id.toString();
        const existing = paymentsByCd.get(key) || { totalPaid: 0, lastPaidOn: null, count: 0 };
        existing.totalPaid += this.decimalToNumber(p.paid_amount);
        existing.lastPaidOn = p.paid_on;
        existing.count += 1;
        paymentsByCd.set(key, existing);
      }
    }
    const records: any[] = [];
    const buckets = {
      today_due: { count: 0, total: 0 },
      upcoming_7d: { count: 0, total: 0 },
      overdue_1_7d: { count: 0, total: 0 },
      overdue_8_30d: { count: 0, total: 0 },
      overdue_gt_30d: { count: 0, total: 0 },
      current_paid: { count: 0, total: 0 },
    };
    for (const enr of enrollments) {
      const customerDetails = cdByCustomer.get(enr.customer_id.toString()) || [];
      for (const cd of customerDetails) {
        const courseFee = this.decimalToNumber(cd.amount);
        const payInfo = paymentsByCd.get(cd.cd_id.toString()) || { totalPaid: 0, lastPaidOn: null, count: 0 };
        const balance = Math.max(courseFee - payInfo.totalPaid, 0);
        if (balance <= 0) { buckets.current_paid.count += 1; continue; }
        const expectedDue = this.computeExpectedDueDate(
          payInfo.lastPaidOn || (enr.courses?.created_at ?? enr.enrolled_at),
          enr.courses?.rate_type,
          enr.courses?.created_at ?? enr.enrolled_at,
        );
        const bucket = this.bucketizeAging(expectedDue, nowTs);
        const record = {
          enrollment_id: enr.enrollment_id.toString(), cd_id: cd.cd_id.toString(),
          customer_id: enr.customers.customer_id.toString(),
          customer_name: `${enr.customers.first_name} ${enr.customers.last_name || ''}`.trim(),
          customer_mobile: enr.customers.mobile,
          student_name: `${cd.first_name} ${cd.last_name || ''}`.trim(),
          subject: cd.subject, course: enr.courses?.course_name || cd.subject,
          courseFee, totalPaid: payInfo.totalPaid, balanceDue: balance, paymentCount: payInfo.count,
          lastPaidOn: payInfo.lastPaidOn, nextDueDate: expectedDue,
          daysDiff: Math.floor((expectedDue.getTime() - nowTs) / (1000 * 60 * 60 * 24)), bucket,
        };
        records.push(record);
        if ((buckets as any)[bucket]) {
          (buckets as any)[bucket].count += 1;
          (buckets as any)[bucket].total += balance;
        }
      }
    }
    const totalOutstanding = buckets.overdue_1_7d.total + buckets.overdue_8_30d.total + buckets.overdue_gt_30d.total + buckets.today_due.total;
    const upcomingTotal = buckets.upcoming_7d.total;
    return {
      client_id: clientId, generated_at: now,
      summary: {
        total_outstanding: totalOutstanding, total_upcoming: upcomingTotal,
        active_enrollments: records.length, paid_up_enrollments: buckets.current_paid.count,
        total_dues_collectible: totalOutstanding + upcomingTotal,
      },
      buckets,
      records: records.sort((a, b) => (a.daysDiff || 0) - (b.daysDiff || 0)),
    };
  }
  async getPaymentCollectionSummary(clientId: string) {
    const cliId = BigInt(clientId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const [currentMonth, lastMonth, allTime, remPending, remSent] = await Promise.all([
      this.prisma.payment_details.aggregate({ where: { client_id: cliId, paid_on: { gte: startOfMonth } }, _sum: { paid_amount: true, discount_amount: true }, _count: { id: true } }),
      this.prisma.payment_details.aggregate({ where: { client_id: cliId, paid_on: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { paid_amount: true, discount_amount: true }, _count: { id: true } }),
      this.prisma.payment_details.aggregate({ where: { client_id: cliId }, _sum: { paid_amount: true, discount_amount: true } }),
      this.prisma.fee_reminders.count({ where: { client_id: cliId, status: 'pending' } }),
      this.prisma.fee_reminders.count({ where: { client_id: cliId, status: 'sent' } }),
    ]);
    const aged = await this.getAgedOutstandingByClient(clientId);
    const targetMonthly = lastMonth._sum.paid_amount ? this.decimalToNumber(lastMonth._sum.paid_amount) * 1.1 : this.decimalToNumber(currentMonth._sum.paid_amount || 0) * 1.1;
    const collected = this.decimalToNumber(currentMonth._sum.paid_amount || 0);
    const progressPct = targetMonthly > 0 ? Math.min(100, Math.round((collected / targetMonthly) * 100)) : 0;
    return {
      generated_at: now,
      collected: {
        this_month: collected, this_month_count: currentMonth._count.id,
        this_month_discount: this.decimalToNumber(currentMonth._sum.discount_amount || 0),
        last_month: this.decimalToNumber(lastMonth._sum.paid_amount || 0), last_month_count: lastMonth._count.id,
        last_month_discount: this.decimalToNumber(lastMonth._sum.discount_amount || 0),
        all_time: this.decimalToNumber(allTime._sum.paid_amount || 0),
      },
      target: {
        monthly_target: Math.round(targetMonthly), collected_so_far: collected,
        balance_to_target: Math.max(Math.round(targetMonthly) - collected, 0), progress_percent: progressPct,
      },
      reminders: { pending_reminders: remPending, sent_reminders: remSent },
      aging: aged.summary,
      momentum: {
        month_over_month_pct:
          this.decimalToNumber(lastMonth._sum.paid_amount || 0) > 0
            ? Math.round(((collected - this.decimalToNumber(lastMonth._sum.paid_amount || 0)) / this.decimalToNumber(lastMonth._sum.paid_amount || 1)) * 100)
            : collected > 0 ? 100 : 0,
      },
    };
  }
}
