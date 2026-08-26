# PRAgent 来源集成

- 状态：首批适配器已可运行
- 日期：2026-08-26
- Cordis bundle：`@cybereinstein/pragent-sources@0.1.0`

## 1. 产品边界

PRAgent 的目标是形成可运行、可检查、可扩展的 `ReproductionCase`。论文搜索和全文获取只是其中的来源能力，不拥有 Claim、复现状态、证据判断或失败经验规则。

首批集成因此拆成两个原子适配器：

| 适配器 | 输入 | 输出 | 副作用 |
| --- | --- | --- | --- |
| `paper_search` | 研究问题、关键词、年份、来源范围 | 去重后的候选论文元数据和每个来源的错误 | 只读网络请求，不下载论文 |
| `paper_fetch` | 已知 DOI、URL 或标题 | 标准化元数据、全文可用性、受限长度的结构化全文或明确缺失原因 | 只读网络请求；合规门面强制禁止 Artifact 写入 |

两者不是固定流水线。已有 DOI 时可直接使用 `paper_fetch`；只做领域扫描时可只使用 `paper_search`。未来任一适配器都可以替换，而不改变 PRAgent 的领域对象。

## 2. 上游与固定版本

| 能力 | 上游 | 固定版本 | 许可证 | 集成方式 |
| --- | --- | --- | --- | --- |
| 论文发现 | `openags/paper-search-mcp` | `0.1.4` | MIT | PyPI 包 + CyberEinstein 合规 MCP 门面 |
| 已知论文获取 | `Dictation354/paper-fetch-skill` | `5.5.0` | MIT | GitHub Release wheel，SHA-256 `3509da3d...15886c9a` |

两个上游需要不兼容的 Python MCP SDK 主版本，已分别固定为 `1.29.1` 和 `2.1.1`。因此它们保存在 `runtime/paper-search` 和 `runtime/paper-fetch`，各自拥有 `.python-version`、`pyproject.toml` 和 `uv.lock`。不要把它们合并到一个 Python 环境。

首期 `paper_fetch` 使用轻量 core。它能走标准 API 和无需浏览器的 HTML 路线，但不安装 Camoufox、Playwright 或 PDF 解析扩展。合规门面只暴露解析、全文可用性探测和无落盘读取三个工具，模型不能传入输出路径，也不能调用浏览器准备、缓存写入或批量下载。需要这些能力时应增加独立、可审查的领域能力或运行时变体，而不是在 MCP 调用时静默下载浏览器。

## 3. 合规门面

`paper-search-mcp 0.1.4` 的原生 MCP 同时暴露搜索、下载和可选 Sci-Hub 回退，其中统一下载工具的 Sci-Hub 默认值为开启。CyberEinstein 不直接装载这个原生工具面。

本项目的搜索门面只注册 `discover_papers`：

- 只调用上游的统一元数据搜索函数；
- 来源必须属于 `policy.json` 的明确允许列表；
- 默认来源为 arXiv、Crossref、OpenAlex 和 Semantic Scholar；
- 不暴露任何 `download_*`、`read_*` 或 Sci-Hub 工具；
- 不纳入 Google Scholar 自动抓取；
- 每个结果带 `adapter_policy.scihub_allowed=false`。

全文获取交给 `paper-fetch-skill`。该上游明确不绕过付费墙，只使用开放获取内容或操作者已有的合法访问权限。CyberEinstein 门面强制关闭浏览器自动准备和本地 Artifact 写入，避免外部 MCP 绕过 DSH 文件边界。后续保存动作必须由 CyberEinstein 自己的领域能力执行并记录来源、目标路径与审批状态。

该保证针对 Agent 注册到的 MCP 工具面，不等于任意 Shell 命令自动合规。部署时仍须保留 DSH 的 Shell 权限和人工审批边界，不能把上游原生命令行入口列为无人值守的允许命令。

## 4. 安装与验证

前置条件是 Node.js 24、pnpm 和 `uv`。在仓库根目录运行：

```bash
corepack pnpm install
corepack pnpm pragent:sources:setup
corepack pnpm pragent:sources:check
```

`setup` 做三件事：

1. 按两个 `uv.lock` 同步 Python 3.12 环境；
2. 将本地 bundle 安装进 `.cybereinstein/dsh-home` 的 headless/web Profile；
3. 组合两个最终 Cordis 配置，确认适配器行存在。

完成 setup 后，MCP 使用 `uv run --offline --locked` 启动：依赖不完整时会明确失败，不会在 Agent 启动阶段隐式下载或升级；这里的 `--offline` 只约束运行时依赖解析，不会阻止论文来源的只读网络请求。

`check` 会分别启动 MCP、完成 initialize 和 `tools/list`，并验证搜索侧只有一个工具且不存在 Sci-Hub 工具。联网验收使用：

```bash
corepack pnpm pragent:sources:smoke
```

它会实际搜索一次 arXiv，并对一篇已知 arXiv 论文执行无落盘抓取。成功调用不等于一定取得全文；输出会明确报告 `contentKind`、`hasFulltext` 和 warning 数量。

## 5. Agent 工具面

通过 DSH/Cordis 装配后，模型看到稳定的服务限定名：

- `mcp__paper_search__discover_papers`
- `mcp__paper_fetch__resolve_paper`
- `mcp__paper_fetch__has_fulltext`
- `mcp__paper_fetch__fetch_paper`

发现结果只是候选来源，全文结果只是待持久化的来源内容。后续领域插件必须继续完成论文身份确认、受控 Artifact 保存、Claim 拆分、来源记录、权利边界和复现证据判断。

## 6. 配置与独立启停

模型密钥和研究来源密钥分开保存。不要把来源密钥放进根 `.env`；按需复制：

```bash
cp config/pragent-sources.env.example .cybereinstein/pragent-sources.env
```

默认不需要任何来源密钥。CORE、DOAJ、Semantic Scholar、Unpaywall、Elsevier 或 Wiley 的可选增强配置见模板。

每个适配器可独立关闭：

```bash
CYBEREINSTEIN_PAPER_SEARCH_ENABLED=false corepack pnpm pragent:sources:setup
CYBEREINSTEIN_PAPER_SEARCH_ENABLED=false corepack pnpm dsh:web

CYBEREINSTEIN_PAPER_FETCH_ENABLED=false corepack pnpm pragent:sources:setup
CYBEREINSTEIN_PAPER_FETCH_ENABLED=false corepack pnpm dsh:web
```

`setup` 和 `check` 都遵循同一组开关：关闭的适配器不会同步运行时或启动探针，但 bundle 中的禁用行仍会保留，后续可以随时重新启用。

可选部署变量：

| 变量 | 用途 |
| --- | --- |
| `CYBEREINSTEIN_ROOT` | 非仓库根目录启动时指定项目绝对路径 |
| `CYBEREINSTEIN_SOURCES_ENV_FILE` | 覆盖来源专用环境文件路径 |

## 7. 失败边界

- 单个来源限流或不可用时，搜索结果保留该来源的错误，不伪造空白成功。
- 全文不可获取时，`paper_fetch` 应返回 `metadata_only`、warning 和来源轨迹，不把摘要标为全文。
- 如果当前 DNS、代理或安全网络把公网域名解析到 `198.18.0.0/15` 等保留地址，`paper_fetch` 的 SSRF 防护会拒绝请求并返回 `non-public address`。不要关闭该防护；应在具有正常公网 DNS 的执行环境中重试，或使用经过审批的网络出口。
- 浏览器/PDF 能力缺失属于可观察的基础设施边界，不能通过静默安装或绕过访问控制掩盖。
