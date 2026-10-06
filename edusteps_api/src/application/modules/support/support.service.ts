import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSupportTicketDto) {
    const ticket = await this.prisma.support_tickets.create({
      data: {
        user_id:  userId,
        subject:  dto.subject.trim(),
        category: dto.category,
        message:  dto.message.trim(),
        priority: dto.priority ?? 'medium',
        updated_at: new Date(),
      },
    });
    return this.toResponse(ticket);
  }

  async findAll(userId: string) {
    const tickets = await this.prisma.support_tickets.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return tickets.map(this.toResponse);
  }

  async findOne(userId: string, id: number) {
    const ticket = await this.prisma.support_tickets.findFirst({
      where: { id, user_id: userId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.toResponse(ticket);
  }

  private toResponse(t: any) {
    return {
      id:        Number(t.id),
      subject:   t.subject,
      category:  t.category,
      message:   t.message,
      status:    t.status,
      priority:  t.priority,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  }
}
