export class Customer {
  customerId: bigint;
  clientId: bigint;
  firstName: string;
  lastName?: string | null;
  mobile: string;
  email: string;
  address?: string | null;
  createdId: string;
  updatedId: string;
  createdAt: Date;
  updatedAt: Date;
  // relations
  clients?: any;

  constructor(
    customerId: bigint,
    clientId: bigint,
    firstName: string,    
    lastName: string,
    mobile: string,
    email: string,    
    address: string | null,
    createdId: string,
    updatedId: string,
    createdAt?: Date,
    updatedAt?: Date,
    clients?: any,
  ) {
    this.customerId = customerId;
    this.clientId = clientId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.mobile = mobile;
    this.email = email;
    this.address = address;
    this.createdId = createdId;
    this.updatedId = updatedId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.clients = clients;
  }
}
