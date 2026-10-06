import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';

export type CreateCustomerDetailPayload = {
  first_name: string;
  last_name?: string;
  subject: string;
  registration_date: string;
  amount: number;
  customer_id: string | number;
  is_active?: boolean;
  deactivate_date?: string;
};

export type UpdateCustomerDetailPayload = Partial<CreateCustomerDetailPayload>;

const handleApiError = (operation: string, error: any, id?: string | number) => {
  console.error(`${operation} error:`, {
    id,
    status: error?.response?.status,
    data: error?.response?.data,
    message: error?.message,
  });
  throw error;
};

export const getCustomerDetailsByCustomerIdApi = async (customerId: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/customer-details?customer_id=${customerId}`);
  } catch (error: any) {
    throw handleApiError('Get customer details', error, customerId);
  }
};

export const createCustomerDetailsApi = async (payload: CreateCustomerDetailPayload): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.post('/customer-details', payload);
  } catch (error: any) {
    throw handleApiError('Create customer details', error);
  }
};

export const updateCustomerDetailsApi = async (id: string | number, payload: UpdateCustomerDetailPayload): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.put(`/customer-details/${id}`, payload);
  } catch (error: any) {
    throw handleApiError('Update customer details', error, id);
  }
};

export const deleteCustomerDetailsApi = async (id: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.delete(`/customer-details/${id}`);
  } catch (error: any) {
    throw handleApiError('Delete customer details', error, id);
  }
};
