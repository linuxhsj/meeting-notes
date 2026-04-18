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
    'rec.idle.hint': { en: 'Click Start to capture system audio', zh: '点击下方按钮开始捕获系统音频' },
    'rec.start': { en: '▶ Start Recording', zh: '▶ 开始录制' },
    'rec.device': { en: '🎵 Switch Device', zh: '🎵 切换设备' },
    'rec.recording': { en: 'Recording', zh: '正在录制' },
    'rec.live': { en: '📡 Live Transcript', zh: '📡 实时转写' },
    'rec.waiting': { en: 'Waiting for speech…', zh: '等待发言…' },
    'rec.autoSave': { en: '💾 Auto-save every 30s', zh: '💾 每 30 秒自动保存' },
    'rec.stop': { en: '⏹ Stop Recording', zh: '⏹ 停止录制' },
    'rec.notes': { en: '📋 View Notes', zh: '📋 查看纪要' },
    'rec.speakers': { en: 'speakers detected', zh: '说话人检测中' },
    'rec.segments': { en: 'segments recorded', zh: '段落已记录' },
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
  }
  return map[key]?.[lang] ?? key
}