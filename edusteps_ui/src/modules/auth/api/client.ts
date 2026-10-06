import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';
// Note: 'client' here refers to axios client, not the Client model

export type CreateClientPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentProviderAccountId?: string;
};

export type UpdateClientPayload = Partial<Omit<CreateClientPayload, ''>>;

export const createClientApi = (payload: CreateClientPayload): Promise<AxiosResponse<unknown>> =>
  api.post('/clients', payload);

export const checkClientExistsApi = (): Promise<AxiosResponse<unknown>> =>
  api.get('/clients/by-user/check');

export const getClientByIdApi = (clientId: string | number): Promise<AxiosResponse<unknown>> =>
  api.get(`/clients/${clientId}`);

export const getClientByEmailApi = (email: string): Promise<AxiosResponse<unknown>> =>
  api.get(`/clients/by-email/${email}`);

export const getClientByPhoneApi = (phone: string): Promise<AxiosResponse<unknown>> =>
  api.get(`/clients/by-phone/${phone}`);

export const getClientsByNameApi = (name: string): Promise<AxiosResponse<unknown>> =>
  api.get(`/clients/by-name?name=${encodeURIComponent(name)}`);

export const updateClientApi = (clientId: string | number, payload: UpdateClientPayload): Promise<AxiosResponse<unknown>> =>
  api.put(`/clients/${clientId}`, payload);

export const updateClientConfigApi = (clientId: string | number, requiresMasterConfig: boolean): Promise<AxiosResponse<unknown>> =>
  api.put(`/clients/${clientId}`, { requiresMasterConfig });

export const deleteClientApi = (clientId: string | number): Promise<AxiosResponse<unknown>> =>
  api.delete(`/clients/${clientId}`);

