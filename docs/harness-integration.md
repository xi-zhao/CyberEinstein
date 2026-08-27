# DeepSeek Harness 底座基线

- 状态：已接入官方完整底座
- 日期：2026-08-27
- 固定版本：`@deepseek-ai/dsh@0.1.1-rc.2`

## 当前决策

第一阶段完整复用 DeepSeek Harness，不 fork、不修改上游核心，也不额外封装另一套 Agent Runtime。CyberEinstein 直接使用 dsh 已有的：

- Cordis 插件生命周期与依赖注入；
- `base`、`web` 和 `headless` Profile；
- Agent Loop、Session 与运行事件；
- 模型适配、工具、文件和 Shell 能力；
- 会话持久化、权限、审批与沙箱策略；
- 官方 Web 工作台和 headless 入口。

后续的科研能力以独立 Cordis 插件或组合包加入，例如能力图、论文 Claim、复现流程、证据账本和 RSI 经验回流。只有遇到明确产品缺口时，才替换某个上游插件或覆盖 Profile 配置。

## 本地运行

推荐 Node.js 24 或更高版本。

```bash
corepack pnpm install
corepack pnpm dsh:version
corepack pnpm dsh:check
```

`dsh:check` 使用官方 headless Profile 生成最终 Cordis 配置树，以验证整套插件组合能够被解析。该检查不会调用模型，不需要 API Key。

启动官方 Web 工作台：

```bash
corepack pnpm dsh:web
```

默认地址为 `http://127.0.0.1:3080`。运行真实模型任务前，在本地 `.env` 中设置：

```bash
DEEPSEEK_API_KEY=your-key
# DEEPSEEK_BASE_URL=https://your-compatible-endpoint
```

运行官方 headless Agent：

```bash
corepack pnpm dsh:headless -- "summarize this workspace"
```

项目脚本把 `DSH_HOME` 放在 `.cybereinstein/dsh-home`，避免污染用户全局的 `~/.dsh`。该目录和 `.env` 都不会进入 Git。

## CyberEinstein 插件层

当前已落地两个边界独立的插件 bundle：

```text
CyberEinstein product
  -> CyberEinstein Cordis bundles
  -> official dsh profiles and services
  -> models, papers, code, data and lab infrastructure
```

`@cybereinstein/pragent-sources` 通过两个 `@deepseek-ai/dsh-mcp-client` 实例挂载论文发现和已知论文读取能力。来源适配器与科研业务对象保持分离：它们只负责外部系统协议和来源内容读取，受控 Artifact 保存、`ReproductionCase`、Claim、证据和失败经验规则仍属于 CyberEinstein 领域插件。

`@cybereinstein/deep-literature-research` 直接向 DSH 的 Skill Registry 注册 `deep-literature-research`，组合现有论文来源、subagent 和 `workflow` 完成文献调研。它不启动 LangGraph、Deep Agents、GPT Researcher 或独立模型客户端，因此不存在第二套 Session、权限、模型密钥和 Agent Loop。编排指导放在版本化 Skill，`LiteratureReview` 结构放在 JSON Schema；未来不可绕过的持久化和状态规则仍应进入领域服务，不能只依赖提示词。

`corepack pnpm setup` 将两个 bundle 都安装到项目隔离的 headless/web Profile，不改官方 bundle 或上游源码。也可以使用 `pragent:sources:setup` 和 `deep-research:setup` 分别装配。

插件应继续通过 Cordis 的 Service、事件和可逆 effect 接入已有能力。科研业务状态和规则放在插件自己的模块中，不散落到 YAML，也不能只靠提示词约束。来源与 Deep Research 的具体边界见 [pragent-source-integrations.md](pragent-source-integrations.md) 和 [deep-literature-research.md](deep-literature-research.md)。

## 升级规则

DeepSeek Harness 仍处于开发者预览阶段。升级固定版本前只做三项检查：

1. 查看上游破坏性变更和安全说明。
2. 运行 `corepack pnpm dsh:check`，确认完整 Profile 仍能组合。
3. 在隔离目录中分别验证一次 Web 启动和 headless 任务。
