import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { normalizePaymentMode } from 'src/common/utils/payment';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute multiple operations in a transaction
   * If any operation fails, all changes are rolled back
   */
  async executeTransaction<T>(
    operations: (tx: any) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
    }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting transaction');
      
      const result = await this.prisma.$transaction(operations, {
        maxWait: options?.maxWait || 5000,  // Wait max 5s to start transaction
        timeout: options?.timeout || 10000,  // Transaction timeout 10s
      });
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Transaction completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Transaction failed after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Create enrollment with initial payment (atomic operation)
   */
  async createEnrollmentWithPayment(data: {
    customerId: bigint;
    courseId: bigint;
    clientId: bigint;
    cdId: bigint;
    paidAmount: number;
    paymentMode: string;
    userId: string;
  }) {
    return this.executeTransaction(async (tx) => {
      // Create enrollment
      const enrollment = await tx.enrollments.create({
        data: {
          customer_id: data.customerId,
          course_id: data.courseId,
          client_id: data.clientId,
          status: 'active',
          created_id: data.userId,
          updated_id: data.userId,
        },
      });

      // Create payment
      const payment = await tx.payment_details.create({
        data: {
          customer_id: data.customerId,
          cd_id: data.cdId,
          client_id: data.clientId,
          paid_amount: data.paidAmount,
          payment_mode: normalizePaymentMode(data.paymentMode),
          created_id: data.userId,
        },
      });

      return { enrollment, payment };
    });
  }

  /**
   * Delete customer with all related records (atomic operation)
   */
  async deleteCustomerCascade(customerId: bigint) {
    return this.executeTransaction(async (tx) => {
      // Delete in correct order to respect foreign keys
      await tx.payment_details.deleteMany({ where: { customer_id: customerId } });
      await tx.enrollments.deleteMany({ where: { customer_id: customerId } });
      await tx.customer_details.deleteMany({ where: { customer_id: customerId } });
      await tx.fee_reminders.deleteMany({ where: { customer_id: customerId } });
      await tx.customers.delete({ where: { customer_id: customerId } });

      return { deleted: true };
    });
  }

  /**
   * Bulk create with rollback on any failure
   */
  async bulkCreate<T>(
    model: string,
    records: any[]
  ): Promise<T[]> {
    return this.executeTransaction(async (tx) => {
      const results: T[] = [];
      
      for (const record of records) {
        const created = await tx[model].create({ data: record });
        results.push(created);
      }
      
      return results;
    });
  }
}
