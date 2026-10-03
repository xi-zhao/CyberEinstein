
export function build(manim) {
  const {Scene,Graph,Text,Line,Create,FadeIn,FadeOut,Indicate,BLUE,TEAL,YELLOW,GRAY,WHITE}=manim;
  const scene=new Scene();
  const pos={a:[-5,1.5,0],b:[-5,-0.6,0],c:[-2.8,0.5,0],s:[-0.5,0.5,0],d:[1.7,1.5,0],e:[1.7,-0.6,0],n:[4.2,0.5,0],x:[-3.7,-2.0,0],f:[4.0,2.3,0],r:[5.4,-1.5,0]};
  const edges=[["a","c"],["b","c"],["c","s"],["s","d"],["s","e"],["d","n"],["e","n"],["b","x"]];
  const g=Graph(Object.keys(pos),edges,{layout:pos,labels:false});
  for(const id of Object.keys(pos))g.get_vertex(id).set_color(id==="x"?GRAY:id==="f"||id==="r"?YELLOW:BLUE);
  for(const p of edges)g.get_edge(p[0],p[1]).set_stroke(GRAY,2);
  const seed=Text("种子论文",{color:WHITE}).scale(0.45).move_to([-0.5,-0.3,0]);
  scene.play(FadeIn(g.get_vertex("s")),FadeIn(seed),{run_time:1});
  for(const id of ["c","a","b","d","e","n","x"])scene.play(FadeIn(g.get_vertex(id)),{run_time:0.3});
  for(const p of edges)scene.play(Create(g.get_edge(p[0],p[1])),{run_time:0.25});
  scene.wait(0.7);
  const relevant=Text("相关性过滤",{color:TEAL}).scale(0.5).move_to([-3.7,-2.8,0]);
  scene.play(FadeIn(relevant),FadeOut(g.get_vertex("x")),FadeOut(g.get_edge("b","x")),{run_time:1.5});
  const spine=[["a","c"],["c","s"],["s","d"],["d","n"]];
  scene.play(...spine.map(p=>g.get_edge(p[0],p[1]).animate.set_stroke(TEAL,5)),{run_time:1.5});
  const backbone=Text("优先阅读的历史主干",{color:TEAL}).scale(0.45).move_to([0,2.9,0]);
  scene.play(FadeIn(backbone),{run_time:1});
  scene.play(FadeIn(g.get_vertex("f")),FadeIn(g.get_vertex("r")),{run_time:1.5});
  const frontier=Text("按主题寻找近期工作",{color:YELLOW}).scale(0.4).move_to([3.3,-2.8,0]);
  scene.play(FadeIn(frontier),Indicate(g.get_vertex("f")),{run_time:1});
  scene.wait(0.5);
  return scene;
}
