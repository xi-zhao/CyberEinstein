# CyberEinstein

[英文](README.md) | 中文

**面向重要知识发现、验证与推进的 AI 科学家工作台。**

CyberEinstein 是面向真实科研工作的 AI 科学家产品。它不是一个通用聊天界面，也不以自动生成论文为终点；它从科研能力盘点和研究方向建模出发，持续组织假设、实验、证据、经验修正和同行审查，目标是产出可信、可追溯、可复现的新知识。

> **使命**：我们希望让每一个人，都有机会在自己感兴趣的科研方向上成为爱因斯坦，完成自己做科学家的梦想。

> **架构原则**：CyberEinstein 是产品与科研系统，DeepSeek Harness 与 Cordis 提供完整运行底座，科研能力通过上层插件逐步加入。

## 产品愿景

CyberEinstein 将科研过程建模为可持续演进的研究计划：

```text
科研能力 -> 方向理解 -> 论文复现 -> 机会识别
        -> 可检验假设 -> 实验或计算 -> 证据与反证
        -> 独立审查 -> 经验回流 -> 可复现成果
```

长期目标是让 AI 能够与人类科学家共同完成有原创性、可验证并真正产生影响的科研工作。

## 核心原则

- **证据优先**：每个科研结论必须关联支持证据、反证和不确定性。
- **科研普惠**：让更多人获得理解问题、设计研究和验证想法的能力，但不降低科学标准。
- **科技向善**：同时评估科研的预期受益、潜在伤害、双重用途和社会影响。
- **基础设施先行**：先确认算力、数据、软件、仪器和人员能力，再生成可执行的研究方案。
- **过程可追溯**：文献、提示、工具调用、代码、参数、数据和结果都进入研究记录。
- **成果可复现**：实验和计算必须保留足以复现的环境、输入和方法。
- **从错误中修正**：每个研究 Loop 都要检索旧经验、诊断偏差并将验证过的教训回流到系统。
- **人类负责关键决策**：发表、外部写入、高成本计算和实验设备控制必须经过明确授权。
- **科研逻辑属于 CyberEinstein 插件**：业务对象和科研规则放在 CyberEinstein 自己的包中，不修改 DeepSeek Harness 核心。
- **通过 Cordis 插件扩展能力**：科研工具、模型、存储、策略和工作流都通过原生插件体系装配。

## 系统边界

```text
CyberEinstein Workbench
  -> CyberEinstein Research Plugins
  -> DeepSeek Harness / Cordis
  -> Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein 自己负责研究计划、科研能力、项目状态、证据关系、经验晋级、审批规则和用户体验。DeepSeek Harness 提供 Profile、Session、Agent Loop、工具执行、运行轨迹、权限和 Cordis 插件编排。第一阶段完整复用这套能力，不 fork，也不修改上游核心。

## 第一阶段

首个可运行版本只验证一条完整科研闭环：

1. 盘点真实可用的科研能力并建立能力图。
2. 选择一个窄研究方向，建立发展脉络和 Claim 图。
3. 复现一组锚点论文并沉淀隐性实验细节。
4. 从复现中的异常、矛盾和瓶颈识别研究机会。
5. 运行一个带 RSI 经验回流的计算实验闭环。
6. 经过独立审查后生成可复现研究报告。

首个验证场景可以从量子计算研究切入，但核心模型不绑定具体学科。

## 项目状态

当前处于产品定义和架构奠基阶段。仓库已经固定并可直接运行官方完整底座 `@deepseek-ai/dsh@0.1.1-rc.2`，没有修改上游核心或 Profile。下一里程碑是开发第一个 CyberEinstein 科研插件。

## 开发者快速开始

推荐使用 Node.js 24 或更高版本。

```bash
corepack pnpm install
corepack pnpm dsh:check
corepack pnpm dsh:web
```

`dsh:check` 会组合并验证官方完整 headless Profile，但不会发送模型请求，所以不需要 API Key。`dsh:web` 会在 `http://127.0.0.1:3080` 启动官方工作台。真实模型请求需要 `DEEPSEEK_API_KEY`。详见 [DeepSeek Harness 底座说明](docs/harness-integration.md)。

项目的完整发展方向见 [docs/development-vision.md](docs/development-vision.md)，详细架构决策见 [docs/architecture.md](docs/architecture.md)。
