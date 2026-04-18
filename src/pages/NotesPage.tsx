import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface Segment {
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: number
  formatted: string
}

const SPEAKER_COLORS: Record<string, string> = {
  '说话人 1': '#1d4ed8',
  '说话人 2': '#166534',
  '说话人 3': '#854d0e',
}

export default function NotesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('会议纪要')
  const [segments, setSegments] = useState<Segment[]>([])
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({})
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!id) return
    window.electronAPI?.getMeeting(id).then((data) => {
      if (!data) return
      setTitle(data.title)
      setSummary(data.summary || '')
      setStartTime(data.startTime)
      setDuration(data.duration)
      const segs = (data.segments || []) as Segment[]
      setSegments(segs)
      // 初始化说话人名
      const names: Record<string, string> = {}
      segs.forEach((s) => {
        if (!names[s.speakerId]) names[s.speakerId] = s.speakerName
      })
      setSpeakerNames(names)
    })
  }, [id])

  const updateName = (sid: string, name: string) => {
    setSpeakerNames((p) => ({ ...p, [sid]: name }))
    setEditingSpeakerId(null)
  }

  const generateSummary = async () => {
    if (!id) return
    setSummaryLoading(true)
    try {
      const s = await window.electronAPI?.summarizeMeeting(id)
      setSummary(s || '')
    } finally {
      setSummaryLoading(false)
    }
  }

  const copyAll = () => {
    const text = segments
      .map((s) => `**${speakerNames[s.speakerId] || s.speakerName}** [${s.formatted}]: ${s.text}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const uniqueSpeakers = Array.from(new Set(segments.map((s) => s.speakerId)))

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between bg-primary-light rounded-lg px-4 py-3">
        <div>
          <div className="font-semibold text-sm text-text-primary">{title}</div>
          <div className="text-xs text-text-muted mt-0.5">
            🗣 {uniqueSpeakers.length} 个说话人 · {Math.floor(duration / 60)} 分钟
          </div>
        </div>
        <button onClick={() => navigate('/history')} className="text-text-muted hover:text-text-primary text-lg">←</button>
      </div>

      {/* AI 摘要 */}
      <div className="bg-blue-50 border-l-4 border-primary rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">📌</span>
            <span className="text-xs font-semibold text-primary">AI 摘要</span>
            {summaryLoading && <span className="text-xs text-text-muted animate-pulse"> 生成中…</span>}
          </div>
          {!summary && !summaryLoading && (
            <button onClick={generateSummary} className="text-xs text-primary hover:underline">
              生成摘要
            </button>
          )}
        </div>
        <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
          {summary || '点击上方"生成摘要"获取 AI 摘要'}
        </div>
      </div>

      {/* 说话人标签 */}
      <div className="flex flex-wrap gap-2">
        {uniqueSpeakers.map((sid) => {
          const name = speakerNames[sid] || '未知'
          const color = SPEAKER_COLORS[name] || '#666'
          if (editingSpeakerId === sid) {
            return (
              <input
                key={sid}
                autoFocus
                className="rounded-full px-3 py-1 text-xs border-2 outline-none"
                style={{ borderColor: color, color }}
                defaultValue={name}
                onBlur={(e) => updateName(sid, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateName(sid, (e.target as HTMLInputElement).value)
                }}
              />
            )
          }
          return (
            <div
              key={sid}
              className="rounded-full px-3 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color + '20', color }}
              onClick={() => setEditingSpeakerId(sid)}
              title="点击修改姓名"
            >
              {name}
            </div>
          )
        })}
      </div>

      {/* 转写内容 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {segments.length === 0 && (
          <div className="text-sm text-text-muted text-center py-8">暂无转写内容</div>
        )}
        {segments.map((seg) => {
          const name = speakerNames[seg.speakerId] || seg.speakerName
          const color = SPEAKER_COLORS[name] || '#666'
          return (
            <div key={seg.id}>
              <div className="text-xs font-semibold mb-1" style={{ color }}>
                {name} — {seg.formatted}
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm leading-relaxed">
                {seg.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部操作 */}
      <div className="flex gap-3">
        <button
          onClick={copyAll}
          className="flex-1 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          📋 {copied ? '已复制！' : '复制全文'}
        </button>
        <button
          onClick={generateSummary}
          disabled={summaryLoading}
          className="flex-1 bg-white text-primary border border-primary rounded-lg py-2.5 text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          💬 {summaryLoading ? '生成中…' : '重新生成摘要'}
        </button>
        <button className="flex-1 bg-white text-text-secondary border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
          ✏️ 编辑纪要
        </button>
      </div>
    </div>
  )
}
