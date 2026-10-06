import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

export interface ReminderPayload {
  recipientPhone: string; // E.164 format, e.g. +919876543210
  studentName: string;
  amount: number;
  dueDate: string;       // human-readable, e.g. "15 Jun 2025"
  paymentLink: string;
  businessName: string;
  mediaUrl?: string;     // URL to PDF invoice
}

export interface SendResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

/**
 * Delivers fee reminder messages via WhatsApp, SMS, or console log.
 *
 * Channel is controlled by the REMINDER_CHANNEL env var:
 *   'whatsapp' — Twilio WhatsApp Business API
 *   'sms'      — Twilio Programmable SMS
 *   'log'      — development mode, prints to console only (default)
 *
 * To switch to live delivery:
 *   1. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env
 *   2. Set REMINDER_CHANNEL=whatsapp (or sms)
 *   3. For WhatsApp sandbox: join sandbox at https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
 *   4. For production WhatsApp: get a Twilio WhatsApp-approved number and set TWILIO_WHATSAPP_FROM
 */
@Injectable()
export class WhatsAppSmsService {
  private readonly logger = new Logger(WhatsAppSmsService.name);
  private readonly channel: string;
  private client: ReturnType<typeof twilio> | null = null;

  constructor() {
    this.channel = (process.env.REMINDER_CHANNEL || 'log').toLowerCase();

    if (this.channel !== 'log') {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;

      if (!sid || !token) {
        this.logger.warn(
          'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing. Falling back to log mode.',
        );
        (this as any).channel = 'log';
      } else {
        try {
          this.client = twilio(sid, token);
          this.logger.log(`WhatsAppSmsService ready — channel: ${this.channel}`);
        } catch (err: any) {
          this.logger.error('Failed to initialize Twilio client:', err?.message || err);
          (this as any).channel = 'log';
        }
      }
    } else {
      this.logger.log('WhatsAppSmsService in LOG mode — no real messages will be sent.');
    }
  }

  /**
   * Builds the Vidya Mandir Coaching Centre reminder message.
   * Template matches the spec exactly.
   */
  buildMessage(payload: ReminderPayload): string {
    return (
      `Dear Parent, this is a friendly reminder from ${payload.businessName}. ` +
      `The fee of ₹${payload.amount.toLocaleString('en-IN')} for ${payload.studentName} ` +
      `is due on ${payload.dueDate}. ` +
      `Kindly pay using this link: ${payload.paymentLink}. ` +
      `Thank you!`
    );
  }

  /**
   * Normalises a phone number to E.164 format.
   * Handles Indian numbers entered without country code (10 digits → +91...).
   */
  normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+91${digits}`;          // Indian mobile
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return `+${digits}`;
  }

  /**
   * Main entry point — send a fee reminder to a parent.
   */
  async sendFeeReminder(payload: ReminderPayload): Promise<SendResult> {
    const message = this.buildMessage(payload);
    const toPhone = this.normalisePhone(payload.recipientPhone);

    if (!toPhone || toPhone.length < 11) {
      return {
        success: false,
        channel: this.channel,
        error: 'Customer registered mobile number is missing or invalid',
      };
    }

    if (this.channel === 'log') {
      this.logger.log(`[LOG MODE] Fee reminder for ${payload.studentName}`);
      this.logger.log(`  → To: ${toPhone}`);
      this.logger.log(`  → Message: ${message}`);
      return { success: true, channel: 'log', messageId: `log_${Date.now()}` };
    }

    try {
      if (this.channel === 'whatsapp') {
        return await this.sendWhatsApp(toPhone, message, payload.mediaUrl);
      }
      return await this.sendSms(toPhone, message);
    } catch (err: any) {
      this.logger.error(`Failed to send reminder to ${toPhone}: ${err.message}`);
      return { success: false, channel: this.channel, error: err.message };
    }
  }

  private async sendWhatsApp(to: string, message: string, mediaUrl?: string): Promise<SendResult> {
    const rawFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`;
    const twilioTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
      const msg = await this.client!.messages.create({
        from,
        to: twilioTo,
        body: message,
        ...(mediaUrl && { mediaUrl: [mediaUrl] }),
      });
      this.logger.log(`WhatsApp sent — SID: ${msg.sid}`);
      return { success: true, channel: 'whatsapp', messageId: msg.sid };
    } catch (err: any) {
      // Twilio errors include useful fields — surface them for diagnostics
      const details = err?.code ? `${err.message} (Twilio code: ${err.code})` : err?.message || String(err);
      this.logger.error(`Twilio WhatsApp send failed: ${details}`);
      return { success: false, channel: 'whatsapp', error: details };
    }
  }

  private async sendSms(to: string, message: string): Promise<SendResult> {
    const fromEnv = process.env.TWILIO_SMS_FROM;
    if (!fromEnv) {
      const errMsg = 'TWILIO_SMS_FROM is not set';
      this.logger.error(errMsg);
      return { success: false, channel: 'sms', error: errMsg };
    }
    const from = fromEnv.startsWith('+') ? fromEnv : `+${fromEnv}`;

    try {
      const msg = await this.client!.messages.create({ from, to, body: message });
      this.logger.log(`SMS sent — SID: ${msg.sid}`);
      return { success: true, channel: 'sms', messageId: msg.sid };
    } catch (err: any) {
      const details = err?.code ? `${err.message} (Twilio code: ${err.code})` : err?.message || String(err);
      this.logger.error(`Twilio SMS send failed: ${details}`);
      return { success: false, channel: 'sms', error: details };
    }
  }
}
