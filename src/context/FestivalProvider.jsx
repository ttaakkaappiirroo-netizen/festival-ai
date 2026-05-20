import { useCallback, useEffect, useState } from 'react'
import { shops as sampleShops, notices as sampleNotices } from '../data'
import { fetchShops, fetchNotices } from '../lib/api'
import { FestivalContext } from './festivalContext'

// 出店・お知らせデータを供給するプロバイダ。
// 初期値はサンプルデータ。マウント後に Supabase 取得を試みる。
export function FestivalProvider({ children }) {
  const [shops, setShops] = useState(sampleShops)
  const [notices, setNotices] = useState(sampleNotices)
  const [isDemo, setIsDemo] = useState(true)
  const [loading, setLoading] = useState(true)

  const apply = useCallback((s, n) => {
    setShops(s.data)
    setNotices(n.data)
    setIsDemo(s.demo || n.demo)
  }, [])

  // 管理ページからの更新後に再取得するための関数
  const refresh = useCallback(async () => {
    const [s, n] = await Promise.all([fetchShops(), fetchNotices()])
    apply(s, n)
  }, [apply])

  // 初回マウント時にデータ取得（setState は await 後にのみ実行）
  useEffect(() => {
    let active = true
    ;(async () => {
      const [s, n] = await Promise.all([fetchShops(), fetchNotices()])
      if (!active) return
      apply(s, n)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [apply])

  return (
    <FestivalContext.Provider
      value={{ shops, notices, isDemo, loading, refresh }}
    >
      {children}
    </FestivalContext.Provider>
  )
}
