# AI 会议纪要工具 — 实现计划

> **执行方式:** 使用 superpowers:subagent-driven-development，逐任务执行
> **目标:** 交付可运行的 Electron 桌面应用，实现音频录制 → 实时转写 → AI 摘要 → 历史管理

---

## 架构概览

```
Electron 主进程
├── 音频捕获（ffmpeg + BlackHole/WASAPI）
├── 说话人分离（pyannote.audio）
├── 流式 ASR（飞书 / 腾讯会议 API，V1 用模拟数据）
└── AI 摘要（通义千问 / Kimi，用户填 API Key）
    └── React 渲染进程（本地页面）
        ├── 录制页（/）
        ├── 纪要页（/notes/:id）
        └── 历史页（/history）
```

**V1 ASR 说明:** 真实 ASR 接入需要申请 API，先用模拟流式数据演示 UI 流程，接口预留给真实 ASR。

---

## 技术栈

- Electron 28 + React 18 + TypeScript
- TailwindCSS（样式）
- electron-builder（打包）
- ffmpeg（音频捕获，内嵌）
- pyannote.audio（说话人分离）
- 本地 SQLite（历史数据存储）

---

## 文件结构

```
meeting-notes/
├── package.json
├── electron-builder.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts              # Vite + Electron 整合配置
├── src/
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts            # 主进程入口，窗口管理
│   │   ├── audio.ts            # ffmpeg 音频捕获逻辑
│   │   ├── speaker.ts          # pyannote 说话人分离
│   │   ├── transcriber.ts      # ASR 接口（模拟 → 真实）
│   │   ├── summarizer.ts       # AI 摘要接口
│   │   ├── store.ts            # SQLite 历史数据存储
│   │   └── preload.ts          # 预加载脚本，安全 bridge
│   ├── renderer/               # React 渲染进程
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── RecordPage.tsx       # 录制页（首页）
│   │   │   ├── NotesPage.tsx        # 纪要页
│   │   │   └── HistoryPage.tsx      # 历史页
│   │   ├── components/
│   │   │   ├── TranscriptBubble.tsx # 转写气泡
│   │   │   ├── SpeakerTag.tsx       # 说话人标签
│   │   │   ├── AISummary.tsx        # AI 摘要块
│   │   │   └── RecordingTimer.tsx    # 计时器
│   │   └── hooks/
│   │       └── useMeeting.ts         # 会议状态管理
│   └── shared/
│       └── types.ts             # 共享类型定义
└── docs/
    └── superpowers/
        ├── specs/2026-04-18-meeting-notes-design.md
        └── plans/2026-04-18-meeting-notes-plan.md
```

---

## 任务清单

### Task 1: 项目脚手架

**目标:** Electron + React + TypeScript + Vite + TailwindCSS 完整可运行项目

**验证:** `npm run dev` 启动 Electron 窗口，显示 React 页面，无报错

- [ ] Step 1: 初始化 `package.json`，安装依赖
- [ ] Step 2: 创建 Vite + Electron 整合配置
- [ ] Step 3: 创建 Electron 主进程入口 `src/main/index.ts`
- [ ] Step 4: 创建预加载脚本 `src/main/preload.ts`
- [ ] Step 5: 创建 React 入口 `src/renderer/main.tsx`
- [ ] Step 6: 配置 TailwindCSS
- [ ] Step 7: 创建基础 App.tsx 和路由结构
- [ ] Step 8: 运行 `npm run dev` 验证启动成功
- [ ] Step 9: 提交

---

### Task 2: 录制页 UI

**目标:** 录制页三个状态（空闲 / 录制中 / 异常）完整 UI，计时器工作

**验证:** 打开录制页，点击开始，计时器走动；点击停止，状态回归空闲

- [ ] Step 1: 创建 `RecordingTimer` 组件（useEffect + setInterval）
- [ ] Step 2: 创建 RecordPage.tsx，定义 `idle / recording / error` 三状态
- [ ] Step 3: 实现空闲状态 UI（大麦克风 + 两个按钮）
- [ ] Step 4: 实现录制中状态 UI（红点脉冲 + 计时器 + 实时预览区）
- [ ] Step 5: 实现异常状态 UI（红色告警 + 两个恢复按钮）
- [ ] Step 6: 添加状态切换逻辑（开始 / 停止 / 重新检测）
- [ ] Step 7: 验证：启动 → 点开始 → 计时器跑 → 点停止 → 回到空闲
- [ ] Step 8: 提交

---

### Task 3: IPC 通信 & 音频捕获

**目标:** 主进程音频捕获通过 IPC 传给渲染进程，渲染进程能接收转写数据

**验证:** 点击开始 → 控制台/日志显示 ffmpeg 启动 → 渲染进程收到模拟转写文字

- [ ] Step 1: 在 preload.ts 暴露安全的 `window.electronAPI`
- [ ] Step 2: 在 main/index.ts 注册 IPC handler
- [ ] Step 3: 实现 `src/main/audio.ts` — ffmpeg 调用逻辑（启动/停止）
- [ ] Step 4: 实现 `src/main/transcriber.ts` — 模拟 ASR（每秒推送一句）
- [ ] Step 5: IPC 通道：renderer 发 `start-recording` → main 返回 `transcript-text`
- [ ] Step 6: 在 RecordPage 中消费 `transcript-text`，渲染到实时预览区
- [ ] Step 7: 验证：点开始 → 实时预览区出现模拟转写文字
- [ ] Step 8: 提交

---

### Task 4: 说话人分离 & 真实 UI 数据流

**目标:** 说话人分离结果流入 UI，TranscriptBubble 组件显示说话人标签

**验证:** 模拟数据中说话人自动切换，UI 上显示不同颜色标签

- [ ] Step 1: 实现 `src/main/speaker.ts` — pyannote.audio 集成（mock → 真实）
- [ ] Step 2: 定义共享类型 `src/shared/types.ts`（Meeting, TranscriptSegment, Speaker）
- [ ] Step 3: TranscriptBubble 组件：颜色 + 说话人标签 + 时间戳 + 文字
- [ ] Step 4: 实时预览区接入 TranscriptBubble 流式列表
- [ ] Step 5: 新文字淡入动画（CSS transition）
- [ ] Step 6: 验证：开始录制 → 出现不同说话人标签的气泡
- [ ] Step 7: 提交

---

### Task 5: AI 摘要

**目标:** 录制停止后调用 AI 接口生成摘要，显示在纪要页

**验证:** 停止录制 → 出现"摘要生成中…" → 出现 AI 摘要内容

- [ ] Step 1: 实现 `src/main/summarizer.ts` — 通义千问/Kimi API 调用
- [ ] Step 2: 用户设置页面（简单 modal，输入 API Key 保存到 electron-store）
- [ ] Step 3: 停止录制时自动触发摘要生成
- [ ] Step 4: AISummary 组件：蓝底 + 左边框 + 行动项加粗
- [ ] Step 5: 验证：停止录制 → 看到 AI 摘要
- [ ] Step 6: 提交

---

### Task 6: 纪要页 & 历史页

**目标:** 完整纪要展示 + 历史列表 + 页面导航

**验证:** 录制停止 → 进入纪要页 → 看到完整摘要 + 转写 + 可编辑说话人姓名 → 返回历史页看到新会议

- [ ] Step 1: NotesPage.tsx：顶部信息栏 + AISummary + 说话人标签 + 转写列表 + 底部操作
- [ ] Step 2: 点击说话人标签 → 行内编辑姓名
- [ ] Step 3: 底部操作：复制全文（Markdown格式）
- [ ] Step 4: HistoryPage.tsx：会议列表卡片，按日期倒序
- [ ] Step 5: 左侧导航：Logo + 录制页 + 历史页（≤ 5 项）
- [ ] Step 6: 路由接入（react-router-dom）
- [ ] Step 7: 验证：完整流程跑通
- [ ] Step 8: 提交

---

### Task 7: 数据持久化（SQLite）

**目标:** 会议数据本地存储，崩溃恢复，历史记录查询

**验证:** 录制 → 停止 → 杀掉进程 → 重启 → 历史页看到上次的会议

- [ ] Step 1: 实现 `src/main/store.ts` — SQLite（better-sqlite3）CRUD
- [ ] Step 2: 每 30 秒自动保存当前录制状态
- [ ] Step 3: 启动时检查是否有未完成的录制，恢复提示
- [ ] Step 4: 历史页从 SQLite 加载会议列表
- [ ] Step 5: 验证：完成一次录制 → 重启应用 → 历史页显示记录
- [ ] Step 6: 提交

---

### Task 8: 打包 & 发布配置

**目标:** electron-builder 配置完成，可打出 .exe / .dmg 安装包

**验证:** `npm run build` 成功，无报错，产物存在

- [ ] Step 1: 配置 electron-builder.json
- [ ] Step 2: 配置 npm scripts（build + package）
- [ ] Step 3: 添加 README.md（安装 + 使用说明）
- [ ] Step 4: 本地打包验证（Linux .AppImage）
- [ ] Step 5: 提交

---

## 依赖清单

```json
{
  "electron": "^28.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "typescript": "^5.3.0",
  "vite": "^5.1.0",
  "@vitejs/plugin-react": "^4.2.0",
  "tailwindcss": "^3.4.0",
  "better-sqlite3": "^9.4.0",
  "electron-builder": "^24.9.0",
  "electron-store": "^8.1.0",
  "fluent-ffmpeg": "^2.1.2"
}
```
