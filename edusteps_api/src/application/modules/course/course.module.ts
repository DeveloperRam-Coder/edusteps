import { Module } from '@nestjs/common';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { PrismaCourseRepository } from 'src/infrastructure/repositories/prisma-course.repository';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [CourseService, PrismaCourseRepository],
  exports: [CourseService],
})
export class CourseModule {}