# AI 会议纪要工具

## 问题解决
多人在线会议（飞书/腾讯会议/企微）自动生成会议纪要

## 目标用户
个人 / 团队，开会后想要快速拿到完整会议记录和摘要

## 成功标准
双击打开 → 加入会议 → 会议结束 → 拿到完整纪要

## 竞品学习

| 竞品 | Stars | 延迟 | 音频捕获 | 亮点 | 我们复用 |
|------|-------|------|---------|------|---------|
| [realtime-translate](https://github.com/linuxhsj/realtime-translate) | — | ASR 200-500ms，总 <1s | ffmpeg+BlackHole | 流式管道、极低延迟 | ✅ 核心架构 |
| [meetily](https://github.com/Zackriya-Solutions/meetily) | 11.2k | 未公开 | 双通道 | 智能混音、说话人分离 | ✅ 说话人分离 |
| [Natively](https://github.com/Natively-AI-assistant/natively-cluely-ai-assistant) | 981 | <500ms | Rust零拷贝双通道 | 实时性、跨平台兼容 | ✅ 延迟目标 |
| [transcribe-anything](https://github.com/zackees/transcribe-anything) | 1.2k | 非实时 | 文件/URL | pyannote说话人分离 | ✅ pyannote.audio |

**我们不做的：**
- ❌ API key 复杂配置 → 零配置开箱即用
- ❌ PRO 收费 → 全部免费

**技术架构：**
```
会议声音 → ffmpeg(跨平台) → Riva ASR(流式识别)
    → pyannote.audio(说话人分离)
    → 流式缓冲 → 通义千问/Kimi AI总结
    → 实时UI展示
```

## 技术栈
Electron + React + TailwindCSS + ffmpeg（内嵌）+ pyannote.audio + AI 摘要 API

## 页面
- `/` 录制页（首页）
- `/notes/:id` 纪要页
- `/history` 历史页

## 设计规范
- 主色：飞书蓝 `#3770FF`，背景 `#FFFFFF`
- 间距 8px，圆角 8px，系统字体，单栏
- 设计文档：`docs/superpowers/specs/2026-04-18-meeting-notes-design.md`

## 状态
- [x] Step 1: 现有工具检查完毕
- [x] Step 2: 需求确认
- [x] Step 3: 竞品调研
- [x] Step 4: UI 设计
- [ ] Step 5: 任务拆解
- [ ] Step 6: 执行
- [ ] Step 7: 测试
