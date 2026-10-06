import { IGenericRepository } from './generic-repository.interface';
import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository extends IGenericRepository<Customer> {
  findByMobile(mobile: string): Promise<Customer[] | null>;
  findByClientId(clientId: bigint): Promise<Customer[]>;
}
