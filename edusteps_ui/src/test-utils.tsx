import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from './auth/AuthContext';
import { NotificationProvider } from './core/components/NotificationProvider';

// Mock Auth Context data
const mockAuthValue = {
  user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
  loading: false,
  businessDetails: { client_id: 1, name: 'Test Business' },
  hasBusinessDetails: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkBusinessDetails: async () => {},
  createBusinessDetails: async () => {},
  refreshUser: async () => {},
  updateBusinessDetails: async () => {},
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthContext.Provider value={mockAuthValue as any}>
          {children}
        </AuthContext.Provider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
