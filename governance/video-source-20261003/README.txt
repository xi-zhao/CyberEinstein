CyberEinstein 项目介绍视频：公开保全副本（2026-10-03）

在线视频参考：https://scrimba.com/explain/guide07h6hsgi4?fullscreen=1
本分支只保全本机已有交付源码，不修改在线影片、不发布、不更新主项目实现。
本机完整 CyberEinstein 主库未找到；这 21 个源文件不是主库的完整备份。

video.explainer.xml 与 animation-source/ 为原在线脚本动画来源；
scenes_manim.py 为另附的原版 ManimGL 实现，原环境未完成安装或渲染。
原在线影片使用服务默认中文配音，不是 ManimGL 渲染或豆包音色。
validation.json 记录源材料已有的检查，不代表本轮重新执行这些检查。
demo-evidence.json 是已保存的两能级教学模型检查，不是论文完整复现或原创发现。
本次仅做静态检查、内容审查与哈希保全，没有重跑数值计算、渲染或调用 TTS。

本地渲染需安装 requirements.txt 中的 manimgl==1.7.2，另备本地中文字体和真实配音。
运行示例：manimgl scenes_manim.py CyberEinsteinFilm -w --hd --fps 30
若运行 build_assets.py，先将 FONT 指向已合法安装的字体文件；副本仅保留字体占位名。
tts_doubao.py 保留无需凭据的 --prepare-only；未调用合成接口，没有保存或上传任何 Key。

公开副本移除了本机绝对字体路径、个人背景叙述和本地权限设置细节。
原始源文件仍在原位置；逐文件源哈希、副本哈希与差异见 preservation.json。
未附 venv、uv-cache、字体、凭据、私人目录配置或论文原文。
原版 Manim：https://github.com/3b1b/manim（MIT）
项目：https://github.com/xi-zhao/CyberEinstein（Apache-2.0）
