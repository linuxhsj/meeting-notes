/**
 * ASR 类型定义
 */

export interface ASRSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
  speakerId: string
  speakerName: string
}

export type ASRState = 'connecting' | 'listening' | 'not-available' | 'error'

export type SegmentCallback = (seg: ASRSegment) => void
export type StateCallback = (state: ASRState, msg?: string) => void

export interface ASRProvider {
  name: string
  hasSpeakerDiarization: boolean
  start(apiKey: string, onSegment: SegmentCallback, onState: StateCallback): Promise<boolean>
  stop(): void
}
