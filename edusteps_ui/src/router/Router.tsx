import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

import SplashScreen from '../modules/auth/screens/SplashScreen';
import LoginScreen from '../modules/auth/screens/LoginScreen';
import RegisterScreen from '../modules/auth/screens/RegisterScreen';
import BusinessDetailsScreen from '../modules/auth/screens/BusinessDetailsScreen';
import AddCustomerScreen from '../modules/student/screens/AddCustomerScreen';
import CustomersScreen from '../modules/student/screens/CustomersScreen';
import CustomerDetailsScreen from '../modules/student/screens/CustomerDetailsScreen';
import PaymentDetailsScreen from '../modules/auth/screens/PaymentDetailsScreen';
import ProfileScreen from '../modules/auth/screens/ProfileScreen';
import DashboardScreen from '../modules/auth/screens/DashboardScreen';
import CoursesScreen from '../modules/auth/screens/CoursesScreen';
import CourseAnalyticsScreen from '../modules/auth/screens/CourseAnalyticsScreen';
import SettingsScreen from '../modules/auth/screens/SettingsScreen';
import FeeReminderScreen from '../modules/fee-reminder/screens/FeeReminderScreen';
import AttendanceScreen from '../modules/attendance/screens/AttendanceScreen';
import PrivacyPolicyScreen from '../modules/auth/screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../modules/auth/screens/legal/TermsOfServiceScreen';
import HelpCenterScreen from '../modules/auth/screens/legal/HelpCenterScreen';
import ContactSupportScreen from '../modules/auth/screens/legal/ContactSupportScreen';
import DashboardLayout from '../core/layouts/DashboardLayout';
import NotFoundScreen from '../modules/auth/screens/NotFoundScreen';

const Router: React.FC = () => {
  const { user, loading, hasBusinessDetails } = useAuth();

  if (loading) return <SplashScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!hasBusinessDetails) {
    return (
      <Routes>
        <Route path="/business-details" element={<BusinessDetailsScreen />} />
        <Route path="/add-customer" element={<AddCustomerScreen />} />
        <Route path="*" element={<Navigate to="/business-details" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/register" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/add-customer" element={<AddCustomerScreen />} />
        <Route path="/customers" element={<CustomersScreen />} />
        <Route path="/customers/:id" element={<CustomerDetailsScreen />} />
        <Route path="/courses" element={<CoursesScreen />} />
        <Route path="/courses/:id/analytics" element={<CourseAnalyticsScreen />} />
        <Route path="/attendance" element={<AttendanceScreen />} />
        <Route path="/fee-reminders" element={<FeeReminderScreen />} />
        <Route path="/payment-details" element={<PaymentDetailsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/privacy" element={<PrivacyPolicyScreen />} />
        <Route path="/terms" element={<TermsOfServiceScreen />} />
        <Route path="/help" element={<HelpCenterScreen />} />
        <Route path="/support" element={<ContactSupportScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
};

export default Router;
