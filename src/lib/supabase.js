import { createClient } from '@supabase/supabase-js'

// .env の値（未設定ならデモモードでサンプルデータを表示）
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// URL とキーが両方そろっていれば接続有効
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
