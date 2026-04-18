import { contextBridge, ipcRenderer } from 'electron'

export interface TranscriptSegment {
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: number
  timestampFormatted: string
}

export interface RecordingState {
  state: 'idle' | 'recording' | 'error'
  elapsed: number
  speakerCount: number
  segmentCount: number
  errorMsg?: string
}

export interface MeetingData {
  id: string
  title: string
  startTime: number
  endTime: number | null
  duration: number
  summary: string | null
  status: string
  speakers?: { id: string; name: string; color: string }[]
  segments?: TranscriptSegment[]
}

export interface ElectronAPI {
  // 录制
  startRecording: () => void
  stopRecording: () => void
  onTranscriptSegment: (callback: (seg: TranscriptSegment) => void) => void
  onRecordingStateChange: (callback: (state: RecordingState) => void) => void
  removeAllListeners: () => void
  // 历史
  getMeetings: () => Promise<MeetingData[]>
  getMeeting: (id: string) => Promise<MeetingData | null>
  getInProgress: () => Promise<MeetingData | null>
  // AI 摘要
  summarizeMeeting: (id: string) => Promise<string>
  // API Key
  getApiKey: () => Promise<{ key?: string; provider: string }>
  setApiKey: (key: string, provider: string) => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  // 录制
  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.send('stop-recording'),
  onTranscriptSegment: (callback: (seg: TranscriptSegment) => void) => {
    ipcRenderer.on('transcript-segment', (_, seg) => callback(seg))
  },
  onRecordingStateChange: (callback: (state: RecordingState) => void) => {
    ipcRenderer.on('recording-state', (_, state) => callback(state))
  },
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('transcript-segment')
    ipcRenderer.removeAllListeners('recording-state')
  },
  // 历史
  getMeetings: () => ipcRenderer.invoke('get-meetings'),
  getMeeting: (id: string) => ipcRenderer.invoke('get-meeting', id),
  getInProgress: () => ipcRenderer.invoke('get-in-progress'),
  // AI 摘要
  summarizeMeeting: (id: string) => ipcRenderer.invoke('summarize-meeting', id),
  // API Key
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key: string, provider: string) => ipcRenderer.send('set-api-key', { key, provider }),
} as ElectronAPI)
