import api from '../../../core/api/client';
import { AxiosResponse } from 'axios';

export interface DashboardStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeEnrollments: number;
  totalRevenue: number;
  growth: string;
  attendance?: {
    attendance_rate: number;
    present_count: number;
    total_records: number;
  };
}

export interface DashboardActivity {
  type: 'customer' | 'payment';
  message: string;
  time: string;
  icon: string;
  payer_name?: string;
  student_name?: string;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
}

export const getDashboardStatsApi = (clientId: string | number): Promise<AxiosResponse<DashboardStats>> =>
  api.get(`/dashboard/stats?clientId=${clientId}`);

export const getDashboardActivityApi = (clientId: string | number): Promise<AxiosResponse<DashboardActivity[]>> =>
  api.get(`/dashboard/activity?clientId=${clientId}`);

export const getDashboardRevenueChartApi = (clientId: string | number): Promise<AxiosResponse<RevenueChartPoint[]>> =>
  api.get(`/dashboard/revenue-chart?clientId=${clientId}`);
