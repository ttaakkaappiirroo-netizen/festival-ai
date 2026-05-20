import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', icon: '🏠', label: 'ホーム' },
  { to: '/shops', icon: '🏪', label: '出店' },
  { to: '/map', icon: '🗺️', label: 'マップ' },
  { to: '/news', icon: '📢', label: 'お知らせ' },
]

function BottomNav() {
  return (
    <nav className="bottomnav">
      <div className="bottomnav-inner">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `navitem${isActive ? ' navitem-active' : ''}`
            }
          >
            <span className="navitem-icon">{it.icon}</span>
            <span className="navitem-label">{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
