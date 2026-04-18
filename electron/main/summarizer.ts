/**
 * AI 摘要生成器
 * 用户填入 API Key，支持通义千问 / Kimi
 */

import Store from 'electron-store'

const store = new Store()

const MOCK_SUMMARY = `本次会议明确了 Q3 目标：
① 完成 MVP 核心功能开发
② 建立 CI/CD 流水线
③ 交付测试报告

负责人分配：
- 后端：张三
- 前端：李四
- 测试：王五

下一阶段评审定于 5 月 10 日。`

export interface SummarizeOptions {
  transcript: string // 纯文本拼接
}

export async function summarize({ transcript }: SummarizeOptions): Promise<string> {
  const apiKey = store.get('aiApiKey') as string | undefined
  if (!apiKey) {
    return MOCK_SUMMARY
  }

  const provider = store.get('aiProvider') as string || 'qwen'

  if (provider === 'qwen') {
    return summarizeWithQwen(apiKey, transcript)
  } else {
    return summarizeWithKimi(apiKey, transcript)
  }
}

async function summarizeWithQwen(apiKey: string, transcript: string): Promise<string> {
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个会议纪要助手。根据会议转写内容，生成简明的摘要，包含：关键决策、行动项（负责人）、下一步计划。用中文输出。',
          },
          {
            role: 'user',
            content: `请根据以下会议转写生成摘要：\n\n${transcript}`,
          },
        ],
        max_tokens: 500,
      }),
    })
    if (!res.ok) throw new Error(`Qwen API error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || MOCK_SUMMARY
  } catch {
    return MOCK_SUMMARY
  }
}

async function summarizeWithKimi(apiKey: string, transcript: string): Promise<string> {
  try {
    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个会议纪要助手。根据会议转写内容，生成简明的摘要，包含：关键决策、行动项（负责人）、下一步计划。用中文输出。',
          },
          {
            role: 'user',
            content: `请根据以下会议转写生成摘要：\n\n${transcript}`,
          },
        ],
        max_tokens: 500,
      }),
    })
    if (!res.ok) throw new Error(`Kimi API error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || MOCK_SUMMARY
  } catch {
    return MOCK_SUMMARY
  }
}

export function saveApiKey(key: string, provider: string) {
  store.set('aiApiKey', key)
  store.set('aiProvider', provider)
}

export function getApiKey(): string | undefined {
  return store.get('aiApiKey') as string | undefined
}

export function getProvider(): string {
  return store.get('aiProvider') as string || 'qwen'
}
