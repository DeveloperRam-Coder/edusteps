import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientRepository } from 'src/infrastructure/repositories/prisma-client.repository';
import { Client } from 'src/core/entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { BaseService } from 'src/common/services/base.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class ClientService extends BaseService<Client> {
  protected readonly logger = new Logger(ClientService.name);
  protected readonly modelName = 'Client';

  constructor(
    prisma: PrismaService,
    private readonly clientRepository: PrismaClientRepository
  ) {
    super(prisma);
  }

  private toResponseDto(client: Client): ClientResponseDto {
    return {
      client_id: client.clientId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      payment_provider_account_id: client.paymentProviderAccountId,
      requires_master_config: client.requiresMasterConfig,
      created_id: client.createdId,
      updated_id: client.updatedId,
      created_at: client.createdAt,
      updated_at: client.updatedAt,
    };
  }

  async create(createClientDto: CreateClientDto, createdId: string): Promise<ClientResponseDto> {
    try {
      this.logOperation('Creating client', { name: createClientDto.name });

      // Validate that user exists
      const userExists = await this.prisma.users.findUnique({
        where: { id: createdId },
      });
      if (!userExists) {
        throw new Error('User not found');
      }

      const client = new Client(
        BigInt(0),
        createClientDto.name.trim(),
        createdId,
        this.sanitizeString(createClientDto.phone),
        this.sanitizeString(createClientDto.email),
        this.sanitizeString(createClientDto.address),
        this.sanitizeString(createClientDto.paymentProviderAccountId),
        createdId,
        undefined,
        undefined,
        createClientDto.requiresMasterConfig ?? false,
      );

      const created = await this.clientRepository.create(client);
      this.logOperation('Client created', { id: created.clientId });
      return this.toResponseDto(created);
    } catch (error) {
      this.handleError('Create client', error);
    }
  }

  async findAll(): Promise<ClientResponseDto[]> {
    try {
      this.logOperation('Finding all clients');
      const clients = await this.clientRepository.findAll();
      return clients.map(client => this.toResponseDto(client));
    } catch (error) {
      this.handleError('Find all clients', error);
    }
  }

  async findAccessible(userId: string): Promise<ClientResponseDto[]> {
    try {
      this.logOperation('Finding accessible clients', { userId });
      const clients = await this.prisma.clients.findMany({
        where: {
          OR: [
            { created_id: userId },
            { client_permission: { some: { user_id: userId } } },
          ],
        },
      });
      return clients.map(client => ({
        client_id: client.client_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        payment_provider_account_id: client.payment_provider_account_id,
        requires_master_config: client.requires_master_config,
        created_id: client.created_id,
        updated_id: client.updated_id,
        created_at: client.created_at,
        updated_at: client.updated_at,
      }));
    } catch (error) {
      this.handleError('Find accessible clients', error);
    }
  }

  async findAccessibleByEmail(email: string, userId: string): Promise<ClientResponseDto | null> {
    const clients = await this.findAccessibleByFilter(userId, { email: email.trim() });
    return clients[0] ?? null;
  }

  async findAccessibleByPhone(phone: string, userId: string): Promise<ClientResponseDto[]> {
    return this.findAccessibleByFilter(userId, { phone: { contains: phone.trim(), mode: 'insensitive' } });
  }

  async findAccessibleByName(name: string, userId: string): Promise<ClientResponseDto[]> {
    return this.findAccessibleByFilter(userId, { name: { contains: name.trim(), mode: 'insensitive' } });
  }

  async findById(id: string): Promise<ClientResponseDto | null> {
    try {
      this.logOperation('Finding client by ID', { id });
      const client = await this.clientRepository.findById(id);
      return client ? this.toResponseDto(client) : null;
    } catch (error) {
      this.handleError('Find client by ID', error);
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto, updatedId: string): Promise<ClientResponseDto> {
    try {
      this.logOperation('Updating client', { id });

      const payload: Partial<Client & { updatedId?: string }> = {
        ...(updateClientDto.name !== undefined && { name: updateClientDto.name.trim() }),
        ...(updateClientDto.phone !== undefined && { phone: this.sanitizeString(updateClientDto.phone) }),
        ...(updateClientDto.email !== undefined && { email: this.sanitizeString(updateClientDto.email) }),
        ...(updateClientDto.address !== undefined && { address: this.sanitizeString(updateClientDto.address) }),
        ...(updateClientDto.paymentProviderAccountId !== undefined && { paymentProviderAccountId: this.sanitizeString(updateClientDto.paymentProviderAccountId) }),
        ...(updateClientDto.requiresMasterConfig !== undefined && { requiresMasterConfig: updateClientDto.requiresMasterConfig }),
        updatedId,
      };

      const updated = await this.clientRepository.update(id, payload);
      this.logOperation('Client updated', { id });
      return this.toResponseDto(updated);
    } catch (error) {
      this.handleError('Update client', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logOperation('Deleting client', { id });
      await this.clientRepository.delete(id);
      this.logOperation('Client deleted', { id });
    } catch (error) {
      this.handleError('Delete client', error);
    }
  }

  async findByEmail(email: string): Promise<ClientResponseDto | null> {
    try {
      this.logOperation('Finding client by email', { email });
      const client = await this.clientRepository.findByEmail(email.trim());
      return client ? this.toResponseDto(client) : null;
    } catch (error) {
      this.handleError('Find client by email', error);
    }
  }

  async findByPhone(phone: string): Promise<ClientResponseDto[]> {
    try {
      this.logOperation('Finding clients by phone', { phone });
      const clients = await this.clientRepository.findByPhone(phone.trim());
      return clients.map(client => this.toResponseDto(client));
    } catch (error) {
      this.handleError('Find clients by phone', error);
    }
  }

  async findByName(name: string): Promise<ClientResponseDto[]> {
    try {
      this.logOperation('Finding clients by name', { name });
      const clients = await this.clientRepository.findByName(name.trim());
      return clients.map(client => this.toResponseDto(client));
    } catch (error) {
      this.handleError('Find clients by name', error);
    }
  }

  async findByUserId(userId: string): Promise<ClientResponseDto | null> {
    try {
      this.logOperation('Finding client by user ID', { userId });
      const client = await this.clientRepository.findByUserId(userId);
      return client ? this.toResponseDto(client) : null;
    } catch (error) {
      this.handleError('Find client by user ID', error);
    }
  }

  async validateClientOwnership(clientId: string, userId: string): Promise<void> {
    try {
      const client = await this.clientRepository.findById(clientId);
      if (!client || client.createdId !== userId) {
        throw new ForbiddenException('You do not have permission to access this client');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.handleError('Validate client ownership', error);
    }
  }

  private async findAccessibleByFilter(userId: string, filter: any): Promise<ClientResponseDto[]> {
    try {
      const clients = await this.prisma.clients.findMany({
        where: {
          ...filter,
          OR: [
            { created_id: userId },
            { client_permission: { some: { user_id: userId } } },
          ],
        },
      });
      return clients.map(client => ({
        client_id: client.client_id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        address: client.address,
        payment_provider_account_id: client.payment_provider_account_id,
        requires_master_config: client.requires_master_config,
        created_id: client.created_id,
        updated_id: client.updated_id,
        created_at: client.created_at,
        updated_at: client.updated_at,
      }));
    } catch (error) {
      this.handleError('Find accessible clients by filter', error);
    }
  }
}
