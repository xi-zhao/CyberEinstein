# CyberEinstein 架构原则

- 状态：已接受
- 日期：2026-08-26

## 1. 产品定义

CyberEinstein 是 AI 科学家工作台。它服务的业务过程是科研，而不是对话：用户和 Agent 共同建设一个研究方向的能力、知识和经验基础，并持续推进其中的研究项目，直到形成经过证据支持、能够复现并接受审查的科研成果。它以科技向善和科研普惠为价值使命，让更多人有机会在热爱的方向上提出重要问题、验证想法并完成自己做科学家的梦想。

DeepSeek Harness 与 Cordis 是当前完整复用的 Agent 运行底座，但不是 CyberEinstein 的产品定义。第一阶段不 fork、不修改上游核心；科研能力以后通过独立 Cordis 插件增加。

## 2. 核心领域模型

### ResearchProgram

`ResearchProgram` 是系统的顶层领域对象，代表围绕一个研究方向持续积累的科研能力、领域知识、复现资产、失败经验和研究项目组合。它通过稳定标识关联这些长期资产，不要求它们处在同一个数据库事务边界内，也不会因为一篇论文完成而结束。

```text
ResearchProgram
├── CapabilityGraph
├── FieldMap
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
| `ClaimGraph` | 连接论文主张、支持证据、反证、复现状态和依赖关系 |
| `ReproductionPortfolio` | 管理论文复现范围、层级、结果和隐性实验细节 |
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

## 5. 首条产品闭环

第一阶段只实现一个纵向场景：盘点真实科研能力，选择窄研究方向，建立发展脉络和 Claim 图，复现锚点论文，从异常或瓶颈中形成可检验假设，再运行带 RSI 经验回流的计算实验，最终经过独立审查生成可复现研究报告。

第一阶段不包含：

- 无人审批的自主发表；
- 直接控制真实实验设备；
- 覆盖所有科研学科；
- 用 Agent 自评替代独立验证；
- 为展示效果伪造科研发现。

## 6. 验收标准

首个版本必须证明：

1. 同一个研究计划和项目可以跨多次 Agent 运行继续推进。
2. 任一结论可以反查文献、实验、数据和运行轨迹。
3. 独立审查能够阻止证据不足的项目进入完成状态。
4. Harness 故障或替换不会破坏已有科研记录。
5. 高风险动作在未获授权时无法执行。
6. 新任务能够检索相关失败经验，并说明哪些经验影响了本轮判断。
7. 错误经验在未通过复验前不能自动改变全局科研策略。
8. 高影响研究能够说明预期受益者、潜在伤害、双重用途风险和缓解措施。
9. 科研成果能够保留来源、作者和人类参与者的真实贡献记录。

更完整的发展路径和产品边界见 [development-vision.md](development-vision.md)。
