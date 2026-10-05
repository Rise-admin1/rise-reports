import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { appLogin, appLogout, appMe } from '@/services/api';
import { clearAppToken, getAppToken } from '@/services/appAuth';
import type { AppRole, AppUser, ReportPermission } from '@/types/appAuth';

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: ReportPermission) => boolean;
  hasAnyPermission: (permissions: ReportPermission[]) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  role: AppRole | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getAppToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await appMe();
      setUser(data.user);
    } catch {
      await clearAppToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await appLogin(username, password);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await appLogout();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: ReportPermission) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: ReportPermission[]) => permissions.some((permission) => hasPermission(permission)),
    [hasPermission]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
      hasPermission,
      hasAnyPermission,
      isSuperAdmin: user?.role === 'SUPER_ADMIN',
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      role: user?.role ?? null,
    }),
    [user, loading, login, logout, refresh, hasPermission, hasAnyPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
