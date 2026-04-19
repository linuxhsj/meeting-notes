import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangContext, t } from '../i18n'

interface MeetingItem {
  id: string
  title: string
  startTime: number
  duration: number
  status: string
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { recording: '● Recording', processing: '◐ Processing', done: '✓ Done', error: '✕ Error' },
  zh: { recording: '● 录制中', processing: '◐ 处理中', done: '✓ 已完成', error: '✕ 出错' },
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { lang } = useContext(LangContext)
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (window.electronAPI?.getMeetings) {
      window.electronAPI.getMeetings().then((data) => {
        setMeetings(data || [])
        setLoading(false)
      })
    } else {
      setMeetings([])
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">{t(lang, 'hist.title')}</h1>
        <span className="text-xs text-text-muted">{meetings.length} {t(lang, 'hist.count')}</span>
      </div>

      {meetings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-4xl opacity-30">📂</div>
          <div className="text-sm text-text-muted">{t(lang, 'hist.empty')}</div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary hover:underline"
          >
            {t(lang, 'hist.goRecord')}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {meetings.map((m) => {
            const mins = Math.floor(m.duration / 60)
            const statusLabel = STATUS_LABELS[lang]?.[m.status] || m.status
            return (
              <div
                key={m.id}
                onClick={() => navigate(`/notes/${m.id}`)}
                className="border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-text-primary">{m.title}</div>
                  <div className="text-xs text-text-muted">{statusLabel}</div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>{formatDate(m.startTime)} {formatTime(m.startTime)}</span>
                  {m.duration > 0 && <span>{mins}min</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
