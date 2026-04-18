// ⚠️ 此文件与 electron/main/preload.ts 中的同名类型必须保持同步
// IPC 传输使用的类型定义见 preload.ts，修改后同步到此文件

export type Speaker = {
  id: string
  name: string
  color: string // CSS color
}

export type TranscriptSegment = {
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: number // seconds from start
  timestampFormatted: string // "00:01:23"
}

export type Meeting = {
  id: string
  title: string
  startTime: number // Unix ms
  endTime: number | null
  duration: number // seconds
  speakers: Speaker[]
  transcript: TranscriptSegment[]
  summary: string | null
  status: 'recording' | 'processing' | 'done' | 'error'
}

export type RecordingState = 'idle' | 'recording' | 'error'
