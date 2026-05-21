import { createClient } from '@supabase/supabase-js'

// VITE_SUPABASE_URL を正規化する。
// ダッシュボードから誤って /rest/v1 などパス付きの URL を貼り付けても
// 動くよう、オリジン（https://xxxx.supabase.co）だけを取り出す。
// これで前後の空白・末尾スラッシュ・余分なパスはすべて除去される。
// （パスが残ると /rest/v1/auth/v1/token 等になり
//   「Invalid path specified in request URL」エラーになる）
function normalizeSupabaseUrl(raw) {
  const value = raw?.trim()
  if (!value) return undefined
  try {
    return new URL(value).origin
  } catch {
    return value
  }
}

// .env の値（未設定ならデモモードでサンプルデータを表示）
const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// URL とキーが両方そろっていれば接続有効
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
