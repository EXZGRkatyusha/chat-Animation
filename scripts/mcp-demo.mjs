#!/usr/bin/env node
// mcp-demo.mjs —— 通过 GitCode MCP（stdio）一键演示协作流程并生成调用日志
//
// 作用：以 MCP 协议连接本地 gitcode-mcp server，依次调用工具完成：
//   读取身份/仓库 → 查看分支与提交（拉取最新）→ 开特性分支 → 提交文件 → 创建合并请求(PR)
//   全过程写入 logs/mcp-call-log.txt，作为“接入 GitCode MCP”的可核验证据。
//
// 用法（PowerShell）：
//   $env:GITCODE_TOKEN="<你的 GitCode Token>"
//   node scripts/mcp-demo.mjs
//
// 可用环境变量覆盖：
//   GITCODE_TOKEN   必填，GitCode 访问令牌
//   GITCODE_PY      python 解释器（默认指向已装 mcp 的 venv）
//   GITCODE_SERVER  gitcode-mcp server.py 路径
//   DEMO_OWNER      GitCode 用户/组织（默认 katyusha-）
//   DEMO_REPO       仓库名（默认 chat-Animation）
//   DEMO_BRANCH     演示分支名（默认 feat/mcp-evidence-<时间戳>）

import { spawn } from "node:child_process";
import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const PY = process.env.GITCODE_PY || "C:\\Users\\wwz\\AppData\\Local\\gitcode-mcp-venv\\Scripts\\python.exe";
const SERVER = process.env.GITCODE_SERVER || "D:\\code_art\\gitcode-mcp\\server.py";
const TOKEN = process.env.GITCODE_TOKEN || "";
const OWNER = process.env.DEMO_OWNER || "katyusha-";
const REPO = process.env.DEMO_REPO || "chat-Animation";
const LOG = process.env.DEMO_LOG || path.join(root, "logs", "mcp-call-log.txt");

if (!TOKEN) {
  console.error("❌ 缺少 GITCODE_TOKEN（请先设置环境变量）");
  process.exit(1);
}
fs.mkdirSync(path.dirname(LOG), { recursive: true });
const logStream = fs.createWriteStream(LOG, { flags: "w" });
const log = (line) => logStream.write(line + "\n");

const child = spawn(PY, [SERVER], {
  env: { ...process.env, GITCODE_TOKEN: TOKEN, GITCODE_TOOLSETS: "all" },
  stdio: ["pipe", "pipe", "pipe"],
});
child.stderr.on("data", (d) => log("[server stderr] " + d.toString().trim()));

const rl = readline.createInterface({ input: child.stdout });
let nextId = 1;
const pending = new Map();
rl.on("line", (line) => {
  const t = line.trim();
  if (!t) return;
  let msg;
  try { msg = JSON.parse(t); } catch { return; }
  if (msg.id != null && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  }
});

function request(method, params) {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error("timeout: " + method)); }
    }, 30000);
  });
}
function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}
function redact(o) {
  return JSON.parse(JSON.stringify(o, (k, v) =>
    (typeof v === "string" && /token|secret|accessKey/i.test(k)) ? "***" : v));
}
async function callTool(name, args) {
  log(`\n>>> tools/call ${name}`);
  log("    args: " + JSON.stringify(redact(args)));
  const resp = await request("tools/call", { name, arguments: args });
  const text = (resp.result?.content || []).map((c) => c.text).join("\n")
    || JSON.stringify(resp.result ?? resp.error);
  log("    result: " + String(text).slice(0, 1500).replace(/\s+/g, " "));
  return resp;
}

(async () => {
  log("======== GitCode MCP 调用日志 ========");
  log("时间: " + new Date().toISOString());
  log("server: " + SERVER);
  log("owner/repo: " + OWNER + "/" + REPO);

  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "chat-animation-mcp-demo", version: "1.0.0" },
  });
  log("\n>>> initialize");
  log("    serverInfo: " + JSON.stringify(init.result?.serverInfo ?? {}));
  notify("notifications/initialized", {});

  // 1) 身份与仓库：证明 MCP 已连通并可读取远程仓库
  await callTool("gitcode_get_user", {});
  await callTool("gitcode_get_repo", { owner: OWNER, repo: REPO });

  // 2) 分支与提交：反映“拉取最新”的状态
  await callTool("gitcode_list_branches", { owner: OWNER, repo: REPO });
  await callTool("gitcode_list_commits", { owner: OWNER, repo: REPO });

  // 3) 开特性分支
  const branch = process.env.DEMO_BRANCH || ("feat/mcp-evidence-" + Date.now());
  await callTool("gitcode_create_branch", {
    owner: OWNER, repo: REPO, refs: "main", branch_name: branch,
  });

  // 4) 通过 MCP 提交文件（内容需 base64）
  const noteText = "# 通过 GitCode MCP 提交的演示文件\n\n本文件由 scripts/mcp-demo.mjs 经 GitCode MCP 工具 `gitcode_create_file` 创建。\n";
  await callTool("gitcode_create_file", {
    owner: OWNER, repo: REPO, path: "docs/mcp-demo-note.md",
    content: Buffer.from(noteText, "utf8").toString("base64"),
    message: "docs: 通过 GitCode MCP 提交演示文件",
    branch,
  });

  // 5) 建立合并请求
  await callTool("gitcode_create_pull", {
    owner: OWNER, repo: REPO,
    title: "演示：通过 GitCode MCP 建立合并请求",
    head: branch, base: "main",
    body: "由 scripts/mcp-demo.mjs 自动创建，用于证明 GitCode MCP 协作流程（开分支 → 提交 → PR）。",
  });

  log("\n演示分支: " + branch);
  log("======== 调用完成 ========");
  child.kill();
  logStream.end();
  setTimeout(() => process.exit(0), 500);
})().catch((e) => {
  log("\n[错误] " + e.message);
  child.kill();
  logStream.end();
  setTimeout(() => process.exit(1), 500);
});