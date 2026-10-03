
export function build(manim) {
  const {Scene,Text,Graph,Arrow,Line,Create,FadeIn,FadeOut,Indicate,BLUE,TEAL,YELLOW,RED,GRAY,WHITE}=manim;
  const scene=new Scene();
  const pos={p1:[-4.6,1.4,0],p2:[-4.6,-0.8,0],m:[-2.5,0.3,0],q:[0.0,0.3,0],h1:[2.4,1.6,0],h2:[2.4,-1.0,0],r1:[4.9,1.6,0],r2:[4.9,-1.0,0]};
  const pairs=[["p1","m"],["p2","m"],["m","q"],["q","h1"],["q","h2"],["h1","r1"],["h2","r2"]];
  const g=Graph(Object.keys(pos),pairs,{layout:pos,labels:false});
  for(const id of Object.keys(pos))g.get_vertex(id).set_color(id==="q"?YELLOW:id==="r2"?RED:id==="r1"?TEAL:BLUE);
  const past=Text("已有方法与证据",{color:BLUE}).scale(0.4).move_to([-3.8,-2.0,0]);
  scene.play(FadeIn(past),FadeIn(g.get_vertex("p1")),FadeIn(g.get_vertex("p2")),FadeIn(g.get_vertex("m")),Create(g.get_edge("p1","m")),Create(g.get_edge("p2","m")),{run_time:2});
  const qt=Text("一个未解决问题",{color:YELLOW}).scale(0.45).move_to([0,2.7,0]);
  scene.play(FadeIn(g.get_vertex("q")),Create(g.get_edge("m","q")),FadeIn(qt),{run_time:1.5});
  for(const id of ["h1","h2"])scene.play(FadeIn(g.get_vertex(id)),Create(g.get_edge("q",id)),{run_time:0.8});
  const test=Text("提出可检验的假设",{color:WHITE}).scale(0.4).move_to([0,-2.0,0]);
  scene.play(FadeIn(test),{run_time:1});
  for(const n of [["h1","r1"],["h2","r2"]])scene.play(FadeIn(g.get_vertex(n[1])),Create(g.get_edge(n[0],n[1])),{run_time:0.8});
  const supported=Text("获得支持",{color:TEAL}).scale(0.38).move_to([4.9,2.4,0]);
  const excluded=Text("解释被排除",{color:RED}).scale(0.38).move_to([4.9,-1.8,0]);
  scene.play(FadeIn(supported),FadeIn(excluded),{run_time:1.5});
  const scrutiny=Text("保留证据与局限 · 接受独立检查",{color:TEAL}).scale(0.45).move_to([0,-3.0,0]);
  scene.play(FadeIn(scrutiny),{run_time:1});
  scene.wait(0.5);
  return scene;
}
