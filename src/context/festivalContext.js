import { createContext, useContext } from 'react'

export const FestivalContext = createContext(null)

// 出店・お知らせデータを参照するフック
export function useFestival() {
  const ctx = useContext(FestivalContext)
  if (!ctx) {
    throw new Error('useFestival は FestivalProvider 内で使用してください')
  }
  return ctx
}
