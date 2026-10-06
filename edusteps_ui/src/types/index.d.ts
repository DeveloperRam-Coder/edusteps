export type User = {
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

export type BusinessDetails = {
  client_id: number | string;
  name: string;
  /** Alias used in some legacy screens — same as `name` */
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_provider_account_id?: string;
  requires_master_config?: boolean;
  created_id?: string;
  updated_id?: string;
  created_at?: string;
  updated_at?: string;
};
