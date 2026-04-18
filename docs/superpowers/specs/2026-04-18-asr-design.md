# ASR 实时语音识别方案

> 决策：不用 Whisper（本地效果差），用云端 ASR
> 参考：https://github.com/linuxhsj/realtime-translate（NVIDIA Riva）

---

## 最终方案

```
麦克风音频（MediaRecorder）
        ↓
  PCM 二进制音频块（每 ~100ms）
        ↓
  WebSocket 连接
  wss://dashscope.aliyuncs.com/api-ws/v1/inference
  (Bearer Token 认证)
        ↓
  Qwen-ASR-Realtime 返回 JSON
  {"payload":{"output":{"sentence":{"text":"..."}}}}
        ↓
  转写文字 → UI 实时显示
```

---

## 技术对比

| 方案 | 延迟 | 准确率 | 成本 | 依赖 |
|------|------|--------|------|------|
| Whisper（本地）| 500-2000ms | ~85% | 免费 | Python 3.8+ / GPU |
| NVIDIA Riva ASR | 200-500ms | ~95% | 按量 | NVIDIA API Key |
| **Qwen-ASR-Realtime** | **低** | **高** | **DashScope 额度** | **通义千问 API Key** |
| DeepSeek ASR | 待确认 | — | — | — |

**选择 Qwen-ASR-Realtime：**
- DashScope 与 AI 摘要共用同一个 Key，用户只需配一次
- WebSocket 接口，支持实时流式
- 无需额外安装 Python 或本地模型

---

## Qwen-ASR-Realtime WebSocket API

### 连接信息

| 项目 | 值 |
|------|-----|
| 端点 | `wss://dashscope.aliyuncs.com/api-ws/v1/inference` |
| 认证 | `Authorization: Bearer {DASHSCOPE_API_KEY}` |
| 模型 | `paraformer-realtime-8k-v2` |

### 音频格式

- 支持格式：`pcm`, `wav`, `mp3`, `opus`, `speex`, `aac`, `amr`
- 推荐：`pcm`，16kHz，单声道
- 发送频率：每约 100ms 发一个音频块

### 请求流程

```
1. 建立 WebSocket 连接（带上 Bearer Token）
2. 发送初始化 JSON：
   {"header": {"appkey": "...", "algorithm": "paraformer", ...}}
3. 持续发送二进制音频块
4. 接收实时识别结果
```

### 响应格式

```json
{
  "header": {
    "task_id": "xxx",
    "event": "result-generated"
  },
  "payload": {
    "output": {
      "sentence": {
        "begin_time": 170,
        "end_time": null,
        "text": "好，我知道了",
        "sentence_end": true,
        "words": [
          {"begin_time": 170, "end_time": 295, "text": "好", "punctuation": "，"}
        ]
      }
    },
    "usage": {"duration": 3}
  }
}
```

---

## 平台差异

| 平台 | 麦克风捕获方式 | 说明 |
|------|------------|------|
| **Linux** | `MediaRecorder` API（浏览器）| Electron 内置，跨系统一致 |
| macOS | `MediaRecorder` API | 同上 |
| Windows | `MediaRecorder` API | 同上 |

> 注：原 realtime-translate 使用 ffmpeg 捕获系统音频（可捕获任意应用声音），
> V1 先用麦克风，V2 考虑接入 ffmpeg 支持系统音频捕获。

---

## 存储安全

| 数据 | 存储 | 是否上传 |
|------|------|---------|
| DashScope API Key | `electron-store`（本地加密）| ❌ 不上传 |
| 会议转写文字 | 本地 JSON 文件 | ❌ 不上传 |
| AI 摘要 | 本地 JSON 文件 | ❌ 不上传 |

---

## 实现计划

### Task A: WebSocket ASR 模块
- `src/asr/qwen-websocket.ts`
- WebSocket 连接管理
- 音频流发送
- 实时结果解析

### Task B: 麦克风捕获
- `MediaRecorder` API 捕获麦克风音频
- 转为 PCM 二进制
- 发送到 WebSocket

### Task C: RecordPage 集成
- 替换 V1 模拟数据
- 真实 ASR 结果 → 实时转写

### Task D: API Key 配置
- UI 设置页面
- 保存到 electron-store

---

## 其他 ASR 选项（备选）

### DeepSeek ASR
待调研，搜索结果显示 DeepSeek 目前以 LLM 为主，ASR 能力待确认。

### Azure Speech SDK
`azure-samples/cognitive-services-speech-sdk`（3.4k stars）
- 支持 Node.js / 浏览器
- 实时语音识别 + 说话人分离
- 需要 Azure 账号和 Speech API Key
- 参考：https://github.com/azure-samples/cognitive-services-speech-sdk

### NVIDIA Riva ASR（realtime-translate 用）
- 需要 Python 3.8+
- riva-client 依赖
- ffmpeg + BlackHole 捕获系统音频
- 效果最好但接入最复杂
