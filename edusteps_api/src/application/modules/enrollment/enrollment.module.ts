import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { PrismaEnrollmentRepository } from 'src/infrastructure/repositories/prisma-enrollment.reposity';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, PrismaEnrollmentRepository],
})
export class EnrollmentModule {}
