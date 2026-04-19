/**
 * 统一配置存储
 * 管理 API Key 等敏感配置（加密存储）
 */

import Store from 'electron-store'

const configStore = new Store({
  name: 'meeting-notes-config',
  encryptionKey: 'meeting-notes-v1',
})

export function getAsrApiKey(): string | undefined {
  return configStore.get('asrApiKey') as string | undefined
}

export function setAsrApiKey(key: string): void {
  configStore.set('asrApiKey', key)
}

export function getAiApiKey(): string | undefined {
  return configStore.get('aiApiKey') as string | undefined
}

export function getAiProvider(): string {
  return configStore.get('aiProvider') as string || 'qwen'
}

export function setAiApiKey(key: string, provider: string): void {
  configStore.set('aiApiKey', key)
  configStore.set('aiProvider', provider)
}
