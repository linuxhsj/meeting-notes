# AI 会议纪要工具 — 项目状态

## 问题解决
多人在线会议（飞书/腾讯会议/企微）自动生成会议纪要

## 目标用户
个人 / 团队，开会后想要快速拿到完整会议记录和摘要

## 成功标准
双击打开 → 加入会议 → 会议结束 → 拿到完整纪要

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Electron 28 | 跨平台，本地音频捕获 |
| 前端 | React 18 + TypeScript + TailwindCSS | 飞书蓝 UI |
| 路由 | React Router v6 | 三页面导航 |
| 国际化 | 自定义 i18n Context | 中英双语 |
| 数据持久化 | JSON 文件（electron-store） | 崩溃恢复 |
| AI 摘要 | 通义千问 / Kimi API | 用户自填 Key |
| ASR（V1） | 模拟流式数据 | 接口预留给真实 ASR |

## 架构

```
Electron 主进程
├── audio.ts        — ffmpeg 音频捕获（V1 mock）
├── transcriber.ts  — 转写器（V1 模拟 → 真实 ASR 预留接口）
├── speaker.ts      — 说话人分离（轮询 → pyannote.audio 预留）
├── summarizer.ts   — AI 摘要（通义千问/Kimi，含超时+错误处理）
├── store.ts        — JSON 持久化（崩溃恢复）
└── preload.ts      — 安全 IPC Bridge

React 渲染进程
├── RecordPage.tsx  — 录制页（三状态：空闲/录制中/异常）
├── NotesPage.tsx   — 纪要页（摘要+说话人+转写+操作）
├── HistoryPage.tsx  — 历史页（会议列表）
├── App.tsx         — 布局+导航+i18n 切换
└── i18n.tsx        — 中英翻译 Context
```

## 竞品学习

| 竞品 | Stars | 亮点 | 我们复用 |
|------|-------|------|---------|
| [realtime-translate](https://github.com/linuxhsj/realtime-translate) | — | ffmpeg+BlackHole 流式管道 | ✅ 核心架构 |
| [meetily](https://github.com/Zackriya-Solutions/meetily) | 11.2k | 智能混音、说话人分离 | ✅ 说话人分离 |
| [Natively](https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant) | 981 | 实时性、跨平台兼容 | ✅ 延迟目标 |
| [transcribe-anything](https://github.com/zackees/transcribe-anything) | 1.2k | pyannote.audio 说话人分离 | ✅ pyannote.audio |

**我们不做的：**
- ❌ API key 复杂配置 → 零配置开箱即用
- ❌ PRO 收费 → 全部免费

## 设计规范

| 属性 | 值 |
|------|------|
| 主色 | 飞书蓝 `#3770FF` |
| 背景 | `#FFFFFF` |
| 文字 | `#333333` / `#666666` |
| 间距基准 | 8px |
| 圆角 | 8px |
| 字体 | 系统默认字体 |
| 布局 | 单栏，操作靠上 |

## MVP 聚焦

- ✅ 音频：自动检测默认设备，一键切换
- ✅ 说话人：V1 轮询分离（说话人 1/2/3），会后可编辑姓名
- ✅ 导出：V1 一键复制全文（Markdown 格式）
- ✅ 断线：每条转写后自动保存，崩溃可恢复
- ✅ 实时：流式转写文字，计时器实时显示
- ✅ AI 摘要：录制完成后生成，含超时和错误处理
- ❌ 导出 PDF / Word（V2）
- ❌ 真实 ASR 接入（V2）
- ❌ pyannote.audio 说话人分离（V2）

## 项目结构

```
meeting-notes/
├── electron/main/          # Electron 主进程
│   ├── index.ts            # 窗口管理
│   ├── preload.ts          # IPC 安全 Bridge
│   ├── ipc.ts              # IPC 通道注册
│   ├── audio.ts            # 音频捕获（预留）
│   ├── transcriber.ts       # 转写器（V1 mock）
│   ├── speaker.ts           # 说话人分离（V1 mock）
│   ├── summarizer.ts        # AI 摘要（通义千问/Kimi）
│   └── store.ts            # JSON 持久化
├── src/
│   ├── pages/
│   │   ├── RecordPage.tsx  # 录制页
│   │   ├── NotesPage.tsx    # 纪要页
│   │   └── HistoryPage.tsx  # 历史页
│   ├── App.tsx             # 布局+导航+i18n
│   ├── i18n.tsx           # 中英翻译
│   └── shared/types.ts     # 共享类型
├── docs/superpowers/
│   ├── specs/2026-04-18-meeting-notes-design.md
│   └── plans/2026-04-18-meeting-notes-plan.md
├── test-e2e.mjs            # E2E 测试
├── electron-builder.json   # 打包配置
└── README.md               # 中英双语说明
```

## 运行命令

```bash
npm install           # 安装依赖
npm run dev           # 开发模式（Vite + Electron）
npm run build         # 打包（产出 .exe / .AppImage）
node test-e2e.mjs     # E2E 测试
```

## GitHub

https://github.com/linuxhsj/meeting-notes

## 状态

- [x] Step 1: 现有工具检查完毕
- [x] Step 2: 需求确认
- [x] Step 3: 竞品调研
- [x] Step 4: UI 设计（Visual Companion + 用户审核通过）
- [x] Step 5: 任务拆解（8 个任务）
- [x] Step 6: 执行（8 个任务全部完成，代码已审核并修复 7 处问题）
- [ ] Step 7: 测试（E2E 测试套件已就绪，待完善）
