import { Link } from 'react-router-dom'

const cards = [
  {
    icon: '🍩',
    title: '出店一覧',
    desc: 'クラス・部活の模擬店をまるごとチェック。グルメから雑貨まで。',
    tag: 'SHOPS',
    to: '/shops',
  },
  {
    icon: '🗺️',
    title: '校内マップ',
    desc: '会場の現在地と出店位置をひと目で。迷わず目的地へ。',
    tag: 'MAP',
    to: '/map',
  },
  {
    icon: '⏱️',
    title: 'タイムテーブル',
    desc: 'ステージ発表やライブの開演時間を時系列でナビゲート。',
    tag: 'SCHEDULE',
    to: '/timetable',
  },
]

function Home() {
  return (
    <div className="app">
      <div className="grid-bg" aria-hidden="true" />

      <header className="hero">
        <span className="badge">CULTURE FESTIVAL</span>
        <h1 className="title">
          文化祭<span className="title-year">2026</span>
        </h1>
        <p className="subtitle">
          未来へ繋がる、二日間。
          <br />
          光と音が交差するキャンパスへようこそ。
        </p>
        <div className="meta">
          <span>2026.05.30 — 05.31</span>
          <span className="dot" />
          <span>OPEN 09:00</span>
        </div>
      </header>

      <main className="cards">
        {cards.map((c) => (
          <Link className="card" key={c.title} to={c.to}>
            <span className="card-tag">{c.tag}</span>
            <div className="card-icon">{c.icon}</div>
            <h2 className="card-title">{c.title}</h2>
            <p className="card-desc">{c.desc}</p>
            <span className="card-link">VIEW &rarr;</span>
          </Link>
        ))}
      </main>

      <footer className="footer">
        <p>© 2026 文化祭実行委員会 — Festival AI</p>
      </footer>
    </div>
  )
}

export default Home
