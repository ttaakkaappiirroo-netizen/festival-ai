import { Link } from 'react-router-dom'

function PageLayout({ tag, title, lead, children }) {
  return (
    <div className="app">
      <div className="grid-bg" aria-hidden="true" />

      <header className="page-head">
        <Link className="back-link" to="/">
          &larr; BACK
        </Link>
        <span className="badge">{tag}</span>
        <h1 className="page-title">{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
      </header>

      <main className="page-body">{children}</main>

      <footer className="footer">
        <p>© 2026 文化祭実行委員会 — Festival AI</p>
      </footer>
    </div>
  )
}

export default PageLayout
