# 局域物理模型的精确桥接：已知梯子张量的一个研究入口

日期：2026-10-13。状态：对已发表模型和定理条件的复核、代数推论与小规模验证；不是新的 LSM 定理、反例或 PRL 成果。原来的态层投影反例没有被重新计算。

## 1. 实际要解决的障碍

Zhou–Li–Zhai–Li–Gu 的开放系统纠缠谱 LSM 提议，主文的正式列举条件是弱旋转/平移对称、半整数表示和短程相关。局域有隙的系统—浴纯化是重要的动机和具体例子，不应被擅自倒写为额外已证明条件。前一轮的状态层反例说明信息距离不足以传递低纠缠谱；它没有给出固定有限程的有隙制备。

本轮回到文章真实使用的 AKLT 梯子，先验证一个可实际使用的模型关系，避免将已知可积定理套在不满足条件的模型上。

## 2. 公开模型及其精确张量

Li–Li–Zhou 2024 的 Model I 使用两条 spin-1/2 链，Model II 使用 spin-1/2 系统与 spin-3/2 环境；每一格耦合成有效 spin-1 并构成 AKLT 态。它们的约化密度算符经辅助空间规范变换可写为 Katsura 的两参数 MPO：

\[
M(x,y)=\sum_{\boldsymbol\alpha}\operatorname{tr}(M^{\alpha_1}\cdots M^{\alpha_L})\,
\sigma^{\alpha_1}\otimes\cdots\otimes\sigma^{\alpha_L},
\]
\[
M^0=\operatorname{diag}(1,x^2,x^2,x^2),\qquad
M^a=xy(|0\rangle\langle a|+|a\rangle\langle0|),\quad a=1,2,3.
\]

两个参数点分别为

\[
(x,y)_{\rm I}=(i/\sqrt3,2/\sqrt3),\qquad
(x,y)_{\rm II}=(i/\sqrt3,1/\sqrt3).
\]

使用规范化密度矩阵；比例常数不影响以下关系。这个映射来自前作，不能归为本轮首次发现。

## 3. 一个必须遵守的可积性边界

Katsura 的 Eq.(45) 在代数轨迹 \(x^2+y^2=1\) 上给出

\[
M(x,y)=y^{2L}T(\lambda)T(-\lambda),\qquad
\lambda=\frac i2\sqrt{\frac{1+3x^2}{y^2}}.
\]

它由有限矩阵的代数恒等式产生，可用原规范变换在非奇异的复参数点直接检查；不能仅因涉及复参数便拒绝，也不能对任意 x,y 都使用。

Model I 满足该条件且 \(\lambda=0\)，因此对偶数 L：

\[
\rho_{\rm I}=\frac{T(0)^2}{\operatorname{Tr}T(0)^2},\qquad
[\rho_{\rm I},H_{\rm XXX}]=0.
\]

Model II 的 \(x^2+y^2=0\)，不在这个轨迹上。有限矩阵在 L=6,8 确实与 XXX 哈密顿量不对易；L=4 的偶然对易不能外推。Katsura 的正文已经警告 L<=5 时一般参数也可出现这种巧合。

这只排除从该 XXX 恒等式直接继承可积性，不证明 Model II 不存在任何其他可积结构。反过来，仅有 Model I 与 XXX 对易，也不证明其最大特征值排序与 XXX 基态排序完全相同，更不直接证明纠缠谱 LSM。

## 4. 精确的局域噪声桥接

定义单比特去极化通道

\[
\mathcal D_p(X)=pX+(1-p)\operatorname{Tr}(X)I/2,\quad 0\le p\le1.
\]

它固定单位算符，将每个 Pauli 算符乘 p。因此对任何长度 L，逐项作用于 MPO 得

\[
\mathcal D_p^{\otimes L}[M(x,y)]=M(x,py).
\]

M 的迹只由全单位 Pauli 项决定，与 y 无关。于是

\[
\boxed{\rho_{\rm II}=\mathcal D_{1/2}^{\otimes L}(\rho_{\rm I})},
\qquad
\rho_p=\mathcal D_p^{\otimes L}(\rho_{\rm I}).
\]

这是已知张量和标准通道定义的直接代数推论，不以“我们刚推出来”声称首创。它的当前用途是提供从可积校准模型到文献目标模型的严格、物理可制备研究路径。

## 5. 这条插值确实存在均匀有限程有隙纯化

取 Model I 的任一个原文有隙局域父哈密顿量 H_AKLT，给每个站点加入一个有限维环境 \(0\oplus1\)，初始化于旋转单态 \(|0\rangle\)。去极化通道有协变 Stinespring 等距映射

\[
V_p|\phi\rangle=\sqrt{\frac{1+3p}{4}}|\phi\rangle|0\rangle+
\sqrt{\frac{1-p}{4}}\sum_{a=1}^{3}\sigma^a|\phi\rangle|a\rangle.
\]

\(V_p^\dagger V_p=I\)，而 Pauli 三分量及环境三重态按相同实旋转矩阵变换，所以它是 SU(2) 交织映射。借助 spin-1/2 表示的重数空间旋转，可将它扩张为每个站点上与总旋转对易的幺正 U_p，并满足 \(U_p(|\phi\rangle|0\rangle)=V_p|\phi\rangle\)。相同的 U_p 作用于每格，保持平移。

定义

\[
H_p=\mathcal U_p\left[H_{\rm AKLT}+\sum_j(I-|0\rangle_j\langle0|)\right]\mathcal U_p^\dagger,
\qquad \mathcal U_p=\bigotimes_j U_p.
\]

共轭按格逐点进行，不扩大相邻格相互作用范围，不改变谱。其唯一基态纯化 \(\rho_p\)，父哈密顿量隙为原隙与环境惩罚隙的较小者，与 L 无关。p 是固定物理参数，不随 L 微调；每格 Hilbert 空间也不随 L 增长。

因此这不是前一轮人为全链投影态的重包装。它提供一个真实满足有限程、均匀有隙和对称性的状态族。但这仍**不证明该族在任何 p 上具有唯一有隙纠缠基态**，更不是物理反例。我们尚未证明它的纠缠哈密顿量在 L 上具有统一局域相互作用界。

## 6. 数值只验证实现，不代替热力学结论

A06：L=4,6,8，两个模型，总六种组合。独立 Clebsch–Gordan AKLT 张量、文献原始 MPDO 和 Katsura 参数 MPDO 相符；L=4 还显式构造全纯态并偏迹。最大矩阵维度为 256。对易性以 \(H_{\rm XXX}=\sum\sigma_j\cdot\sigma_{j+1}\) 定义。

A07：独立实现局域去极化 Kraus 作用，p=0,1/4,1/2,1，L=4,6,8；检查与张量参数变换相符。所有误差在浮点舍入尺度。

这些数值检查不证明新的场论、能隙标度或 PRL 贡献。大 L 的桥接由上述算符恒等式保证；父哈密顿量构造由局域幺正共轭保证。

## 7. 下一项实质命题

可以研究 \(\rho_p\) 的模哈密顿量在给定 p 区间是否有对 L 一致可求和的相互作用范数界，或寻找真正违反该界且改变低谱的物理点。必须先比较局域噪声下 Gibbs/模哈密顿量局域性和相关 AKLT 精确结果。不能只扫更大尺寸拟合 gap，也不能由 \(\rho_p\) 与单位态很近直接推导 log 的局域性。

到目前为止，有限程父哈密顿量问题没有解决；我们已排除错误的可积捷径，并建立了更符合物理前提的精确对象。高价值目标未达到。

## 本轮实际核对的来源

1. Zhou et al., NSR 12, nwae287, DOI 10.1093/nsr/nwae287；arXiv:2310.01475v1。https://academic.oup.com/nsr/article/12/1/nwae287/7737777
2. Li, Li, Zhou, Numerical investigations of the extensive entanglement Hamiltonian in quantum spin ladders (2024), DOI 10.1007/s44214-024-00056-2，Eq.(1)–(6)及第2节。https://link.springer.com/article/10.1007/s44214-024-00056-2
3. Katsura, On integrable matrix product operators with bond dimension D=4, arXiv:1407.4262v3，Eq.(19),(45)–(55)及小尺寸警告。https://arxiv.org/html/1407.4262v3
4. Chandran, Khemani, Sondhi, How Universal Is the Entanglement Spectrum?, PRL 113,060501 (2014), DOI 10.1103/PhysRevLett.113.060501。https://arxiv.org/abs/1311.2946
5. Tzeng–Möller, arXiv:2509.03588v2，摘要与结论；作为不同对称性/编码下不可外推的直接近邻。https://arxiv.org/html/2509.03588v2

公开补充 ZIP 再次返回工具错误；并未读到其内容。宽泛搜索有大量无关结果，不构成首创性证据。以上桥接是对现有公式的推论，未赋予新颖性标签。