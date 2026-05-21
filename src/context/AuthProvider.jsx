import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './authContext'

// Supabase Auth のセッションと、profiles テーブルの role=admin 判定を供給するプロバイダ。
// マウント時に既存セッションを復元し、以後はログイン状態の変化を購読する。
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // 未接続ならセッション取得が走らないため、最初から loading は false
  const [loading, setLoading] = useState(isSupabaseConfigured)

  // profiles テーブルを参照し、ログインユーザーが管理者かどうかを確認
  const checkAdmin = useCallback(async (currentSession) => {
    if (!currentSession?.user) return false
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentSession.user.id)
      .maybeSingle()
    if (error) {
      console.error('管理者権限の確認に失敗しました:', error.message)
      return false
    }
    return data?.role === 'admin'
  }, [])

  useEffect(() => {
    // Supabase 未接続時はログイン不可（セッション取得・購読をスキップ）
    if (!isSupabaseConfigured) return

    let active = true

    // 初回マウント：既存セッションを復元
    ;(async () => {
      const {
        data: { session: current },
      } = await supabase.auth.getSession()
      if (!active) return
      setSession(current)
      setIsAdmin(await checkAdmin(current))
      setLoading(false)
    })()

    // ログイン／ログアウトの変化を購読
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, current) => {
      if (!active) return
      setSession(current)
      setIsAdmin(await checkAdmin(current))
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [checkAdmin])

  // メール・パスワードでログイン
  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase が未接続です（.env を設定してください）')
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  // ログアウト
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
