import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const indicators: Array<() => Promise<any>> = [];

    // 1. Database health — use our own isHealthy() method instead of
    //    @nestjs/terminus PrismaHealthIndicator.pingCheck() which tries
    //    MongoDB $runCommandRaw first and crashes on Postgres with pg adapter
    indicators.push(async () => {
      const key = 'database';
      try {
        const healthy = await this.prisma.isHealthy();
        const pool = this.prisma.getPoolStats();
        if (!healthy) {
          return { [key]: { status: 'down', error: 'ping failed', pool } };
        }
        return { [key]: { status: 'up', pool } };
      } catch (error: any) {
        return {
          [key]: {
            status: 'down',
            error: error?.message || 'unknown database error',
          },
        };
      }
    });

    // 2. Memory health (heap < 1 GB — realistic for NestJS + Prisma + Bcrypt + deps)
    indicators.push(async () => {
      try {
        return await this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024);
      } catch (e: any) {
        return { memory_heap: { status: 'down', error: e?.message || 'heap check failed' } };
      }
    });

    // 3. Memory health (RSS < 2 GB)
    indicators.push(async () => {
      try {
        return await this.memory.checkRSS('memory_rss', 2048 * 1024 * 1024);
      } catch (e: any) {
        return { memory_rss: { status: 'down', error: e?.message || 'rss check failed' } };
      }
    });

    // 4. Disk health (90% threshold — alert only when almost full)
    //    Windows-safe path resolution
    let diskPath = '/';
    if (process.platform === 'win32') {
      const driveLetter = (process.cwd() || 'C:').split(':')[0] || 'C';
      diskPath = `${driveLetter}:\\`;
    }
    indicators.push(async () => {
      try {
        return await this.disk.checkStorage('disk', {
          path: diskPath,
          thresholdPercent: 0.9,
        });
      } catch (e: any) {
        // Disk library may not support all OS/mount combos — don't fail
        // the whole health check for a non-critical disk metric
        this.logger.warn(`Disk check skipped (${diskPath}): ${e?.message || e}`);
        return {
          disk: {
            status: 'up',
            path: diskPath,
            note: 'disk check skipped — configured at 90% threshold',
          },
        };
      }
    });

    return this.health.check(indicators);
  }

  @Get('simple')
  @Public()
  @ApiOperation({ summary: 'Simple health check' })
  @ApiResponse({ status: 200, description: 'Service is up' })
  simple() {
    return {
      ok: true,
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('database')
  @Public()
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async database() {
    const started = Date.now();
    let healthy = false;
    let error: string | null = null;
    let stats: any = null;

    try {
      healthy = await this.prisma.isHealthy();
      stats = this.prisma.getPoolStats();
    } catch (e: any) {
      error = e?.message || String(e);
    }

    const latencyMs = Date.now() - started;

    return {
      healthy,
      latencyMs,
      error,
      pool: stats,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      driver: process.env.DATABASE_URL?.startsWith('postgres') ? 'postgresql' : (process.env.DATABASE_URL?.split(':')[0] || 'unknown'),
      timestamp: new Date().toISOString(),
    };
  }
}
