import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';

type LoginPayload = { identifier: string; password: string };
type RegisterPayload = { email: string; password: string; name?: string; mobile?: string };
type UpdateProfilePayload = { name?: string; email?: string; mobile?: string };

export const loginApi = (payload: LoginPayload): Promise<AxiosResponse<unknown>> =>
  api.post('/auth/login', payload);

export const registerApi = (payload: RegisterPayload): Promise<AxiosResponse<unknown>> =>
  api.post('/auth/register', payload);

export const meApi = (): Promise<AxiosResponse<unknown>> => api.get('/auth/me');

export const logoutApi = (): Promise<AxiosResponse<unknown>> => api.post('/auth/logout', {});

export const updateProfileApi = async (userId: string, data: UpdateProfilePayload) => {
  const payload: UpdateProfilePayload = {
    name: data.name,
    email: data.email,
    mobile: data.mobile,
  };
  const res = await api.put(`/users/${userId}`, payload);
  return res.data;
};

export const deleteProfileApi = async (userId: string) => {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
};

export const uploadAvatarApi = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const changePasswordApi = async (data: any) => {
  const res = await api.post('/users/change-password', data);
  return res.data;
};

export const getCurrentUserApi = (): Promise<AxiosResponse<unknown>> =>
  api.get('/users/me');
