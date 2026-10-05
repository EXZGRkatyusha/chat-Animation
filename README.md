# Git 学习小助手（微信聊天动画）

以**微信聊天动画**为载体，逐条演示「本地 Git 学习」全过程的 Web 作品：
从 `git init`、`git add/commit`，到分支合并、回退（restore/reset/revert），再到连接远程仓库协作（remote/push/pull/PR）。
同时以 **GitCode MCP** 完成远程仓库协作，并提供配置、演示脚本与真实调用日志作为证据。

## 运行

直接用浏览器打开 `index.html` 即可（纯静态，无依赖），页面会自动播放聊天气泡动画并循环演示。

## 作品结构

```
index.html              # 微信聊天动画：演示本地 Git 学习（核心交付）
scripts/mcp-demo.mjs    # 一键通过 GitCode MCP 完成协作流程的演示脚本
docs/mcp-setup.md       # GitCode MCP 配置与安装说明
docs/mcp-demo-note.md   # 由 MCP 工具创建的文件（协作流程证据）
logs/mcp-call-log.txt   # MCP 真实调用日志（请求/响应）
```

## 与赛题验收标准对照

| 验收要点 | 对应交付 |
|----------|----------|
| 以微信聊天动画（Web 效果）为载体展示本地 Git 学习 | `index.html`：聊天气泡逐条讲解并演示 `git init/add/commit/log/branch/merge/restore/reset/revert/remote/push/pull` 等 |
| 提供 GitCode MCP 接入证据 | `docs/mcp-setup.md`（配置）、`scripts/mcp-demo.mjs`（演示脚本）、`logs/mcp-call-log.txt`（调用日志） |
| 证明完成建远程仓 / push / 拉取最新 / 开特性分支 / 创建合并请求 | 本仓库的远程地址、提交历史、分支与合并请求记录；并由 MCP 工具在日志中复现上述环节 |

## Git 协作流程（本仓库真实历史）

- 建远程仓：`https://gitcode.com/katyusha-/chat-Animation.git`
- 提交历史：`v1 静态聊天界面 → v2 消息自动播放动画 → v3 优化细节与主题 → feat: 霓虹渐变气泡与赛博朋克标题栏 → Merge feat-neon`
- 特性分支与合并请求：见仓库 Branches / Pull Requests 记录及 `logs/mcp-call-log.txt`