# CyberEinstein 架构原则

- 状态：已接受
- 日期：2026-08-27

## 1. 产品定义

CyberEinstein 是 AI for Science（AI4S）工作台和科研执行系统。它服务的业务过程是科研，而不是对话：用户和 Agent 共同建设研究能力、知识、证据和经验基础，并通过可独立调用、按需组合的能力参与理解、复现、实验、验证与发现。它以科技向善和科研普惠为价值使命，让更多人有机会在热爱的方向上提出重要问题、验证想法并完成自己做科学家的梦想。

DeepSeek Harness 与 Cordis 是当前完整复用的 Agent 运行底座，但不是 CyberEinstein 的产品定义。第一阶段不 fork、不修改上游核心；科研能力以后通过独立 Cordis 插件增加。

## 2. 核心领域模型

### ResearchProgram

`ResearchProgram` 是系统的顶层领域对象，代表围绕一个研究方向持续积累的科研能力、领域知识、复现资产、失败经验和研究项目组合。它通过稳定标识关联这些长期资产，不要求它们处在同一个数据库事务边界内，也不会因为一篇论文完成而结束。

```text
ResearchProgram
├── CapabilityGraph
├── FieldMap
├── LiteratureReviews
├── ClaimGraph
├── ReproductionPortfolio
├── OpportunityMap
├── ScientificExperienceBase
├── ImpactAssessments
└── ResearchProjects
```

`ResearchProject` 是 `ResearchProgram` 下针对一个具体问题或假设发起的有边界研究任务。聊天记录、工具调用和文件都是项目活动，不是项目本身。

建议状态：

```text
proposed -> active -> under_review -> completed
                 \-> blocked
completed / blocked -> active
any non-final state -> archived
```

### 核心对象

| 对象 | 责任 |
| --- | --- |
| `ResearchProgram` | 管理一个方向的长期科研能力、知识、经验和项目组合 |
| `CapabilityGraph` | 描述算力、数据、软件、仪器、人员、成本和权限 |
| `FieldMap` | 记录领域历史、方法谱系、前沿进展、争议和关键参与者 |
| `LiteratureReview` | 保存问题范围、检索批次、来源访问级别、证据、反证、矛盾、缺口和停止决定 |
| `ClaimGraph` | 连接论文主张、支持证据、反证、复现状态和依赖关系 |
| `ReproductionPortfolio` | 管理论文复现范围、层级、结果和隐性实验细节 |
| `ReproductionCase` | 管理一篇论文或一组目标 Claim 的方法重建、运行证据、审查状态和剩余边界 |
| `OpportunityMap` | 记录异常、矛盾、性能瓶颈、知识空白和候选问题 |
| `ScientificExperienceBase` | 保存失败、异常、负结果、根因和验证过的修正规则 |
| `ImpactAssessment` | 评估预期受益、潜在伤害、双重用途、公平可及和对外边界 |
| `ResearchProject` | 推进一个具体科学问题或工程目标 |
| `ResearchQuestion` | 定义要回答的科学问题和成功标准 |
| `Hypothesis` | 描述可检验的主张、预测和证伪条件 |
| `StudyPlan` | 组织文献、实验、计算和审查任务 |
| `Experiment` | 保存方法、环境、参数、输入和运行状态 |
| `Evidence` | 记录来源、生成过程、结果和可信度 |
| `Claim` | 表达由证据支持或反驳的科研结论 |
| `Artifact` | 管理代码、数据、图表、报告和论文草稿 |
| `Review` | 独立检查方法、证据、复现性和结论边界 |

### 必须成立的规则

1. `Claim` 必须关联至少一条 `Evidence`，并记录反证和不确定性。
2. 计算或实验产生的 `Evidence` 必须追溯到具体运行、参数、输入和环境。
3. `Experiment` 在缺少复现信息时不能标记为已验证。
4. `ResearchProject` 在关键结论未通过独立审查时不能标记为完成。
5. 发表、对外发送、昂贵计算、数据删除和实验设备控制必须经过人类授权。
6. Agent 运行成功不等于科研结论成立，科研有效性由领域规则和审查决定。
7. 每个研究 Loop 在规划前必须检索相关经验，在结束后必须记录偏差和负结果。
8. 单次失败只能形成候选经验，未经独立验证不得晋级为系统规则或 Skill。
9. 任何经验规则都必须记录适用范围、可信度、版本和失效条件，并允许撤销。
10. 具有明显安全、伦理或双重用途风险的研究，在执行和公开前必须通过 `ImpactAssessment`。
11. 文献来源、数据来源、作者和人类贡献必须可追溯，AI 不得抹去真实贡献者的署名。
12. 降低科研使用门槛不得以降低证据、复现和审查标准为代价。
13. 元数据来源只能证明文献身份与候选关系，不能直接支持实质科研结论；摘要与全文证据必须明确区分。
14. `LiteratureReview` 只有在问题范围、支持与反对证据、关键缺口和停止理由均被记录后才可标记为完成；达到搜索深度或预算上限不等于完成。

## 3. 分层架构

```text
┌─────────────────────────────────────────────┐
│ Workbench UI                                │
│ 研究计划、能力、证据、经验、影响与时间线    │
├─────────────────────────────────────────────┤
│ Application / Use Cases                     │
│ 创建课题、推进研究、影响审查与高风险审批     │
├─────────────────────────────────────────────┤
│ CyberEinstein Research Plugins              │
│ 科研对象、状态转换、证据规则与经验晋级       │
├─────────────────────────────────────────────┤
│ DeepSeek Harness / Cordis                   │
│ Profile、Agent Loop、Session、Tools、Policy │
├─────────────────────────────────────────────┤
│ Infrastructure                              │
│ 模型、论文库、代码执行、数据、GPU、实验设备  │
└─────────────────────────────────────────────┘
```

依赖方向只能向下。科研状态和规则应在 CyberEinstein 插件内部保持清晰模块边界；Cordis 负责插件生命周期、服务依赖和事件扩展，不把业务规则散落进 Profile YAML 或提示词补丁。

## 4. Harness 接入决策

CyberEinstein 当前直接固定并完整复用 `@deepseek-ai/dsh@0.1.1-rc.2`。官方 `base`、`web` 和 `headless` Profile 以及其中的 Session、Agent Loop、工具、权限、持久化和 UI 都保持原样。

约束如下：

- 不 fork 或直接修改 DeepSeek Harness 核心来实现科研业务规则。
- 暂不重写官方 Profile，也不额外封装一套运行时接口。
- 新科研能力实现为独立 CyberEinstein Cordis 插件或插件组合包。
- 只有当官方底座明确不能满足产品需求时，才评估替换某个插件或调整 Profile。
- DeepSeek Harness 版本升级必须先验证官方 Profile 能完整组合并启动。
- Shell、文件编辑、网络和未来实验设备访问继续使用 dsh 的权限与审批机制，并按科研风险逐步收紧。

当前运行基线见 [harness-integration.md](harness-integration.md)。

## 5. 首个产品重点：PRAgent

PRAgent 是 Paper Reproduction Agent（论文复现 Agent），也是 CyberEinstein 进入 AI4S 的第一个产品入口和首个核心能力，但不等于产品的全部边界。它以版本化 `ReproductionCase` 为核心对象，将目标 Claim、方法重建、实验要求、Run、Evidence、Review、FailureLesson 和剩余边界连接起来，而不是把整篇论文压缩成一个总结或二元复现状态。

第一阶段验证以下可独立产生价值的能力：

- 从论文、DOI、来源文件或具体 Claim 中任意一种对象开始工作；
- 确认论文身份、权利边界和来源，并建立 Claim 目标账本；
- 重建公式、方法、参数、数据、环境、实验条件和未披露细节；
- 区分理论、计算、物理和混合验证，并登记基础设施与权限依赖；
- 执行当前可行的计算复现，为物理实验生成协议和证据交接；
- 通过机器检查、基线、稳健性测试和独立审查比较复现结果；
- 保存部分、受阻、无效和负结果，以及 FailureLesson 与明确剩余边界；
- 让复现案例中的所有对象可以继续被其他 AI4S 能力复用。

首个基础设施 bundle 是 `@cybereinstein/pragent-sources`，只提供论文发现和已知论文获取两个来源适配器。它们产生候选元数据或待持久化的来源内容，不直接创建“已复现”结论，也不拥有 `ReproductionCase` 状态。搜索适配器通过合规门面只暴露元数据发现；全文适配器仅使用开放获取或用户已有合法权限。两个适配器分别锁定运行环境并可独立启停，避免第三方 MCP 依赖或故障进入科研领域模型。

第二个 bundle `@cybereinstein/deep-literature-research` 在 DSH 中注册按需加载的文献调研 Skill。它以 `LiteratureReview` 契约组织问题分解、迭代检索、论文筛选、证据提取、反证搜索、缺口反思和综合，但不运行第二套 Agent Harness。DSH 继续负责 Agent Loop、subagent、workflow、会话和权限；Skill 负责版本化编排指导，JSON Schema 固定当前结构契约，后续领域服务负责持久化与不可绕过的状态规则。

`@cybereinstein/field-history` 是 `FieldMap` 的首个领域服务。它将引用扩展、相关性过滤、主题级前沿检索、关系分类和历史主干提取拆成独立模块，通过 OpenAlex 元数据与可用摘要构建两到三跳候选图，并输出 Cytoscape.js 图数据。关系标签均为待全文核验的假设；只有经过文献调研、引用语境核对或复现链连接后，才可以进入 Claim/Evidence 判断。

具体装配和运行边界见 [pragent-source-integrations.md](pragent-source-integrations.md)、[deep-literature-research.md](deep-literature-research.md) 与 [field-history.md](field-history.md)。

第一阶段不包含：

- 无人审批的自主发表；
- 直接控制真实实验设备；
- 覆盖所有科研学科；
- 用 Agent 自评替代独立验证；
- 为展示效果伪造科研发现。

## 6. 验收标准

首个版本必须证明：

1. 同一个复现案例可以跨多次 Agent 运行继续推进。
2. 任一复现结论可以反查原论文、目标 Claim、方法、数据、环境和运行轨迹。
3. 独立审查能够阻止证据不足的 Claim 被标记为已复现或已验证。
4. Harness 故障或替换不会破坏已有科研记录。
5. 高风险动作在未获授权时无法执行。
6. 新任务能够检索相关失败经验，并说明哪些经验影响了本轮判断。
7. 错误经验在未通过复验前不能自动改变全局科研策略。
8. 高影响研究能够说明预期受益者、潜在伤害、双重用途风险和缓解措施。
9. 科研成果能够保留来源、作者和人类参与者的真实贡献记录。
10. 文献调研能够区分元数据、摘要和全文证据，并在预算或访问受限时保留明确的部分结果与下一步行动。

更完整的发展路径和产品边界见 [development-vision.md](development-vision.md)。
