import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Validate DATABASE_URL before passing to Prisma
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl?.startsWith('postgresql://') && !dbUrl?.startsWith('postgres://')) {
      throw new Error('Invalid DATABASE_URL: must start with postgresql:// or postgres://');
    }
    // Configure connection pool with optimal settings
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,                      // Maximum number of connections
      min: 5,                       // Minimum number of connections
      idleTimeoutMillis: 30000,     // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Fail fast if can't connect in 2s
      maxUses: 7500,                // Recycle connections after 7500 uses
    });

    const adapter = new PrismaPg(pool);
    
    super({
      adapter,
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    this.pool = pool;

    // Log Prisma warnings and errors
    this.$on('warn' as never, (e: any) => {
      this.logger.warn(e.message);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(e.message);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      this.logger.log(`📊 Connection pool: min=${this.pool.options.min}, max=${this.pool.options.max}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Get pool statistics
  getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}
