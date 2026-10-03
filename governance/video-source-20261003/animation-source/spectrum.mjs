
export function build(manim) {
  const {Scene,Axes,Text,Dot,DashedLine,Create,FadeIn,Indicate,BLUE,YELLOW,GRAY,TEAL,WHITE}=manim;
  const scene=new Scene();
  const re=Axes({x_range:[0,2,0.5],y_range:[-1.8,1.8,1],x_length:4.5,y_length:3.6}).move_to([-3.1,0,0]);
  const im=Axes({x_range:[0,2,0.5],y_range:[-1.8,1.8,1],x_length:4.5,y_length:3.6}).move_to([3.1,0,0]);
  const rt=Text("本征值的实部",{color:WHITE}).scale(0.5).move_to([-3.1,2.7,0]);
  const it=Text("本征值的虚部",{color:WHITE}).scale(0.5).move_to([3.1,2.7,0]);
  const zero=Text("教学示例 · γ = 1",{color:GRAY}).scale(0.4).move_to([0,-2.9,0]);
  scene.play(Create(re),Create(im),FadeIn(rt),FadeIn(it),FadeIn(zero),{run_time:1.5});
  const rp=re.plot(x=>Math.sqrt(Math.max(0,x*x-1)),{x_range:[1,2],color:BLUE});
  const rm=re.plot(x=>-Math.sqrt(Math.max(0,x*x-1)),{x_range:[1,2],color:YELLOW});
  const ip=im.plot(x=>Math.sqrt(Math.max(0,1-x*x)),{x_range:[0,1],color:BLUE});
  const ink=im.plot(x=>-Math.sqrt(Math.max(0,1-x*x)),{x_range:[0,1],color:YELLOW});
  scene.play(Create(rp),Create(rm),Create(ip),Create(ink),{run_time:2});
  const er=DashedLine(re.c2p(1,-1.7),re.c2p(1,1.7),{color:TEAL});
  const ei=DashedLine(im.c2p(1,-1.7),im.c2p(1,1.7),{color:TEAL});
  const ep=Text("g = 1 · 简并点",{color:TEAL}).scale(0.45).move_to([0,3.35,0]);
  scene.play(Create(er),Create(ei),FadeIn(ep),{run_time:1});
  const p1=Dot(re.c2p(0.15,0),{color:BLUE});
  const p2=Dot(re.c2p(0.15,0),{color:YELLOW});
  const q1=Dot(im.c2p(0.15,Math.sqrt(1-0.15*0.15)),{color:BLUE});
  const q2=Dot(im.c2p(0.15,-Math.sqrt(1-0.15*0.15)),{color:YELLOW});
  scene.play(FadeIn(p1),FadeIn(p2),FadeIn(q1),FadeIn(q2),{run_time:0.5});
  for(const x of [0.35,0.65,0.9,1,1.15,1.45,1.8]){
    const a=Math.sqrt(Math.max(0,x*x-1));
    const b=Math.sqrt(Math.max(0,1-x*x));
    scene.play(p1.animate.move_to(re.c2p(x,a)),p2.animate.move_to(re.c2p(x,-a)),q1.animate.move_to(im.c2p(x,b)),q2.animate.move_to(im.c2p(x,-b)),{run_time:0.7});
  }
  scene.wait(0.5);
  return scene;
}
