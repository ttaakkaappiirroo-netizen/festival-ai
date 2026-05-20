import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">✦</span>
          <span className="brand-name">
            育英祭<b>OS</b>
          </span>
        </Link>
        <Link to="/admin" className="admin-btn">
          ⚙ 管理
        </Link>
      </div>
    </header>
  )
}

export default Header
