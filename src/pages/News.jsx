import { useFestival } from '../context/festivalContext'
import DemoBanner from '../components/DemoBanner'
import NoticeCard from '../components/NoticeCard'

function News() {
  const { notices } = useFestival()
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">お知らせ</h1>
        <p className="page-sub">運営からの最新情報（新しい順）</p>
      </header>

      <DemoBanner />

      <div className="stack">
        {notices.map((n) => (
          <NoticeCard key={n.id} notice={n} />
        ))}
      </div>
    </div>
  )
}

export default News
