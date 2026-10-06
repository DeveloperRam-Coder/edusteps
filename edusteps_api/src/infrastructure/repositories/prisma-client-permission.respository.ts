import { IClientPermissionRepository } from "src/core/interfaces/client-permission-repository.interface";
import { PrismaService } from "../prisma/prisma.service";
import { ClientPermission } from "src/core/entities/client-permission.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrismaClientPermissionRepository
  implements IClientPermissionRepository {

  constructor(private readonly prisma: PrismaService) {}

  async create(permission: ClientPermission): Promise<ClientPermission> {

    // console.log("REPO permission:", permission); // DEBUG

    const result = await this.prisma.client_permission.create({
      data: {
        client_id: permission.clientId,
        user_id: permission.userId,
        created_id: permission.createdId, // ✅ REQUIRED FIELD
        updated_id: permission.updatedId || undefined,
      },
    });

    return new ClientPermission(
      result.permission_id,
      result.client_id,
      result.user_id || '',
      result.created_id,
      result.updated_id || '',
    );
  }

  async findAll(): Promise<ClientPermission[]> {
    const data = await this.prisma.client_permission.findMany();
    return data.map(
      p =>
        new ClientPermission(
          p.permission_id,
          p.client_id,
          p.user_id || '',
          p.created_id,
          p.updated_id || '',
        )
    );
  }

  async findByClientId(clientId: bigint): Promise<ClientPermission[]> {
    const data = await this.prisma.client_permission.findMany({
      where: { client_id: clientId },
    });

    return data.map(
      p =>
        new ClientPermission(
          p.permission_id,
          p.client_id,
          p.user_id || '',
          p.created_id,
          p.updated_id || '',
        )
    );
  }

  async delete(permissionId: bigint): Promise<void> {
    await this.prisma.client_permission.delete({
      where: { permission_id: permissionId },
    });
  }
}
