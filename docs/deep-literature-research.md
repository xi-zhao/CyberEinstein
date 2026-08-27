# Deep Literature Research 集成

- 状态：首个 DSH 原生能力已可装配
- 日期：2026-08-27
- Cordis bundle：`@cybereinstein/deep-literature-research@0.1.0`
- Skill：`deep-literature-research`

## 1. 产品边界

Deep Literature Research 是 CyberEinstein 的文献调研能力。它服务于 `FieldMap`、PRAgent 的论文选择与 Claim 背景、研究机会识别和新课题立项，但不等于 PRAgent，也不拥有论文复现状态。

核心产出是版本化 `LiteratureReview`：它保存研究问题、范围、子问题、检索批次、候选论文、访问级别、证据、反证、矛盾、缺口、失败经验和停止理由。长篇综述只是这个对象的一种展示形式。

这项能力不是固定流水线。用户可以只调用其中一个原子动作，例如：

- 为一个 Claim 查找先行工作；
- 重建某方向的发展历史和方法谱系；
- 对一组论文做筛选和去重；
- 专门寻找反证、复现失败或相互冲突的结果；
- 审计现有综述的证据覆盖和引用边界；
- 根据新论文重新打开并修正旧结论。

## 2. 为什么不直接嵌入另一套 Harness

本轮比较了几类主流开源实现：

| 项目 | 可复用价值 | 不直接作为当前运行内核的原因 |
| --- | --- | --- |
| [LangChain Open Deep Research](https://github.com/langchain-ai/open_deep_research) | 问题分解、研究者并行、缺口反思、MCP 和 Deep Research Bench 评估 | 依赖 LangGraph Server 和独立模型路由；仓库已于 2026-08-21 归档，适合作为方法与评估参考，不适合作为新运行依赖 |
| [LangChain Deep Agents](https://github.com/langchain-ai/deepagents) | 长任务规划、subagent、文件系统、记忆、人工审批和 Skill | 它本身就是完整 Agent Harness，与 DSH 的会话、工具、subagent、权限和 Skill 重叠 |
| [dzhng/deep-research](https://github.com/dzhng/deep-research) | 小型递归搜索实现，清楚展示 breadth/depth 与反复生成方向 | 默认再引入 Firecrawl、独立 LLM 调用和报告生成循环，来源与模型边界会重复 |
| [Tongyi DeepResearch](https://github.com/Alibaba-NLP/DeepResearch) | 长程信息检索模型、训练和 benchmark 资产 | 当前是 30B-A3B 模型与推理栈，更适合作为未来可选模型能力，而不是文献调研领域对象 |
| [GPT Researcher MCP](https://github.com/assafelovic/gptr-mcp) | 已提供单次 Deep Research MCP 工具 | 仍隐藏第二套 Agent 循环；其主项目还有一个[关于 WebSocket MCP 配置命令注入的公开未修复报告](https://github.com/assafelovic/gpt-researcher/issues/1694)，当前不进入供应链 |

因此首期只复用这些项目已验证的 Deep Research 方法，不复制其运行时。循环仍由 DeepSeek Harness 执行，论文来源仍经过 CyberEinstein 已收紧的 `paper_search` 和 `paper_fetch` 门面，科研契约由 CyberEinstein 自己维护。

## 3. 核心对象

`LiteratureReview` 的最小结构定义在 `packages/deep-literature-research/literature-review.schema.json`：

```text
LiteratureReview
├── Question + Scope
├── Subquestions
├── SearchBatches
│   ├── Queries
│   ├── SourceErrors
│   ├── NegativeResults
│   └── Reflection
├── Sources + AccessLevel
├── Evidence
├── Conclusions + CounterEvidence
├── Contradictions
├── Gaps
├── FailureLessons
└── StopDecision
```

建议状态包括 `scoping`、`investigating`、`synthesizing`、`under_review`、`partial`、`blocked`、`stopped` 和 `complete`。状态只是当前工作投影，不构成只能向前走的阶段机；新证据可以重新打开任何子问题或结论。

## 4. 研究循环

Skill 将成熟 Deep Research 方法压缩为一个由证据缺口驱动的循环：

```text
读取适用失败经验
-> 选择当前最有信息价值的子问题
-> 检索、筛选或读取
-> 记录证据、反证、错误和负检索结果
-> 检查矛盾与缺口
-> 修订问题、检索或综合
-> 形成显式停止决定
```

每一轮都必须回答四个问题：本轮改变了什么判断、哪些结论仍无证据、什么结果可能推翻当前综合、下一步哪个动作的信息价值最高。独立子问题足够多时可以使用 DSH `workflow` 或 subagent 扇出，但最终结论不能由投票、平均分或模型自信度决定。

## 5. 证据规则

- 元数据只证明论文身份和候选关系，不能直接成为实质科学结论的 `Evidence`。
- 摘要、全文和用户提供资料必须明确区分；无法取得全文时不能声称检查过方法、图表或附录。
- 每条证据保存稳定论文标识和可检查定位；全文证据应尽量精确到章节、图、表、公式、页或段落。
- 重要结论必须同时记录支持证据、已发现的反证和仍未执行的反证检索。
- 来源错误、空结果和误导性检索词是研究记录，不应被静默丢弃。
- 不使用 Sci-Hub，不绕过付费墙，不关闭 SSRF 防护，不虚构访问权限或引用。
- 达到 breadth、depth、token 或时间上限只说明预算耗尽，不自动满足 `complete`。

## 6. 安装和调用

统一安装全部当前能力：

```bash
corepack pnpm install
corepack pnpm setup
corepack pnpm deep-research:check
```

也可以只安装该 bundle：

```bash
corepack pnpm deep-research:setup
```

它会把本地 package 安装到项目隔离的 headless 和 web Profile，并验证最终 Cordis 配置中存在 `cybereinstein-deep-literature-research`。没有新增 Python 环境、浏览器、模型 SDK 或 API Key。

在 DSH 中可以自然提出文献调研任务，也可以用 `/deep-literature-research` 显式加载 Skill。模型需要论文时会组合稳定工具名：

- `mcp__paper_search__discover_papers`
- `mcp__paper_fetch__resolve_paper`
- `mcp__paper_fetch__has_fulltext`
- `mcp__paper_fetch__fetch_paper`

独立关闭能力：

```bash
CYBEREINSTEIN_DEEP_RESEARCH_ENABLED=false corepack pnpm dsh:web
```

关闭 Deep Research 不会关闭论文搜索或获取；关闭某个论文来源时，Skill 会使用仍可用的授权来源并明确报告缺失能力。

## 7. 当前边界

- 当前 bundle 提供版本化协议、结构契约和 DSH Skill，还没有独立的 `LiteratureReview` 持久化服务；默认结果保存在会话中，未经用户或应用层授权不自动写文件。
- `FailureLesson` 领域服务尚未落地。Skill 必须在服务不可用时明确说明，不能假装已经完成经验检索。
- 现有 `paper_fetch` 仍受当前网络 DNS 与 SSRF 防护边界影响；`metadata_only` 是诚实的部分结果，不是全文成功。
- 还没有在真实科学问题集上校准质量。下一步评估应分别测量引用身份正确率、全文访问诚实度、证据定位、反证召回、矛盾保留、问题覆盖和停止决定，而不是只让另一个模型给长报告打总分。
