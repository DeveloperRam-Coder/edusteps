import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';
import { createRetryableOperation, analyzeServerError } from '../../../core/utils/serverError';

export type CreateCustomerPayload = {
  clientId: number | string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email?: string;
  address?: string;
};

export type UpdateCustomerPayload = Partial<Omit<CreateCustomerPayload, 'clientId'>>;

const handleApiError = (operation: string, error: any, id?: string | number) => {
  const errorInfo = analyzeServerError(error);
  console.error(`${operation} error:`, {
    id,
    status: error?.response?.status,
    data: error?.response?.data,
    message: error?.message,
    errorInfo
  });
  throw { ...error, ...errorInfo };
};

export const createCustomerApi = async (payload: CreateCustomerPayload): Promise<AxiosResponse<unknown>> => {
  try {
    const requestPayload: Record<string, string> = {
      firstName: payload.firstName,
      mobile: payload.mobile,
      clientId: String(payload.clientId)
    };

    if (payload.lastName?.trim()) {
      requestPayload.lastName = payload.lastName.trim();
    }
    if (payload.email?.trim()) {
      requestPayload.email = payload.email.trim();
    }
    if (payload.address?.trim()) {
      requestPayload.address = payload.address.trim();
    }
    const response = await api.post('/customers', requestPayload);
    return response;
  } catch (error: any) {
    throw handleApiError('Create customer', error);
  }
};

export const getCustomersByClientIdApi = async (clientId: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/customers/by-client/${clientId}`);
  } catch (error: any) {
    throw handleApiError('Get customers by client', error, clientId);
  }
};

export const getCustomerByIdApi = async (customerId: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/customers/${customerId}`);
  } catch (error: any) {
    throw handleApiError('Get customer by ID', error, customerId);
  }
};

export const getCustomerByMobileApi = async (mobile: string): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/customers/by-mobile/${mobile}`);
  } catch (error: any) {
    throw handleApiError('Get customer by mobile', error, mobile);
  }
};

export const updateCustomerApi = async (customerId: string | number, payload: UpdateCustomerPayload): Promise<AxiosResponse<unknown>> => {
  const updateOperation = () => api.put(`/customers/${customerId}`, payload);
  const retryableUpdate = createRetryableOperation(updateOperation, 2, 1000);

  try {
    return await retryableUpdate();
  } catch (error: any) {
    throw handleApiError('Update customer', error, customerId);
  }
};

export const deleteCustomerApi = async (customerId: string | number): Promise<AxiosResponse<unknown>> => {
  const deleteOperation = () => api.delete(`/customers/${customerId}`);
  const retryableDelete = createRetryableOperation(deleteOperation, 2, 1000);

  try {
    return await retryableDelete();
  } catch (error: any) {
    throw handleApiError('Delete customer', error, customerId);
  }
};

export const searchCustomersApi = async (q: string, clientId?: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    const params: any = { q };
    if (clientId) params.clientId = String(clientId);
    return await api.get('/customers/search', { params });
  } catch (error: any) {
    throw handleApiError('Search customers', error);
  }
};
