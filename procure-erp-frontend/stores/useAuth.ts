// procure-erp-frontend/stores/useAuth.ts
"use client";

import { useAuthStore, User } from "./authStore";
import { authApi } from "@/lib/api/auth";          // ← 既存の API ラッパー

/** 画面から見える型 */
export interface UseAuthReturn {
  /** 画面用ラッパー – 成功すれば true */
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  loading: boolean;
}

export const useAuth = (): UseAuthReturn => {
  /** store の setter／state を個別に取得 */
  const setLoading = useAuthStore((s) => s.setLoading);
  const writeLogin = useAuthStore((s) => s.login);
  const logout     = useAuthStore((s) => s.logout);
  const user       = useAuthStore((s) => s.user);
  const loading    = useAuthStore((s) => s.loading);

  /** 画面用ラッパー */
  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await authApi.login(username, password, rememberMe);

      if (res.user && res.accessToken) {
        writeLogin(res.user, res.accessToken, res.refreshToken ?? null);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, logout, user, loading };
};
