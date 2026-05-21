import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { isSupabaseConfigured } from '../lib/supabase'

function Login() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // すでにログイン済みなら管理画面へ
  if (!loading && session) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">管理者ログイン</h1>
        <p className="page-sub">登録済みのメールアドレスでログインしてください</p>
      </header>

      {!isSupabaseConfigured && (
        <div className="conn-status conn-off">
          🔴 Supabase 未接続 — <code>.env</code> を設定するとログインできます。
        </div>
      )}

      <form className="admin-form" onSubmit={onSubmit}>
        <label className="admin-field">
          <span className="admin-label">メールアドレス</span>
          <input
            className="admin-input"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="admin@example.com"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">パスワード</span>
          <input
            className="admin-input"
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <div className="auth-error">⚠ {error}</div>}

        <button
          type="submit"
          className="admin-submit"
          disabled={busy || !isSupabaseConfigured || !email || !password}
        >
          {busy ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}

// Supabase のエラーメッセージを日本語へ
function translateError(message) {
  if (/invalid login credentials/i.test(message)) {
    return 'メールアドレスまたはパスワードが正しくありません。'
  }
  if (/email not confirmed/i.test(message)) {
    return 'メールアドレスが未確認です。確認メールのリンクを開いてください。'
  }
  return message || 'ログインに失敗しました。'
}

export default Login
