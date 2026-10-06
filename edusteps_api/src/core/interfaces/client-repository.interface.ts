import { IGenericRepository } from './generic-repository.interface';
import { Client } from '../entities/client.entity';

export interface IClientRepository extends IGenericRepository<Client> {
  findByEmail(email: string): Promise<Client | null>;
  findByPhone(phone: string): Promise<Client[]>;
  findByName(name: string): Promise<Client[]>;
  findByUserId(userId: string): Promise<Client | null>;
}