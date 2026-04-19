import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { QwenASR, type ASRSegment } from '../asr'

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
  const navigate = useNavigate()
  const [recState, setRecState] = useState<'idle' | 'recording' | 'error'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [speakerCount, setSpeakerCount] = useState(0)
  const [segmentCount, setSegmentCount] = useState(0)
  const [segments, setSegments] = useState<ASRSegment[]>([])
  const [speakerIds, setSpeakerIds] = useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = useState('')
  const [asrMsg, setAsrMsg] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const asrRef = useRef<QwenASR | null>(null)

  // 滚动到底部
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [segments])

  const startRecording = useCallback(async () => {
    setSegments([])
    setSpeakerIds(new Set())
    setElapsed(0)
    setSpeakerCount(0)
    setSegmentCount(0)
    setErrorMsg('')

    // 获取 API Key
    let apiKey = ''
    if (window.electronAPI?.getAsrApiKey) {
      apiKey = (await window.electronAPI.getAsrApiKey()) || ''
    }
    if (!apiKey) {
      // 尝试从 localStorage 读取（开发模式）
      apiKey = localStorage.getItem('asrApiKey') || ''
    }
    if (!apiKey) {
      setRecState('error')
      setAsrMsg('⚠ 请先配置阿里云 API Key')
      return
    }

    setRecState('recording')

    // 启动 QwenASR
    asrRef.current = new QwenASR()
    asrRef.current.start(
      apiKey,
      (seg) => {
        setSegments((prev) => [...prev, seg])
        setSegmentCount((n) => n + 1)
        // 更新说话人数量（去重）
        setSpeakerIds((prev) => {
          const newSet = new Set(prev)
          newSet.add(seg.speakerId)
          setSpeakerCount(newSet.size)
          return newSet
        })
      },
      (state, msg) => {
        if (state === 'listening') setAsrMsg('● 实时识别中')
        else if (state === 'not-available') setAsrMsg('⚠ ' + (msg || 'ASR 不可用'))
        else if (state === 'error') {
          setAsrMsg('⚠ ' + (msg || 'ASR 错误'))
          setRecState('error')
        }
        else setAsrMsg(msg || '')
      }
    )

    // 计时器
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    asrRef.current?.stop()
    asrRef.current = null
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecState('idle')
    setAsrMsg('')
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      asrRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // --- 空闲状态 ---
  if (recState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-6xl opacity-40">🎤</div>
        <div className="text-text-secondary text-sm">未在录制</div>
        <div className="text-xs text-text-muted mb-2">ASR 模式：阿里云 QwenASR（实时转写 + 说话人分离）</div>
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
    const isApiKeyMissing = asrMsg.includes('API Key')
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">⚠️</div>
        <div className="text-center">
          <div className="font-semibold text-error text-sm mb-1">
            {isApiKeyMissing ? '请配置 API Key' : '音频捕获中断'}
          </div>
          <div className="text-xs text-text-muted">
            {isApiKeyMissing
              ? '需要阿里云 DashScope API Key 才能使用真实 ASR'
              : `上次正常：${formatTime(elapsed)} · 已自动保存`}
          </div>
        </div>
        {isApiKeyMissing ? (
          <button
            onClick={() => {
              const key = prompt('请输入阿里云 DashScope API Key:')
              if (key) {
                localStorage.setItem('asrApiKey', key)
                setAsrMsg('')
                setRecState('idle')
              }
            }}
            className="w-full max-w-xs bg-primary text-white rounded py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            🔑 配置 API Key
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-full max-w-xs bg-primary text-white rounded py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            🔄 重新检测设备
          </button>
        )}
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
        {asrMsg && (
          <span className="text-xs text-text-muted ml-1">{asrMsg}</span>
        )}
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
                {seg.speakerName} · {formatTime(seg.timestamp)}
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
        💾 每条自动保存，崩溃可恢复
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
          onClick={() => navigate('/history')}
          className="flex-1 bg-white text-primary border border-primary rounded-lg py-3 text-sm hover:bg-primary-light transition-colors"
        >
          📋 查看历史
        </button>
      </div>
    </div>
  )
}
