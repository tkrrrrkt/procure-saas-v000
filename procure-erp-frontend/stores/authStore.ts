import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  role: string
}

// 状態管理に特化したストア定義
interface AuthState {
  user: User | null
  accessToken: string | null
  loading: boolean
  // 内部状態管理用の基本的なアクション
  setUser: (user: User | null, accessToken: string | null) => void
  setLoading: (loading: boolean) => void
}

/**
 * 認証状態を管理する内部Zustandストア
 * 注意: このストアは直接使用せず、useAuth() フックを通じてアクセスしてください
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      loading: false,

      // より明示的な名前に変更し、ロジックを単純化
      setUser: (user, accessToken) =>
        set({
          user,
          accessToken,
          loading: false,
        }),

      // loading状態の設定のみ
      setLoading: (loading) => set({ loading }),
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