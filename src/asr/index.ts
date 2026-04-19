/**
 * ASR 模块统一导出
 */

export type {
  ASRSegment,
  ASRState,
  SegmentCallback,
  StateCallback,
  ASRProvider
} from './types'

export { MockASR } from './mock-asr'
export { QwenASR } from './qwen-websocket'

import { QwenASR } from './qwen-websocket'
import { MockASR } from './mock-asr'
import type { ASRProvider } from './types'

/**
 * 创建 ASR Provider
 * 默认使用 QwenASR（阿里云）
 * 可通过环境变量切换到 MockASR
 */
export function createASRProvider(): ASRProvider {
  const mode = import.meta.env.VITE_ASR_MODE || 'qwen'
  switch (mode) {
    case 'mock':
      return new MockASR()
    case 'qwen':
    default:
      return new QwenASR()
  }
}

export function createMockProvider(): ASRProvider {
  return new MockASR()
}
