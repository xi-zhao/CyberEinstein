# CyberEinstein 进展交接

检查点：2026-10-03，北京时间。验证时间与运行环境见 [checkpoint-verification.json](media/cybereinstein-intro/checkpoint-verification.json)。

本检查点保存项目介绍视频的制作进展、源文件、证据和接续步骤。视频尚未完成用户指定的原版 3b1b ManimGL 渲染与豆包音色配音；当前没有可交付的本地 MP4。

## 任务目标与仓库基线

- 用户要求制作 CyberEinstein 项目介绍视频，使用 [3b1b/manim](https://github.com/3b1b/manim)，后续指定豆包音色 `zh_male_m191_uranus_bigtts`。
- 介绍围绕“可执行科学史”：连接方法、证据、失败经验与新问题；沿用项目的深色视觉和简体中文表达。
- 本次保存到 `xi-zhao/CyberEinstein` 的 `main`。核对时的基线提交为 `e8ce8307a878c1bc6fe5e0fcf5b680e90f2045b8`，基线 tree 为 `af43246b661b8ce5afb3e41d132b9c0f3d6d3783`。
- 当前工作目录是 ChatGPT 项目镜像，不是 Git checkout。本检查点通过 GitHub 接口添加文件，保留基线 tree 的其他内容。
- 中文 README 的 blob 为 `dd4bc50b744deb2a3f527f639da6f3d5c8a7e630`，与视频制作时记录的来源一致。README 将产品定义为开发者预览阶段，列出论文地图、文献调研、研究记录三项基础能力。本轮未运行应用测试，不能将文档描述当作新增验收结果。

## 已保存的材料

视频材料集中在 [media/cybereinstein-intro](media/cybereinstein-intro/README.txt)。原有 21 个源文件和素材逐字节保存，未改动制作逻辑。

| 文件 | 当前状态与用途 |
| --- | --- |
| `video.explainer.xml` | 12 个分镜、12 段中文旁白及在线动画脚本；保存的是脚本，不是视频二进制文件。 |
| `animation-source/*.mjs` | 8 个动画模块，与 XML 中的脚本一致。 |
| `narration.txt` | 与 XML 一致的完整旁白文本；配音输入共 1,223 字符，按适配器的 Python `len` 计数。 |
| `scenes_manim.py` | 面向 `manimgl==1.7.2` 的 Python 场景；包含 `CyberEinsteinFilm` 全片与 `SpectrumDemo` 单场景。已编译检查，尚未实际渲染。 |
| `requirements.txt`、`custom_config.yml` | ManimGL 版本要求与 1920×1080、30 fps 配置；实际渲染兼容性未验收。 |
| `tts_doubao.py` | 指定音色的配音适配器；当前实现采用 V3 HTTP 流式接口。已运行 `--prepare-only`，未发起合成请求。 |
| `build_assets.py`、`cybereinstein-cover.png` | 封面生成代码与 1920×1080 封面。生成代码的字体路径依赖原制作机，换机时需要处理。 |
| `demo-evidence.json` | 二能级教学模型的 100 个采样点、EP 检查及错误符号检查。 |
| `sources.json` | 制作时读取的项目文档、Git blob 与外部接口来源。 |
| `README.txt`、`validation.json` | 上一轮制作说明与历史验证记录，保留原文。 |
| `validate_and_package.py` | 原打包脚本；其中部分状态字段是固定值，不能用再次运行该脚本证明已经安装、渲染、配音或检查播放器。 |
| `checkpoint-verification.json` | 本次实际重新执行的检查、环境及未执行项目。 |
| `checkpoint-manifest.json` | 本检查点文件的大小、SHA-256 和 Git blob SHA，可用于核对保存内容。 |

上一轮记录的在线预览地址：<https://scrimba.com/explain/guide07h6hsgi4?fullscreen=1>。

根据上一轮说明，在线预览使用 Explain Video Generator 的 JavaScript 动画接口及该服务的默认中文配音。该预览不等同于原版 ManimGL 渲染，也没有使用后续指定的豆包音色。本次未打开播放器验证其可访问性、播放或导出状态。历史记录中的约 242.324 秒仅是预览时长估计。

## 本次实际验证

- 原有 21 个文件的保存副本与制作目录内容逐字节一致。
- 4 个 Python 文件通过语法解析，并在现有 Python 3.12.11 虚拟环境中通过编译检查；这不验证 ManimGL API 或渲染行为。
- 8 个 JavaScript 模块通过 Node.js v24.4.1 的 `--check`。
- XML 可解析；12 段旁白的锚点引用全部存在，导出的脚本与旁白文本一致。
- `tts_doubao.py --prepare-only` 返回指定音色、12 段、1,223 字符以及 `called_api: false`。
- 重新执行现有教学模型检查，结果与保存的 JSON 完全一致。模型为 `H=[[iγ,g],[g,-iγ]]`，`γ=1`；远离 EP 的 100 个采样点中，直接求本征值与特征方程解析解的最大误差为 `7.021666937153402e-16`，检查阈值为 `1e-12`。`g=γ=1` 时另检查 `H²=0` 与 `rank(H)=1`，并检出根号内错误加号的候选。
- 封面 PNG 可解码，尺寸为 1920×1080；本轮未重新做视觉检查。
- 当前制作目录未发现 `.wav`、`.mp3`、`.mp4` 或 `.mov`，现有虚拟环境中也没有 `manimlib`。

数值结果只支持这个明确给定的 2×2 教学模型，不代表论文完整复现或 CyberEinstein 的原创发现。科学关系图属于解释性示意，不是真实论文引用网络。

## 阻塞与待验证项

上一轮记录了 PyPI DNS 失败，以及浏览器和原生应用访问被已保存权限设置或自动审批阻止。本次没有重试这些操作，不能把历史失败直接作为当前网络或权限状态的判断。可以直接确认的是：现有虚拟环境仍缺少 ManimGL。

后续仍需完成：

1. 安装并运行原版 ManimGL，检查实际场景 API、中文字体、公式渲染与视频写出。
2. 调用指定豆包音色并试听，确认认证、音色、返回格式及音频有效性。用户最初提供的是双向 WebSocket 文档；现有适配器选择 HTTP 流式接口，这一选择及服务兼容性尚未实测。
3. 生成 `voice/01.wav` 至 `voice/12.wav`，按真实时长检查动画与旁白同步。源码目前读取 WAV 时长，但无音频时使用估计时长，不能据此声称同步完成。
4. 导出完整 MP4，检查全片中文、公式、动画布局、分镜过渡、声音、字幕需求与画面一致性。

## 下一位执行者如何接续

先读本文件及 `checkpoint-verification.json`，以实际执行记录为准。继续制作时进入仓库的 `media/cybereinstein-intro`，按以下顺序推进：

1. 创建或选择 Python ≥3.10 的环境，安装 `requirements.txt` 中的依赖；核对中文字体、公式渲染所需组件、图形环境和 `ffmpeg`。
2. 先渲染短场景 `SpectrumDemo`，修复实际发现的 API 或环境问题，再渲染全片。已有运行命令如下，CLI 兼容性仍需实际验证：

   ```bash
   python -m pip install -r requirements.txt
   manimgl scenes_manim.py SpectrumDemo -w --hd --fps 30
   ```

3. 用 `python tts_doubao.py --prepare-only` 检查输入。适配器要求 `--free-quota-characters` 覆盖全部文本；该参数是调用者提供的额度数值，代码本身不查询账户余额。密钥应通过受保护的 `DOUBAO_API_KEY` 或运行时隐藏输入读取，不写入文件或 Git。
4. 合成并检查 12 段旁白后，运行：

   ```bash
   manimgl scenes_manim.py CyberEinsteinFilm -w --hd --fps 30
   ```

5. 用真实运行日志、媒体信息及全片观看结果补充验收记录。交付要求是原版 ManimGL 生成的完整影片、指定豆包音色、可检查的声画同步，以及对项目现状和教学例子边界的准确表达。

本检查点不包含凭据、虚拟环境、下载缓存或本地渲染产物。原制作材料保留；ChatGPT 项目的 `sources/` 参考文件未作修改。
