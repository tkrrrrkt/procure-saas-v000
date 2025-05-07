import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  loading: boolean
  /** ログイン成功時に呼び出す */
  login: (u: User, at: string) => void
  /** ログアウト時に呼び出す */
  logout: () => void
  /** スピナー制御などに利用 */
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      loading: false,

      login: (user, accessToken) =>
        set({
          user,
          accessToken,
          loading: false,
        }),

      logout: () => set({ user: null, accessToken: null, loading: false }),

      setLoading: (v) => set({ loading: v }),
    }),
    {
      name: 'auth-storage',                            // LocalStorage のキー
      storage: createJSONStorage(() => localStorage), // LocalStorage に永続化
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
      }),
    },
  ),
)