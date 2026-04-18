/**
 * Web Speech API ASR 模块
 *
 * 架构：
 *   麦克风 → Web Speech API → RecognitionResult → SentenceBuffer → emit segment
 *
 * 降级策略：
 *   Web Speech API 不可用 → 回退到模拟数据
 */

import { getApiKey } from '../electron/main/summarizer'

export interface ASRResult {
  transcript: string
  isFinal: boolean
  timestamp: number
}

type SegmentCallback = (text: string, isFinal: boolean, timestamp: number) => void
type StateCallback = (state: 'listening' | 'not-available' | 'error', msg?: string) => void

const SENTENCE_END_CHARS = /[。！？.!?\n]/

export class WebSpeechASR {
  private recognizer: typeof window.SpeechRecognition | null = null
  private buffer = ''
  private lastUpdate = 0
  private segmentCallback: SegmentCallback | null = null
  private stateCallback: StateCallback | null = null
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private startTime = 0

  constructor() {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      this.recognizer = null
    } else {
      this.recognizer = new SR()
      this.recognizer.continuous = true
      this.recognizer.interimResults = true
      this.recognizer.lang = 'zh-CN'

      this.recognizer.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript.trim()
          if (!text) continue

          const isFinal = result.isFinal
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000)

          if (isFinal) {
            this.flushBuffer(text)
          } else {
            this.buffer = text
            this.lastUpdate = Date.now()
            this.segmentCallback?.(text, false, elapsed)
          }
        }
      }

      this.recognizer.onerror = (event) => {
        console.error('[WebSpeechASR] error:', event.error)
        if (event.error === 'not-allowed') {
          this.stateCallback?.('error', '麦克风权限被拒绝，请在系统设置中允许访问')
        } else if (event.error === 'no-speech') {
          // 正常，继续监听
        } else {
          this.stateCallback?.('error', `ASR 错误: ${event.error}`)
        }
      }

      this.recognizer.onend = () => {
        // 非主动停止时自动重启
        if (this.isRunning) {
          try { this.recognizer?.start() } catch { /* ignore */ }
        }
      }
    }
  }

  start(onSegment: SegmentCallback, onState: StateCallback) {
    this.segmentCallback = onSegment
    this.stateCallback = onState
    this.startTime = Date.now()
    this.buffer = ''
    this.lastUpdate = 0
    this.isRunning = true

    if (!this.recognizer) {
      onState('not-available', '浏览器不支持 Web Speech API，将使用模拟数据')
      return false
    }

    try {
      this.recognizer.start()
      onState('listening')
      // 启动超时刷新（1.5 秒不说话强制输出）
      this.startFlushTimer()
      return true
    } catch (e) {
      onState('error', `无法启动麦克风: ${e}`)
      return false
    }
  }

  stop() {
    this.isRunning = false
    if (this.flushTimer) clearTimeout(this.flushTimer)
    if (this.buffer.trim()) {
      this.flushBuffer(this.buffer.trim())
    }
    try { this.recognizer?.stop() } catch { /* ignore */ }
  }

  private flushBuffer(text: string) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    this.buffer = ''
    this.lastUpdate = 0
    this.segmentCallback?.(text, true, elapsed)
  }

  private startFlushTimer() {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => {
      if (this.buffer.trim() && Date.now() - this.lastUpdate > 1500) {
        this.flushBuffer(this.buffer.trim())
      }
      if (this.isRunning) this.startFlushTimer()
    }, 500)
  }
}

// 全局声明
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
