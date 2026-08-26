# CyberEinstein

**An AI Scientist Workbench for discovering, verifying, and advancing knowledge that matters.**

CyberEinstein 是面向真实科研工作的 AI 科学家产品。它不是一个通用聊天界面，也不以自动生成论文为终点；它围绕科学问题持续组织假设、实验、证据、结论和同行审查，目标是产出可信、可追溯、可复现的新知识。

> CyberEinstein 是产品与科研系统，DeepSeek Harness 是可替换的 Agent 运行内核。

## 产品愿景

CyberEinstein 将科研过程建模为可持续推进的研究项目：

```text
科学问题 -> 可检验假设 -> 研究方案 -> 实验或计算
        -> 证据 -> 结论与反证 -> 审查 -> 可复现成果
```

长期目标是让 AI 能够与人类科学家共同完成有原创性、可验证并真正产生影响的科研工作。

## 核心原则

- **证据优先**：每个科研结论必须关联支持证据、反证和不确定性。
- **过程可追溯**：文献、提示、工具调用、代码、参数、数据和结果都进入研究记录。
- **成果可复现**：实验和计算必须保留足以复现的环境、输入和方法。
- **人类负责关键决策**：发表、外部写入、高成本计算和实验设备控制必须经过明确授权。
- **科研领域独立于 Agent 内核**：业务对象和科研规则不依赖某个模型或 Harness。
- **通过插件扩展能力**：科研工具、模型、存储和工作流以明确接口接入，避免修改 DeepSeek Harness 核心。

## 系统边界

```text
CyberEinstein Workbench
  -> Research Domain
  -> Harness Adapter
  -> DeepSeek Harness
  -> Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein 自己负责研究项目、科研状态、证据关系、审批规则和用户体验。DeepSeek Harness 负责任务线程、Agent Loop、工具执行、运行轨迹和插件编排。两者之间通过适配层连接，以便未来替换或并行接入其他运行内核。

## 第一阶段

首个可运行版本只验证一条完整科研闭环：

1. 创建研究项目并定义科学问题。
2. 检索和整理可信文献。
3. 形成可检验假设与研究方案。
4. 运行隔离的计算实验。
5. 将结果组织为证据、反证和不确定性。
6. 经过独立审查后生成可复现研究报告。

首个验证场景可以从量子计算研究切入，但核心模型不绑定具体学科。

## 项目状态

当前处于产品定义和架构奠基阶段，尚无可运行版本。下一里程碑是建立最小研究领域模型，并通过适配层接入固定版本的 DeepSeek Harness。

详细架构决策见 [docs/architecture.md](docs/architecture.md)。
