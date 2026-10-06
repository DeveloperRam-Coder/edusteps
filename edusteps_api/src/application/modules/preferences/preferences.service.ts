import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const prefs = await this.prisma.user_preferences.findUnique({
      where: { user_id: userId },
    });
    if (prefs) return this.toResponse(prefs);

    // Auto-create defaults on first access
    const created = await this.prisma.user_preferences.create({
      data: { user_id: userId, updated_at: new Date() },
    });
    return this.toResponse(created);
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    const data: any = { updated_at: new Date() };
    if (dto.theme !== undefined)              data.theme = dto.theme;
    if (dto.language !== undefined)           data.language = dto.language;
    if (dto.emailNotifications !== undefined) data.email_notifications = dto.emailNotifications;
    if (dto.smsReminders !== undefined)       data.sms_reminders = dto.smsReminders;
    if (dto.marketingEmails !== undefined)    data.marketing_emails = dto.marketingEmails;

    const prefs = await this.prisma.user_preferences.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });
    return this.toResponse(prefs);
  }

  private toResponse(p: any) {
    return {
      theme:              p.theme,
      language:           p.language,
      emailNotifications: p.email_notifications,
      smsReminders:       p.sms_reminders,
      marketingEmails:    p.marketing_emails,
      updatedAt:          p.updated_at,
    };
  }
}
