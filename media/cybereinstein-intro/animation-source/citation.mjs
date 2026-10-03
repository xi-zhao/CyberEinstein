
export function build(manim) {
  const {Scene,Text,SurroundingRectangle,VGroup,Arrow,Create,FadeIn,FadeOut,Transform,Indicate,BLUE,TEAL,YELLOW,GRAY,WHITE}=manim;
  const scene=new Scene();
  const a=Text("论文 A",{color:BLUE}).scale(0.7).move_to([-3.8,0.5,0]);
  const b=Text("论文 B",{color:TEAL}).scale(0.7).move_to([3.8,0.5,0]);
  const ba=SurroundingRectangle(a,{buff:0.45,color:BLUE});
  const bb=SurroundingRectangle(b,{buff:0.45,color:TEAL});
  const link=Arrow(ba.get_right(),bb.get_left(),{color:GRAY,buff:0.2});
  const label=Text("引用",{color:WHITE}).scale(0.5).move_to([0,1.1,0]);
  scene.play(FadeIn(a),Create(ba),FadeIn(b),Create(bb),{run_time:1.5});
  scene.play(Create(link),FadeIn(label),{run_time:1.5});
  scene.wait(1);
  const h=Text("继承？   验证？   反驳？",{color:YELLOW}).scale(0.55).move_to([0,-1.2,0]);
  scene.play(FadeIn(h),{run_time:1.5});
  scene.play(Indicate(link),{run_time:1});
  const full=Text("阅读全文中的引用语境",{color:TEAL}).scale(0.55).move_to([0,-2.5,0]);
  scene.play(FadeIn(full),{run_time:1.5});
  scene.wait(0.5);
  return scene;
}
