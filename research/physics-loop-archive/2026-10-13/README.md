# 物理科研 Loop 跨会话归档（2026-10-13）

**同步状态：完整归档已上传并经 Git 对象核对。** 此目录位于用户指定的公开仓库 `xi-zhao/CyberEinstein` 的独立分支 `archive/physics-discovery-loop-20261013`。尚未合并 `main`。

本目录包含：
- **25 份可直接阅读的协议、报告、推导、决定与查新资料**。
- `payload/physics_research_protocol_codex_v1_2.zip`：完整 Codex 类宿主协议。
- `payload/physics_loop_full_handover_20261013.zip.part01` ... `part08`：完整原始科研证据合集（二进制分块，每块 436260 字节，总计 3490080 字节）。内部有 **12 份原始 ZIP**，包括翟荟开放系统方向研究、完整数值代码与证据、历史研究 loop、重启快照、协议及审查记录。
- `FULL_ARCHIVE_RESTORE.md`：Git 同步、按顺序拼接、SHA-256 核验和解压的准确命令。

**完整 ZIP SHA-256：**
`3104d2011f2fe38848a82690215ef0f7c3136f9311561044a0d736302a61bb4a`

## Work/Codex 如何读取

先在 Work 的已有 CE 克隆中检查未提交改动，然后：

```bash
git fetch origin archive/physics-discovery-loop-20261013
git switch -c physics-loop-recovery --track origin/archive/physics-discovery-loop-20261013
cd research/physics-loop-archive/2026-10-13
cat payload/physics_loop_full_handover_20261013.zip.part0{1..8} > physics_loop_full_handover_20261013.zip
shasum -a 256 physics_loop_full_handover_20261013.zip
unzip -t physics_loop_full_handover_20261013.zip
unzip physics_loop_full_handover_20261013.zip -d recovered
```

校验与详细说明见 `FULL_ARCHIVE_RESTORE.md`。下载后请优先读协议包与 `recovered/archives/zhai_forward_loop_v12_run01_evidence.zip`、`recovered/archives/zhai_forward_restart_packet_20261013.zip`。最后再核对后续 `zhai/later_continuation/REPORT.md` 的具体事实与保存日期；不要假定旧对话里的下一步建议就是新任务的唯一方向。

## 科研与执行边界

- 目标：沿翟荟等顶尖研究者关注的方向，**前瞻性提出并解决具有实质新颖性和物理后果的重要问题**。论文审查、复现、认知模型是手段，不是目标。
- 新的科学问题与新的方法/结果**分别查新**，以最接近原文的条件、命题和证据作实质比较。投入计算前先做前审，仅批准有界的下一项研究行动。
- 新 Agent 可以依据上述事实选择全新路线；旧研究成果与真实失败记录须保留，事后认知地图不可冒充事先驱动选题。真 Fork-and-Flush 是否完成必须由宿主验证，不能据新建目录推断。
- **此归档是传输与恢复，不是新一次的数值重跑、外部审稿或 PRL 水平认证**。最新文件中的局部结果与高价值目标尚未完成的状态需原样区分。
- 本仓库为公开仓库；以上上传会让未发表研究材料公开可见。已做常见密钥模式排查，但不保证穷尽全部敏感信息。没有修改 CE main，也没有向外部期刊提交任何结果。
