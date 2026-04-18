/**
 * 模拟 ASR（V1 开发测试用）
 * 完全模拟 QwenASR 的接口，不需要任何 API Key
 */

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

export class MockASR {
  private timer: ReturnType<typeof setTimeout> | null = null
  private onSegment: SegmentCallback | null = null
  private onState: StateCallback | null = null
  private startTime = 0
  private speakerIdx = 0
  private running = false

  private readonly MOCK_SEGMENTS = [
    '好的，那我们开始今天的进度同步。',
    '我这边后端 API 已经完成了 80%，预计下周可以提测。',
    '很好，那前端这边李四的排期是什么？',
    'UI 框架刚搭好，大概需要两周完成页面开发。',
    '测试这边可以同步准备用例了，争取下周开始跑自动化测试。',
    '好，那我们分配一下各自的任务。',
    '我负责前端页面的开发，预计两周内完成。',
    '后端这边争取这周把 API 文档写完。',
  ]

  private readonly SPEAKERS = [
    { id: 'sp-1', name: '说话人 1' },
    { id: 'sp-2', name: '说话人 2' },
    { id: 'sp-3', name: '说话人 3' },
  ]

  async start(
    _apiKey: string,
    onSegment: SegmentCallback,
    onState: StateCallback
  ): Promise<boolean> {
    this.onSegment = onSegment
    this.onState = onState
    this.startTime = Date.now()
    this.speakerIdx = 0
    this.running = true

    onState('connecting', '模拟连接中...')
    await delay(800)
    onState('listening')

    this.scheduleNext(500) // 第一次 0.5 秒后
    return true
  }

  stop() {
    this.running = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private scheduleNext(delayMs: number) {
    if (!this.running) return
    this.timer = setTimeout(() => {
      if (!this.running) return

      if (this.speakerIdx >= this.MOCK_SEGMENTS.length) {
        // 播完后停
        this.stop()
        return
      }

      const speaker = this.SPEAKERS[this.speakerIdx % this.SPEAKERS.length]
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
      this.onSegment?.({
        id: `mock-${Date.now()}`,
        text: this.MOCK_SEGMENTS[this.speakerIdx],
        timestamp: elapsed,
        isFinal: true,
        speakerId: speaker.id,
        speakerName: speaker.name,
      })

      this.speakerIdx++
      // 4-6 秒随机间隔
      this.scheduleNext(4000 + Math.random() * 2000)
    }, delayMs)
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
