import apiClient from '@/core/api/client';

export interface AttendanceRecord {
  [x: string]: any;
  attendance_id: number;
  customer_id: number;
  client_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  marked_by: number;
  customer?: {
    customer_id: number;
    first_name: string;
    last_name?: string;
    mobile?: string;
  };
}

export const getAttendanceApi = async (clientId: number, date: string): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get(`/attendance/${clientId}`, {
    params: { date },
  });
  // Backend returns { data: [...], success: true }
  const payload = response.data;
  return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
};

export const markAttendanceApi = async (data: {
  customer_id: number;
  client_id: number;
  date: string;
  status: string;
  remarks?: string;
}) => {
  const response = await apiClient.post('/attendance', data);
  const payload = response.data;
  if (payload?.success === false) {
    throw new Error(payload.message || 'Failed to mark attendance');
  }
  return payload?.data ?? payload;
};

export const getAttendanceByCustomerApi = async (
  customerId: number | string,
  clientId: number | string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get(`/attendance/customer/${customerId}`, {
    params: {
      clientId,
      startDate,
      endDate,
    },
  });
  const payload = response.data;
  return Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
};
