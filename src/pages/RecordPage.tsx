import { useState, useEffect, useRef, useCallback } from 'react'
import type { RecordingState, TranscriptSegment } from '../shared/types'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const SPEAKER_COLORS: Record<string, string> = {
  '说话人 1': '#1d4ed8',
  '说话人 2': '#166534',
  '说话人 3': '#854d0e',
}

export default function RecordPage() {
  const [recState, setRecState] = useState<'idle' | 'recording' | 'error'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [speakerCount, setSpeakerCount] = useState(0)
  const [segmentCount, setSegmentCount] = useState(0)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  // 滚动到底部
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [segments])

  // 监听 IPC 事件
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    api.onRecordingStateChange((state) => {
      setRecState(state.state as 'idle' | 'recording' | 'error')
      setElapsed(state.elapsed)
      setSpeakerCount(state.speakerCount)
      setSegmentCount(state.segmentCount)
      if (state.errorMsg) setErrorMsg(state.errorMsg)
    })

    api.onTranscriptSegment((seg) => {
      setSegments((prev) => [...prev, seg])
    })

    return () => api.removeAllListeners()
  }, [])

  const startRecording = useCallback(() => {
    setSegments([])
    setElapsed(0)
    setSpeakerCount(0)
    setSegmentCount(0)
    setErrorMsg('')
    window.electronAPI?.startRecording()
  }, [])

  const stopRecording = useCallback(() => {
    window.electronAPI?.stopRecording()
  }, [])

  // --- 空闲状态 ---
  if (recState === 'idle') {
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

  // --- 异常状态 ---
  if (recState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">⚠️</div>
        <div className="text-center">
          <div className="font-semibold text-error text-sm mb-1">音频捕获中断</div>
          <div className="text-xs text-text-muted">上次正常：{formatTime(elapsed)} · 已自动保存</div>
        </div>
        <button
          onClick={startRecording}
          className="w-full max-w-xs bg-primary text-white rounded py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          🔄 重新检测设备
        </button>
        <button className="w-full max-w-xs bg-white text-text-secondary border border-gray-200 rounded py-2.5 text-sm hover:bg-gray-50 transition-colors">
          🎵 切换设备
        </button>
      </div>
    )
  }

  // --- 录制中状态 ---
  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* 顶部状态栏 */}
      <div className="flex items-center gap-3 bg-primary-light rounded-lg px-4 py-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-dot" />
        <span className="text-primary font-semibold text-sm">正在录制</span>
        <div className="text-xs text-text-muted ml-2">
          🗣 {speakerCount} 人 · {segmentCount} 段落
        </div>
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
          const color = SPEAKER_COLORS[seg.speakerName] || '#666'
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