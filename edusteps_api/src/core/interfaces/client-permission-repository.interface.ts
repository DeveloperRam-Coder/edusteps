import { ClientPermission } from "../entities/client-permission.entity"

export interface IClientPermissionRepository {
  create(permission:ClientPermission):Promise<ClientPermission>;
  findAll():Promise<ClientPermission[]>
  findByClientId(clientID:bigint):Promise<ClientPermission[]>
  delete(permissionID:bigint):Promise<void>
}