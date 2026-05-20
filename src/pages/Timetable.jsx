import PageLayout from './PageLayout'

const schedule = [
  { time: '09:00', name: '開場・受付スタート', place: '正門', live: false },
  { time: '10:00', name: 'オープニングセレモニー', place: 'ステージ', live: true },
  { time: '11:30', name: '軽音部ライブ', place: 'ステージ', live: true },
  { time: '13:00', name: 'ダンス部パフォーマンス', place: 'ステージ', live: true },
  { time: '14:30', name: '有志バンド対決', place: 'ステージ', live: true },
  { time: '16:00', name: '抽選会・フィナーレ', place: 'ステージ', live: true },
  { time: '17:00', name: '閉場', place: '校内全域', live: false },
]

function Timetable() {
  return (
    <PageLayout
      tag="SCHEDULE"
      title="タイムテーブル"
      lead="2026.05.30 のメインステージ進行表です。"
    >
      <ul className="timeline">
        {schedule.map((e) => (
          <li className={`tl-item${e.live ? ' tl-live' : ''}`} key={e.time}>
            <span className="tl-time">{e.time}</span>
            <span className="tl-marker" />
            <div className="tl-content">
              <h2 className="tl-name">{e.name}</h2>
              <p className="tl-place">
                {e.place}
                {e.live && <span className="tl-tag">LIVE</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </PageLayout>
  )
}

export default Timetable
