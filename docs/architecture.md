# CyberEinstein 架构原则

- 状态：已接受
- 日期：2026-08-26

## 1. 产品定义

CyberEinstein 是 AI 科学家工作台。它服务的业务过程是科研，而不是对话：用户和 Agent 共同推进一个研究项目，直到形成经过证据支持、能够复现并接受审查的科研成果。

DeepSeek Harness 是默认 Agent 运行内核，但不是产品领域模型，也不是不可替换的基础设施。

## 2. 核心领域模型

### ResearchProject

`ResearchProject` 是系统的聚合根，代表一个有目标、有状态、有证据链的科研项目。聊天记录、工具调用和文件都是项目活动，不是项目本身。

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

## 3. 分层架构

```text
┌─────────────────────────────────────────────┐
│ Workbench UI                                │
│ 项目、假设、实验、证据、审查与研究时间线    │
├─────────────────────────────────────────────┤
│ Application / Use Cases                     │
│ 创建课题、推进研究、提交审查、批准高风险动作 │
├─────────────────────────────────────────────┤
│ Research Domain                             │
│ 科研对象、状态转换、不变量和证据规则         │
├─────────────────────────────────────────────┤
│ Harness Adapter                             │
│ 运行任务、恢复会话、流式事件、取消与审批     │
├─────────────────────────────────────────────┤
│ DeepSeek Harness                            │
│ Agent Loop、Session、Tools、Plugins、Sandbox │
├─────────────────────────────────────────────┤
│ Infrastructure                              │
│ 模型、论文库、代码执行、数据、GPU、实验设备  │
└─────────────────────────────────────────────┘
```

依赖方向只能向下。`Research Domain` 不得导入 DeepSeek Harness 类型，Harness 的会话标识和事件必须在适配层转换为 CyberEinstein 自己的接口。

## 4. Harness 接入决策

CyberEinstein 采用 DeepSeek Harness 的固定版本，通过独立适配层接入。

约束如下：

- 不 fork 或直接修改 DeepSeek Harness 核心来实现科研业务规则。
- 科研能力优先实现为 CyberEinstein 插件、工具或领域服务。
- Harness 版本升级必须通过契约测试后才能进入主分支。
- 模型选择属于运行配置，DeepSeek 是默认选项而不是领域依赖。
- 每个研究项目使用隔离的工作目录和会话存储。
- Shell、文件编辑和网络访问遵循最小权限；不得沿用全权限示例配置进入生产。

适配层的最小接口应覆盖：

```text
startResearchTask
continueResearchTask
streamTaskEvents
cancelResearchTask
requestApproval
readRunTrace
```

## 5. 首条产品闭环

第一阶段只实现一个纵向场景：从科学问题出发，完成文献检索、假设形成、计算实验、证据整理和独立审查，最终生成可复现研究报告。

第一阶段不包含：

- 无人审批的自主发表；
- 直接控制真实实验设备；
- 覆盖所有科研学科；
- 用 Agent 自评替代独立验证；
- 为展示效果伪造科研发现。

## 6. 验收标准

首个版本必须证明：

1. 同一个研究项目可以跨多次 Agent 运行继续推进。
2. 任一结论可以反查文献、实验、数据和运行轨迹。
3. 独立审查能够阻止证据不足的项目进入完成状态。
4. Harness 故障或替换不会破坏已有科研记录。
5. 高风险动作在未获授权时无法执行。
