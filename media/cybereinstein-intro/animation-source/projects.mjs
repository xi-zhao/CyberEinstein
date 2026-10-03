
export function build(manim) {
  const {Scene,Text,VGroup,SurroundingRectangle,Arrow,Line,Create,FadeIn,Indicate,BLUE,TEAL,YELLOW,GRAY,WHITE}=manim;
  const scene=new Scene();
  const specs=[["PRAgent","独立重建与检验",-4.1,BLUE],["RunThePaper","保存与共享",0,TEAL],["CyberEinstein","连接历史与新问题",4.1,YELLOW]];
  const groups=specs.map(([name,role,x,color])=>{
    const t=Text(name,{color}).scale_to_fit_width(2.8).move_to([x,1.0,0]);
    const box=SurroundingRectangle(t,{buff:0.35,color});
    const r=Text(role,{color:WHITE}).scale(0.42).move_to([x,-0.4,0]);
    return VGroup(box,t,r);
  });
  for(const g of groups)scene.play(FadeIn(g),{run_time:1.3});
  for(let i=0;i<2;i++)scene.play(Create(Arrow(groups[i].get_right(),groups[i+1].get_left(),{color:GRAY,buff:0.18})),{run_time:1});
  scene.wait(1);
  const a=Line([4.1,-1.2,0],[4.1,-2.2,0],{color:TEAL});
  const b=Arrow([4.1,-2.2,0],[-4.1,-2.2,0],{color:TEAL,buff:0});
  const c=Arrow([-4.1,-2.2,0],[-4.1,-1.2,0],{color:TEAL,buff:0});
  const experience=Text("让新证据和失败经验，回到下一次研究",{color:TEAL}).scale(0.45).move_to([0,-2.85,0]);
  scene.play(Create(a),Create(b),Create(c),FadeIn(experience),{run_time:2});
  const status=Text("正在建设的研究路径",{color:GRAY}).scale(0.38).move_to([0,2.8,0]);
  scene.play(FadeIn(status),{run_time:1});
  scene.wait(0.5);
  return scene;
}
