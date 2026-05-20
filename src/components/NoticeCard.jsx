function NoticeCard({ notice }) {
  const important = notice.level === 'important'

  return (
    <article className={`notice${important ? ' notice-important' : ''}`}>
      <div className="notice-head">
        <span className="notice-badge">
          {important ? '⚠ 重要' : '📢 お知らせ'}
        </span>
        <span className="notice-time">{notice.time}</span>
      </div>
      <h3 className="notice-title">{notice.title}</h3>
      <p className="notice-body">{notice.body}</p>
    </article>
  )
}

export default NoticeCard
