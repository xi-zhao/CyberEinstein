
export function build(manim) {
  const {Scene,Graph,Text,VGroup,Circle,Line,Create,FadeIn,FadeOut,Indicate,Transform,BLUE,TEAL,YELLOW,GRAY,WHITE}=manim;
  const scene=new Scene();
  const positions={a:[-4.8,1.6,0],b:[-4.3,-1.0,0],c:[-2.2,0.3,0],d:[0.2,1.5,0],e:[0.8,-1.1,0],f:[3.0,0.5,0],q:[5.0,1.1,0]};
  const nodes=["a","b","c","d","e","f","q"];
  const graph=Graph(nodes,[["a","c"],["b","c"],["c","d"],["c","e"],["d","f"],["e","f"],["f","q"]],{layout:positions,labels:false});
  const title=Text("一个结论，连接许多次探索",{color:WHITE}).scale(0.6).move_to([0,2.9,0]);
  scene.play(FadeIn(title),{run_time:1});
  for(const id of nodes) graph.get_vertex(id).set_color(id==="q"?YELLOW:BLUE);
  for(const id of ["a","b","c","d","e","f"]) scene.play(FadeIn(graph.get_vertex(id)),{run_time:0.45});
  scene.wait(1);
  for(const edge of [["a","c"],["b","c"],["c","d"],["c","e"],["d","f"],["e","f"]]) scene.play(Create(graph.get_edge(edge[0],edge[1])),{run_time:0.5});
  const method=Text("方法",{color:BLUE}).scale(0.5).move_to([-3.8,-2.3,0]);
  const evidence=Text("证据",{color:TEAL}).scale(0.5).move_to([0,-2.3,0]);
  const question=Text("新问题",{color:YELLOW}).scale(0.5).move_to([3.8,-2.3,0]);
  scene.play(FadeIn(method),FadeIn(evidence),{run_time:1});
  scene.play(FadeIn(graph.get_vertex("q")),Create(graph.get_edge("f","q")),FadeIn(question),{run_time:1.5});
  scene.play(Indicate(graph.get_vertex("q")),{run_time:1});
  scene.wait(0.5);
  return scene;
}
