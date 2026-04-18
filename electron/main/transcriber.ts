/**
 * 转写器 — V1 用模拟流式数据
 * 真实 ASR 接入：替换 transcribe() 内的逻辑即可
 */

import { RecordingState } from './preload'
import { nextSpeaker, resetSpeakerIndex } from './speaker'
import { saveSegment } from './store'

type StateCallback = (state: RecordingState) => void
type SegmentCallback = (seg: unknown) => void

let timer: ReturnType<typeof setInterval> | null = null
let mockTimer: ReturnType<typeof setTimeout> | null = null
let saveTimer: ReturnType<typeof setInterval> | null = null
let elapsed = 0
let segmentCount = 0
let currentMeetingId = ''

const MOCK_SEGMENTS = [
  '好的，那我们开始今天的进度同步。',
  '我这边后端 API 已经完成了 80%，预计下周可以提测。',
  '很好，那前端这边李四的排期是什么？',
  'UI 框架刚搭好，大概需要两周完成页面开发。',
  '测试这边可以同步准备用例了，争取下周开始跑自动化测试。',
  '好，那我们分配一下各自的任务。',
  '我负责前端页面的开发，预计两周内完成。',
  '后端这边争取这周把 API 文档写完。',
]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function transcribe(
  onState: StateCallback,
  onSegment: SegmentCallback,
  meetingId: string
) {
  elapsed = 0
  segmentCount = 0
  currentMeetingId = meetingId
  resetSpeakerIndex()

  // 计时器（每秒）
  timer = setInterval(() => {
    elapsed++
    onState({
      state: 'recording',
      elapsed,
      speakerCount: 3,
      segmentCount,
    })
  }, 1000)

  // 模拟转写（每 4-6 秒）
  let idx = 0
  const pushNext = () => {
    if (idx >= MOCK_SEGMENTS.length) {
      mockTimer = setTimeout(pushNext, 5000)
      return
    }
    const speaker = nextSpeaker()
    segmentCount++
    const seg = {
      id: `seg-${Date.now()}`,
      speakerId: speaker.id,
      speakerName: speaker.name,
      text: MOCK_SEGMENTS[idx],
      timestamp: elapsed,
      timestampFormatted: formatTime(elapsed),
    }
    onSegment(seg)
    // 持久化
    saveSegment({ ...seg, meetingId: currentMeetingId })
    idx++
    const delay = 4000 + Math.random() * 2000
    mockTimer = setTimeout(pushNext, delay)
  }
  mockTimer = setTimeout(pushNext, 2000)
}

export function stopTranscribe() {
  if (timer) clearInterval(timer)
  if (mockTimer) clearTimeout(mockTimer)
  if (saveTimer) clearInterval(saveTimer)
  timer = null
  mockTimer = null
  saveTimer = null
}