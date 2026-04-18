/**
 * JSON 文件持久化
 * 替代 SQLite，避免 native 编译问题，支持崩溃恢复
 */

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

let storePath = ''

function getStorePath() {
  if (!storePath) {
    const userData = app.getPath('userData')
    mkdirSync(userData, { recursive: true })
    storePath = join(userData, 'meetings-data.json')
  }
  return storePath
}

interface MeetingData {
  id: string
  title: string
  startTime: number
  endTime: number | null
  duration: number
  summary: string | null
  status: 'recording' | 'processing' | 'done' | 'error'
  speakers: { id: string; name: string; color: string }[]
}

interface SegmentData {
  id: string
  meetingId: string
  speakerId: string
  text: string
  timestamp: number
  formatted: string
}

interface StoreData {
  meetings: MeetingData[]
  segments: SegmentData[]
}

function readStore(): StoreData {
  const path = getStorePath()
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
      return { meetings: [], segments: [] }
    }
  }
  return { meetings: [], segments: [] }
}

function writeStore(data: StoreData) {
  writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf-8')
}

export function saveMeeting(meeting: MeetingData) {
  const store = readStore()
  const idx = store.meetings.findIndex((m) => m.id === meeting.id)
  if (idx >= 0) {
    store.meetings[idx] = meeting
  } else {
    store.meetings.unshift(meeting)
  }
  writeStore(store)
}

export function getAllMeetings(): MeetingData[] {
  return readStore().meetings
}

export function getMeeting(id: string): MeetingData | undefined {
  return readStore().meetings.find((m) => m.id === id)
}

export function getSegments(meetingId: string): SegmentData[] {
  return readStore().segments.filter((s) => s.meetingId === meetingId)
}

export function getInProgressMeeting(): MeetingData | undefined {
  return readStore().meetings.find((m) => m.status === 'recording')
}

export function saveSegment(seg: Omit<SegmentData, 'meetingId'>) {
  const store = readStore()
  const meeting = store.meetings.find((m) => m.id === seg.meetingId)
  if (!meeting) return
  const idx = store.segments.findIndex((s) => s.id === seg.id && s.meetingId === seg.meetingId)
  if (idx >= 0) {
    store.segments[idx] = seg as SegmentData
  } else {
    store.segments.push(seg as SegmentData)
  }
  writeStore(store)
}

export function updateMeetingStatus(id: string, status: MeetingData['status'], summary?: string) {
  const store = readStore()
  const meeting = store.meetings.find((m) => m.id === id)
  if (meeting) {
    meeting.status = status
    if (summary !== undefined) meeting.summary = summary
    if (status === 'done') meeting.endTime = Date.now()
  }
  writeStore(store)
}
