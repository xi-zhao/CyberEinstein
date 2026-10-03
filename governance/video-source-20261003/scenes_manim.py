"""Original 3b1b ManimGL source for the CyberEinstein introduction.

Target: manimgl==1.7.2, Python >=3.10.
Syntax was checked here; original ManimGL rendering was unavailable.
The delivered online film uses its own Manim-compatible JavaScript renderer.
Optional narration clips: voice/01.wav ... voice/12.wav.
"""
from pathlib import Path
import wave
import numpy as np
from manimlib import *

ROOT = Path(__file__).resolve().parent
FONT = 'Microsoft YaHei'
CYAN = '#58c4dd'
MINT = '#5dd6b5'
GOLD = '#f4cf73'
MUTED = '#7e8a9e'
PAPER = '#eeeeee'
BG = '#0b0d13'


def label(s, size=34, color=PAPER):
    return Text(s, font=FONT, font_size=size, color=color)


def boxed(s, center, color=CYAN, size=30, width=None):
    t = label(s, size, color).move_to(center)
    if width and t.get_width() > width:
        t.set_width(width)
    rect = SurroundingRectangle(t, buff=0.28, color=color)
    return VGroup(rect, t)


class CyberEinsteinFilm(Scene):
    """Twelve synchronized teaching beats; replace estimates with real audio lengths."""
    def construct(self):
        self.camera.background_color = BG
        beats = [self.intro, self.history, self.citation, self.map,
                 self.model, self.spectrum, self.evidence, self.failure,
                 self.projects, self.today, self.question, self.closing]
        estimates = [7, 19, 19, 28, 21, 24, 24, 26, 25, 24, 26, 20]
        for i, (beat, estimate) in enumerate(zip(beats, estimates), 1):
            start = self.time
            audio = ROOT / 'voice' / f'{i:02d}.wav'
            if audio.exists():
                with wave.open(str(audio), 'rb') as wav:
                    estimate = wav.getnframes() / wav.getframerate()
                self.add_sound(str(audio))
            beat()
            elapsed = self.time - start
            self.wait(max(0.5, estimate - elapsed))
            if i != len(beats):
                self.play(*[FadeOut(m) for m in list(self.mobjects)], run_time=0.65)

    def heading(self, s):
        t = label(s, 36).to_edge(UP, buff=0.48)
        self.play(FadeIn(t), run_time=0.7)
        return t

    def network(self, positions, pairs, colors=None):
        nodes = {k: Dot(p, radius=0.12, color=(colors or {}).get(k, CYAN))
                 for k, p in positions.items()}
        edges = {p: Line(positions[p[0]], positions[p[1]],
                         color=MUTED, stroke_width=2) for p in pairs}
        return nodes, edges

    def intro(self):
        title = label('CyberEinstein', 70).shift(UP * 0.5)
        sub = label('让科学史可以重新运行', 38, CYAN).next_to(title, DOWN, buff=0.4)
        self.play(FadeIn(title), run_time=1.5)
        self.play(FadeIn(sub), run_time=1.3)

    def history(self):
        self.heading('一个结论，是怎样走到这里的？')
        pos = {'a':[-5,1.3,0], 'b':[-4.5,-1,0], 'c':[-2.5,0.3,0],
               'd':[0,1.3,0], 'e':[0.5,-1,0], 'f':[3,0.3,0], 'q':[5,1.3,0]}
        pairs=[('a','c'),('b','c'),('c','d'),('c','e'),('d','f'),('e','f'),('f','q')]
        nodes,edges=self.network(pos,pairs,{'q':GOLD})
        for k in ['a','b','c','d','e','f']:
            self.play(FadeIn(nodes[k]),run_time=.35)
        for p in pairs[:-1]:self.play(ShowCreation(edges[p]),run_time=.4)
        self.play(FadeIn(nodes['q']),ShowCreation(edges[pairs[-1]]),run_time=1.4)
        for x,s,c in [(-4,'方法',CYAN),(0,'证据',MINT),(4,'新问题',GOLD)]:
            self.play(FadeIn(label(s,32,c).move_to([x,-2.3,0])),run_time=.5)
        self.play(Indicate(nodes['q']),run_time=1)

    def citation(self):
        self.heading('引用关系，通向需要核验的问题')
        a=boxed('论文 A',[-3.8,.6,0],CYAN)
        b=boxed('论文 B',[3.8,.6,0],MINT)
        arrow=Arrow(a.get_right(),b.get_left(),buff=.15,color=MUTED)
        self.play(FadeIn(a),FadeIn(b),run_time=1.5)
        self.play(ShowCreation(arrow),FadeIn(label('引用',28).move_to([0,1.3,0])),run_time=1.5)
        self.play(FadeIn(label('继承？    验证？    反驳？',34,GOLD).move_to([0,-1,0])),run_time=1.5)
        self.play(FadeIn(label('阅读全文中的引用语境',32,MINT).move_to([0,-2.4,0])),run_time=1.5)

    def map(self):
        self.heading('从一篇论文，展开领域历史')
        pos={'a':[-5,1.4,0],'b':[-5,-.5,0],'c':[-2.8,.5,0],
             's':[-.5,.5,0],'d':[1.7,1.4,0],'e':[1.7,-.5,0],
             'n':[4.2,.5,0],'x':[-3.7,-1.8,0],'f':[4,2.3,0],'r':[5.4,-1.5,0]}
        pairs=[('a','c'),('b','c'),('c','s'),('s','d'),('s','e'),('d','n'),('e','n'),('b','x')]
        nodes,edges=self.network(pos,pairs,{'x':MUTED,'f':GOLD,'r':GOLD})
        self.play(FadeIn(nodes['s']),FadeIn(label('种子论文',26).move_to([-.5,-.2,0])),run_time=1)
        for k in ['c','a','b','d','e','n','x']:self.play(FadeIn(nodes[k]),run_time=.25)
        for e in edges.values():self.play(ShowCreation(e),run_time=.2)
        self.play(FadeOut(nodes['x']),FadeOut(edges[('b','x')]),
                  FadeIn(label('相关性过滤',28,MINT).move_to([-3.7,-2.6,0])),run_time=1.4)
        spine=[('a','c'),('c','s'),('s','d'),('d','n')]
        self.play(*[edges[p].animate.set_stroke(MINT,width=5) for p in spine],run_time=1.5)
        self.play(FadeIn(nodes['f']),FadeIn(nodes['r']),
                  FadeIn(label('按主题寻找近期工作',28,GOLD).move_to([3.1,-2.7,0])),run_time=1.5)

    def model(self):
        self.heading('把方法，变成可以计算的对象')
        h=Tex(r'H(g)=\begin{pmatrix}i\gamma&g\\g&-i\gamma\end{pmatrix}',font_size=58).shift(UP*.5)
        e=Tex(r'E_{\pm}(g)=\pm\sqrt{g^2-\gamma^2}',font_size=56,color=CYAN).next_to(h,DOWN,buff=.65)
        self.play(Write(h),run_time=2)
        self.play(Write(e),run_time=2)
        self.play(FadeIn(label('教学示例 · γ = 1',28,MUTED).to_edge(DOWN,buff=.5)),run_time=1)

    def spectrum(self):
        self.heading('改变参数，让预测真正运行')
        axes=[Axes(x_range=(0,2,.5),y_range=(-1.8,1.8,1),
                   width=4.5,height=3.5).move_to([x,0,0]) for x in [-3.1,3.1]]
        re,im=axes
        self.play(*[ShowCreation(a) for a in axes],run_time=1.5)
        for x,s in [(-3.1,'本征值的实部'),(3.1,'本征值的虚部')]:
            self.play(FadeIn(label(s,28).move_to([x,2.2,0])),
                      FadeIn(label('耦合强度 g',24,MUTED).move_to([x,-2.25,0])),run_time=.6)
        curves=[re.get_graph(lambda g:np.sqrt(max(0,g*g-1)),x_range=(1,2),color=CYAN),
                re.get_graph(lambda g:-np.sqrt(max(0,g*g-1)),x_range=(1,2),color=GOLD),
                im.get_graph(lambda g:np.sqrt(max(0,1-g*g)),x_range=(0,1),color=CYAN),
                im.get_graph(lambda g:-np.sqrt(max(0,1-g*g)),x_range=(0,1),color=GOLD)]
        self.play(*[ShowCreation(c) for c in curves],run_time=2)
        self.play(*[ShowCreation(DashedLine(a.c2p(1,-1.7),a.c2p(1,1.7),color=MINT)) for a in axes],run_time=1)
        dots=[Dot(re.c2p(.15,0),color=CYAN),Dot(re.c2p(.15,0),color=GOLD),
              Dot(im.c2p(.15,np.sqrt(1-.15**2)),color=CYAN),
              Dot(im.c2p(.15,-np.sqrt(1-.15**2)),color=GOLD)]
        self.add(*dots)
        for g in [.35,.65,.9,1,1.15,1.45,1.8]:
            r=np.sqrt(max(0,g*g-1));j=np.sqrt(max(0,1-g*g))
            points=[re.c2p(g,r),re.c2p(g,-r),im.c2p(g,j),im.c2p(g,-j)]
            self.play(*[d.animate.move_to(p) for d,p in zip(dots,points)],run_time=.8)
        self.play(FadeIn(label('教学示例 · γ = 1 · g = 1 时本征值汇合',26,MINT).to_edge(DOWN,buff=.45)),run_time=1)

    def evidence(self):
        self.heading('把结论，连接到具体证据')
        words=['模型','参数与环境','运行记录','检查结果']
        blocks=[boxed(s,[x,.9,0],CYAN if i<2 else MINT,size=26)
                for i,(s,x) in enumerate(zip(words,[-4.65,-1.55,1.55,4.65]))]
        for i,b in enumerate(blocks):
            self.play(FadeIn(b),run_time=.7)
            if i:self.play(ShowCreation(Arrow(blocks[i-1].get_right(),b.get_left(),buff=.12,color=MUTED)),run_time=.5)
        claim=boxed('结论 + 适用范围',[2,-1.3,0],GOLD,size=32)
        self.play(FadeIn(claim),ShowCreation(Arrow(blocks[-1].get_bottom(),claim.get_top(),buff=.12,color=MINT)),run_time=1.5)
        self.play(FadeIn(label('解析极限 · 独立方法 · 收敛检查',30,MINT).move_to([0,-2.8,0])),run_time=1.4)

    def failure(self):
        self.heading('一次失败，也能留下可复用的经验')
        bad=boxed('错误候选：根号内相加',[-3.3,1,0],RED,size=26)
        good=boxed('矩阵直接求本征值',[3.3,1,0],MINT,size=26)
        self.play(FadeIn(bad),FadeIn(good),run_time=1.4)
        mismatch=label('g = 1 时，预测不一致',32,RED).move_to([0,-.2,0])
        self.play(FadeIn(mismatch),ShowCreation(Cross(bad)),run_time=1.8)
        lesson=boxed('此模型：复核行列式符号',[0,-1.7,0],MINT,size=30)
        self.play(FadeIn(lesson),ShowCreation(Arrow(mismatch.get_bottom(),lesson.get_top(),buff=.15,color=MUTED)),run_time=1.5)
        self.play(FadeIn(label('带着适用范围，进入下一次研究',28,GOLD).move_to([0,-2.9,0])),run_time=1)

    def projects(self):
        self.heading('三个项目，共同建设一条研究路径')
        specs=[('PRAgent','独立重建与检验',-4.1,CYAN),
               ('RunThePaper','保存与共享',0,MINT),
               ('CyberEinstein','连接历史与新问题',4.1,GOLD)]
        blocks=[]
        for name,role,x,c in specs:
            b=boxed(name,[x,1,0],c,size=33,width=2.8)
            blocks.append(b)
            self.play(FadeIn(b),FadeIn(label(role,26).move_to([x,-.3,0])),run_time=1.3)
        for a,b in zip(blocks,blocks[1:]):self.play(ShowCreation(Arrow(a.get_right(),b.get_left(),buff=.1,color=MUTED)),run_time=1)
        self.play(ShowCreation(Line([4.1,-1.1,0],[4.1,-2.1,0],color=MINT)),
                  ShowCreation(Arrow([4.1,-2.1,0],[-4.1,-2.1,0],buff=0,color=MINT)),run_time=1.7)
        self.play(FadeIn(label('让证据和经验，回到下一次研究',30,MINT).move_to([0,-2.9,0])),run_time=1)

    def today(self):
        self.heading('当前：开发者预览，从量子与计算物理切入')
        specs=[('论文地图','相关工作 · 历史主干 · 近期进展',CYAN),
               ('文献调研','检索阅读 · 证据矛盾 · 未决问题',MINT),
               ('研究记录','目标方法 · 运行失败 · 版本记录',GOLD)]
        for (s,detail,c),x in zip(specs,[-4.2,0,4.2]):
            card=boxed(s,[x,.8,0],c,size=36)
            detail=label(detail,23).set_width(3.7).move_to([x,-.6,0])
            self.play(FadeIn(card),FadeIn(detail),run_time=1.4)
        self.play(FadeIn(label('自动生成的关系仍需核验',28,MUTED).move_to([0,-2.6,0])),run_time=1)

    def question(self):
        self.heading('下一步：围绕一个真正未解决的问题')
        pos={'a':[-4.6,1.2,0],'b':[-4.6,-.8,0],'m':[-2.5,.3,0],
             'q':[0,.3,0],'h1':[2.4,1.3,0],'h2':[2.4,-1,0],
             'r1':[4.9,1.3,0],'r2':[4.9,-1,0]}
        pairs=[('a','m'),('b','m'),('m','q'),('q','h1'),('q','h2'),('h1','r1'),('h2','r2')]
        nodes,edges=self.network(pos,pairs,{'q':GOLD,'r1':MINT,'r2':RED})
        for k in nodes:self.play(FadeIn(nodes[k]),run_time=.3)
        for e in edges.values():self.play(ShowCreation(e),run_time=.4)
        for x,y,s,c in [(-3.5,-2,'已有方法与证据',CYAN),(0,-2,'可检验的假设',GOLD),
                         (4.9,2.1,'获得支持',MINT),(4.9,-1.8,'解释被排除',RED)]:
            self.play(FadeIn(label(s,26,c).move_to([x,y,0])),run_time=.5)
        self.play(FadeIn(label('保留证据与局限 · 接受独立检查',30,MINT).move_to([0,-3,0])),run_time=1)

    def closing(self):
        cover=ROOT/'cybereinstein-cover.png'
        if cover.exists():
            self.play(FadeIn(ImageMobject(str(cover)).set_width(14.2)),run_time=2)
        else:
            self.play(FadeIn(label('CyberEinstein',68)),run_time=2)
        self.wait(2)


class SpectrumDemo(CyberEinsteinFilm):
    def construct(self):
        self.camera.background_color=BG
        self.spectrum()
        self.wait(1)
