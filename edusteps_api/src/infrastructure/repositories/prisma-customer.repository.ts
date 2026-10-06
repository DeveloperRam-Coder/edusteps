import { Injectable } from '@nestjs/common';
import { GenericPrismaRepository } from './generic-prisma.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Customer } from 'src/core/entities/customer.entity';
import { ICustomerRepository } from 'src/core/interfaces/customer-repository.interface';

@Injectable()
export class PrismaCustomerRepository
  extends GenericPrismaRepository<Customer>
  implements ICustomerRepository {
  protected modelName = 'customers';
  protected primaryKeyName = 'customer_id';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(customer: Customer): Promise<any> {
    const created = await this.prisma.customers.create({
      data: {
        client_id: customer.clientId,
        first_name: customer.firstName,
        last_name: customer.lastName,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        created_id: customer.createdId,
        updated_id: customer.updatedId,
      },
    });
    return this.mapToCustomer(created);
  }

  async findById(id: string): Promise<Customer | null> {
    const found = await this.prisma.customers.findUnique({
      where: { customer_id: BigInt(id) },
    });
    if (!found) return null;
    return this.mapToCustomer(found);
  }

  async findAll(): Promise<Customer[]> {
    const list = await this.prisma.customers.findMany();
    return list.map(customer => this.mapToCustomer(customer));
  }

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const updated = await this.prisma.customers.update({
      where: { customer_id: BigInt(id) },
      data: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        updated_id: customer.updatedId,
      },
    });
    return this.mapToCustomer(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customers.delete({
      where: { customer_id: BigInt(id) },
    });
  }

  async findByMobile(mobile: string): Promise<Customer[] | null> {
    const found = await this.prisma.customers.findMany({
      where: { mobile },
    });
    return found.map(customer => this.mapToCustomer(customer));
  }

  async search(q: string, clientId?: bigint): Promise<Customer[]> {
    const list = await this.prisma.customers.findMany({
      where: {
        ...(clientId ? { client_id: clientId } : {}),
        OR: [
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q, mode: 'insensitive' } },
        ],
      },
    });
    return list.map(customer => this.mapToCustomer(customer));
  }

  async findByClientId(clientId: bigint): Promise<Customer[]> {
    const list = await this.prisma.customers.findMany({
      where: { client_id: clientId },
    });
    return list.map(customer => this.mapToCustomer(customer));
  }

  private mapToCustomer(data: any): Customer {
    const c = new Customer(
      data.customer_id,
      data.client_id,
      data.first_name,
      data.last_name,
      data.mobile,
      data.email,
      data.address,
      data.created_id,
      data.updated_id,
      data.created_at,
      data.updated_at,
    );
    return c;
  }
}
