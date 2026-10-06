import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'instructor' | 'user';
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  role?: 'admin' | 'instructor' | 'user';
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const createUserApi = (payload: CreateUserPayload): Promise<AxiosResponse<unknown>> =>
  api.post('/users', payload);

export const getCurrentUserApi = (): Promise<AxiosResponse<unknown>> =>
  api.get('/users/me');

export const updateUserApi = (userId: string, payload: UpdateUserPayload): Promise<AxiosResponse<unknown>> =>
  api.put(`/users/${userId}`, payload);

export const changePasswordApi = (payload: ChangePasswordPayload): Promise<AxiosResponse<unknown>> =>
  api.post('/users/chnage-password', payload);