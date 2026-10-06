import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IGenericRepository } from 'src/core/interfaces/generic-repository.interface';

@Injectable()
export abstract class GenericPrismaRepository<T> implements IGenericRepository<T> {
  protected abstract readonly modelName: string;
  protected abstract readonly primaryKeyName: string;

  constructor(protected readonly prisma: PrismaService) {}

  private get model(): any {
    const m = (this.prisma as any)[this.modelName];
    if (!m) throw new Error(`Prisma model "${this.modelName}" not found. Check modelName matches Prisma schema plural (e.g. "customers", "courses")`);
    return m;
  }

  private pk(value: string): Record<string, any> {
    if (!this.primaryKeyName) {
      throw new Error(`primaryKeyName not configured for ${this.modelName || 'GenericPrismaRepository'} subclass.`);
    }
    const idType = this.primaryKeyName.endsWith('_id') && this.primaryKeyName !== 'id' ? BigInt(value) : value;
    return { [this.primaryKeyName]: idType };
  }

  async create(entity: T): Promise<T> {
    return await this.model.create({ data: entity });
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({ where: this.pk(id) });
  }

  async findAll(): Promise<T[]> {
    return await this.model.findMany();
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    return await this.model.update({ where: this.pk(id), data: entity });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: this.pk(id) });
  }
}
