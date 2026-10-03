
export function build(manim) {
  const {Scene,Text,SurroundingRectangle,VGroup,Arrow,Cross,Create,FadeIn,FadeOut,Indicate,Transform,BLUE,TEAL,YELLOW,RED,GRAY,WHITE}=manim;
  const scene=new Scene();
  const bad=Text("错误候选：根号内相加",{color:RED}).scale(0.5).move_to([-3.2,1.5,0]);
  const good=Text("矩阵直接求本征值",{color:TEAL}).scale(0.5).move_to([3.2,1.5,0]);
  const b1=SurroundingRectangle(bad,{buff:0.4,color:RED});
  const b2=SurroundingRectangle(good,{buff:0.4,color:TEAL});
  scene.play(FadeIn(bad),Create(b1),FadeIn(good),Create(b2),{run_time:1.5});
  const mismatch=Text("g = 1 时，预测不一致",{color:RED}).scale(0.55).move_to([0,-0.15,0]);
  scene.play(FadeIn(mismatch),{run_time:1.5});
  scene.play(Create(Cross(b1,{stroke_color:RED})),{run_time:1});
  scene.wait(0.8);
  const lesson=Text("此模型：复核行列式符号",{color:TEAL}).scale(0.5).move_to([0,-1.75,0]);
  const lb=SurroundingRectangle(lesson,{buff:0.4,color:TEAL});
  scene.play(Create(Arrow(mismatch.get_bottom(),lb.get_top(),{color:GRAY,buff:0.15})),FadeIn(lesson),Create(lb),{run_time:1.5});
  const future=Text("带着适用范围，进入下一次研究",{color:YELLOW}).scale(0.45).move_to([0,-3.0,0]);
  scene.play(FadeIn(future),Indicate(lb),{run_time:1.5});
  scene.wait(0.5);
  return scene;
}
