export class ClientPermission {
  constructor(
    public readonly permissionId: bigint,
    public readonly clientId: bigint,
    public readonly userId: string,
    public readonly createdId: string,
    public readonly updatedId: string|null,
  ) {}
}
