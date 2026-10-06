import { useState, useEffect, useCallback, ReactNode } from 'react';
import { BusinessDetails } from '../types';
import { loginApi, registerApi, meApi, logoutApi } from '../modules/auth/api/auth';
import { checkClientExistsApi, createClientApi, updateClientApi, CreateClientPayload } from '../modules/auth/api/client';
import { getAuthToken, saveAuth, clearAuth } from '../core/utils/storage';
import { setToken, removeToken } from '../core/api/client';
import { User } from '../types';
import { AuthContext } from './AuthContext';
import { getPreferencesApi } from '../modules/profile/api/profile';

const THEME_STORAGE_KEY = 'internsteps.theme';

function syncThemeFromPrefs(theme: string) {
  const valid = ['system', 'light', 'dark'].includes(theme) ? theme : 'system';
  localStorage.setItem(THEME_STORAGE_KEY, valid);
  const resolved = valid === 'dark' ? 'dark' : valid === 'light' ? 'light' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails | null>(null);
  const [hasBusinessDetails, setHasBusinessDetails] = useState<boolean>(false);

  const checkBusinessDetailsInternal = useCallback(async () => {
    try {
      const res = await checkClientExistsApi();
      const d = res.data as any;
      if (d?.exists && d?.client) {
        setBusinessDetails(d.client as BusinessDetails);
        setHasBusinessDetails(true);
      } else {
        setBusinessDetails(null);
        setHasBusinessDetails(false);
      }
    } catch (e) {
      if (import.meta.env?.DEV) {
        console.log('Error checking business details:', e)
      }
      setBusinessDetails(null);
      setHasBusinessDetails(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = getAuthToken(); // reads sessionStorage then localStorage
        if (token) {
          // Restore token into axios in-memory store on page refresh
          setToken(token);
          const res = await meApi();
          setUser(res.data as User);
          await checkBusinessDetailsInternal();
          // Sync theme from DB so preference works across devices
          try {
            const prefsRes = await getPreferencesApi();
            syncThemeFromPrefs(prefsRes.data.theme);
          } catch { /* non-critical — localStorage fallback already applied */ }
        } else {
          setUser(null);
          setHasBusinessDetails(false);
        }
      } catch (e) {
        if (import.meta.env?.DEV) {
          console.log('Bootstrap error:', e)
        }
        clearAuth();
        setUser(null);
        setHasBusinessDetails(false);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [checkBusinessDetailsInternal]);

  const login = async (identifier: string, password: string) => {
    const res = await loginApi({ identifier, password });
    const data = res.data as any;
    // Sync token into axios in-memory store FIRST so all subsequent requests are authenticated
    if (data.access_token) setToken(data.access_token);
    saveAuth(data.access_token, data.refresh_token);
    setUser(data.user ?? null);
    await checkBusinessDetailsInternal();
    // Sync theme from DB on every login
    try {
      const prefsRes = await getPreferencesApi();
      syncThemeFromPrefs(prefsRes.data.theme);
    } catch { /* non-critical */ }
  };

  const register = async (payload: { email: string; password: string; name?: string; mobile: string }) => {
    const res = await registerApi(payload);
    const data = res.data as any;
    if (data.access_token) setToken(data.access_token);
    saveAuth(data.access_token, data.refresh_token);
    setUser(data.user ?? null);
    setBusinessDetails(null);
    setHasBusinessDetails(false);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      if (import.meta.env?.DEV) {
        console.log('Logout API error:', e)
      }
    }
    removeToken();
    clearAuth();
    setUser(null);
    setBusinessDetails(null);
    setHasBusinessDetails(false);
  };

  const checkBusinessDetails = async () => {
    await checkBusinessDetailsInternal();
  };

  const createBusinessDetails = async (payload: CreateClientPayload) => {
    const res = await createClientApi(payload);
    const client = res.data as any;
    setBusinessDetails(client as BusinessDetails);
    setHasBusinessDetails(true);
    return client;
  };

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const res = await meApi();
        setUser(res.data as User);
      }
    } catch (e) {
      if (import.meta.env?.DEV) {
        console.log('Failed to refresh user:', e)
      }
    }
  };

  const updateBusinessDetails = async (clientId: string | number, payload: Partial<CreateClientPayload & { requiresMasterConfig?: boolean }>) => {
    const res = await updateClientApi(clientId, payload);
    const updated = res.data as BusinessDetails;
    setBusinessDetails(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      businessDetails,
      hasBusinessDetails,
      login,
      register,
      logout,
      checkBusinessDetails,
      createBusinessDetails,
      refreshUser,
      updateBusinessDetails,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
