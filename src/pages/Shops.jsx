import { useMemo, useState } from 'react'
import PageLayout from './PageLayout'

// ダミー出店データ
const shops = [
  { no: 'A-01', name: 'ネオン焼きそば', org: '3年A組', icon: '🍜', cat: 'FOOD' },
  { no: 'A-04', name: 'クレープ・スターダスト', org: '2年B組', icon: '🍓', cat: 'FOOD' },
  { no: 'A-06', name: 'プラズマたこ焼き', org: '1年A組', icon: '🐙', cat: 'FOOD' },
  { no: 'A-09', name: 'ギャラクシーかき氷', org: '2年A組', icon: '🍧', cat: 'FOOD' },
  { no: 'B-02', name: 'サイバータピオカ', org: '2年C組', icon: '🧋', cat: 'DRINK' },
  { no: 'B-05', name: 'オーロラソーダ屋', org: '1年B組', icon: '🥤', cat: 'DRINK' },
  { no: 'B-07', name: 'ホログラム射的', org: '1年D組', icon: '🎯', cat: 'GAME' },
  { no: 'B-09', name: 'VR迷路チャレンジ', org: 'パソコン部', icon: '🕹️', cat: 'GAME' },
  { no: 'C-03', name: 'お化け屋敷 -2099-', org: '3年E組', icon: '👻', cat: 'EVENT' },
  { no: 'C-05', name: 'ステージ生演奏', org: '軽音部', icon: '🎸', cat: 'EVENT' },
  { no: 'C-08', name: 'ガラクタ雑貨店', org: '美術部', icon: '🛍️', cat: 'GOODS' },
  { no: 'C-11', name: '手作りアクセ工房', org: '手芸部', icon: '💍', cat: 'GOODS' },
]

const categories = ['ALL', 'FOOD', 'DRINK', 'GAME', 'EVENT', 'GOODS']

function Shops() {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('ALL')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return shops.filter((s) => {
      const matchCat = activeCat === 'ALL' || s.cat === activeCat
      const matchQuery =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.org.toLowerCase().includes(q) ||
        s.no.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [query, activeCat])

  return (
    <PageLayout
      tag="SHOPS"
      title="出店一覧"
      lead="全12店舗が出店。番号は校内マップと対応しています。"
    >
      <div className="shop-controls">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            className="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="店名・団体名・番号で検索"
            aria-label="出店を検索"
          />
        </div>

        <div className="cat-filter">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`cat-chip${activeCat === c ? ' cat-active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="shop-count">{filtered.length} 件の出店</p>

      {filtered.length > 0 ? (
        <div className="shop-grid">
          {filtered.map((s) => (
            <article className="shop-item" key={s.no}>
              <div className="shop-icon">{s.icon}</div>
              <div className="shop-info">
                <div className="shop-top">
                  <span className="shop-no">{s.no}</span>
                  <span className={`shop-cat cat-${s.cat.toLowerCase()}`}>
                    {s.cat}
                  </span>
                </div>
                <h2 className="shop-name">{s.name}</h2>
                <p className="shop-org">{s.org}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="shop-empty">
          条件に合う出店が見つかりませんでした。
          <br />
          検索キーワードやカテゴリを変えてお試しください。
        </p>
      )}
    </PageLayout>
  )
}

export default Shops
