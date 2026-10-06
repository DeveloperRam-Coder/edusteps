import { createContext, useContext } from 'react';
import { BusinessDetails } from '../types';
import { CreateClientPayload } from '../modules/auth/api/client';
import { User } from '../types';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  businessDetails: BusinessDetails | null;
  hasBusinessDetails: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; name?: string; mobile: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkBusinessDetails: () => Promise<void>;
  createBusinessDetails: (payload: CreateClientPayload) => Promise<unknown>;
  refreshUser: () => Promise<void>;
  updateBusinessDetails: (clientId: string | number, payload: Partial<CreateClientPayload & { requiresMasterConfig?: boolean }>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
