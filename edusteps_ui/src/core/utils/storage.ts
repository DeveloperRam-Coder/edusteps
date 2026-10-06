// Platform-aware storage helpers — use sessionStorage for auth tokens (cleared on tab close)
// Non-sensitive keys still use localStorage
export const save = (key: string, value: string): void => {
  localStorage.setItem(key, value);
};

export const get = (key: string): string | null => {
  return localStorage.getItem(key);
};

export const remove = (key: string): void => {
  localStorage.removeItem(key);
};

export const saveAuth = (accessToken?: string, refreshToken?: string): void => {
  if (accessToken) {
    try {
      sessionStorage.setItem('access_token', accessToken);
    } catch {
      /* ignore */
    }
  }
  if (refreshToken) {
    try {
      sessionStorage.setItem('refresh_token', refreshToken);
    } catch {
      /* ignore */
    }
  }
};

/** Read auth token — checks sessionStorage first (current session), then localStorage (legacy) */
export const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token');
  } catch {
    return null;
  }
};

export const clearAuth = (): void => {
  try {
    sessionStorage.removeItem('access_token');
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem('refresh_token');
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem('access_token');
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem('refresh_token');
  } catch {
    /* ignore */
  }
};

