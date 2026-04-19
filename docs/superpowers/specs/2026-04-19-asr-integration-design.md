# ASR 实时语音识别接入设计

> 日期：2026-04-19
> 状态：草稿

## 目标

接入阿里云 QwenASR 实时语音识别，支持说话人分离，替代当前的 MockASR 模拟数据。

## 方案选择

| 方案 | 优点 | 缺点 |
|------|------|------|
| 完整适配器 | 扩展性好 | 工作量大 |
| **简化方案（当前）** | **快速上线** | **切换需改代码** |

## 技术架构

```
录音 → MediaRecorder → WebSocket → 阿里云 QwenASR
                                      ↓
                              实时转写 + 说话人分离
                                      ↓
                              JSON → UI 展示
```

## 文件改动

```
src/asr/
├── types.ts      # ASRSegment, ASRState 类型定义
├── mock.ts       # MockASR（保留开发测试用）
├── qwen.ts       # QwenASR 阿里云 WebSocket 客户端
└── index.ts      # 统一导出，默认导出 QwenASR

src/pages/RecordPage.tsx  # 切换 MockASR → QwenASR
src/components/          # 新增 API Key 配置组件（可选）
```

## 改动详情

### 1. 新增 types.ts

```typescript
export interface ASRSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
  speakerId: string
  speakerName: string
}

export type ASRState = 'connecting' | 'listening' | 'not-available' | 'error'
```

### 2. 改造 qwen.ts

- 复用现有 `qwen-websocket.ts` 代码
- 添加说话人分离配置参数
- 统一接口格式

### 3. RecordPage.tsx

```typescript
// 当前（MockASR）
import { MockASR } from '../asr/mock-asr'

// 改动后（QwenASR）
import { QwenASR } from '../asr/qwen'

// 录制开始
const startRecording = () => {
  const asr = new QwenASR()
  asr.start(apiKey, onSegment, onState)
}
```

### 4. API Key 配置

| 方式 | 实现 |
|------|------|
| 简单 | 录制页顶部提示"请配置 API Key"，点击跳转设置 |
| 完整 | 弹窗引导配置（可选 V2） |

## 阿里云 QwenASR 配置

### 说话人分离参数（待确认）

```typescript
// 初始化请求
{
  header: {
    appkey: 'audio-asr',
    algorithm: 'paraformer',
    model: 'paraformer-realtime-8k-v2',
    // 说话人分离参数（需查文档确认具体字段）
    // diarization_enabled: true,
    // max_speaker_count: 8,
  }
}
```

### 说话人输出格式（待确认）

```typescript
// 当前 Mock 输出
{ speakerId: 'sp-1', speakerName: '说话人 1' }

// 阿里云可能输出（需确认）
{ speaker_id: 1 } // 数字 ID，需映射为"说话人 1"
```

## 测试计划

1. 本地开发环境测试
2. 真实会议录音测试
3. 说话人分离准确率评估
4. 多人会议（8+ 人）压力测试

## 风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 说话人分离效果不佳 | 中 | 后续可切换 Azure |
| API Key 配置复杂 | 低 | 提供引导 UI |
| WebSocket 连接不稳定 | 中 | 添加重连逻辑 |

## 后续扩展

- V2：支持 Azure Speech（完整 ASR + 说话人分离）
- V2：适配器模式抽象（多服务切换）
- V2：PDF/Word 导出

## 负责人

- ASR 接入：待定
- UI 配置：待定
- 测试验证：待定
