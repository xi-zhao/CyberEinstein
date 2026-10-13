# 2026-10-13：已同步完整证据 ZIP（GitHub 分块存储）

**这一目录位于公开的 `xi-zhao/CyberEinstein` 仓库，所有附件对公众可见。**

已上传：
- `payload/physics_research_protocol_codex_v1_2.zip`：原始完整 Codex v1.2 协议 ZIP。
- `payload/physics_loop_full_handover_20261013.zip.part01` 至 `part08`：共 8 个按顺序连续切分的**二进制**文件。每块 436260 字节，合计 3490080 字节。包含 12 个原始研究 ZIP 和恢复说明。
- 同目录下还有 25 个可读文本研究文件，供 Work 先查阅。

## Work/Codex 恢复命令

在带 Git 和文件权限的 Work/本地克隆中，先安全同步本分支（不要覆盖未提交修改）：

```bash
git fetch origin archive/physics-discovery-loop-20261013
git switch -c physics-loop-recovery --track origin/archive/physics-discovery-loop-20261013
cd research/physics-loop-archive/2026-10-13
cat payload/physics_loop_full_handover_20261013.zip.part0{1..8} > physics_loop_full_handover_20261013.zip
shasum -a 256 physics_loop_full_handover_20261013.zip
```

**预期 SHA-256**：
`3104d2011f2fe38848a82690215ef0f7c3136f9311561044a0d736302a61bb4a`

校验通过后：

```bash
unzip -t physics_loop_full_handover_20261013.zip
unzip physics_loop_full_handover_20261013.zip -d recovered
unzip -t payload/physics_research_protocol_codex_v1_2.zip
```

这是原始会话归档的**传输完整性**校验，不代表所有科研结论已经通过外部独立审查。

优先阅读 `recovered/README.md` 和 `recovered/archives/physics_research_protocol_codex_v1_2.zip` 中的启动协议，再使用 `zhai_forward_loop_v12_run01_evidence.zip` 与 `zhai_forward_restart_packet_20261013.zip` 恢复研究状态，最后核对后续报告与实际状态文件。前作查新日期、旧会话状态和未运行的独立分叉实验都必须保留限制，不可当作已验收。

若 shell 不支持花括号展开，可用显式八个文件名按顺序拼接，不能把文件当文本转码。
