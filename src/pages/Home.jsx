import { Link } from 'react-router-dom'
import { festival } from '../data'
import { useFestival } from '../context/festivalContext'
import DemoBanner from '../components/DemoBanner'
import ShopCard from '../components/ShopCard'
import NoticeCard from '../components/NoticeCard'

const quickActions = [
  { to: '/shops', icon: '🏪', label: '出店一覧' },
  { to: '/map', icon: '🗺️', label: '混雑マップ' },
  { to: '/news', icon: '📢', label: 'お知らせ' },
]

function Home() {
  const { shops, notices } = useFestival()
  const importantNotices = notices.filter((n) => n.level === 'important')
  const freeShops = shops.filter((s) => s.status === 'free').slice(0, 3)

  return (
    <div className="page">
      <section className="hero">
        <span className="hero-badge">
          ✦ {festival.name} {festival.year}
        </span>
        <h1 className="hero-title">
          育英祭<span className="hero-os">OS</span>
        </h1>
        <p className="hero-sub">文化祭を、スマホひとつで快適に。</p>
        <span className="hero-time">📅 本日 {festival.hours}</span>
      </section>

      <DemoBanner />

      <div className="quick-actions">
        {quickActions.map((q) => (
          <Link key={q.to} to={q.to} className="quick-card">
            <span className="quick-icon">{q.icon}</span>
            <span className="quick-label">{q.label}</span>
          </Link>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">🚨 重要なお知らせ</h2>
        <div className="stack">
          {importantNotices.map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">✨ いま空いてる出店</h2>
          <Link to="/shops" className="section-more">
            すべて見る →
          </Link>
        </div>
        <div className="stack">
          {freeShops.map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
