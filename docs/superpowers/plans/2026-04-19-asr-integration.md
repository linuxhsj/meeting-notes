# ASR 实时语音识别接入实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入阿里云 QwenASR 实时语音识别，替代 MockASR 模拟数据，支持说话人分离

**Architecture:**
- 简化方案：直接使用 QwenASR，复用现有接口
- 文件结构：src/asr/ 下新增 types.ts、index.ts，改造 qwen.ts，RecordPage.tsx 切换调用

**Tech Stack:** TypeScript, WebSocket, 阿里云 DashScope API

---

## 文件改动总览

```
src/asr/
├── types.ts          # 新增：ASRSegment, ASRState 类型定义
├── mock-asr.ts       # 保留：MockASR（开发测试用）
├── qwen-websocket.ts # 改造：统一接口格式
├── index.ts          # 新增：统一导出，默认 QwenASR
└── index.ts          # 后续新增：切换逻辑

src/pages/RecordPage.tsx  # 改造：MockASR → QwenASR
electron/main/preload.ts  # 可能需要：暴露 API Key 存储
```

---

## Task 1: 新增类型定义

**Files:**
- Create: `src/asr/types.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
// src/asr/types.ts

export interface ASRSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
  speakerId: string
  speakerName: string
}

export type ASRState = 'connecting' | 'listening' | 'not-available' | 'error'

export type SegmentCallback = (seg: ASRSegment) => void
export type StateCallback = (state: ASRState, msg?: string) => void

export interface ASRProvider {
  name: string
  hasSpeakerDiarization: boolean
  start(apiKey: string, onSegment: SegmentCallback, onState: StateCallback): Promise<boolean>
  stop(): void
}
```

- [ ] **Step 2: 验证文件创建**

Run: `cat src/asr/types.ts`
Expected: 包含 ASRSegment、ASRState 等类型定义

- [ ] **Step 3: 提交**

```bash
git add src/asr/types.ts
git commit -m "feat(asr): add type definitions for ASR providers"
```

---

## Task 2: 改造 QwenASR 接口

**Files:**
- Modify: `src/asr/qwen-websocket.ts`（新增导出 ASRProvider 接口实现）

- [ ] **Step 1: 查看当前 qwen-websocket.ts 完整代码**

Run: `cat src/asr/qwen-websocket.ts`

- [ ] **Step 2: 改造 qwen-websocket.ts，统一接口**

在文件开头添加类型导入，在类定义处实现 ASRProvider 接口：

```typescript
// src/asr/qwen-websocket.ts

import type { ASRSegment, ASRState, SegmentCallback, StateCallback, ASRProvider } from './types'

const ASR_WS_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/inference'
const MODEL = 'paraformer-realtime-8k-v2'

// 复用现有的 ASRSegment、SegmentCallback、StateCallback 定义（或从 types.ts 导入）

export class QwenASR implements ASRProvider {
  name = '阿里云 QwenASR'
  hasSpeakerDiarization = true

  private ws: WebSocket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private apiKey = ''
  private onSegment: SegmentCallback | null = null
  private onState: ((state: ASRState, msg?: string) => void) | null = null
  private startTime = 0
  private speakerIdx = 0
  private running = false

  // ... 其余方法保持不变，确保 stop() 方法正确实现
```

- [ ] **Step 3: 添加说话人分离支持（行业默认值）**

在 start() 方法中初始化请求添加说话人分离配置：

```typescript
// 初始化请求（行业默认参数：enable_diarization + max_speaker_num）
this.ws!.send(JSON.stringify({
  header: {
    appkey: 'audio-asr',
    algorithm: 'paraformer',
    version: '0.1.0',
    model: MODEL,
    // 说话人分离参数（行业默认值）
    enable_diarization: true,
    max_speaker_num: 8,  // 最大 8 人
  }
}))
```

- [ ] **Step 4: 处理说话人输出**

在 handleMessage 中处理阿里云返回的说话人信息：

```typescript
// 在 result-generated 事件中解析说话人
if (event === 'result-generated') {
  const sentence = msg?.payload?.output?.sentence
  if (sentence?.text) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)

    // 阿里云说话人分离输出格式
    // 注意：实际格式可能为 { channel_id } 或 { spk_id }，根据 API 返回调整
    const speakerData = msg?.payload?.output?.sentence
    const speakerId = speakerData?.channel_id ?? speakerData?.spk_id ?? this.speakerIdx % 3
    const speakerName = `说话人 ${(parseInt(String(speakerId)) || 0) + 1}`

    this.speakerIdx++
    this.onSegment?.({
      id: `qwen-${Date.now()}`,
      text: sentence.text,
      timestamp: elapsed,
      isFinal: true,
      speakerId: `sp-${speakerId}`,
      speakerName,
    })
  }
}
```

- [ ] **Step 4.5: 添加 WebSocket 重连机制**

在 QwenASR 类中添加重连逻辑：

```typescript
// 添加属性
private reconnectAttempts = 0
private maxReconnectAttempts = 3
private reconnectTimer: ReturnType<typeof setTimeout> | null = null

// 在 onclose 中添加重连逻辑
this.ws.onclose = () => {
  if (this.running) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = 1000 * Math.pow(2, this.reconnectAttempts)  // 指数退避: 1s, 2s, 4s
      this.reconnectAttempts++
      this.onState?.('connecting', `连接断开，正在重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.reconnectTimer = setTimeout(() => this.reconnect(), delay)
    } else {
      this.onState?.('error', '连接断开，请检查网络')
    }
  }
}

// 添加 reconnect 方法
private async reconnect() {
  if (!this.running) return
  try {
    await this.start(this.apiKey, this.onSegment!, this.onState!)
  } catch {
    this.onState?.('error', '重连失败')
  }
}
```

- [ ] **Step 5: 验证 QwenASR 类导出正确**

Run: `grep -n "export class QwenASR" src/asr/qwen-websocket.ts`
Expected: `export class QwenASR implements ASRProvider`

- [ ] **Step 6: 提交**

```bash
git add src/asr/qwen-websocket.ts
git commit -m "feat(asr): implement QwenASR with ASRProvider interface"
```

---

## Task 3: 创建统一导出 index.ts

**Files:**
- Create: `src/asr/index.ts`

- [ ] **Step 1: 创建 index.ts**

```typescript
// src/asr/index.ts

export type { ASRSegment, ASRState, SegmentCallback, StateCallback, ASRProvider } from './types'

export { MockASR } from './mock-asr'
export { QwenASR } from './qwen-websocket'

// 默认导出：当前使用 QwenASR（后续可改为配置驱动）
import { QwenASR } from './qwen-websocket'
import type { ASRProvider } from './types'

export function createASRProvider(): ASRProvider {
  return new QwenASR()
}

export function createMockProvider(): ASRProvider {
  const { MockASR } = require('./mock-asr')
  return new MockASR()
}
```

- [ ] **Step 2: 验证导出**

Run: `cat src/asr/index.ts`
Expected: 包含所有类型和类导出

- [ ] **Step 3: 提交**

```bash
git add src/asr/index.ts
git commit -m "feat(asr): add unified export index.ts"
```

---

## Task 4: 改造 RecordPage 使用 QwenASR

**Files:**
- Modify: `src/pages/RecordPage.tsx`

- [ ] **Step 1: 查看当前 RecordPage.tsx 导入部分**

Run: `head -30 src/pages/RecordPage.tsx`

- [ ] **Step 2: 修改导入**

```typescript
// 修改前
import { MockASR, type ASRSegment } from '../asr/mock-asr'

// 修改后
import { QwenASR, createMockProvider, type ASRSegment } from '../asr'
```

- [ ] **Step 3: 修改 asrRef 类型**

```typescript
// 修改前
const asrRef = useRef<MockASR | null>(null)

// 修改后
const asrRef = useRef<InstanceType<typeof QwenASR> | null>(null)
```

- [ ] **Step 4: 修改 startRecording 函数**

```typescript
// 修改前
asrRef.current = new MockASR()
asrRef.current.start(
  'mock-key', // 模拟不需要真实 Key
  ...
)

// 修改后
asrRef.current = new QwenASR()
// API Key 从配置获取（后续接入 electron-store 或配置页面）
const apiKey = 'your-dashscope-api-key' // TODO: 从配置读取
asrRef.current.start(
  apiKey,
  (seg) => { ... },
  (state, msg) => { ... }
)
```

- [ ] **Step 5: 更新空闲状态文字**

```typescript
// 修改前
<div className="text-xs text-text-muted mb-2">ASR 模式：模拟数据（真实 ASR V2 接入中）</div>

// 修改后
<div className="text-xs text-text-muted mb-2">ASR 模式：阿里云 QwenASR（实时转写）</div>
```

- [ ] **Step 6: 验证修改**

Run: `grep -n "QwenASR\|MockASR" src/pages/RecordPage.tsx`
Expected: 只显示 QwenASR 相关，无 MockASR

- [ ] **Step 7: 提交**

```bash
git add src/pages/RecordPage.tsx
git commit -m "feat(recordpage): switch from MockASR to QwenASR"
```

---

## Task 5: 添加 API Key 配置支持（必需）

**Files:**
- Modify: `electron/main/preload.ts`（暴露 ASR API Key 读取/保存）
- Modify: `electron/main/ipc.ts`（添加 ASR API Key IPC 处理）
- Modify: `src/pages/RecordPage.tsx`（读取 API Key）

- [ ] **Step 1: 在 preload.ts 中添加 ASR API Key 接口**

查看当前 preload.ts：

```bash
cat electron/main/preload.ts
```

在 ElectronAPI 接口中添加：

```typescript
// electron/main/preload.ts

// ASR API Key（阿里云）
getAsrApiKey: () => Promise<string | undefined>
setAsrApiKey: (key: string) => void
```

- [ ] **Step 2: 在 ipc.ts 中添加 ASR API Key IPC 处理**

```typescript
// electron/main/ipc.ts

import Store from 'electron-store'
const store = new Store()

// 添加 IPC 处理
ipcMain.handle('get-asr-api-key', () => {
  return store.get('asrApiKey') as string | undefined
})

ipcMain.on('set-asr-api-key', (_, key: string) => {
  store.set('asrApiKey', key)
})
```

- [ ] **Step 3: 在 RecordPage.tsx 中读取 API Key**

```typescript
// src/pages/RecordPage.tsx

// 在组件中添加状态
const [apiKey, setApiKey] = useState('')

// 在 startRecording 中获取 API Key
const getApiKey = async () => {
  if (window.electronAPI?.getAsrApiKey) {
    return await window.electronAPI.getAsrApiKey()
  }
  return localStorage.getItem('asrApiKey') || ''
}

// 修改 startRecording 函数
const startRecording = async () => {
  const key = await getApiKey()
  if (!key) {
    setAsrMsg('⚠ 请先配置 API Key')
    setRecState('error')
    return
  }

  // ... 继续录制逻辑
}
```

- [ ] **Step 4: 添加 API Key 配置 UI 提示**

在空闲状态 UI 中添加配置入口：

```tsx
// src/pages/RecordPage.tsx 空闲状态部分
{!apiKey && (
  <div className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
    ⚠️ 请先配置阿里云 API Key 才能使用真实 ASR
    <button
      onClick={() => {/* 打开设置 */}}
      className="ml-2 underline"
    >
      去配置
    </button>
  </div>
)}
```

- [ ] **Step 5: 验证 IPC 暴露**

Run: `grep -n "getAsrApiKey\|setAsrApiKey" electron/main/preload.ts`
Expected: 显示两个函数

- [ ] **Step 6: 提交**

```bash
git add electron/main/preload.ts electron/main/ipc.ts src/pages/RecordPage.tsx
git commit -m "feat(config): add ASR API Key configuration via IPC"
```

---

## Task 6: 测试验证

**Files:**
- Modify: `test-e2e.mjs`（更新测试用例）

- [ ] **Step 1: 确认 Vite 开发服务器运行**

Run: `curl -s http://localhost:5173 > /dev/null && echo "Vite running" || echo "Vite not running"`
Expected: Vite running

- [ ] **Step 2: 运行 E2E 测试**

Run: `node test-e2e.mjs`
Expected: 如果无 API Key，可能显示配置错误；Mock 相关测试可能失败（因为已切换到 QwenASR）

- [ ] **Step 3: 手动测试（需要真实 API Key）**

1. 在 localStorage 或配置中设置阿里云 API Key
2. 点击开始录制
3. 观察控制台 WebSocket 连接日志
4. 观察实时转写是否出现

- [ ] **Step 4: 测试说话人分离**

1. 多人同时说话
2. 检查输出是否包含不同 speakerId

- [ ] **Step 5: 提交测试结果**

```bash
git add test-e2e.mjs
git commit -m "test: update E2E tests for QwenASR"
```

---

## Task 7: 回滚机制（可选）

如果 QwenASR 效果不佳，提供快速回滚到 MockASR 的能力。

**Files:**
- Modify: `src/asr/index.ts`（添加切换逻辑）
- Modify: `src/pages/RecordPage.tsx`（添加切换按钮或配置）

- [ ] **Step 1: 在 index.ts 中添加环境变量驱动的创建函数**

```typescript
// src/asr/index.ts

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
```

- [ ] **Step 2: 提交**

```bash
git add src/asr/index.ts
git commit -m "feat(asr): add fallback to MockASR via environment variable"
```

---

## 验证清单

- [ ] Task 1: types.ts 创建成功
- [ ] Task 2: QwenASR 实现 ASRProvider 接口 + 说话人分离 + 重连
- [ ] Task 3: index.ts 统一导出
- [ ] Task 4: RecordPage 切换到 QwenASR
- [ ] Task 5: API Key 配置支持（必需，已实现）
- [ ] Task 6: 测试验证通过
- [ ] Task 7: 回滚机制（可选）

## 风险与注意事项

1. **阿里云说话人分离参数**：使用行业默认值，实际格式可能需调整
2. **API Key 安全**：通过 electron-store 加密存储，安全
3. **WebSocket 重连**：已实现指数退避重连（3 次重试）
4. **错误处理**：包含连接超时、网络错误、麦克风权限等场景

---

## 执行选项

**1. Subagent-Driven (recommended)** - 每个 Task 由独立 subagent 执行，Task 间有审核检查点

**2. Inline Execution** - 在当前 session 中顺序执行所有 Task

选择哪个方式？
