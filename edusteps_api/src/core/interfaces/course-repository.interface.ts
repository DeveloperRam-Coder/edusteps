import { IGenericRepository } from './generic-repository.interface';
import { Course } from '../entities/course.entity';

export interface ICourseRepository extends IGenericRepository<Course> {
  findByClientId(clientId: bigint): Promise<Course[]>;
  findByRateType(rateType: string): Promise<Course[]>;
  findByPriorityRange(minPriority: number, maxPriority: number): Promise<Course[]>;
}