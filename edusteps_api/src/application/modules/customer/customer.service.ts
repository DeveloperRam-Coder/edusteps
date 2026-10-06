import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Customer } from 'src/core/entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaCustomerRepository } from 'src/infrastructure/repositories/prisma-customer.repository';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { BaseService } from 'src/common/services/base.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class CustomerService extends BaseService<Customer> {
  protected readonly logger = new Logger(CustomerService.name);
  protected readonly modelName = 'Customer';

  constructor(
    prisma: PrismaService,
    private readonly customerRepository: PrismaCustomerRepository
  ) {
    super(prisma);
  }

  private toResponseDto(customer: any): CustomerResponseDto {
    const response: CustomerResponseDto = {
      customer_id: customer.customer_id ?? customer.customerId,
      client_id: customer.client_id ?? customer.clientId,
      first_name: customer.first_name ?? customer.firstName,
      last_name: customer.last_name ?? customer.lastName,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      created_id: customer.created_id ?? customer.createdId,
      updated_id: customer.updated_id ?? customer.updatedId,
      created_at: customer.created_at ?? customer.createdAt,
      updated_at: customer.updated_at ?? customer.updatedAt,
    };

    if (Array.isArray(customer.enrollments)) {
      response.enrollments = customer.enrollments.map((enrollment: any) => ({
        enrollment_id: enrollment.enrollment_id,
        customer_id: enrollment.customer_id,
        course_id: enrollment.course_id,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status,
        client_id: enrollment.client_id,
        created_id: enrollment.created_id,
        updated_id: enrollment.updated_id,
        created_at: enrollment.created_at,
        updated_at: enrollment.updated_at,
        course_name: enrollment.courses?.course_name,
        course_description: enrollment.courses?.description,
      }));
    }

    return response;
  }

  async create(createCustomerDto: CreateCustomerDto, createdId: string): Promise<CustomerResponseDto> {
    try {
      this.logOperation('Creating customer', { mobile: createCustomerDto.mobile });

      const clientId = this.validateBigInt(createCustomerDto.clientId, 'clientId');

      // Validate that client exists
      const clientExists = await this.prisma.clients.findUnique({
        where: { client_id: clientId },
      });
      if (!clientExists) {
        throw new Error('Client not found');
      }

      const payload: any = {
        clientId,
        firstName: createCustomerDto.firstName.trim(),
        lastName: this.sanitizeString(createCustomerDto.lastName),
        mobile: createCustomerDto.mobile.trim(),
        email: this.sanitizeString(createCustomerDto.email),
        address: this.sanitizeString(createCustomerDto.address),
        createdId,
        updatedId: createdId,
      };

      const created = await this.customerRepository.create(payload as unknown as Customer);
      this.logOperation('Customer created', { id: created.customerId });
      return this.toResponseDto(created);
    } catch (error) {
      this.handleError('Create customer', error);
    }
  }

  async findAll(): Promise<CustomerResponseDto[]> {
    try {
      this.logOperation('Finding all customers');
      const customers = await this.customerRepository.findAll();
      return customers.map(customer => this.toResponseDto(customer));
    } catch (error) {
      this.handleError('Find all customers', error);
    }
  }

  async findById(id: string): Promise<CustomerResponseDto | null> {
    try {
      this.logOperation('Finding customer by ID', { id });
      const customer = await this.prisma.customers.findUnique({
        where: { customer_id: BigInt(id) },
        include: {
          enrollments: {
            include: {
              courses: true,
            },
          },
        },
      });

      return customer ? this.toResponseDto(customer) : null;
    } catch (error) {
      this.handleError('Find customer by ID', error);
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, updatedId: string): Promise<CustomerResponseDto> {
    try {
      this.logOperation('Updating customer', { id });

      const payload: Partial<Customer & { updatedId?: string }> = {
        ...(updateCustomerDto.firstName !== undefined && { firstName: updateCustomerDto.firstName.trim() }),
        ...(updateCustomerDto.lastName !== undefined && { lastName: this.sanitizeString(updateCustomerDto.lastName) }),
        ...(updateCustomerDto.mobile !== undefined && { mobile: updateCustomerDto.mobile.trim() }),
        ...(updateCustomerDto.email !== undefined && { email: this.sanitizeString(updateCustomerDto.email) }),
        ...(updateCustomerDto.address !== undefined && { address: this.sanitizeString(updateCustomerDto.address) }),
        updatedId,
      };

      const updated = await this.customerRepository.update(id, payload);
      this.logOperation('Customer updated', { id });
      return this.toResponseDto(updated);
    } catch (error) {
      this.handleError('Update customer', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.logOperation('Deleting customer', { id });
      await this.customerRepository.delete(id);
      this.logOperation('Customer deleted', { id });
    } catch (error) {
      this.handleError('Delete customer', error);
    }
  }

  async findByClientId(clientId: bigint | number): Promise<CustomerResponseDto[]> {
    try {
      const cid = typeof clientId === 'number' ? BigInt(clientId) : clientId;
      this.logOperation('Finding customers by client ID', { clientId: cid.toString() });
      const customers = await this.customerRepository.findByClientId(cid);
      return customers.map(customer => this.toResponseDto(customer));
    } catch (error) {
      this.handleError('Find customers by client ID', error);
    }
  }

  async search(q: string, clientId?: string): Promise<CustomerResponseDto[]> {
    try {
      if (!q || q.trim().length < 2) {
        throw new BadRequestException('Search query must be at least 2 characters');
      }

      this.logOperation('Searching customers', { query: q, clientId });
      const cid = clientId ? this.validateBigInt(clientId, 'clientId') : undefined;
      const customers = await this.customerRepository.search(q.trim(), cid);
      return customers.map(customer => this.toResponseDto(customer));
    } catch (error) {
      this.handleError('Search customers', error);
    }
  }

  async findByMobile(mobile: string): Promise<CustomerResponseDto[] | null> {
    try {
      this.logOperation('Finding customer by mobile', { mobile });
      const customers = await this.customerRepository.findByMobile(mobile.trim());
      return customers ? customers.map(customer => this.toResponseDto(customer)) : null;
    } catch (error) {
      this.handleError('Find customer by mobile', error);
    }
  }
}
