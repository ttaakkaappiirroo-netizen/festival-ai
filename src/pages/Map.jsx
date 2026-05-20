import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { FLOORS, STATUS } from '../data'
import { useFestival } from '../context/festivalContext'
import ShopCard from '../components/ShopCard'

// 3D ビュー（Three.js）は開いたときだけ読み込む
const Map3D = lazy(() => import('../components/Map3D'))

function Map() {
  const { shops } = useFestival()
  const [floor, setFloor] = useState('1F')
  const [view, setView] = useState('card')
  const [selected, setSelected] = useState(null)
  const [resetKey, setResetKey] = useState(0)

  const floorShops = useMemo(
    () => shops.filter((s) => s.floor === floor),
    [shops, floor],
  )

  const handleSelect = useCallback((shop) => setSelected(shop), [])

  const switchFloor = (f) => {
    setFloor(f)
    setSelected(null)
  }

  return (
    <div className="page">
      <header className="page-head map-head">
        <div>
          <h1 className="page-title">混雑マップ</h1>
          <p className="page-sub">フロア別に一目で混雑状況を確認</p>
        </div>
        <div className="view-toggle">
          <button
            type="button"
            className={`view-btn${view === 'card' ? ' view-active' : ''}`}
            onClick={() => setView('card')}
          >
            🗂 カード
          </button>
          <button
            type="button"
            className={`view-btn${view === '3d' ? ' view-active' : ''}`}
            onClick={() => setView('3d')}
          >
            🧊 3D
          </button>
        </div>
      </header>

      <div className="floor-tabs">
        {FLOORS.map((f) => (
          <button
            key={f}
            type="button"
            className={`floor-tab${floor === f ? ' floor-active' : ''}`}
            onClick={() => switchFloor(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="legend">
        {Object.values(STATUS).map((s) => (
          <span key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {view === 'card' ? (
        <div className="room-grid">
          {floorShops.map((s) => {
            const st = STATUS[s.status]
            return (
              <article
                key={s.id}
                className="roomcard"
                style={{ '--st': st.color }}
              >
                <div className="roomcard-head">
                  <span className="roomcard-room">{s.room}</span>
                  <span
                    className="roomcard-dot"
                    style={{ background: st.color }}
                  />
                </div>
                <h3 className="roomcard-name">{s.name}</h3>
                <p className="roomcard-org">{s.org}</p>
                <div className="roomcard-foot">
                  <span
                    className="status-pill"
                    style={{ color: st.color, borderColor: st.color }}
                  >
                    {st.label}
                  </span>
                  <span className="roomcard-wait">⏱ {s.wait}</span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="map3d-wrap">
          <Suspense
            fallback={<div className="map3d-loading">3Dマップを読み込み中…</div>}
          >
            <Map3D
              key={`${floor}-${resetKey}`}
              shops={floorShops}
              onSelect={handleSelect}
            />
          </Suspense>
          <button
            type="button"
            className="reset-btn"
            onClick={() => setResetKey((k) => k + 1)}
          >
            ⟳ 視点リセット
          </button>
          <span className="map3d-hint">ドラッグで回転 / ピンチでズーム</span>
        </div>
      )}

      {view === '3d' && (
        <div className="map3d-detail">
          {selected ? (
            <>
              <p className="detail-label">📍 {selected.room}</p>
              <ShopCard shop={selected} />
            </>
          ) : (
            <p className="detail-empty">
              建物をタップすると出店の詳細が表示されます
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Map
