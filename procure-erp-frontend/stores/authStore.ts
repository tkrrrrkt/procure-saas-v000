import { create } from 'zustand'

export interface User {
  id: string
  username: string
  role: string
}

/**
 * 認証状態を管理する内部ストア
 * Cookie認証に統一し、メモリ内のみで状態管理します
 * 注意: このストアは直接使用せず、useAuth() フックを通じてアクセスしてください
 */
interface AuthState {
  user: User | null
  loading: boolean
  mfaRequired: boolean
  // 内部状態管理用の基本的なアクション
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setMfaRequired: (required: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: false,
  mfaRequired: false,

  // シンプル化したユーザー状態設定
  setUser: (user) =>
    set({
      user,
      loading: false,
    }),

  // loading状態の設定のみ
  setLoading: (loading) => set({ loading }),
  
  // MFA要求状態の設定
  setMfaRequired: (mfaRequired) => set({ mfaRequired }),
}))