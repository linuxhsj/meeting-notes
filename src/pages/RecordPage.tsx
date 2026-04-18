import { useState, useEffect, useRef } from 'react'
import type { RecordingState, TranscriptSegment } from '../shared/types'

// 格式化时间
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 模拟转写数据
const MOCK_TRANSCRIPTS = [
  { speaker: '说话人 1', text: '好的，那我们开始今天的进度同步。', color: '#1d4ed8' },
  { speaker: '说话人 2', text: '我这边后端 API 已经完成了 80%，预计下周可以提测。', color: '#166534' },
  { speaker: '说话人 1', text: '很好，那前端这边李四的排期是什么？', color: '#1d4ed8' },
  { speaker: '说话人 3', text: '前端 UI 框架刚搭好，大概需要两周完成页面开发。', color: '#854d0e' },
  { speaker: '说话人 2', text: '测试这边可以同步准备用例了，争取下周开始跑自动化测试。', color: '#166534' },
]

// Electron API 类型
declare global {
  interface Window {
    electronAPI?: {
      startRecording: () => void
      stopRecording: () => void
      onTranscriptText: (callback: (text: string) => void) => void
      onRecordingState: (callback: (state: string) => void) => void
    }
  }
}

export default function RecordPage() {
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [speakerIdx, setSpeakerIdx] = useState(0)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 滚动到底部
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [segments])

  // 计时器
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state])

  const startRecording = () => {
    setState('recording')
    setElapsed(0)
    setSegments([])
    setSpeakerIdx(0)
    window.electronAPI?.startRecording()

    // 模拟转写：每 3-5 秒推一句
    let idx = 0
    mockRef.current = setInterval(() => {
      if (idx >= MOCK_TRANSCRIPTS.length) {
        clearInterval(mockRef.current!)
        return
      }
      const item = MOCK_TRANSCRIPTS[idx]
      const seg: TranscriptSegment = {
        id: `seg-${Date.now()}`,
        speakerId: `sp-${speakerIdx}`,
        speakerName: item.speaker,
        text: item.text,
        timestamp: elapsed,
        timestampFormatted: formatTime(elapsed),
      }
      setSegments((prev) => [...prev, seg])
      setSpeakerIdx((i) => (i + 1) % 3)
      idx++
    }, 3500)
  }

  const stopRecording = () => {
    setState('idle')
    if (timerRef.current) clearInterval(timerRef.current)
    if (mockRef.current) clearInterval(mockRef.current)
    window.electronAPI?.stopRecording()
  }

  // --- 空闲状态 ---
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-6xl opacity-40">🎤</div>
        <div className="text-text-secondary text-sm">未在录制</div>
        <button
          onClick={startRecording}
          className="w-full max-w-xs bg-primary text-white rounded py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          ▶ 开始录制
        </button>
        <button className="w-full max-w-xs bg-white text-text-secondary border border-gray-200 rounded py-2.5 text-sm hover:bg-gray-50 transition-colors">
          🎵 切换设备
        </button>
      </div>
    )
  }

  // --- 录制中状态 ---
  if (state === 'recording') {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        {/* 顶部状态栏 */}
        <div className="flex items-center gap-3 bg-primary-light rounded-lg px-4 py-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-dot" />
          <span className="text-primary font-semibold text-sm">正在录制</span>
          <div className="text-xl font-bold text-text-primary tabular-nums ml-auto">
            {formatTime(elapsed)}
          </div>
        </div>

        {/* 实时预览区 */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3"
        >
          <div className="text-xs text-text-muted mb-3">📡 实时转写</div>
          {segments.length === 0 && (
            <div className="text-sm text-text-muted italic">等待发言…</div>
          )}
          {segments.map((seg) => {
            const colorMap: Record<string, string> = {
              '说话人 1': '#1d4ed8',
              '说话人 2': '#166534',
              '说话人 3': '#854d0e',
            }
            const color = colorMap[seg.speakerName] || '#666'
            return (
              <div key={seg.id} className="animate-fade-in">
                <div className="text-xs font-semibold mb-1" style={{ color }}>
                  {seg.speakerName} · {seg.timestampFormatted}
                </div>
                <div className="bg-white rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm">
                  {seg.text}
                </div>
              </div>
            )
          })}
        </div>

        {/* 自动保存提示 */}
        <div className="bg-warning-bg border border-yellow-200 rounded px-3 py-2 text-xs text-yellow-700">
          💾 每 30 秒自动保存，崩溃可恢复
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={stopRecording}
            className="flex-1 bg-red-500 text-white rounded-lg py-3 text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            ⏹ 停止录制
          </button>
          <button
            onClick={() => window.location.hash = '#notes'}
            className="flex-1 bg-white text-primary border border-primary rounded-lg py-3 text-sm hover:bg-primary-light transition-colors"
          >
            📋 全屏纪要
          </button>
        </div>
      </div>
    )
  }

  return null
}
