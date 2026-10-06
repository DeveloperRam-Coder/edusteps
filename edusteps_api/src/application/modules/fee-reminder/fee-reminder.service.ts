import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { WhatsAppSmsService } from './whatsapp-sms.service';

@Injectable()
export class FeeReminderService {
  private readonly logger = new Logger(FeeReminderService.name);

  private readonly REMINDER_ADVANCE_DAYS = 3;
  private readonly BILLING_CYCLE_DAYS = {
    PER_MONTH: 1,
    PER_SESSION: 7,
    PER_COURSE_MONTHS: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: WhatsAppSmsService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  calculateNextDueDate(lastPaymentDate: Date, rateType: string): Date {
    const nextDue = new Date(lastPaymentDate);
    switch (rateType) {
      case 'per_month':
        nextDue.setMonth(nextDue.getMonth() + this.BILLING_CYCLE_DAYS.PER_MONTH);
        break;
      case 'per_session':
        nextDue.setDate(nextDue.getDate() + this.BILLING_CYCLE_DAYS.PER_SESSION);
        break;
      case 'per_course':
        nextDue.setMonth(nextDue.getMonth() + this.BILLING_CYCLE_DAYS.PER_COURSE_MONTHS);
        break;
      default:
        nextDue.setMonth(nextDue.getMonth() + this.BILLING_CYCLE_DAYS.PER_MONTH);
    }
    return nextDue;
  }

  private serializeReminder(r: any) {
    return {
      ...r,
      reminder_id: r.reminder_id.toString(),
      customer_id: r.customer_id.toString(),
      client_id: r.client_id.toString(),
      cd_id: r.cd_id.toString(),
      amount_due: Number(r.amount_due),
    };
  }

  // ─── Auto-generate reminders for all active enrollments ───────────────────

  async generateReminders(clientId: number) {
    const clientExists = await this.prisma.clients.findUnique({
      where: { client_id: BigInt(clientId) },
    });
    if (!clientExists) throw new BadRequestException('Client not found');

    const activeEnrollments = await this.prisma.enrollments.findMany({
      where: { client_id: BigInt(clientId), status: 'active' },
      include: { customers: true, courses: true },
    });

    if (activeEnrollments.length === 0) {
      return { message: 'No active enrollments found', reminders: [] };
    }

    const reminders = [];

    for (const enrollment of activeEnrollments) {
      try {
        const customerDetailsList = await this.prisma.customer_details.findMany({
          where: { customer_id: enrollment.customer_id },
          select: { cd_id: true },
        });
        const cdIds = customerDetailsList.map((d) => d.cd_id);

        const lastPayment = cdIds.length
          ? await this.prisma.payment_details.findFirst({
              where: {
                customer_id: enrollment.customer_id,
                client_id: BigInt(clientId),
                cd_id: { in: cdIds },
              },
              orderBy: { paid_on: 'desc' },
              include: { customer_details: true },
            })
          : null;

        if (!lastPayment?.customer_details) continue;

        const dueDate = this.calculateNextDueDate(
          new Date(lastPayment.paid_on),
          enrollment.courses?.rate_type || 'per_month',
        );

        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - this.REMINDER_ADVANCE_DAYS);

        const existing = await this.prisma.fee_reminders.findFirst({
          where: {
            customer_id: enrollment.customer_id,
            client_id: BigInt(clientId),
            cd_id: lastPayment.cd_id,
            due_date: dueDate,
            status: { in: ['pending', 'sent'] },
          },
        });

        if (!existing && reminderDate >= new Date()) {
          const reminder = await this.prisma.fee_reminders.create({
            data: {
              customer_id: enrollment.customer_id,
              client_id: BigInt(clientId),
              cd_id: lastPayment.cd_id,
              due_date: dueDate,
              amount_due: lastPayment.customer_details.amount,
              reminder_date: reminderDate,
              status: 'pending',
            },
          });
          reminders.push(reminder);
        }
      } catch (err) {
        this.logger.error(`Error processing enrollment ${enrollment.enrollment_id}:`, err);
      }
    }

    return {
      message: `Generated ${reminders.length} reminders successfully`,
      reminders: reminders.map(this.serializeReminder),
    };
  }

  // ─── Send a single reminder via WhatsApp/SMS ──────────────────────────────

  async sendReminder(reminderId: number | bigint) {
    const reminder = await this.prisma.fee_reminders.findUnique({
      where: { reminder_id: BigInt(reminderId) },
      include: {
        customers: { include: { clients: true } },
      },
    });

    if (!reminder) throw new NotFoundException(`Reminder ${reminderId} not found`);
    if (reminder.status !== 'pending') {
      throw new BadRequestException(`Reminder is already ${reminder.status}`);
    }

    const customer = reminder.customers;
    const businessName = customer.clients.name;
    const amount = Number(reminder.amount_due);
    const dueDate = new Date(reminder.due_date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    const recipientPhone = customer.mobile;

    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment?customer=${customer.customer_id}&client=${reminder.client_id}&cd=${reminder.cd_id}&amount=${amount}&reminder=${reminder.reminder_id}`;

    const result = await this.messagingService.sendFeeReminder({
      recipientPhone,
      studentName: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      amount,
      dueDate,
      paymentLink,
      businessName,
    });

    // Persist delivery outcome
    const updated = await this.prisma.fee_reminders.update({
      where: { reminder_id: BigInt(reminderId) as bigint },
      data: {
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date() : null,
        delivery_status: result.success ? `${result.channel}:${recipientPhone}` : 'failed',
        message_id: result.messageId ?? null,
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Failed to send reminder: ${result.error}`);
    }

    return {
      success: true,
      message: 'Reminder sent successfully',
      channel: result.channel,
      reminder: this.serializeReminder(updated),
    };
  }

  // ─── Cron: daily at 9 AM — send all pending reminders due today or earlier ─

  @Cron('0 9 * * *')
  async sendPendingReminders() {
    this.logger.log('Running daily fee reminder cron...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = await this.prisma.fee_reminders.findMany({
      where: { reminder_date: { lte: today }, status: 'pending' },
    });

    this.logger.log(`Found ${pending.length} pending reminders to dispatch`);

    for (const r of pending) {
      try {
        await this.sendReminder(r.reminder_id);
      } catch (err) {
        this.logger.error(`Cron: failed to send reminder ${r.reminder_id}:`, err);
      }
    }
  }

  // ─── Manual reminder creation ─────────────────────────────────────────────

  async createManualReminder(dto: CreateReminderDto) {
    if (!dto.customer_id || dto.customer_id <= 0) throw new BadRequestException('Invalid customer ID');
    if (!dto.client_id || dto.client_id <= 0) throw new BadRequestException('Invalid client ID');
    if (!dto.cd_id || dto.cd_id <= 0) throw new BadRequestException('Invalid customer detail ID');
    if (!dto.amount_due || dto.amount_due <= 0) throw new BadRequestException('Amount must be > 0');

    const customer = await this.prisma.customers.findUnique({
      where: { customer_id: BigInt(dto.customer_id) },
    });
    if (!customer) throw new NotFoundException(`Customer ${dto.customer_id} not found`);

    const customerDetail = await this.prisma.customer_details.findUnique({
      where: { cd_id: BigInt(dto.cd_id) },
    });
    if (!customerDetail) throw new NotFoundException(`Customer detail ${dto.cd_id} not found`);
    if (customerDetail.customer_id.toString() !== dto.customer_id.toString()) {
      throw new BadRequestException('Customer detail does not belong to this customer');
    }
    if (customer.client_id.toString() !== BigInt(dto.client_id).toString()) {
      throw new BadRequestException('Customer does not belong to this client');
    }

    const dueDate = new Date(dto.due_date);
    const reminderDate = dto.reminder_date ? new Date(dto.reminder_date) : new Date();

    const reminder = await this.prisma.fee_reminders.create({
      data: {
        customer_id: BigInt(dto.customer_id),
        client_id: BigInt(dto.client_id),
        cd_id: BigInt(dto.cd_id),
        due_date: dueDate,
        amount_due: dto.amount_due,
        reminder_date: reminderDate,
        status: 'pending',
      },
    });

    // Send immediately if reminder date is today or in the past
    if (reminderDate <= new Date()) {
      try {
        const sendResult = await this.sendReminder(reminder.reminder_id);
        return sendResult.reminder;
      } catch (err) {
        this.logger.error('Immediate send failed after manual creation:', err);
        // Return the latest state of the reminder (may be 'failed')
        const updated = await this.prisma.fee_reminders.findUnique({
          where: { reminder_id: reminder.reminder_id },
        });
        return this.serializeReminder(updated ?? reminder);
      }
    }

    return this.serializeReminder(reminder);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getReminders(clientId: number, status?: string) {
    const reminders = await this.prisma.fee_reminders.findMany({
      where: {
        client_id: BigInt(clientId),
        ...(status && { status: status as any }),
      },
      include: {
        customers: {
          select: { first_name: true, last_name: true, mobile: true, email: true },
        },
      },
      orderBy: { reminder_date: 'desc' },
    });
    return reminders.map(this.serializeReminder);
  }

  async getCustomerReminders(customerId: number) {
    const reminders = await this.prisma.fee_reminders.findMany({
      where: { customer_id: BigInt(customerId) },
      orderBy: { reminder_date: 'desc' },
    });
    return reminders.map(this.serializeReminder);
  }

  async cancelReminder(reminderId: number) {
    const reminder = await this.prisma.fee_reminders.findUnique({
      where: { reminder_id: BigInt(reminderId) },
    });
    if (!reminder) throw new NotFoundException(`Reminder ${reminderId} not found`);

    const updated = await this.prisma.fee_reminders.update({
      where: { reminder_id: BigInt(reminderId) },
      data: { status: 'cancelled' },
    });
    return this.serializeReminder(updated);
  }
}
