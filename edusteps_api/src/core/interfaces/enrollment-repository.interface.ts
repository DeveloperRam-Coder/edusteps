import { Enrollment } from "../entities/enrollment.entity";
import { IGenericRepository } from "./generic-repository.interface";

export interface IEnrollmentRepository extends IGenericRepository<Enrollment> {
}
