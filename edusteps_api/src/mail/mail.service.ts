import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  private logger = new Logger(MailService.name);

  constructor() {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      this.logger.warn('SMTP credentials missing (MAIL_USER/MAIL_PASS). Emails will not be sent.');
    }
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }



  async sendResetPasswordMail(email: string, link: string) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      this.logger.warn('SMTP credentials missing. Logging reset link to console instead.');
      this.logger.log(`RESET LINK FOR ${email}: ${link}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"EduSteps" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
          <h3>Password Reset</h3>
          <p>Click the link below:</p>
          <a href="${link}">Reset Password</a>
          <p>This link expires in 15 minutes</p>
        `,
      });

      this.logger.log(`Reset password mail sent to ${email}`);
    } catch (error) {
      this.logger.error('Mail send failed', error);
      throw error;
    }
  }
}



