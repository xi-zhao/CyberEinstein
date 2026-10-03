
export function build(manim) {
  const {Scene,Text,SurroundingRectangle,VGroup,Arrow,Line,Create,FadeIn,Indicate,BLUE,TEAL,YELLOW,WHITE,GRAY}=manim;
  const scene=new Scene();
  const names=["模型","参数与环境","运行记录","检查结果"];
  const colors=[BLUE,BLUE,TEAL,TEAL];
  const xs=[-4.65,-1.55,1.55,4.65];
  const blocks=names.map((s,i)=>{
    const t=Text(s,{color:colors[i]}).scale(0.5).move_to([xs[i],0.9,0]);
    return VGroup(SurroundingRectangle(t,{buff:0.32,color:colors[i]}),t);
  });
  for(let i=0;i<4;i++){
    scene.play(FadeIn(blocks[i]),{run_time:0.7});
    if(i>0)scene.play(Create(Arrow(blocks[i-1].get_right(),blocks[i].get_left(),{color:GRAY,buff:0.12})),{run_time:0.5});
  }
  scene.wait(0.8);
  const claim=Text("结论 + 适用范围",{color:YELLOW}).scale(0.6).move_to([2,-1.3,0]);
  const border=SurroundingRectangle(claim,{buff:0.35,color:YELLOW});
  const trace=Arrow(blocks[3].get_bottom(),border.get_top(),{color:TEAL,buff:0.15});
  scene.play(FadeIn(claim),Create(border),Create(trace),{run_time:1.5});
  const review=Text("解析极限 · 独立方法 · 收敛检查",{color:TEAL}).scale(0.45).move_to([-1.5,-2.8,0]);
  scene.play(FadeIn(review),{run_time:1.5});
  scene.play(Indicate(blocks[3]),{run_time:1});
  scene.wait(0.5);
  return scene;
}
