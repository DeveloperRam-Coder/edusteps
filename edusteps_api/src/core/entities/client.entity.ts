export class Client {
  clientId: bigint;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentProviderAccountId?: string;
  requiresMasterConfig: boolean;
  createdId: string;
  updatedId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    clientId: bigint,
    name: string,
    createdId: string,
    phone?: string,
    email?: string,
    address?: string,
    paymentProviderAccountId?: string,
    updatedId?: string,
    createdAt?: Date,
    updatedAt?: Date,
    requiresMasterConfig: boolean = false,
  ) {
    this.clientId = clientId;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.paymentProviderAccountId = paymentProviderAccountId;
    this.requiresMasterConfig = requiresMasterConfig;
    this.createdId = createdId;
    this.updatedId = updatedId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}