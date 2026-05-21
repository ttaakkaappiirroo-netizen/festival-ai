import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

// 管理画面のガード。
//   - 確認中        → ローディング表示
//   - 未ログイン    → /login へリダイレクト
//   - 管理者でない  → 権限なしメッセージ＋ログアウト
//   - 管理者        → 子要素を表示
function RequireAdmin({ children }) {
  const { session, isAdmin, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <p className="auth-loading">読み込み中…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <header className="page-head">
          <h1 className="page-title">アクセス権限がありません</h1>
          <p className="page-sub">
            このアカウントには管理者権限が付与されていません。
          </p>
        </header>
        <div className="conn-status conn-off">
          🔴 管理者アカウントでログインし直してください。
        </div>
        <button className="logout-btn" onClick={signOut}>
          ログアウト
        </button>
      </div>
    )
  }

  return children
}

export default RequireAdmin
