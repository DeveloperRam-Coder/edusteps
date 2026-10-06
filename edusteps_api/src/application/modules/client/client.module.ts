import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { PrismaClientRepository } from 'src/infrastructure/repositories/prisma-client.repository';

@Module({
  controllers: [ClientController],
  providers: [ClientService, PrismaClientRepository],
  exports: [ClientService],
})
export class ClientModule {}