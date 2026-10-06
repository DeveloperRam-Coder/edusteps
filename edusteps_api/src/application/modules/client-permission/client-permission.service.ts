import { Injectable } from '@nestjs/common';
import { PrismaClientPermissionRepository } from 'src/infrastructure/repositories/prisma-client-permission.respository';
import { CreateClientPermissionDto } from './dto/create-client-permisson.dto';
import { ClientPermission } from 'src/core/entities/client-permission.entity';


@Injectable()
export class ClientPermissionService {
  
  constructor(private readonly repo: PrismaClientPermissionRepository){
  }

  async create(dto:CreateClientPermissionDto,createdId:string):Promise<ClientPermission>{
    return this.repo.create(
      new ClientPermission(
        BigInt(0),
        dto.clientId,
        dto.userId,
        createdId,
        createdId,
      )
    );
  }

  async findAll(){
    return this.repo.findAll();
  }

  async findByClientId(clientId:bigint){
    return this.repo.findByClientId(clientId);
  }

  async delete (permissionId:bigint){
    return this.repo.delete(permissionId);
  }
}
