import { useMemo, useState } from 'react'
import { CATEGORY } from '../data'
import { useFestival } from '../context/festivalContext'
import DemoBanner from '../components/DemoBanner'
import ShopCard from '../components/ShopCard'

const categories = ['すべて', ...Object.keys(CATEGORY)]

function Shops() {
  const { shops } = useFestival()
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('すべて')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shops.filter((s) => {
      const matchCat = activeCat === 'すべて' || s.category === activeCat
      const matchQuery =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.org.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [shops, query, activeCat])

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">出店一覧</h1>
        <p className="page-sub">全{shops.length}店舗から探せます</p>
      </header>

      <DemoBanner />

      <div className="search-box">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="店名・団体名・教室で検索"
          aria-label="出店を検索"
        />
      </div>

      <div className="chips">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${activeCat === c ? ' chip-active' : ''}`}
            onClick={() => setActiveCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="result-count">{filtered.length} 件の出店</p>

      {filtered.length > 0 ? (
        <div className="stack">
          {filtered.map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      ) : (
        <p className="empty">
          条件に合う出店が見つかりませんでした。
          <br />
          検索キーワードやカテゴリを変えてお試しください。
        </p>
      )}
    </div>
  )
}

export default Shops
