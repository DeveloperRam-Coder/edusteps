import { Module } from '@nestjs/common';
import { ClientPermissionService } from './client-permission.service';
import { ClientPermissionController } from './client-permission.controller';
import { PrismaClientPermissionRepository } from 'src/infrastructure/repositories/prisma-client-permission.respository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [ClientPermissionController],
  providers: [
    ClientPermissionService,
    PrismaClientPermissionRepository,
    PrismaService
  ],
  exports: [ClientPermissionService]
})
export class ClientPermissionModule {}
