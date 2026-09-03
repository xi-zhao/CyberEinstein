# ReproductionCase 领域服务

- 状态：首个可运行版本
- 日期：2026-08-27

## 1. 作用

`@cybereinstein/reproduction-case` 是 PRAgent 的首个持久化领域服务。它保存一篇论文或一组有边界目标 Claim 的方法重建、基础设施要求、运行、证据、审查、失败经验和剩余复现边界。

该服务不执行 Agent Loop，不获取论文，也不自行得出科研结论。DeepSeek Harness 继续负责任务执行和权限，来源适配器负责发现或获取资料，`ReproductionCase` 服务负责不可绕过的科学状态规则和跨会话持久化。

## 2. 服务接口

Cordis 服务名为 `reproductionCases`，当前公开以下方法：

| 方法 | 作用 |
| --- | --- |
| `create(input)` | 建立版本 1 的复现案例 |
| `get(id, { version? })` | 读取当前或历史版本 |
| `list(filter?)` | 按状态或 `ResearchProgram` 列出案例摘要 |
| `save(value, options)` | 通过期望版本写入一个完整新快照 |
| `history(id)` | 读取版本、操作者、原因和时间线 |
| `validate(value)` | 只运行 Schema 与领域规则，不写入 |

所有写入都要求明确操作者和原因。`save` 还要求 `expectedVersion`；过期写入返回 `VERSION_CONFLICT`，调用者必须重新读取并决定如何合并，不能静默覆盖另一轮科研工作。

## 3. 科学状态规则

JSON Schema 固定对象结构，领域验证器负责跨对象关系。当前强制执行：

- Claim、方法、运行、证据和审查之间的标识引用必须存在且方向一致；
- 元数据只能证明论文身份，`metadata_only` 来源不能创建科学证据；
- 已完成运行必须保存开始时间、结束时间、参数、环境、输入和输出记录；
- Claim 只有同时具备已完成运行产生的支持证据和通过的独立审查，才能标记为 `reproduced`；证据创建者和运行执行者不能审查通过自己的结果；
- 案例只有包含至少一个目标 Claim、所有目标 Claim 均已复现且不存在缺失或待审批的阻塞基础设施时，才能标记为 `reproduced`；
- 案例标识、Schema 版本、创建者和创建时间不可修改。

这使“Agent 成功运行”和“科研结论成立”保持为两个不同事件。

## 4. 持久化

默认存储目录为 `.cybereinstein/reproduction-cases`，可通过 `CYBEREINSTEIN_REPRODUCTION_STORE` 修改。每个案例保存一个包含全部不可变历史版本的 JSON 文档。

写入使用案例级跨进程锁、临时文件同步和同目录原子替换。存储目录和文件默认采用仅当前用户可读写的权限。当前 JSON 快照存储适合单机首版和可审计开发；未来迁移到数据库时，应保持相同的版本冲突、历史和领域验证语义。

## 5. 安装与关闭

统一安装：

```bash
corepack pnpm setup
```

只安装该 bundle：

```bash
corepack pnpm reproduction-case:setup
```

可独立关闭：

```bash
CYBEREINSTEIN_REPRODUCTION_CASE_ENABLED=false corepack pnpm dsh:web
```

## 6. 当前边界

- 服务已经可以跨 DSH 运行保存和恢复案例，但还没有面向 Agent 的专用 Tool 或 Workbench 页面；后续应用插件应通过该服务调用，而不是直接写 JSON。
- 当前一个案例只登记一个主来源；补充文献关系将通过 `LiteratureReview` 和后续 Claim/Evidence 图服务接入。
- `FailureLesson` 目前记录案例内引用和候选经验，独立的经验晋级服务尚未实现。
- 真实物理实验的设备控制、审批和证据签名不在当前版本范围内。
