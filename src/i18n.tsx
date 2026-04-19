import { createContext, useContext, useState } from 'react'

export type Lang = 'en' | 'zh'

interface LangContextType {
  lang: Lang
  toggle: () => void
}

export const LangContext = createContext<LangContextType>({
  lang: 'en',
  toggle: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const toggle = () => setLang((l) => (l === 'en' ? 'zh' : 'en'))
  return <LangContext.Provider value={{ lang, toggle }}>{children}</LangContext.Provider>
}

export const t = (lang: Lang, key: string): string => {
  const map: Record<string, Record<string, string>> = {
    // App shell
    'app.title': { en: 'AI Meeting Notes', zh: 'AI 会议纪要' },
    'nav.record': { en: 'Record', zh: '录制' },
    'nav.history': { en: 'History', zh: '历史记录' },
    // Record page
    'rec.idle.title': { en: 'Not Recording', zh: '未在录制' },
    'rec.idle.mode': { en: 'ASR: Alibaba QwenASR (Real-time + Speaker Diarization)', zh: 'ASR 模式：阿里云 QwenASR（实时转写 + 说话人分离）' },
    'rec.start': { en: '▶ Start Recording', zh: '▶ 开始录制' },
    'rec.device': { en: '🎵 Switch Device', zh: '🎵 切换设备' },
    'rec.recording': { en: 'Recording', zh: '正在录制' },
    'rec.live': { en: '📡 Live Transcript', zh: '📡 实时转写' },
    'rec.waiting': { en: 'Waiting for speech…', zh: '等待发言…' },
    'rec.autoSave': { en: '💾 Auto-save enabled', zh: '💾 每条自动保存，崩溃可恢复' },
    'rec.stop': { en: '⏹ Stop Recording', zh: '⏹ 停止录制' },
    'rec.notes': { en: '📋 View Notes', zh: '📋 查看历史' },
    'rec.connecting': { en: 'Connecting…', zh: '正在连接…' },
    'rec.listening': { en: '● Real-time识别中', zh: '● 实时识别中' },
    'rec.speakers': { en: 'speakers', zh: '人' },
    'rec.segments': { en: 'segments', zh: '段落' },
    // Error states
    'err.apiKeyMissing': { en: 'Configure API Key', zh: '请配置 API Key' },
    'err.apiKeyHint': { en: 'Alibaba DashScope API Key required', zh: '需要阿里云 DashScope API Key 才能使用真实 ASR' },
    'err.audioInterrupt': { en: 'Audio Interrupted', zh: '音频捕获中断' },
    'err.lastNormal': { en: 'Last normal', zh: '上次正常' },
    'err.retry': { en: '🔄 Retry', zh: '🔄 重新检测设备' },
    'err.configKey': { en: '🔑 Configure API Key', zh: '🔑 配置 API Key' },
    'err.prompt': { en: 'Enter Alibaba DashScope API Key:', zh: '请输入阿里云 DashScope API Key:' },
    // Notes page
    'notes.title': { en: 'Meeting Notes', zh: '会议纪要' },
    'notes.summary': { en: 'AI Summary', zh: 'AI 摘要' },
    'notes.edit': { en: 'Edit', zh: '编辑' },
    'notes.copyAll': { en: '📋 Copy All', zh: '📋 复制全文' },
    'notes.copied': { en: 'Copied!', zh: '已复制！' },
    'notes.regenerate': { en: '💬 Re-generate', zh: '💬 重新生成摘要' },
    'notes.editNote': { en: '✏️ Edit Notes', zh: '✏️ 编辑纪要' },
    'notes.merge': { en: '+ merge', zh: '+ 合并段落' },
    // History page
    'hist.title': { en: 'History', zh: '历史记录' },
    'hist.count': { en: 'records', zh: '条记录' },
    'hist.empty': { en: 'No meeting records', zh: '暂无会议记录' },
    'hist.goRecord': { en: 'Go to Record →', zh: '去录制 →' },
  }
  return map[key]?.[lang] ?? key
}