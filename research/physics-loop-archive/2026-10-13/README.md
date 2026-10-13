# Physics Discovery Loop：2026-10-13 跨会话恢复档案（部分同步）

**重要：这个提交只是可读取的文本研究档案，不是完整的可执行证据归档。**
上传目标为用户指定的公开仓库 `xi-zhao/CyberEinstein`，因此本分支中的内容对公众可见。
本次仅归档旧会话中可以直接读取的 23 份原始文本附件，未改 CE 主线项目逻辑，也没有部署科研 Agent。

## 恢复研究工作的入口

1. 读 `protocol/v1.1/SKILL.md`、`protocol/v1.1/START.md`，以及新版 Fork-and-Flush 增补 `protocol/v1.2/fork-and-flush.md`。
2. 读 `zhai/later_continuation/REPORT.md`（上轮翟荟开放物理方向的实测记录），再读 `zhai/forward_loop_v12_run01/{REPORT,THEORY,NOVELTY_AUDIT}.html`。
3. 旧的 LSM 诊断和恢复报告在 `zhai/open_physics_loop_test0{1,2}/`。更早的开放系统试验和玻色容量结果在 `open-systems/`、`quantum/`。
4. **前审→有界研究→独立核验→查新/价值复核→依据证据继续或转向**。心智模型仅按需调用；不得用原报告的自评替代新文献的实质比较。
5. 目前未验证 Fork-and-Flush 真正创建了独立新模型上下文，也没有能够无人值守自动完成高价值科研的已部署执行器；不要误报。
6. 原始代码、完整数值证据、某些 `STATE.md` 与 `DECISIONS.md` 尚在旧会话 ZIP 内，见 `MISSING_BINARY_ARCHIVES.md`。**未取得这些包之前，不能宣称能逐字节重现所有旧实验。**

## 在 Work/Codex 同步本分支

```bash
git fetch origin archive/physics-discovery-loop-20261013
git switch --track -c physics-loop-recovery origin/archive/physics-discovery-loop-20261013
```

以上仅为 Git 使用示例，应先保护好 Work 已有修改；如分支已存在，不重复创建。
**本分支尚未合并 `main`，也没有暗示用户授予外部发布新论文或付费模型权限。**

## 新旧文件关系

- `protocol/v1.1/` 包含完整可读的旧 v1.1 主 Skill 与启动指令。
- `protocol/v1.2/fork-and-flush.md` 仅是 v1.2 的分叉增补；**完整 v1.2 ZIP 未以二进制上传**，不可声称这是原样安装的 v1.2 全包。
- `zhai/forward_loop_v12_run01/` 是前沿研究一轮的文本报告，不等于其完整含代码工作区。
- `zhai/later_continuation/` 是旧会话最新附加记录，未证实对应项目文件系统中存在的最新 STATE。
- 所有研究主张的正确性、首创性与物理价值分开审查。部分前作结论基于当时查新范围，不代表 2026-10-13 之后的完备文献判断。
