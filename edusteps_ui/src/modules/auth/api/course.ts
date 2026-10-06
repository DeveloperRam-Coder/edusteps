import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';
import { createRetryableOperation, analyzeServerError } from '../../../core/utils/serverError';

export type CourseRateType = 'per_hour' | 'per_session' | 'per_course' | 'per_month';

export type CreateCoursePayload = {
  clientId: number | string;
  courseName: string;
  description?: string;
  rate: number;
  rateType: CourseRateType;
  priorityNo: number;
};

export type UpdateCoursePayload = Partial<Omit<CreateCoursePayload, 'clientId'>>;

export interface CourseAnalytics {
  course: {
    course_id: string;
    client_id: string;
    course_name: string;
    description?: string;
    rate: number;
    rate_type: CourseRateType;
    priority_no: number;
  };
  metrics: {
    active_students: number;
    total_students: number;
    course_revenue: number;
    attendance_rate: number;
    total_sessions: number;
  };
  students: Array<{
    cd_id: string;
    customer_id: string;
    student_name: string;
    subject: string;
    amount: number;
    is_active: boolean;
    registration_date: string;
    total_paid: number;
    balance_due: number;
    parent_name: string;
    parent_mobile?: string | null;
    parent_email?: string | null;
  }>;
}

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

export const createCourseApi = async (payload: CreateCoursePayload): Promise<AxiosResponse<unknown>> => {
  try {
    const response = await api.post('/courses', payload);
    return response;
  } catch (error: any) {
    throw handleApiError('Create course', error);
  }
};

export const getCoursesByClientIdApi = async (clientId: string | number): Promise<AxiosResponse<unknown>> => {
  try {
    return await api.get(`/courses/by-client/${clientId}`);
  } catch (error: any) {
    throw handleApiError('Get courses by client', error, clientId);
  }
};

export const getCourseAnalyticsApi = async (courseId: string | number): Promise<AxiosResponse<CourseAnalytics>> => {
  try {
    return await api.get(`/courses/${courseId}/analytics`);
  } catch (error: any) {
    throw handleApiError('Get course analytics', error, courseId);
  }
};

export const updateCourseApi = async (courseId: string | number, payload: UpdateCoursePayload): Promise<AxiosResponse<unknown>> => {
  const updateOperation = () => api.put(`/courses/${courseId}`, payload);
  const retryableUpdate = createRetryableOperation(updateOperation, 2, 1000);

  try {
    const response = await retryableUpdate();
    return response;
  } catch (error: any) {
    throw handleApiError('Update course', error, courseId);
  }
};

export const deleteCourseApi = async (courseId: string | number): Promise<AxiosResponse<unknown>> => {
  const deleteOperation = () => api.delete(`/courses/${courseId}`);
  const retryableDelete = createRetryableOperation(deleteOperation, 2, 1000);

  try {
    const response = await retryableDelete();
    return response;
  } catch (error: any) {
    throw handleApiError('Delete course', error, courseId);
  }
};
