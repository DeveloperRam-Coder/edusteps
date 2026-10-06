import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';
import { analyzeServerError } from '../../../core/utils/serverError';

export type CreateEnrollmentPayload = {
  customer_id: number;
  course_id: number;
  client_id: number;
  status?: string;
};

const handleApiError = (operation: string, error: any, id?: string | number) => {
  const errorInfo = analyzeServerError(error);
  console.error(`${operation} error:`, {
    id,
    status: error?.response?.status,
    data: error?.response?.data,
    message: error?.message,
    errorInfo,
  });
  throw { ...error, ...errorInfo };
};

export const createEnrollmentApi = async (
  payload: CreateEnrollmentPayload,
): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.post('/enrollments', payload);
  } catch (error: any) {
    throw handleApiError('Create enrollment', error);
  }
};

export const getEnrollmentByIdApi = async (
  enrollmentId: string | number,
): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/enrollments/${enrollmentId}`);
  } catch (error: any) {
    throw handleApiError('Get enrollment by ID', error, enrollmentId);
  }
};

export const updateEnrollmentApi = async (
  enrollmentId: string | number,
  payload: Partial<CreateEnrollmentPayload>,
): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.patch(`/enrollments/${enrollmentId}`, payload);
  } catch (error: any) {
    throw handleApiError('Update enrollment', error, enrollmentId);
  }
};

export const deleteEnrollmentApi = async (
  enrollmentId: string | number,
): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.delete(`/enrollments/${enrollmentId}`);
  } catch (error: any) {
    throw handleApiError('Delete enrollment', error, enrollmentId);
  }
};
