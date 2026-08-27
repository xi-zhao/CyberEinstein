# CyberEinstein

[英文](README.md) | 中文

**面向真实科研与重要知识发现的 AI for Science（AI4S）工作台。**

CyberEinstein 的核心定位是 AI for Science（AI4S）：用 AI 帮助人理解研究方向、复现已知结果、设计和执行研究、判断证据并产生新知识。它不是一个通用聊天界面，也不以自动生成论文为终点。它把科研组织为相互连接的科学对象，并提供可以独立使用、按需组合的原子能力。论文、问题、假设、数据、异常、仪器或一次失败实验，都可以成为科研工作的起点。

> **使命**：我们希望让每一个人，都有机会在自己感兴趣的科研方向上成为爱因斯坦，完成自己做科学家的梦想。

> **架构原则**：CyberEinstein 是 AI4S 产品与科研系统，DeepSeek Harness 与 Cordis 提供完整运行底座，科研能力通过上层插件逐步加入。

## 产品愿景

CyberEinstein 将科研建模为一张持续演进的科学对象图：

```text
论文 --包含--> Claim
假设 --竞争或扩展--> Claim
Claim --由实验检验--> Experiment
Experiment --产生--> Evidence
Evidence --支持或反驳--> Claim
Review --质疑或确认--> Evidence
FailureLesson --约束--> Capability / Experiment
```

这不是一条强制执行的流水线。每个对象都保存独立有用的科研状态，每项能力都可以单独产生价值，不需要把整套流程跑完。文献研究、论文复现、工程优化、机制发现、证据验证和经验回流，只是基于同一张科研对象图形成的不同组合。

长期目标是让 AI 能够与人类科学家共同完成有原创性、可验证并真正产生影响的科研工作。

## 原子科研能力

每个 CyberEinstein 插件提供一个或多个边界清楚的科研能力，而不是独占一条端到端流程。

| 能力 | 典型输入 | 持久化贡献 |
| --- | --- | --- |
| 发现文献 | 问题、方向或 Claim | 候选来源和领域关系 |
| 深度文献调研 | 问题、论文集合或现有综述 | 检索轨迹、证据、反证、矛盾、缺口和停止决定 |
| 获取与解析资料 | DOI、URL 或文档 | 带来源记录的标准化 Artifact |
| 结构化 Claim | 论文、资料或证据 | 分类后的 Claim 和明确关系 |
| 设计或执行实验 | 假设与可用基础设施 | 计划、运行记录、产物和 Evidence |
| 验证或质疑 | Claim、Evidence 或运行结果 | 检查、反证和 Review 状态 |
| 记录失败经验 | 预期结果与实际结果 | 带范围和可信度的版本化 FailureLesson |
| 评估影响 | 问题、项目或结果 | 受益、风险和审批约束 |

每项能力都必须声明读取什么、产生什么、执行前提、副作用、验证方式和权限。只要原因与证据得到保留，受阻、失败和负结果同样是有效科研贡献。常见科研 Loop 是由这些能力组成的可选配方，而不是系统写死的阶段。

## PRAgent：论文复现 Agent

PRAgent，即 Paper Reproduction Agent（论文复现 Agent），是 CyberEinstein 首个也是最重要的产品能力。它是项目进入 AI4S 的第一个产品入口，但不等于 CyberEinstein 的全部边界。它负责把一篇身份明确的论文或一个具体科学 Claim，转化为可运行、可检查、可继续扩展的复现案例。

PRAgent 不是论文总结器，也不把复现简化成“成功或失败”的二元标签。它是一组拥有统一产品入口的原子能力：

- 确认论文身份并获取允许使用的资料，同时保留权利边界和来源记录；
- 将论文拆成明确的目标 Claim、方法、假设前提、证据、局限和未解决细节；
- 重建公式、参数、数据要求、软件环境、实验条件和隐性的实现选择；
- 判断每个目标属于理论、计算、物理实验还是混合验证，并登记所需基础设施和权限；
- 在基础设施允许时，建立并执行计算复现；
- 为物理实验 Claim 准备协议和证据交接，但在真实观测返回前不标记为已复现；
- 通过机器检查、基线、稳健性测试和独立审查，将生成结果与论文目标进行比较；
- 保存负结果、失败经验、审查状态、来源记录和明确的剩余复现边界。

PRAgent 最重要的产出是版本化的 `ReproductionCase`，其中连接目标 Claim、Experiment、Run、Evidence、Review、FailureLesson 和精确的复现边界。只要输入契约得到满足，每项能力都可以独立调用，每个产出也能够被后续科研能力继续复用。论文搜索 MCP、文档解析器、科学计算运行时、模拟器和实验室接口只是 PRAgent 背后可替换的适配器，不是产品本身。

## 核心原则

- **证据优先**：每个科研结论必须关联支持证据、反证和不确定性。
- **原子化与可组合**：每项科研能力都有独立作用、清楚边界和可复用输出。
- **科研普惠**：让更多人获得理解问题、设计研究和验证想法的能力，但不降低科学标准。
- **科技向善**：同时评估科研的预期受益、潜在伤害、双重用途和社会影响。
- **执行感知能力边界**：每个动作在运行前声明并检查所需算力、数据、软件、仪器、人员、成本和权限。
- **过程可追溯**：文献、提示、工具调用、代码、参数、数据和结果都进入研究记录。
- **成果可复现**：实验和计算必须保留足以复现的环境、输入和方法。
- **从错误中修正**：每次能力调用前都必须检索适用的失败经验，执行后记录偏差并回流经过验证的教训。
- **人类负责关键决策**：发表、外部写入、高成本计算和实验设备控制必须经过明确授权。
- **科研逻辑属于 CyberEinstein 插件**：业务对象和科研规则放在 CyberEinstein 自己的包中，不修改 DeepSeek Harness 核心。
- **通过 Cordis 插件扩展能力**：科研工具、模型、存储、策略和可选配方都通过原生插件体系装配。

## 系统边界

```text
CyberEinstein Workbench
  |-- 科研对象图与证据账本
  |-- 原子科研能力插件
  `-- 可选 Loop 与科研配方
          |
          v
DeepSeek Harness / Cordis
          |
          v
Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein 自己负责科研对象及其关系和状态变化、能力契约、证据规则、经验晋级、审批规则和用户体验。DeepSeek Harness 提供 Profile、Session、Agent 执行、运行轨迹、权限和 Cordis 插件编排。第一阶段完整复用这套能力，不 fork，也不修改上游核心。

## 第一阶段：PRAgent

首个可运行版本将以 PRAgent 为中心，验证一组可以独立产生价值的论文复现能力，并证明它们能够形成不同组合：

- 接受论文、DOI、来源文件或具体 Claim 作为相互独立的起点。
- 建立带有明确复现范围和成功标准的 Claim 目标账本。
- 重建方法、参数、数据、环境和缺失的实现细节。
- 区分计算与物理验证要求，不隐藏当前缺失的基础设施。
- 执行有边界的计算目标，并保存输入、输出和环境证据。
- 将结果与论文目标比较，记录检查、偏差、负结果和独立审查。
- 即使结果是部分完成、受阻、无效或等待物理证据，也返回可以继续使用的复现案例。

典型组合包括 `论文 -> Claim 目标`、`Claim -> 复现要求`、`计算 Claim -> Run -> Evidence`、`物理 Claim -> 实验协议 -> 待返回证据`，以及 `失败运行 -> FailureLesson -> 修订运行`。只要已有对象满足输入契约，能力就可以从该对象开始；无关工作不会被强制塞进同一条流水线。

首个验证场景可以从量子计算研究切入，但核心模型不绑定具体学科。

## 已接入的首批来源能力

仓库现在包含首个 CyberEinstein Cordis bundle：`@cybereinstein/pragent-sources`。它没有把第三方项目变成 PRAgent 本身，而是为后续复现能力提供两个可独立启停、可替换的来源适配器：

| 适配器 | 原子作用 | 当前边界 |
| --- | --- | --- |
| `paper_search` | 从 arXiv、Crossref、OpenAlex、Semantic Scholar 等来源发现候选论文 | 只返回元数据；合规门面不暴露下载、Sci-Hub 或 Google Scholar 抓取 |
| `paper_fetch` | 将已知 DOI、URL 或标题解析为元数据、可用性判断和允许访问的全文内容 | 不绕过付费墙；合规门面强制无落盘、无浏览器准备；当前轻量运行时不含浏览器与 PDF 扩展 |

Agent 中的工具名稳定为 `mcp__paper_search__discover_papers`、`mcp__paper_fetch__resolve_paper`、`mcp__paper_fetch__has_fulltext` 和 `mcp__paper_fetch__fetch_paper`。两个适配器使用各自的 Python 环境和 `uv.lock`，因为它们依赖不同主版本的 MCP SDK；一个来源故障或被替换不会污染另一个来源，也不会改变 `ReproductionCase` 的领域模型。来源内容后续由 CyberEinstein 领域插件在受控目录持久化，第三方 MCP 不能自行指定文件路径。

## Deep Literature Research：深度文献调研

仓库还包含独立 Cordis bundle `@cybereinstein/deep-literature-research`。它不是另一个 Agent Harness，而是向 DSH 注册按需加载的 `deep-literature-research` Skill，直接复用 DSH 的模型循环、Session、subagent、`workflow`、权限和现有论文来源。

它的核心产出是版本化 `LiteratureReview`，而不是一篇看起来完整的长报告：

```text
研究问题与范围
-> 子问题和竞争解释
-> 检索批次、候选论文与访问级别
-> 证据、反证、矛盾与缺口
-> 带有明确理由的继续、受阻或停止决定
```

这也不是固定流水线。用户可以单独执行领域历史重建、先行工作检索、论文筛选、反证搜索、争议分析、覆盖审计或证据综合；新证据可以重新打开旧结论。每批检索后都必须总结错误、负结果和判断偏差，并在下一轮规划前查询适用的失败经验。元数据不能直接支持实质科研结论，摘要和全文证据必须明确区分，达到检索深度或 token 上限也不等于调研完成。

选择 DSH 原生实现是有意的架构决策：LangChain Open Deep Research、Deep Agents、GPT Researcher 等项目都自带自己的模型与 Agent 循环，直接嵌入会重复 CyberEinstein 已选定的运行底座。我们复用其问题分解、并行调查、缺口反思和反证搜索方法，但科研对象、来源合规和状态契约由 CyberEinstein 自己维护。详见 [Deep Literature Research 集成](docs/deep-literature-research.md)。

## 项目状态

当前处于 AI4S 产品定义和架构奠基阶段。仓库已经固定并可直接运行官方完整底座 `@deepseek-ai/dsh@0.1.1-rc.2`，完成 PRAgent 来源适配器和 DSH 原生深度文献调研两个 bundle；没有 fork 或修改上游核心。下一里程碑仍以 PRAgent 为优先：建立可持久化的 `ReproductionCase` 领域服务，并让 `LiteratureReview` 通过同一证据边界为它提供研究脉络，而不是继续堆叠无边界工具。

## 开发者快速开始

推荐使用 Node.js 24 或更高版本。

```bash
corepack pnpm install
corepack pnpm setup
corepack pnpm pragent:sources:check
corepack pnpm deep-research:check
corepack pnpm dsh:check
corepack pnpm dsh:web
```

`setup` 会同步两个锁定的论文来源运行时，并把来源与 Deep Research bundle 一起安装到项目内的 headless 和 web Profile。`pragent:sources:check` 检查 MCP 工具边界，`deep-research:check` 检查 Skill 与 `LiteratureReview` 契约；`pragent:sources:smoke` 还会发起最小联网调用。在工作台中可以自然提出文献调研任务，也可以用 `/deep-literature-research` 显式加载 Skill。`dsh:web` 会在 `http://127.0.0.1:3080` 启动工作台，真实模型请求才需要 `DEEPSEEK_API_KEY`。详见 [PRAgent 来源集成](docs/pragent-source-integrations.md)、[Deep Literature Research 集成](docs/deep-literature-research.md) 和 [DeepSeek Harness 底座说明](docs/harness-integration.md)。

项目的完整发展方向见 [docs/development-vision.md](docs/development-vision.md)，详细架构决策见 [docs/architecture.md](docs/architecture.md)。
