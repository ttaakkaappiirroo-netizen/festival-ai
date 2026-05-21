import { createClient } from '@supabase/supabase-js'

// .env の値（未設定ならデモモードでサンプルデータを表示）
// 前後の空白は除去する。値の末尾などに空白が混入すると URL が壊れ、
// 「Invalid path specified in request URL」エラーになるため。
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// URL とキーが両方そろっていれば接続有効
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
