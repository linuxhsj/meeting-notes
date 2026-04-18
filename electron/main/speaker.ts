/**
 * 说话人分离 — V1 用轮询模拟
 * 真实接入：替换为 pyannote.audio 或云 ASR 的说话人标签接口
 */

export interface Speaker {
  id: string
  name: string
  color: string
}

export const SPEAKERS: Speaker[] = [
  { id: 'sp-1', name: '说话人 1', color: '#1d4ed8' },
  { id: 'sp-2', name: '说话人 2', color: '#166534' },
  { id: 'sp-3', name: '说话人 3', color: '#854d0e' },
]

// V1：轮询 3 个说话人，模拟 VAD 说话人切换
let speakerIdx = 0

export function nextSpeaker(): Speaker {
  const s = SPEAKERS[speakerIdx]
  speakerIdx = (speakerIdx + 1) % SPEAKERS.length
  return s
}

export function resetSpeakerIndex() {
  speakerIdx = 0
}
