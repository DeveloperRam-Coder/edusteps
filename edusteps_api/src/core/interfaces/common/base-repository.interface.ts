export interface IBaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string | number, data: any): Promise<T>;
  delete(id: string | number): Promise<T>;
}