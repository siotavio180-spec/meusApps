const $=id=>document.getElementById(id);
const state={parts:[],sheets:[],sheet:1,zoom:1,angle:"perspective",rot:0,wire:false,showMeasures:true};
const val=id=>Number($(id)?.value)||0;
const material=()=>$("material").value;
const dateNow=()=>new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});

function makeParts(){
 const W=val("mw"),H=val("mh"),D=val("md"),T=val("thick"),B=val("back"),foot=val("foot");
 if(W<100||H<100||D<100) throw new Error("Preencha largura, altura e profundidade do móvel.");
 const carcassH=Math.max(1,H-foot),innerW=Math.max(1,W-2*T),drawerW=Math.max(120,Math.round((innerW-T)/2)),drawerD=Math.max(120,Math.min(D-50,500)),shelfW=Math.max(1,innerW-T);
 const p=[
 ["Lateral Esquerda",1,carcassH,D],["Lateral Direita",1,carcassH,D],["Divisão Vertical",1,carcassH,D],
 ["Base",1,innerW,D],["Tampo",1,innerW,D],["Prateleira 1",1,shelfW,D],["Prateleira 2",1,shelfW,D],["Prateleira 3",1,shelfW,D],
 ["Gaveta 1 Lateral",2,Math.max(1,drawerD-36),Math.max(80,drawerD)],["Gaveta 1 Frente",1,drawerW,200],["Gaveta 1 Traseira",1,drawerW,200],
 ["Fundo do Móvel",1,Math.max(1,W-10),Math.max(1,H-10)]
 ];
 if(B>0)p.push(["Fundo das Gavetas",2,Math.max(1,drawerW-20),Math.max(80,190-B)]);
 return p.map((x,i)=>({n:i+1,name:x[0],qty:x[1],w:Math.round(x[2]),h:Math.round(x[3]),t:T,mat:material()}));
}
function expandParts(parts){const out=[];parts.forEach(p=>{for(let i=0;i<p.qty;i++)out.push({...p,qty:1,name:p.qty>1?p.name+" "+(i+1):p.name});});return out;}
function pack(items,bw,bh,gap){
 const sheets=[];const newSheet=()=>({items:[],free:[{x:gap,y:gap,w:bw-2*gap,h:bh-2*gap}]});sheets.push(newSheet());
 const sorted=[...items].sort((a,b)=>b.w*b.h-a.w*a.h);
 for(const item of sorted){
  let placed=false;
  for(const sh of sheets){
   let best=null;
   sh.free.forEach((f,fi)=>[[false,item.w,item.h],[true,item.h,item.w]].forEach(q=>{
    const rot=q[0],w=q[1],h=q[2];if(w<=f.w&&h<=f.h){const waste=f.w*f.h-w*h;if(!best||waste<best.waste)best={fi,f,rot,w,h,waste};}
   }));
   if(best){
    const f=best.f;sh.items.push({...item,x:f.x,y:f.y,pw:best.w,ph:best.h,rot:best.rot});sh.free.splice(best.fi,1);
    const r={x:f.x+best.w+gap,y:f.y,w:f.w-best.w-gap,h:best.h},b={x:f.x,y:f.y+best.h+gap,w:f.w,h:f.h-best.h-gap};
    if(r.w>5&&r.h>5)sh.free.push(r);if(b.w>5&&b.h>5)sh.free.push(b);placed=true;break;
   }
  }
  if(!placed){
   const sh=newSheet();sheets.push(sh);const f=sh.free[0];let rot=false,w=item.w,h=item.h;
   if(!(w<=f.w&&h<=f.h)&&item.h<=f.w&&item.w<=f.h){rot=true;w=item.h;h=item.w;}
   if(w>f.w||h>f.h)throw new Error("A peça ""+item.name+"" não cabe na chapa "+bw+" × "+bh+" mm.");
   sh.items.push({...item,x:f.x,y:f.y,pw:w,ph:h,rot});sh.free=[];
   const r={x:f.x+w+gap,y:f.y,w:f.w-w-gap,h:h},b={x:f.x,y:f.y+h+gap,w:f.w,h:f.h-h-gap};
   if(r.w>5&&r.h>5)sh.free.push(r);if(b.w>5&&b.h>5)sh.free.push(b);
  }
 }
 return sheets;
}
function getData(){return{boardW:val("boardW"),boardH:val("boardH"),thick:val("thick"),edge:val("edge"),mw:val("mw"),mh:val("mh"),md:val("md"),foot:val("foot"),back:$("back").value,margin:val("margin"),material:material(),parts:state.parts};}
function generate(){
 try{const bw=val("boardW"),bh=val("boardH"),gap=Math.max(2,val("margin"));if(bw<100||bh<100)throw new Error("Confira as medidas da chapa.");
 state.parts=makeParts();state.sheets=pack(expandParts(state.parts),bw,bh,gap);state.sheet=1;state.zoom=1;renderAll();localStorage.setItem("woodplan3d-pro",JSON.stringify(getData()));show("cut");
 }catch(e){alert(e.message);}
}
function renderAll(){drawCut();renderTable();renderStats();renderModel();$("infoDims").textContent=val("mw")+" × "+val("mh")+" × "+val("md")+" mm (L × A × P)";$("infoMaterial").textContent=material()+" "+val("thick")+"mm";$("infoDate").textContent=dateNow();}
function drawCut(){
 const c=$("cutCanvas"),ctx=c.getContext("2d"),wrap=c.parentElement,dpr=window.devicePixelRatio||1,cw=Math.max(300,wrap.clientWidth),ch=Math.max(400,wrap.clientHeight);
 c.width=cw*dpr;c.height=ch*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,ch);
 const bw=val("boardW"),bh=val("boardH"),pad=32,s=Math.min((cw-pad*2)/bw,(ch-pad*2)/bh)*state.zoom,ox=(cw-bw*s)/2,oy=(ch-bh*s)/2;
 ctx.fillStyle="#e9e6df";ctx.strokeStyle="#bd8850";ctx.lineWidth=3;ctx.fillRect(ox,oy,bw*s,bh*s);ctx.strokeRect(ox,oy,bw*s,bh*s);
 const sh=state.sheets[state.sheet-1];if(!sh)return;ctx.textAlign="center";ctx.textBaseline="middle";
 sh.items.forEach((p,i)=>{const x=ox+p.x*s,y=oy+p.y*s,w=p.pw*s,h=p.ph*s;ctx.fillStyle=i%2?"#e8e5df":"#f0ece5";ctx.fillRect(x,y,w,h);ctx.strokeStyle="#30363b";ctx.lineWidth=1.5;ctx.setLineDash([6,5]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
 if(w>45&&h>28){ctx.fillStyle="#161b20";ctx.beginPath();ctx.arc(x+w/2,y+Math.max(13,h*.3),9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 10px Arial";ctx.fillText(i+1,x+w/2,y+Math.max(13,h*.3));ctx.fillStyle="#20252a";ctx.font="bold 10px Arial";ctx.fillText(p.name.length>20?p.name.slice(0,19)+"…":p.name,x+w/2,y+h*.57);ctx.font="10px Arial";ctx.fillText(p.w+" × "+p.h,x+w/2,y+h*.76);}});
 ctx.fillStyle="#252d32";ctx.font="11px Arial";ctx.fillText(bw+" mm",ox+bw*s/2,oy-12);ctx.save();ctx.translate(ox-18,oy+bh*s/2);ctx.rotate(-Math.PI/2);ctx.fillText(bh+" mm",0,0);ctx.restore();$("sheetLabel").textContent="Chapa "+state.sheet+" de "+state.sheets.length;
}
function renderTable(){const body=$("partsTable");body.innerHTML="";state.parts.forEach((p,i)=>{const tr=document.createElement("tr");[i+1,p.name,p.qty,p.w,p.h,p.t,p.mat].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});body.appendChild(tr);});}
function renderStats(){
 const bw=val("boardW"),bh=val("boardH"),count=Math.max(1,state.sheets.length),used=state.parts.reduce((s,p)=>s+p.w*p.h*p.qty,0),total=bw*bh*count,rate=total?used/total*100:0;
 const vals=[(bw*bh/1e6).toFixed(2)+" m²",(used/1e6).toFixed(2)+" m² ("+rate.toFixed(1)+"%)",Math.max(0,(total-used)/1e6).toFixed(2)+" m² ("+Math.max(0,100-rate).toFixed(1)+"%)",state.parts.reduce((s,p)=>s+p.qty,0),rate.toFixed(1)+"%"];
 document.querySelectorAll("#stats .stat b").forEach((e,i)=>e.textContent=vals[i]);
}
function renderModel(){
 const c=$("cabinet");c.innerHTML="";
 ["backPiece","topPiece","bottomPiece","leftPiece","rightPiece","shelf s1","shelf s2","drawer dr1","drawer dr2","door door1","door door2"].forEach(cls=>{const el=document.createElement("div");el.className="piece "+cls;if(cls.includes("drawer")||cls.includes("door")){const h=document.createElement("i");h.className="handle";el.appendChild(h);}c.appendChild(el);});
 $("dimW").textContent=val("mw")+" mm";$("dimH").textContent=val("mh")+" mm";$("dimD").textContent=val("md")+" mm";document.querySelectorAll(".dim").forEach(x=>x.style.display=state.showMeasures?"block":"none");c.classList.toggle("wire",state.wire);applyAngle();
}
function applyAngle(){let t="translate(-50%,-50%) rotateX(-4deg) rotateY(-28deg)";if(state.angle==="front")t="translate(-50%,-50%) rotateX(0) rotateY(0)";if(state.angle==="side")t="translate(-50%,-50%) rotateX(0) rotateY(-90deg)";if(state.angle==="top")t="translate(-50%,-50%) rotateX(82deg) rotateY(0)";$("cabinet").style.transform=t;}
function show(view){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));document.querySelectorAll(".mobileNav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(view==="cut")$("cutCanvas").scrollIntoView({behavior:"smooth",block:"center"});if(view==="model")$("scene").scrollIntoView({behavior:"smooth",block:"center"});if(view==="project")window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>show(b.dataset.view));
$("generateBtn").onclick=generate;$("partsBtn").onclick=()=>show("cut");
$("zoomIn").onclick=()=>{state.zoom=Math.min(2,state.zoom+.15);drawCut()};$("zoomOut").onclick=()=>{state.zoom=Math.max(.5,state.zoom-.15);drawCut()};$("fit").onclick=()=>{state.zoom=1;drawCut()};
document.querySelectorAll(".viewBtn").forEach(b=>b.onclick=()=>{state.angle=b.dataset.angle;document.querySelectorAll(".viewBtn").forEach(x=>x.classList.toggle("active",x===b));applyAngle();});
$("rotate").onclick=()=>{state.rot=(state.rot+1)%4;state.angle=["perspective","front","side","top"][state.rot];document.querySelectorAll(".viewBtn").forEach(x=>x.classList.toggle("active",x.dataset.angle===state.angle));applyAngle();};
$("wire").onclick=()=>{state.wire=!state.wire;$("cabinet").classList.toggle("wire",state.wire)};$("measures").onclick=()=>{state.showMeasures=!state.showMeasures;document.querySelectorAll(".dim").forEach(x=>x.style.display=state.showMeasures?"block":"none")};$("modelZoom").onclick=()=>{$("cabinet").style.scale=$("cabinet").style.scale==="1.2"?"1":"1.2"};$("pan").onclick=()=>{$("cabinet").style.translate=$("cabinet").style.translate?"":"8px -6px"};
$("newBtn").onclick=()=>{if(confirm("Começar um projeto novo?")){localStorage.removeItem("woodplan3d-pro");location.reload()}};
$("saveBtn").onclick=()=>{const blob=new Blob([JSON.stringify(getData(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="woodplan3d-projeto.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);};
$("openBtn").onclick=()=>$("fileInput").click();$("fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);Object.keys(d).forEach(k=>{if($(k)&&k!=="parts")$(k).value=d[k]});state.parts=d.parts||[];state.sheets=pack(expandParts(state.parts),val("boardW"),val("boardH"),Math.max(2,val("margin")));state.sheet=1;renderAll();alert("Projeto aberto.");}catch(err){alert("Arquivo de projeto inválido.");}};r.readAsText(f);};
$("pdfBtn").onclick=()=>{const rows=state.parts.map((p,i)=>(i+1)+" | "+p.name+" | "+p.qty+" | "+p.w+" | "+p.h+" | "+p.t+" | "+p.mat).join("\n");const win=window.open("","_blank");if(!win){alert("Permita pop-ups para gerar a lista.");return;}win.document.write("<html><head><title>Lista WoodPlan3D</title></head><body><h2>WOODPLAN3D — LISTA DE PEÇAS</h2><pre style='font:14px Arial'>"+rows+"</pre><script>window.onload=function(){window.print()}<\/script></body></html>");win.document.close();};
window.addEventListener("resize",()=>{if(state.sheets.length)drawCut()});
try{const d=JSON.parse(localStorage.getItem("woodplan3d-pro")||"null");if(d){Object.keys(d).forEach(k=>{if($(k)&&k!=="parts")$(k).value=d[k]});state.parts=d.parts||[];}}catch(e){}
if(state.parts.length){try{state.sheets=pack(expandParts(state.parts),val("boardW"),val("boardH"),Math.max(2,val("margin")));renderAll();}catch(e){generate();}}else{generate();}
