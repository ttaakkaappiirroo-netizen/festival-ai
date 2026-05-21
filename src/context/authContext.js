import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// ログイン状態・管理者権限を参照するフック
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth は AuthProvider 内で使用してください')
  }
  return ctx
}
