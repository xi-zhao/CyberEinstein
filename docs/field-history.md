# Field History：从论文邻域到学科历史主干

- 状态：v0.3 已实现并通过跨领域自动验收
- 数据源：OpenAlex 元数据与可用摘要
- 领域产物：`FieldHistoryMap`

## 它解决什么问题

给定一篇种子论文的 OpenAlex ID、DOI 或标题，Field History 不只查找它的直接引用者，而是构造一个有边界、可解释、可复现的学科历史候选图：

1. 沿参考文献和后续引用分别扩展 1–3 跳；
2. 用标题、摘要、OpenAlex 主题、引用距离和图结构过滤噪声；
3. 从保留论文中提取较小的历史主干；
4. 从种子论文的主题检索近期工作，避免把“前沿”等同于“最新引用者”；
5. 对引用边提出关系假设，区分理论继承、方法改进、实验验证、工程应用、综述引用、反驳与争议。

交互图提供六个视图：`foundations`、`branches`、`seed`、`derivatives`、`frontier` 和 `backbone`。历史主干只是高优先级阅读路径，不声称穷尽整个学科。

## 解耦边界

`FieldHistoryService` 只负责编排，五个能力可以分别测试或替换：

| 模块 | 单一职责 |
| --- | --- |
| `CitationTraversal` | 前向 / 后向 1–3 跳有界扩展；先取参考文献元数据，再按共同引用与影响力截断 |
| `RelevanceRanker` | 文本、主题、引用距离、图结构的严格相关性过滤 |
| `TopicFrontierDiscovery` | 从整个主题检索近期和高影响工作 |
| `ResearchRelationClassifier` | 为引用边生成可核验的关系假设 |
| `BackboneExtractor` | 结合相关性、连通性、桥接性和历史层级提取主干 |

这里没有引入向量数据库、LLM 分类服务或工作流框架。当前文本相似度使用依赖为零的 TF-IDF；关系分类使用标题、摘要和论文类型中的保守规则。后续可以单独升级其中一个模块，不改变其他模块的数据契约。

## 严格相关性过滤

候选论文默认按以下信号计算相关性。`0.3` 是高置信阈值；后续和前沿论文如果低于它但高于 `0.17`，只有在至少两类独立信号同时支持、且标题能够连接种子标题或摘要中的领域词锚点时才会保留。领域词表只由种子生成，候选不能把自己的词加入词表后再给自己背书。预印本与正式发表版本会先按 DOI，或按相同标题、重合作者与三年发表窗口合并。其余论文进入 `excludedCandidates`，不会悄悄消失：

| 信号 | 默认权重 | 含义 |
| --- | ---: | --- |
| 标题与摘要 | 0.55 | 种子与候选论文的 TF-IDF 余弦相似度 |
| OpenAlex 主题 | 0.20 | 带置信度的主题重合；平方后计分，降低单个宽泛主题造成的误收 |
| 引用距离 | 0.15 | 直接引用、1–3 跳距离及发现来源 |
| 图结构 | 0.10 | 候选在保留引用网络中的连接度 |

权重不是科学结论。它们只决定哪些论文值得优先阅读全文。

引用量不参与“是否相关”的判定。通过相关性门槛后，系统使用对数归一化引用量参与重要性排序、历史主干分数和节点大小；候选配额按 `78%` 相关性与 `22%` 引用影响排序。历史主干排序中引用影响占 `75%`，其余来自相关性、图内连接、桥接位置和历史层级。这里使用对数归一化，避免头部论文把其他信号完全淹没。这样高影响论文会被明显凸显，但不能只靠引用量进入图谱。最终 `scores.total` 由相关性、引用影响、图内历史支持、新近性和共享参考共同构成。

反向扩展不会先按 OpenAlex ID 任意截断。每一跳先批量取得最多 100 篇参考文献元数据，再按共同引用支持度与对数引用影响选出配置数量：第一跳更重视影响力，第二、三跳更重视多篇论文共同指向的历史来源。

## 消融实验

运行固定的小型离线标注集：

```bash
corepack pnpm field-history:ablation
```

当前结果如下。`Δ F1` 是相对完整组合的变化：

| 方案 | Precision | Recall | F1 | Δ F1 |
| --- | ---: | ---: | ---: | ---: |
| 完整组合 | 1.0000 | 1.0000 | 1.0000 | 0 |
| 去掉标题与摘要 | 0.0000 | 0.0000 | 0.0000 | -1.0000 |
| 去掉主题 | 1.0000 | 0.5714 | 0.7273 | -0.2727 |
| 去掉引用距离 | 1.0000 | 0.4286 | 0.6000 | -0.4000 |
| 去掉图结构 | 1.0000 | 0.7143 | 0.8333 | -0.1667 |

这组结果只证明四类信号在受控样本中都提供了可观测增益，不是跨学科效果声明。评测夹具还包含一篇引用量为 50,000 的无关论文，用于确认引用量不能绕过相关性门槛。

## 无需人工标注的自动验收

正式验收不依赖项目维护者逐篇标论文。它组合三种可重复的外部标准：

1. **综述共识**：用语义检索与普通检索寻找独立综述，取至少两篇综述共同引用且早于种子论文的工作，按共识度和引用影响形成 Top-K 历史答案；
2. **时间回测**：把数据截断到历史年份，只用截断时已经产生的逐年引用量排序，再用之后三年的真实引用增长判断前沿命中；
3. **多种子稳定性**：同一主题从不同种子重建，计算历史主干 Top 20 的 Jaccard 和重叠系数。

运行全部跨领域案例：

```bash
corepack pnpm field-history:benchmark -- \
  --strict \
  --output .cybereinstein/field-history/benchmark.json
```

`--strict` 只有在所有门槛通过时才返回成功。OpenAlex 暂时缺少足够综述或逐年引用数据时，结果是 `inconclusive`，不会被转换成通过。当前门槛为：数据请求无关键失败、综述覆盖至少一半种子、历史平均 `Recall@20 ≥ 0.15` 且 `NDCG@20 ≥ 0.20`、历史与前沿 NDCG 不低于引用基线超过 `0.02`、前沿 `NDCG@10 ≥ 0.70` 且高潜论文命中不低于候选总体、同主题主干重叠系数不低于 `0.30`。

2026-09-04 的固定基准如下；完整快照位于 `evaluation/field-history-benchmark.baseline.json`：

| 领域 | 历史 Recall@20 | 历史 NDCG@20 | 引用基线 | 前沿 NDCG@10 | 前沿引用基线 | 多种子重叠 | 结果 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 非厄米能带拓扑 | 0.250 | 0.521 | 0.456 | 0.847 | 0.711 | 0.50 | 通过 |
| Surface Code QEC | 0.300 | 0.280 | 0.284 | 0.884 | 0.894 | 0.71 | 通过 |
| CRISPR 基因编辑 | 0.347 | 0.564 | 0.577 | 0.812 | 0.829 | 0.55 | 通过 |

这是一套工程验收证据，不等于对每条科学关系的人工同行评审。OpenAlex 会持续更新，因此发布前应重新运行，而不是永久依赖快照数字。

## 数据获取可靠性

OpenAlex 客户端默认使用 30 秒超时，对网络错误、`429` 和 `5xx` 做指数退避；成功响应持久缓存 7 天，`404` 负缓存 6 小时，重复请求与并发相同请求会被合并。语义综述检索最多等待 12 秒，失败后自动使用普通检索。批量接口漏掉少量已失效记录时会尝试单篇补取，但这种元数据缺口只作为限制披露，不会把一次受控构图误报为网络失败。

## 关系标签的证据边界

`researchRelation.kind` 的六个业务标签和 `unclassified` 都是发现假设。每条边同时保留 `confidence`、命中的 `basis`、可用文本级别和 `needsFullTextReview: true`。引用元数据能证明“论文 A 的参考文献包含论文 B”，不能证明 A 继承、验证或反驳了 B 的具体结论。

因此：

- 节点与边的 `scientificEvidence` 固定为 `false`，Schema 不允许提升；
- API 局部失败返回 `partial` 和具体限制；
- 正常完成返回 `bounded_complete`，明确表示这是受预算限制的地图；
- 关系进入 Claim/Evidence 前必须核对全文引用语境，关键结论还要连接运行证据。

## 与 RunThePaper / PRAgent 的连接

每个论文节点带有 `executableHistory`：

```json
{
  "reproductionCaseIds": [],
  "claimIds": [],
  "runIds": [],
  "failureLessonIds": []
}
```

构建时可以通过 OpenAlex ID、完整 DOI URL 或短 DOI 注入已有对象 ID。同一张图因此能够同时回答：论文处在学科历史的什么位置，以及我们对它运行、验证或失败过什么。

## 命令行使用

小型演示可匿名访问 OpenAlex；持续使用应申请免费 API Key，并只放在本地环境文件中：

```bash
cp config/field-history.env.example .cybereinstein/field-history.env
```

以非厄米拓扑论文为种子生成 JSON、Cytoscape 数据和单文件交互图：

```bash
node --env-file=.cybereinstein/field-history.env \
  scripts/build-field-history.mjs \
  --seed 10.1103/PhysRevLett.121.086803 \
  --depth 2 \
  --relevance-threshold 0.3 \
  --retention-floor 0.17 \
  --output .cybereinstein/field-history/non-hermitian.json \
  --cytoscape .cybereinstein/field-history/non-hermitian.cytoscape.json \
  --html .cybereinstein/field-history/non-hermitian.html
```

HTML 完全自包含，支持搜索、角色筛选、历史主干筛选、关系类型详情和可解释评分。

程序接口：

```js
import { FieldHistoryService, OpenAlexClient } from '@cybereinstein/field-history';

const service = new FieldHistoryService({
  client: new OpenAlexClient({
    apiKey: process.env.OPENALEX_API_KEY,
    cacheDir: '.cybereinstein/cache/openalex',
  }),
});

const history = await service.build({
  seed: '10.1103/PhysRevLett.121.086803',
  citationDepth: 2,
  frontierYears: 3,
  relevanceThreshold: 0.3,
});
```

核心契约在 `packages/field-history/field-history.schema.json`，模块实现位于 `packages/field-history/`。Connected Papers 是交互体验参照；本实现独立使用 OpenAlex API，并输出 CyberEinstein 自己的 Apache-2.0 数据契约。
