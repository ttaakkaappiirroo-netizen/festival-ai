import { useFestival } from '../context/festivalContext'

// Supabase 接続時は非表示。デモモード（未接続・取得失敗）時のみ表示。
function DemoBanner() {
  const { isDemo } = useFestival()
  if (!isDemo) return null

  return (
    <div className="demo-banner">
      <span className="demo-icon" aria-hidden="true">
        ⚠
      </span>
      デモ表示中：サーバーに接続できないため、サンプルデータを表示しています。
    </div>
  )
}

export default DemoBanner
