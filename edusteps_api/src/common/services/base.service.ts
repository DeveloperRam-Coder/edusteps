import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

export abstract class BaseService<_T> {
  protected abstract readonly logger: Logger;
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  protected handleError(operation: string, error: any): never {
    this.logger.error(`${operation} failed:`, error);
    
    if (error.code === 'P2002') {
      throw new BadRequestException(`A record with this ${error.meta?.target?.[0] || 'field'} already exists`);
    }
    
    if (error.code === 'P2025') {
      throw new NotFoundException(`${this.modelName} not found`);
    }
    
    if (error.code === 'P2003') {
      throw new BadRequestException('Foreign key constraint failed. Related record does not exist');
    }
    
    throw error;
  }

  protected validateBigInt(value: any, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`Invalid ${fieldName}: must be a valid number`);
    }
  }

  protected sanitizeString(value: string | undefined | null): string | null {
    if (!value) return null;
    return value.trim() || null;
  }

  protected logOperation(operation: string, data?: any): void {
    this.logger.log(`${operation} - ${this.modelName}`, data ? JSON.stringify(data) : '');
  }
}
