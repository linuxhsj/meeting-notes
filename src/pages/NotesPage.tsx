import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TranscriptSegment } from '../shared/types'

const DEMO_SEGMENTS: TranscriptSegment[] = [
  { id: '1', speakerId: 'sp-1', speakerName: '张三', text: '好的，今天我们来同步一下 Q3 的项目进度。根据上次评审的结果，我整理了三项核心任务。', timestamp: 0, timestampFormatted: '00:00' },
  { id: '2', speakerId: 'sp-2', speakerName: '李四', text: '我这边后端 API 框架已经搭好了，预计两周内完成用户模块和权限模块的开发。', timestamp: 83, timestampFormatted: '00:01:23' },
  { id: '3', speakerId: 'sp-1', speakerName: '张三', text: '很好。那前端这边，排期是什么？', timestamp: 165, timestampFormatted: '00:02:45' },
  { id: '4', speakerId: 'sp-3', speakerName: '王五', text: 'UI 框架刚搭好，大概需要两周完成页面开发。测试这边可以同步准备用例了。', timestamp: 190, timestampFormatted: '00:03:10' },
]

const SPEAKER_COLORS: Record<string, string> = {
  '张三': '#1d4ed8',
  '李四': '#166534',
  '王五': '#854d0e',
}

export default function NotesPage() {
  const navigate = useNavigate()
  const [segments] = useState(DEMO_SEGMENTS)
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null)
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({
    'sp-1': '张三',
    'sp-2': '李四',
    'sp-3': '王五',
  })
  const [summary] = useState('本次会议明确了 Q3 目标：① 完成 MVP 核心功能开发；② 建立 CI/CD 流水线；③ 交付测试报告。负责人分配：后端 @张三，前端 @李四，测试 @王五。下一阶段评审定于 5 月 10 日。')
  const [copied, setCopied] = useState(false)

  const updateSpeakerName = (id: string, name: string) => {
    setSpeakerNames((prev) => ({ ...prev, [id]: name }))
    setEditingSpeakerId(null)
  }

  const copyAll = () => {
    const text = segments
      .map((s) => `**${speakerNames[s.speakerId] || s.speakerName}** [${s.timestampFormatted}]: ${s.text}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const speakers = Object.entries(speakerNames)

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between bg-primary-light rounded-lg px-4 py-3">
        <div>
          <div className="font-semibold text-sm text-text-primary">项目进度同步会</div>
          <div className="text-xs text-text-muted mt-0.5">🗣 3 个说话人 · 45 分钟 · 2026-04-18 14:00</div>
        </div>
        <button onClick={() => navigate('/')} className="text-text-muted hover:text-text-primary text-lg">←</button>
      </div>

      {/* AI 摘要 */}
      <div className="bg-blue-50 border-l-4 border-primary rounded-lg px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs">📌</span>
          <span className="text-xs font-semibold text-primary">AI 摘要</span>
        </div>
        <div className="text-sm leading-relaxed text-text-primary">{summary}</div>
      </div>

      {/* 说话人标签 */}
      <div className="flex flex-wrap gap-2">
        {speakers.map(([id, name]) => {
          const color = SPEAKER_COLORS[name] || '#666'
          if (editingSpeakerId === id) {
            return (
              <input
                key={id}
                autoFocus
                className="rounded-full px-3 py-1 text-xs border-2 outline-none"
                style={{ borderColor: color, color }}
                defaultValue={name}
                onBlur={(e) => updateSpeakerName(id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateSpeakerName(id, (e.target as HTMLInputElement).value)
                }}
              />
            )
          }
          return (
            <div
              key={id}
              className="rounded-full px-3 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color + '20', color }}
              onClick={() => setEditingSpeakerId(id)}
              title="点击修改姓名"
            >
              {name}
            </div>
          )
        })}
        <div className="text-xs text-text-muted self-center cursor-pointer">+ 合并段落</div>
      </div>

      {/* 转写内容 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {segments.map((seg) => {
          const color = SPEAKER_COLORS[speakerNames[seg.speakerId]] || '#666'
          return (
            <div key={seg.id}>
              <div className="text-xs font-semibold mb-1" style={{ color }}>
                {speakerNames[seg.speakerId] || seg.speakerName} — {seg.timestampFormatted}
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
        <button className="flex-1 bg-white text-primary border border-primary rounded-lg py-2.5 text-sm hover:bg-primary-light transition-colors">
          💬 重新生成摘要
        </button>
        <button className="flex-1 bg-white text-text-secondary border border-gray-200 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
          ✏️ 编辑纪要
        </button>
      </div>
    </div>
  )
}
