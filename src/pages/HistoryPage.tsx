import { useNavigate } from 'react-router-dom'

const DEMO_MEETINGS = [
  { id: '1', title: '项目进度同步会', date: '2026-04-18', time: '14:00', duration: '45分钟', speakers: 3 },
  { id: '2', title: '技术方案评审', date: '2026-04-15', time: '10:30', duration: '30分钟', speakers: 4 },
  { id: '3', title: '头脑风暴讨论', date: '2026-04-10', time: '15:00', duration: '60分钟', speakers: 5 },
]

export default function HistoryPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">📂 历史会议</h1>
        <span className="text-xs text-text-muted">{DEMO_MEETINGS.length} 条记录</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {DEMO_MEETINGS.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/notes/${m.id}`)}
            className="border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="font-medium text-sm text-text-primary">{m.title}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              <span>{m.date} {m.time}</span>
              <span>·</span>
              <span>{m.duration}</span>
              <span>·</span>
              <span>🗣 {m.speakers} 人</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
