<p align="center">
  <img src="assets/brand/einstein-pixel-logo.png" width="200" alt="CyberEinstein 像素风 Logo" />
</p>

<h1 align="center">CyberEinstein</h1>

<p align="center"><strong>让每个人都有机会，发现人类尚未知晓的事。</strong></p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

CyberEinstein 是一个正在建设中的开源 AI 科学家，目标是与人一起提出问题、开展原创研究、发现并验证新知识。

我们选择从科学的历史出发：让 AI 继承前人的方法、证据、失败与修正，寻找那些仍未得到回答、或值得重新研究的问题。我们把这条路径叫作 **可执行科学史（Executable History of Science）**。

[为什么做](#story) · [我们的路径](#approach) · [当前进展](#today) · [参与项目](#start)

<a id="story"></a>

## 一个从小就有的梦想

我从小就很喜欢物理，也梦想过成为一个能与爱因斯坦比肩的科学家。提出自己的问题，发现人类原本不知道的东西，为我们理解世界的方式增加一点新的可能。

从大学到博士期间，我一直在做物理。我知道这很难：提出一个好问题很难，为它找到可靠的答案更难。

坦白说，靠我自己，一定达不到爱因斯坦那样的高度。但看到 AI 展现出的能力，我又想起了这个梦想。如果把人的好奇心、科学判断和 AI 的能力结合起来，我们有没有可能真正推进一些非常重要的问题，甚至向大一统理论这样的目标迈出一步？

我不知道这条路最终能走多远，但我想认真试一试。这就是 CyberEinstein 的起点。

而我希望，这份梦想不只属于我。一个学生、一位教师、一个独立研究者，都应该有机会提出自己的问题，获得研究所需的支持，并让自己的发现接受检验。

**对我来说，科技平权，就是让更多人拥有探索未知、贡献新知识的机会。**

<a id="approach"></a>

## 新的发现，可以从科学走过的路开始

一篇论文留下了结论。继续研究的人，还需要知道它为什么成立、依赖什么条件、哪些尝试没有走通，以及什么问题仍然悬而未决。

CyberEinstein 希望把这些研究过程连接起来，让 AI 能够检查证据、重新运行计算、理解失败，再据此提出下一步值得做的研究。

这就是“可执行科学史”的含义：**前人的探索，能够成为下一次研究实际用得上的经验。**

例如，一个想法曾因计算代价太高而被搁置。新的计算工具出现后，它是否值得重新尝试？原来的限制还在吗？怎样的结果才能证明我们向前走了一步？

我们希望 CyberEinstein 能沿着这样的线索工作：找到问题，提出假设，开展计算或实验，寻找反证，再让结果接受独立检验。新的发现和没有走通的尝试，都留给后来者继续研究。

**复现建立可信的起点，原创发现决定我们要去的方向。** 可执行科学史与新研究之间的持续积累，是我们选择长期建设的核心。

<a id="today"></a>

## 我们走到了哪里

CyberEinstein 目前处于**开发者预览阶段**，从量子与计算物理切入。现在可以体验三项基础能力：

| 你想做什么 | 当前可以使用的能力 |
| --- | --- |
| 理解一个方向的来龙去脉 | 从一篇论文生成交互式论文地图，探索相关工作与近期进展。 |
| 围绕一个问题展开调研 | 组织文献检索与阅读，整理证据、矛盾和未决问题。 |
| 保留可以继续研究的过程 | 记录目标、方法、运行、证据和失败，支持版本管理。 |

这些基础已经实现；提出新假设、持续执行研究并验证新发现的完整流程仍在建设中。自动生成的论文关系需要核验，面向非技术用户的易用体验也尚未完成。

这条路已经有了起点：[RunThePaper](https://github.com/xi-zhao/RunThePaper) 围绕 100 篇物理论文积累了复现案例，保留成功、受阻与失败的探索过程。这些[公开研究记录](https://github.com/xi-zhao/RunThePaper/tree/main/evaluation/claim-first-100)，将成为继续提问、验证和探索新知的基础。

[PRAgent](https://github.com/xi-zhao/PRAgent) 专注于论文复现，CyberEinstein 将沿着这些积累探索原创研究，完整的跨项目连接仍在建设中。

**下一步，是围绕一个真实的未解决问题，跑通一次能够独立检查的研究过程。** 它可能带来新结果，也可能排除一种解释。我们会如实保留证据与局限，让下一次尝试有更好的起点。

<a id="start"></a>

## 带着你的问题来

你可能有一个一直想弄明白的现象，一项还没来得及验证的想法，或一次值得让别人少走弯路的研究经历。

欢迎[把它带到 CyberEinstein](https://github.com/xi-zhao/CyberEinstein/issues/new)。你也可以从阅读[公开案例](https://github.com/xi-zhao/RunThePaper)、运行现有工具、改进文档和验证方法开始参与。

我们希望开源带来的不只是代码可用，还有研究经验能够被更多人继承。发现的新知识可以帮助人们理解世界、解决真实问题；参与发现的机会，也应当向更多人开放。

### 本地体验

目前需要基本的命令行操作能力。开源代码不等于全部运行资源免费：模型调用及部分外部服务可能产生费用，真实实验也需要相应设施和权限。

<details>
<summary>展开安装步骤与运行说明</summary>

环境要求：Node.js 24 或更高版本（也支持 22.19 及以上的 22.x 版本）、Corepack / pnpm、Python 3.11–3.14 和 [uv](https://docs.astral.sh/uv/)。

```bash
git clone https://github.com/xi-zhao/CyberEinstein.git
cd CyberEinstein
corepack pnpm install
corepack pnpm setup
corepack pnpm test
```

运行模型驱动的调研任务前：

```bash
cp .env.example .env
# 编辑 .env，填入自己的 DEEPSEEK_API_KEY
corepack pnpm dsh:web
```

然后打开 `http://127.0.0.1:3080`。

论文地图功能不需要大模型 API，仍需联网访问论文数据源。可以先尝试：

```bash
corepack pnpm field-history:build -- --seed 10.1103/PhysRevLett.121.086803 --output .cybereinstein/field-history/example.json --html .cybereinstein/field-history/example.html
```

小型演示可匿名访问 OpenAlex；持续使用的数据源配置、限制与验收方法见 [Field History 说明](docs/field-history.md)。

进一步阅读：[发展愿景](docs/development-vision.md) · [架构与科学规则](docs/architecture.md) · [运行说明](docs/harness-integration.md)。

</details>

项目代码采用 [Apache-2.0](LICENSE) 协议。引用的论文、数据与外部案例分别遵循各自的使用条件。
