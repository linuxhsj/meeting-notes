import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  startRecording: () => void
  stopRecording: () => void
  onTranscriptText: (callback: (text: string) => void) => void
  onRecordingState: (callback: (state: string) => void) => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.send('stop-recording'),
  onTranscriptText: (callback: (text: string) => void) => {
    ipcRenderer.on('transcript-text', (_, text) => callback(text))
  },
  onRecordingState: (callback: (state: string) => void) => {
    ipcRenderer.on('recording-state', (_, state) => callback(state))
  },
} as ElectronAPI)
