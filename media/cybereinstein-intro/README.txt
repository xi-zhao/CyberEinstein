CyberEinstein 项目介绍视频

在线视频：
https://scrimba.com/explain/guide07h6hsgi4?fullscreen=1

制作与验证范围：
1. 在线影片由 Explain Video Generator 的 JavaScript 脚本动画接口制作，
   该接口兼容一部分 Manim CE API。中文旁白由该免费服务提供。
2. 这份源码另附用户指定的 3b1b 原版 ManimGL Python 实现。
   原版 ManimGL 未在本轮环境实际渲染；Python 源码仅完成语法检查。
   不应把在线影片说成由原版 ManimGL 渲染。
3. 本地系统 say 配音测试输出空音频；没有使用或交付该空文件。
4. 未调用付费 TTS，未购买服务，未克隆任何人的声音。
5. 视频中的二能级模型是教学例子，已独立作数值检查；
   它不是某篇论文的完整复现，也不是 CyberEinstein 已取得的原创发现。
6. 项目功能陈述依据制作时直接读取的当前 GitHub 文档；
   未把文档所述能力当作本轮实际运行验收结果。

文件：
video.explainer.xml      实际在线视频的完整脚本与旁白
narration.txt            中文旁白逐段文本
scenes_manim.py           原版 3b1b ManimGL 动画源码（尚未实际渲染）
custom_config.yml         1080p / 30fps 配置
requirements.txt          原版 ManimGL 版本要求
tts_doubao.py              指定豆包音色的配音适配器（未调用服务）
build_assets.py           封面绘制与教学模型独立检查
demo-evidence.json        教学模型运行结果与边界
cybereinstein-cover.png   原创精确绘图封面
sources.json              文档来源、读取时间及 Git blob 标识
validation.json           本轮实际完成的检查与限制

原版 ManimGL 运行（需要已经安装依赖的 Python >=3.10 环境）：
python -m pip install -r requirements.txt
manimgl scenes_manim.py CyberEinsteinFilm -w --hd --fps 30

用户后续指定的豆包音色：zh_male_m191_uranus_bigtts
适配器采用同一模型的官方 V3 HTTP 流式接口，便于一次性合成旁白。
原始参考：
https://docs.volcengine.com/docs/DoubaoVoice/bidirectional-streaming-text-to-speech-websocket?lang=zh
适配器接口依据：
https://docs.volcengine.com/docs/DoubaoVoice/unidirectional-streaming-text-to-speech-http?lang=zh
未使用用户提供的密钥发起请求，未保存密钥，音色尚未实际试听。
若继续制作，需先确认账户剩余免费字符额度；准备检查不触发调用：
python tts_doubao.py --prepare-only
确认剩余额度后，以实测剩余数值替换 N，再在不回显的提示中输入 Key：
python tts_doubao.py --free-quota-characters N

数值教学例子及封面：
python build_assets.py

ManimGL 全片源码中的时长是分镜估计值。若要在本地配音合成，
需导入真实配音段落 voice/01.wav ... voice/12.wav，
源码会读取 WAV 时长以安排场景等待。在线影片由播放器同步动画与旁白。

本轮安装尝试已创建 venv，但 manimgl 依赖下载失败：
受限终端无法解析 pypi.org；自动审批提示已保存的用户权限设置禁止浏览器访问。
线上预览使用免费服务的默认中文配音，并非后续指定的豆包音色。

原版 Manim：https://github.com/3b1b/manim（MIT）
本项目：https://github.com/xi-zhao/CyberEinstein（Apache-2.0）
成片中的科学关系图均为解释性示意，不代表真实论文引用网络。
