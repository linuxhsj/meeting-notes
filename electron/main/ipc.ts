import { ipcMain, BrowserWindow } from 'electron'
import { transcribe, stopTranscribe } from './transcriber'
import { saveApiKey, getApiKey, getProvider, summarize } from './summarizer'
import {
  saveMeeting,
  saveSegment,
  getAllMeetings,
  getMeeting,
  getSegments,
  updateMeetingStatus,
  getInProgressMeeting,
} from './store'
import Store from 'electron-store'
import { RecordingState } from './preload'

const store = new Store()

let currentWindow: BrowserWindow | null = null

export function registerAllIPC(mainWindow: BrowserWindow) {
  currentWindow = mainWindow

  // === 录制 ===
  ipcMain.on('start-recording', () => {
    const meetingId = `meeting-${Date.now()}`
    saveMeeting({
      id: meetingId,
      title: `会议 ${new Date().toLocaleString('zh-CN')}`,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      summary: null,
      status: 'recording',
      speakers: [],
    })

    const sendState = (state: RecordingState) => {
      if (currentWindow && !currentWindow.isDestroyed()) {
        currentWindow.webContents.send('recording-state', state)
      }
    }
    const sendSegment = (seg: unknown) => {
      if (currentWindow && !currentWindow.isDestroyed()) {
        currentWindow.webContents.send('transcript-segment', seg)
      }
      // 保存到 store（每 30 秒，由 transcriber 调用外部 hook）
    }

    sendState({ state: 'recording', elapsed: 0, speakerCount: 0, segmentCount: 0 })
    transcribe(sendState, sendSegment, meetingId)
  })

  ipcMain.on('stop-recording', async () => {
    stopTranscribe()
    if (currentWindow && !currentWindow.isDestroyed()) {
      currentWindow.webContents.send('recording-state', {
        state: 'idle',
        elapsed: 0,
        speakerCount: 0,
        segmentCount: 0,
      })
    }
  })

  // === 历史 ===
  ipcMain.handle('get-meetings', () => {
    return getAllMeetings()
  })

  ipcMain.handle('get-meeting', (_, id: string) => {
    const meeting = getMeeting(id)
    if (meeting) {
      return { ...meeting, segments: getSegments(id) }
    }
    return null
  })

  // === AI 摘要 ===
  ipcMain.handle('summarize-meeting', async (_, meetingId: string) => {
    const segments = getSegments(meetingId)
    const text = segments.map((s) => `[${s.formatted}] ${s.text}`).join('\n')
    const summary = await summarize({ transcript: text })
    updateMeetingStatus(meetingId, 'done', summary)
    return summary
  })

  // === API Key ===
  ipcMain.handle('get-api-key', () => {
    return { key: getApiKey(), provider: getProvider() }
  })

  ipcMain.on('set-api-key', (_, data: { key: string; provider: string }) => {
    saveApiKey(data.key, data.provider)
  })

  // === ASR API Key ===
  ipcMain.handle('get-asr-api-key', () => {
    const asrKey = store.get('asrApiKey') as string | undefined
    return asrKey
  })

  ipcMain.on('set-asr-api-key', (_, key: string) => {
    store.set('asrApiKey', key)
  })

  // === 崩溃恢复 ===
  ipcMain.handle('get-in-progress', () => {
    return getInProgressMeeting()
  })
}
