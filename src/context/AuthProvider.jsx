import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './authContext'

// profiles テーブルを参照し、ログインユーザーが管理者かどうかを確認
async function fetchIsAdmin(currentSession) {
  if (!currentSession?.user) return false
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentSession.user.id)
      .maybeSingle()
    if (error) throw error
    return data?.role === 'admin'
  } catch (err) {
    console.error('管理者権限の確認に失敗しました:', err.message ?? err)
    return false
  }
}

// Supabase Auth のセッションと、profiles テーブルの role=admin 判定を供給するプロバイダ。
// マウント時に既存セッションを復元し、以後はログイン状態の変化を購読する。
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // 未接続ならセッション取得が走らないため、最初から loading は false
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    // Supabase 未接続時はログイン不可（セッション取得・購読をスキップ）
    if (!isSupabaseConfigured) return

    let active = true

    // 初回マウント：既存セッションを復元し、管理者判定まで終えてから loading 解除。
    // try/finally で、途中で失敗しても必ず loading を解除する（無限ローディング防止）。
    ;(async () => {
      try {
        const {
          data: { session: current },
        } = await supabase.auth.getSession()
        if (!active) return
        setSession(current)
        setIsAdmin(await fetchIsAdmin(current))
      } catch (err) {
        console.error('認証の初期化に失敗しました:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()

    // ログイン／ログアウトの変化を購読。
    // ※ onAuthStateChange のコールバック内で supabase の関数を await すると
    //   内部ロックと競合してデッドロックする（公式が警告する既知の罠）。
    //   そのため session の更新だけ即座に行い、管理者判定は setTimeout で
    //   コールバックの外（ロック解放後）に逃がして実行する。
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      if (!active) return
      setSession(current)
      setTimeout(async () => {
        const admin = await fetchIsAdmin(current)
        if (active) setIsAdmin(admin)
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

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
