/**
 * 通义千问 Qwen-ASR-Realtime WebSocket 客户端
 *
 * 流程：麦克风 → MediaRecorder → WebM/Opus → WebSocket → Qwen ASR → JSON 结果
 *
 * API 文档：https://help.aliyun.com/zh/model-studio/websocket-for-paraformer-real-time-service
 */

import type { ASRProvider, ASRSegment, ASRState } from './types'

const ASR_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'
const MODEL = 'paraformer-realtime-8k-v2'

export class QwenASR implements ASRProvider {
  name = '阿里云 QwenASR'
  hasSpeakerDiarization = true

  private ws: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private apiKey = ''
  private onSegmentCallback: ((seg: ASRSegment) => void) | null = null
  private onStateCallback: ((state: ASRState, msg?: string) => void) | null = null
  private startTime = 0
  private speakerIdx = 0
  private running = false

  // 重连机制
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  async start(
    apiKey: string,
    onSegment: (seg: ASRSegment) => void,
    onState: (state: ASRState, msg?: string) => void
  ): Promise<boolean> {
    this.apiKey = apiKey
    this.onSegmentCallback = onSegment
    this.onStateCallback = onState
    this.startTime = Date.now()
    this.speakerIdx = 0
    this.running = true
    this.reconnectAttempts = 0

    // 先检查麦克风权限
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      onState('not-available', `麦克风权限被拒绝: ${msg}`)
      return false
    }

    onState('connecting', '正在连接 ASR 服务...')

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(ASR_WS_URL)

        this.ws.onopen = () => {
          // 发送初始化请求（带认证 + 说话人分离参数）
          this.ws!.send(JSON.stringify({
            header: {
              appkey: 'audio-asr',
              algorithm: 'paraformer',
              version: '0.1.0',
              model: MODEL,
              // Bearer Token 认证
              authorization: `Bearer ${this.apiKey}`,
              // 说话人分离参数（行业默认值）
              enable_diarization: true,
              max_speaker_num: 8,
            }
          }))
          resolve(true)
        }

        this.ws.onmessage = (event) => this.handleMessage(event.data)

        this.ws.onerror = () => {
          if (this.running) {
            onState('error', 'WebSocket 连接失败，请检查网络')
            resolve(false)
          }
        }

        this.ws.onclose = () => {
          if (this.running) {
            this.handleDisconnect()
          }
        }

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            onState('error', 'ASR 连接超时，请检查网络')
            resolve(false)
          }
        }, 10000)

      } catch {
        onState('not-available', '浏览器不支持 WebSocket')
        resolve(false)
      }
    })
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = 1000 * Math.pow(2, this.reconnectAttempts) // 指数退避: 1s, 2s, 4s
      this.reconnectAttempts++
      this.onStateCallback?.('connecting', `连接断开，正在重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.reconnectTimer = setTimeout(() => this.reconnect(), delay)
    } else {
      this.onStateCallback?.('error', '连接断开，请检查网络')
    }
  }

  private async reconnect() {
    if (!this.running) return
    try {
      await this.start(this.apiKey, this.onSegmentCallback!, this.onStateCallback!)
    } catch {
      this.onStateCallback?.('error', '重连失败')
    }
  }

  private handleMessage(data: string | Blob) {
    if (typeof data !== 'string') return

    try {
      const msg = JSON.parse(data)
      const event = msg?.header?.event as string

      if (event === 'ready') {
        this.onStateCallback?.('listening')
        this.startMicCapture()
      } else if (event === 'result-generated') {
        const sentence = msg?.payload?.output?.sentence
        if (sentence?.text) {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000)

          // 解析说话人信息（阿里云说话人分离输出格式）
          const speakerData = msg?.payload?.output?.sentence
          const speakerId = speakerData?.channel_id ?? speakerData?.spk_id ?? this.speakerIdx % 3
          const speakerNum = parseInt(String(speakerId)) || 0
          const speakerName = `说话人 ${speakerNum + 1}`

          this.speakerIdx++
          this.onSegmentCallback?.({
            id: `qwen-${Date.now()}`,
            text: sentence.text,
            timestamp: elapsed,
            isFinal: true,
            speakerId: `sp-${speakerId}`,
            speakerName,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  private startMicCapture() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // 优先用 opus 编码，减少数据量
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm'

        this.mediaRecorder = new MediaRecorder(stream, { mimeType })

        this.mediaRecorder.ondataavailable = (e) => {
          if (!this.running) return
          if (e.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(e.data)
          }
        }

        this.mediaRecorder.start(100) // 每 100ms 发一次音频块
        stream.getTracks().forEach(t => t.stop())
      })
      .catch((err: Error) => {
        this.onStateCallback?.('error', `麦克风启动失败: ${err.message}`)
      })
  }

  stop() {
    this.running = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop()
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
