import PageLayout from './PageLayout'

const zones = [
  { id: 'A', label: '本館', sub: 'A-01〜A-09', area: 'a' },
  { id: 'B', label: '中庭', sub: 'B-01〜B-09', area: 'b' },
  { id: 'C', label: '体育館', sub: 'C-01〜C-09', area: 'c' },
  { id: 'S', label: 'ステージ', sub: 'メイン会場', area: 's' },
  { id: 'G', label: '正門', sub: '受付・案内所', area: 'g' },
]

function Map() {
  return (
    <PageLayout
      tag="MAP"
      title="校内マップ"
      lead="エリアごとに出店番号を配置。タップで位置を確認できます。"
    >
      <div className="map-board">
        {zones.map((z) => (
          <div className={`map-zone zone-${z.area}`} key={z.id}>
            <span className="zone-id">{z.id}</span>
            <span className="zone-label">{z.label}</span>
            <span className="zone-sub">{z.sub}</span>
          </div>
        ))}
      </div>

      <ul className="map-legend">
        <li>
          <span className="dot" /> 出店エリア
        </li>
        <li>
          <span className="dot dot-cyan" /> ステージ / 受付
        </li>
      </ul>
    </PageLayout>
  )
}

export default Map
