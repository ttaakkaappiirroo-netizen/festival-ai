import { supabase, isSupabaseConfigured } from './supabase'
import { shops as sampleShops, notices as sampleNotices } from '../data'

// timestamptz を「M/D HH:mm」表記へ
function formatTime(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// --- 読み取り -------------------------------------------------------------

// 出店一覧を取得（未接続・失敗時はサンプルデータにフォールバック）
export async function fetchShops() {
  if (!isSupabaseConfigured) return { data: sampleShops, demo: true }
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('sort', { ascending: true })
    if (error || !data || data.length === 0) {
      return { data: sampleShops, demo: true }
    }
    return { data, demo: false }
  } catch {
    return { data: sampleShops, demo: true }
  }
}

// お知らせを取得（新しい順）
export async function fetchNotices() {
  if (!isSupabaseConfigured) return { data: sampleNotices, demo: true }
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return { data: sampleNotices, demo: true }
    const mapped = data.map((n) => ({
      id: n.id,
      level: n.level,
      time: formatTime(n.created_at),
      title: n.title,
      body: n.body,
    }))
    return { data: mapped, demo: false }
  } catch {
    return { data: sampleNotices, demo: true }
  }
}

// --- 書き込み -------------------------------------------------------------

// 出店の混雑ステータスを更新
export async function updateShopStatus(id, status) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase が未接続です（.env を設定してください）')
  }
  const { error } = await supabase.from('shops').update({ status }).eq('id', id)
  if (error) throw error
}

// お知らせを新規投稿
export async function addNotice({ level, title, body }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase が未接続です（.env を設定してください）')
  }
  const { error } = await supabase
    .from('notices')
    .insert({ level, title, body })
  if (error) throw error
}
