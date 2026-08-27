const canvas=document.getElementById("bg-canvas");
const ctx=canvas.getContext("2d");
let width,height;
function resize(){width=canvas.width=window.innerWidth;height=canvas.height=window.innerHeight}
window.addEventListener("resize",resize);
resize();
const colors=["rgba(216,255,62,0.18)","rgba(165,160,154,0.12)","rgba(18,17,15,0.06)","rgba(216,255,62,0.12)","rgba(123,120,114,0.10)"];
const blobs=colors.map((c,i)=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*300+200,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,color:c}));
function draw(){
  ctx.clearRect(0,0,width,height);
  blobs.forEach(b=>{
    b.x+=b.vx;b.y+=b.vy;
    if(b.x<-b.r)b.x=width+b.r;
    if(b.x>width+b.r)b.x=-b.r;
    if(b.y<-b.r)b.y=height+b.r;
    if(b.y>height+b.r)b.y=-b.r;
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fillStyle=b.color;
    ctx.fill();
  });
  requestAnimationFrame(draw);
}
draw();
