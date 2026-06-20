'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import type { MeProfile } from '@/lib/meProfile';

type DashboardUserValue = {
  me: MeProfile | null;
  permissionCodes: Set<string>;
  loading: boolean;
  refresh: () => Promise<void>;
};

interface AuthPermissionsRes {
  permissions?: string[];
}

const DashboardUserContext = createContext<DashboardUserValue | null>(null);

export function DashboardUserProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [permissionCodes, setPermissionCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const resolvePermissionCodes = useCallback(async (): Promise<Set<string>> => {
    try {
      const { data } = await api.get<AuthPermissionsRes>('/api/auth/permissions');
      const direct = Array.isArray(data?.permissions)
        ? data.permissions
          .map((code) => String(code).trim().toLowerCase())
          .filter(Boolean)
        : [];
      return new Set(direct);
    } catch {
      return new Set();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!getAccessToken()) {
      setMe(null);
      setPermissionCodes(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<MeProfile>('/api/auth/me');
      setMe(data);
      const codes = await resolvePermissionCodes();
      setPermissionCodes(codes);
    } catch {
      setMe(null);
      setPermissionCodes(new Set());
    } finally {
      setLoading(false);
    }
  }, [resolvePermissionCodes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ me, permissionCodes, loading, refresh }), [me, permissionCodes, loading, refresh]);

  return (
    <DashboardUserContext.Provider value={value}>{children}</DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUserValue {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error('useDashboardUser debe usarse dentro de DashboardUserProvider');
  }
  return ctx;
}
