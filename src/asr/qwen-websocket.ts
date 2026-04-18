/**
 * 通义千问 Qwen-ASR-Realtime WebSocket 客户端
 *
 * 流程：麦克风 → MediaRecorder → WebM/Opus → WebSocket → Qwen ASR → JSON 结果
 *
 * API 文档：https://help.aliyun.com/zh/model-studio/websocket-for-paraformer-real-time-service
 */

const ASR_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'
const MODEL = 'paraformer-realtime-8k-v2'

export interface ASRSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
  speakerId: string
  speakerName: string
}

type SegmentCallback = (seg: ASRSegment) => void
type StateCallback = (state: 'connecting' | 'listening' | 'not-available' | 'error', msg?: string) => void

export class QwenASR {
  private ws: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private apiKey = ''
  private onSegment: SegmentCallback | null = null
  private onState: StateCallback | null = null
  private startTime = 0
  private speakerIdx = 0
  private running = false

  private readonly SPEAKERS = [
    { id: 'sp-1', name: '说话人 1' },
    { id: 'sp-2', name: '说话人 2' },
    { id: 'sp-3', name: '说话人 3' },
  ]

  async start(
    apiKey: string,
    onSegment: SegmentCallback,
    onState: StateCallback
  ): Promise<boolean> {
    this.apiKey = apiKey
    this.onSegment = onSegment
    this.onState = onState
    this.startTime = Date.now()
    this.speakerIdx = 0
    this.running = true

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
          // 发送初始化请求
          this.ws!.send(JSON.stringify({
            header: {
              appkey: 'audio-asr',
              algorithm: 'paraformer',
              version: '0.1.0',
              model: MODEL,
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
          if (this.running) onState('error', 'ASR 连接已断开')
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

  private handleMessage(data: string | Blob) {
    if (typeof data !== 'string') return

    try {
      const msg = JSON.parse(data)
      const event = msg?.header?.event as string

      if (event === 'ready') {
        this.onState?.('listening')
        this.startMicCapture()
      } else if (event === 'result-generated') {
        const sentence = msg?.payload?.output?.sentence
        if (sentence?.text) {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
          const speaker = this.SPEAKERS[this.speakerIdx % this.SPEAKERS.length]
          this.speakerIdx++
          this.onSegment?.({
            id: `seg-${Date.now()}`,
            text: sentence.text,
            timestamp: elapsed,
            isFinal: true,
            speakerId: speaker.id,
            speakerName: speaker.name,
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
        this.onState?.('error', `麦克风启动失败: ${err.message}`)
      })
  }

  stop() {
    this.running = false
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop()
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
