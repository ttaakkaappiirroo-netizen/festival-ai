import { STATUS, CATEGORY, normalizeCategory } from '../data'

function ShopCard({ shop }) {
  const st = STATUS[shop.status]
  const category = normalizeCategory(shop.category)
  const catColor = CATEGORY[category]

  return (
    <article className="shopcard" style={{ '--st': st.color }}>
      <div className="shopcard-body">
        <div className="shopcard-tags">
          <span
            className="cat-badge"
            style={{ color: catColor, borderColor: catColor }}
          >
            {category}
          </span>
          <span className="shopcard-org">{shop.org}</span>
        </div>
        <h3 className="shopcard-name">{shop.name}</h3>
        <p className="shopcard-meta">
          📍 {shop.floor}・{shop.room}
          {'　'}
          <span className="price">{shop.price}</span>
        </p>
        <p className="shopcard-comment">💬 {shop.comment}</p>
      </div>
      <span
        className="status-badge"
        style={{ color: st.color, borderColor: st.color }}
      >
        <span className="status-dot" style={{ background: st.color }} />
        {st.label}
      </span>
    </article>
  )
}

export default ShopCard
