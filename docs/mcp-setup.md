# GitCode MCP 接入说明

本作品通过 **GitCode MCP Server**（`gitcode-mcp`，基于 FastMCP 的 stdio 服务）把 GitCode 的仓库操作暴露为 MCP 工具，
用于完成「建远程仓 → push → 拉取最新 → 开特性分支 → 创建合并请求」的协作流程。

## 1. MCP 配置（CodeArts / MCP 客户端）

在 MCP 配置文件中注册 `gitcode` 服务（以下为脱敏示例）：

```json
{
  "mcp": {
    "gitcode": {
      "type": "local",
      "command": [
        "C:\\Users\\<user>\\AppData\\Local\\gitcode-mcp-venv\\Scripts\\python.exe",
        "D:\\code_art\\gitcode-mcp\\server.py"
      ],
      "enabled": true,
      "environment": {
        "GITCODE_TOKEN": "****（GitCode 访问令牌，勿提交明文）",
        "GITCODE_TOOLSETS": "all"
      }
    }
  }
}
```

> 说明：`GITCODE_TOOLSETS=all` 会启用全部工具集，含建仓/文件/分支/合并请求等。
> `GITCODE_TOKEN` 只放在本机配置里，**不写入仓库**。

## 2. 依赖安装

```powershell
# 1) 独立虚拟环境（避免污染全局）
python -m venv "$env:LOCALAPPDATA\gitcode-mcp-venv"

# 2) 安装依赖（注意：mcp 需锁 1.x，mcp 2.x 缺少 mcp.server.fastmcp）
& "$env:LOCALAPPDATA\gitcode-mcp-venv\Scripts\python.exe" -m pip install "mcp<2" aiohttp python-dotenv
```

## 3. 一键演示 + 调用日志

`scripts/mcp-demo.mjs` 会通过 MCP 协议依次调用工具，并把请求/响应写入 `logs/mcp-call-log.txt`：

```powershell
$env:GITCODE_TOKEN="<你的 GitCode Token>"
node scripts/mcp-demo.mjs
```

脚本覆盖的协作环节：

| 环节 | 调用的 MCP 工具 |
|------|-----------------|
| 读取身份 / 远程仓库信息 | `gitcode_get_user`、`gitcode_get_repo` |
| 查看分支与提交（拉取最新状态） | `gitcode_list_branches`、`gitcode_list_commits` |
| 开特性分支 | `gitcode_create_branch` |
| 提交文件（push 内容） | `gitcode_create_file` |
| 创建合并请求（PR） | `gitcode_create_pull` |

调用结果见 [`logs/mcp-call-log.txt`](../logs/mcp-call-log.txt)。