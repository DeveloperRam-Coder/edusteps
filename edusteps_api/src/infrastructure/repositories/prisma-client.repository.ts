import { Injectable } from '@nestjs/common';
import { GenericPrismaRepository } from './generic-prisma.repository';
import { IClientRepository } from 'src/core/interfaces/client-repository.interface';
import { Client } from 'src/core/entities/client.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaClientRepository extends GenericPrismaRepository<Client> implements IClientRepository {
  protected modelName = 'clients';
  protected primaryKeyName = 'client_id';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(client: Client): Promise<Client> {
    const created = await this.prisma.clients.create({
      data: {
        name: client.name,
        phone: client.phone || null,
        email: client.email || null,
        address: client.address || null,
        payment_provider_account_id: client.paymentProviderAccountId || null,
        requires_master_config: client.requiresMasterConfig ?? false,
        created_id: client.createdId,
        updated_id: client.updatedId || client.createdId,
      },
    });
    return this.mapToClient(created);
  }

  async findById(id: string): Promise<Client | null> {
    const found = await this.prisma.clients.findUnique({
      where: { client_id: BigInt(id) },
    });
    if (!found) return null;
    return this.mapToClient(found);
  }

  async findAll(): Promise<Client[]> {
    const list = await this.prisma.clients.findMany();
    return list.map(client => this.mapToClient(client));
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const updated = await this.prisma.clients.update({
      where: { client_id: BigInt(id) },
      data: {
        ...(client.name && { name: client.name }),
        ...(client.phone !== undefined && { phone: client.phone || null }),
        ...(client.email !== undefined && { email: client.email || null }),
        ...(client.address !== undefined && { address: client.address || null }),
        ...(client.paymentProviderAccountId !== undefined && { payment_provider_account_id: client.paymentProviderAccountId || null }),
        ...(client.requiresMasterConfig !== undefined && { requires_master_config: client.requiresMasterConfig }),
        ...(client.updatedId && { updated_id: client.updatedId }),
      },
    });
    return this.mapToClient(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clients.delete({
      where: { client_id: BigInt(id) },
    });
  }

  async findByEmail(email: string): Promise<Client | null> {
    const found = await this.prisma.clients.findFirst({
      where: { email },
    });
    if (!found) return null;
    return this.mapToClient(found);
  }

  async findByPhone(phone: string): Promise<Client[]> {
    const list = await this.prisma.clients.findMany({
      where: { phone: { contains: phone, mode: 'insensitive' } },
    });
    return list.map(client => this.mapToClient(client));
  }

  async findByName(name: string): Promise<Client[]> {
    const list = await this.prisma.clients.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    return list.map(client => this.mapToClient(client));
  }

  async findByUserId(userId: string): Promise<Client | null> {
    const found = await this.prisma.clients.findFirst({
      where: { created_id: userId },
    });
    if (!found) return null;
    return this.mapToClient(found);
  }

  private mapToClient(data: any): Client {
    return new Client(
      data.client_id,
      data.name,
      data.created_id,
      data.phone,
      data.email,
      data.address,
      data.payment_provider_account_id,
      data.updated_id,
      data.created_at,
      data.updated_at,
      data.requires_master_config ?? false,
    );
  }
}