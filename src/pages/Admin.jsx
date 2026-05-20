import { useState } from 'react'
import { STATUS } from '../data'
import { useFestival } from '../context/festivalContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { updateShopStatus, addNotice } from '../lib/api'

const statusKeys = Object.keys(STATUS)

function Admin() {
  const { shops, notices, refresh } = useFestival()
  const [busyId, setBusyId] = useState(null)
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ level: 'info', title: '', body: '' })

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const onStatusChange = async (id, status) => {
    setBusyId(id)
    try {
      await updateShopStatus(id, status)
      await refresh()
      flash('混雑ステータスを更新しました')
    } catch (e) {
      alert(`更新に失敗しました：${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setPosting(true)
    try {
      await addNotice(form)
      setForm({ level: 'info', title: '', body: '' })
      await refresh()
      flash('お知らせを投稿しました')
    } catch (err) {
      alert(`投稿に失敗しました：${err.message}`)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">管理</h1>
        <p className="page-sub">出店ステータスとお知らせを編集</p>
      </header>

      <div className={`conn-status ${isSupabaseConfigured ? 'conn-ok' : 'conn-off'}`}>
        {isSupabaseConfigured ? (
          <>🟢 Supabase 接続中 — 編集内容はデータベースに保存されます。</>
        ) : (
          <>
            🔴 Supabase 未接続 — <code>.env</code> を設定すると編集が有効になります。
            現在は閲覧のみ可能です。
          </>
        )}
      </div>

      {message && <div className="admin-flash">✅ {message}</div>}

      <section className="section">
        <h2 className="section-title">🏪 出店の混雑ステータス</h2>
        <div className="stack">
          {shops.map((s) => (
            <div className="admin-row" key={s.id}>
              <div className="admin-row-info">
                <span className="admin-row-name">{s.name}</span>
                <span className="admin-row-sub">
                  {s.floor}・{s.room}／{s.org}
                </span>
              </div>
              <select
                className="admin-select"
                value={s.status}
                disabled={!isSupabaseConfigured || busyId === s.id}
                onChange={(e) => onStatusChange(s.id, e.target.value)}
                style={{ color: STATUS[s.status]?.color }}
              >
                {statusKeys.map((k) => (
                  <option key={k} value={k}>
                    {STATUS[k].label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">📢 お知らせを投稿</h2>
        <form className="admin-form" onSubmit={onSubmit}>
          <label className="admin-field">
            <span className="admin-label">区分</span>
            <select
              className="admin-select"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="info">お知らせ</option>
              <option value="important">重要</option>
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">タイトル</span>
            <input
              className="admin-input"
              type="text"
              value={form.title}
              maxLength={60}
              placeholder="例：軽音ライブ開演のお知らせ"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">本文</span>
            <textarea
              className="admin-textarea"
              rows={3}
              value={form.body}
              maxLength={300}
              placeholder="お知らせの内容を入力"
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>

          <button
            type="submit"
            className="admin-submit"
            disabled={
              !isSupabaseConfigured ||
              posting ||
              !form.title.trim() ||
              !form.body.trim()
            }
          >
            {posting ? '投稿中…' : 'お知らせを投稿'}
          </button>
        </form>

        <p className="admin-hint">現在の登録件数：{notices.length} 件</p>
      </section>
    </div>
  )
}

export default Admin
