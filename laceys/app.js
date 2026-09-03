const STORE="laceys-slips-v5";
const LAYOUT_STORE="laceys-layout-v1";
const load=()=>{try{return JSON.parse(localStorage.getItem(STORE)||"{}")}catch{return{}}};
const save=d=>localStorage.setItem(STORE,JSON.stringify(d));
let data=load();
const svg=document.getElementById("svg");
const NS="http://www.w3.org/2000/svg";
const el=(n,a,t)=>{const e=document.createElementNS(NS,n);Object.entries(a||{}).forEach(([k,v])=>e.setAttribute(k,v));if(t!=null)e.textContent=t;return e;};
const COLORS={pref:"#d2b48c",std:"#c9896a",wide:"#5aa0c4",sales:"#e39a7a",cruiser:"#e8c4b4",hb:"#6dad6a",fuel:"#e3c35c",courtesy:"#f3efe6"};
const clone=o=>JSON.parse(JSON.stringify(o));
const parseNums=str=>String(str||"").split(/[\s,]+/).map(s=>s.trim()).filter(Boolean).map(s=>/^\d+$/.test(s)?Number(s):s);
const DEFAULT_DOCKS=[
  {id:"7",name:"7",type:"ns",x:1020,y:110,kind:"std",size:"10x30 Standard",a:[65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80],b:[96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81]},
  {id:"8",name:"8",type:"ns",x:1170,y:110,kind:"std",size:"10x30 Standard",a:[97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112],b:[128,127,126,125,124,123,122,121,120,119,118,117,116,115,114,113]},
  {id:"9",name:"9",type:"ns",x:1320,y:110,kind:"std",size:"10x30 Standard",a:[129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144],b:[160,159,158,157,156,155,154,153,152,151,150,149,148,147,146,145]},
  {id:"10",name:"10",type:"ns",x:1470,y:110,kind:"std",size:"10x30 Standard",a:[161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176],b:[192,191,190,189,188,187,186,185,184,183,182,181,180,179,178,177]},
  {id:"11",name:"11",type:"ns",x:1620,y:110,kind:"std",size:"10x30 Standard",a:[193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208],b:[224,223,222,221,220,219,218,217,216,215,214,213,212,211,210,209]},
  {id:"12",name:"12",type:"ns",x:1770,y:110,kind:"std",size:"10x30 Standard",a:[293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308],b:[324,323,322,321,320,319,318,317,316,315,314,313,312,311,310,309]},
  {id:"13",name:"13",type:"ns",x:1920,y:110,kind:"std",size:"10x30 Standard",a:[325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340],b:[356,355,354,353,352,351,350,349,348,347,346,345,344,343,342,341]},
  {id:"4",name:"4",type:"ns",x:40,y:290,kind:"pref",size:"10x30 Preferred",a:[32,31,30,29,28,27,26,25,24,23,22,21,20,19],b:[1,2,3,4,5,6,7,8,9,10,11,12,13,14]},
  {id:"3",name:"3",type:"ns",x:150,y:290,kind:"pref",size:"10x30 Preferred",a:[64,63,62,61,60,59,58,57,56,55,54,53,52,51,50,49],b:[33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]},
  {id:"2",name:"2",type:"ns",x:260,y:290,kind:"wide",size:"16x42",a:[272,271,270,269,268,267,266,265,264,263,262,261],b:[249,250,251,252,253,254,255,256,257,258,259,260]},
  {id:"1",name:"1",type:"ns",x:370,y:290,kind:"wide",size:"16x42",a:[248,247,246,245,244,243,242,241,240,239,238,237],b:[225,226,227,228,229,230,231,232,233,234,235,236]},
  {id:"5",name:"5",type:"ew",x:40,y:600,kind:"pref",size:"10x30 Preferred",a:[283,284,285,286,287,288,289,290,291,292],b:[273,274,275,276,277,278,279,280,281,282]},
  {id:"sales",name:"Sales",type:"col",x:520,y:352,kind:"sales",size:"10x34",a:[851,852,853,854,855,856,841,842,843,844,845,846,847,848,849,850],gap:18,w:40,h:16},
  {id:"fuel",name:"Fuel",type:"col",x:584,y:352,kind:"fuel",size:"Fuel stall",a:["F1","F2","F3","F4"],gap:20,w:40,h:18},
  {id:"courtesy",name:"Courtesy",type:"col",x:584,y:440,kind:"courtesy",size:"Courtesy",a:["C1","C2","C3","C4","C5","C6"],gap:20,w:40,h:18},
  {id:"cruiser",name:"Cruiser",type:"ew",x:700,y:980,kind:"cruiser",size:"Cruiser",a:[801,802,803,804,805,806,807],b:[800,808,809,810,811,812,813,814,815,816]},
  {id:"houseboats",name:"Houseboats",type:"ns",x:1100,y:720,kind:"hb",size:"12x38",a:[817,818,819,820,821,822,823,824,825,826,827,828,829,830],b:[831,832,833,834,835,836,837,838],extras:[{num:839,dx:0,dy:260,w:96,h:22,kind:"fuel",size:"20x87",filter:"Fuel"},{num:840,dx:0,dy:286,w:96,h:22,kind:"fuel",size:"20x87",filter:"Fuel"}]}
];
const DEFAULT_MARKS=[
  {id:"shop",kind:"box",x:40,y:40,w:220,h:70,fill:"#8a8f62",t1:"SHOP / Service Dept.",t2:"Office"},
  {id:"parking",kind:"p",x:150,y:150,w:140,h:52},
  {id:"restroom",kind:"pill",x:318,y:262,w:58,h:20,label:"Restroom"},
  {id:"store",kind:"box",x:520,y:280,w:100,h:44,fill:"#2b6d8a",t1:"Marina Store",t2:"Wave runners",ink:"#fff"},
  {id:"picnic-store",kind:"pill",x:520,y:652,w:72,h:28,label:"Picnic",fill:"#e7a0b8",ink:"#4a2430"},
  {id:"picnic-cru",kind:"pill",x:900,y:1072,w:62,h:26,label:"Picnic",fill:"#e7a0b8",ink:"#4a2430"},
  {id:"picnic-hb",kind:"pill",x:1210,y:1022,w:62,h:26,label:"Picnic",fill:"#e7a0b8",ink:"#4a2430"},
  {id:"bridge",kind:"bridge",x:980,y:36,w:1100,h:22},
  {id:"label-pref",kind:"text",x:40,y:268,text:"10x30 Preferred",size:13},
  {id:"label-std",kind:"text",x:1000,y:78,text:"10x30 Standard",size:13},
  {id:"label-d5",kind:"text",x:40,y:190,text:"Dock 5 access",size:11},
  {id:"label-walk",kind:"text",x:280,y:70,text:"Main walkway",size:11},
  {id:"label-sales",kind:"text",x:520,y:340,text:"Sales 10x34",size:12},
  {id:"label-fuel",kind:"text",x:584,y:342,text:"Fuel / courtesy",size:11},
  {id:"label-emma",kind:"text",x:1100,y:1046,text:"Emma's Room",size:11},
  {id:"std-walk",kind:"bar",x:990,y:88,w:1080,h:14},
  {id:"north",kind:"text",x:1200,y:24,text:"NORTH",size:13},
  {id:"channel",kind:"text",x:2288,y:860,text:"NARROWS CHANNEL",size:14,rot:90}
];
function walkGeomFromDock(d){
  if(d.type==="ns"){const w=d.sw||40,h=d.sh||15,g=d.gap||3,n=Math.max((d.a||[]).length,(d.b||[]).length);return {x:d.x+w+2,y:d.y-4,w:12,h:n*(h+g)+10};}
  if(d.type==="ew"){const w=d.sw||16,h=d.sh||36,g=d.gap||3,n=Math.max((d.a||[]).length,(d.b||[]).length);return {x:d.x-4,y:d.y+h+2,w:n*(w+g)+10,h:12};}
  const n=(d.a||[]).length,g=d.gap||18,h=d.h||16;return {x:d.x+(d.w||40)+4,y:d.y-2,w:10,h:Math.max(20,n*g-g+h+8)};
}
function isDockPieceMark(id){ return /^(walk|dlabel)-(7|8|9|10|11|12|13|4|3|2|1|5|sales|fuel|courtesy|cruiser|houseboats)$/.test(id); }
function loadLayout(){
  try{
    const raw=JSON.parse(localStorage.getItem(LAYOUT_STORE)||"null");
    if(!raw||!raw.docks) return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS)};
    const byId=Object.fromEntries(raw.docks.map(d=>[d.id,d]));
    const docks=DEFAULT_DOCKS.map(d=>Object.assign(clone(d), byId[d.id]||{}));
    raw.docks.forEach(d=>{ if(!docks.find(x=>x.id===d.id)) docks.push(d); });
    const saved=(raw.marks||[]).filter(m=>!isDockPieceMark(m.id));
    const mBy=Object.fromEntries(saved.map(m=>[m.id,m]));
    const marks=DEFAULT_MARKS.map(m=>Object.assign(clone(m), mBy[m.id]||{}));
    saved.forEach(m=>{ if(!marks.find(x=>x.id===m.id)) marks.push(m); });
    const cruDef=DEFAULT_DOCKS.find(d=>d.id==="cruiser");
    const cru=docks.find(d=>d.id==="cruiser");
    if(cru&&cruDef){ cru.a=clone(cruDef.a); cru.b=clone(cruDef.b); }
    return {docks,marks};
  }catch{return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS)};}
}
function saveLayout(){ localStorage.setItem(LAYOUT_STORE, JSON.stringify({docks,marks})); }
let {docks,marks}=loadLayout();
let slips=[], selected=null, selectedDock=null, selectedMark=null, filter="All", editing=false;
function buildSlips(){
  slips=[];
  docks.forEach(d=>{
    if(d.type==="ns"){const w=d.sw||40,h=d.sh||15,g=d.gap||3;(d.a||[]).forEach((num,i)=>slips.push({id:String(num),num,dock:d.name,dockId:d.id,kind:d.kind,size:d.size,x:d.x,y:d.y+i*(h+g),w,h,filter:d.name}));(d.b||[]).forEach((num,i)=>slips.push({id:String(num),num,dock:d.name,dockId:d.id,kind:d.kind,size:d.size,x:d.x+w+16,y:d.y+i*(h+g),w,h,filter:d.name}));}
    else if(d.type==="ew"){const w=d.sw||16,h=d.sh||36,g=d.gap||3;(d.a||[]).forEach((num,i)=>slips.push({id:String(num),num,dock:d.name,dockId:d.id,kind:d.kind,size:d.size,x:d.x+i*(w+g),y:d.y,w,h,filter:d.name}));(d.b||[]).forEach((num,i)=>slips.push({id:String(num),num,dock:d.name,dockId:d.id,kind:d.kind,size:d.size,x:d.x+i*(w+g),y:d.y+h+16,w,h,filter:d.name}));}
    else if(d.type==="col"){const w=d.w||40,h=d.h||16,g=d.gap||18;(d.a||[]).forEach((num,i)=>slips.push({id:String(num),num,dock:d.name,dockId:d.id,kind:d.kind,size:d.size,x:d.x,y:d.y+i*g,w,h,filter:d.name}));}
    (d.extras||[]).forEach(ex=>slips.push({id:String(ex.num),num:ex.num,dock:d.name,dockId:d.id,kind:ex.kind||d.kind,size:ex.size||d.size,x:d.x+(ex.dx||0),y:d.y+(ex.dy||0),w:ex.w,h:ex.h,filter:ex.filter||d.name}));
  });
}
const layerBg=el("g",{id:"bg"}), layerMarks=el("g",{id:"marks"}), layerDocks=el("g",{id:"docks"}), layerSlips=el("g",{id:"slips"});
svg.appendChild(el("rect",{width:2400,height:1700,fill:"#0c3c41"}));
const bgImg=el("image",{href:"dock-map.jpg",x:0,y:0,width:2400,height:1700,opacity:0,preserveAspectRatio:"xMidYMid meet"});
layerBg.appendChild(bgImg);
svg.appendChild(layerBg);svg.appendChild(layerMarks);svg.appendChild(layerDocks);svg.appendChild(layerSlips);
function fill(s){const rec=data[s.id];if(rec&&rec.status==="occupied")return "#b55a32";if(rec&&rec.status==="reserved")return "#d7b45a";return COLORS[s.kind]||"#e4dcc8";}
function match(s,f){ if(!f||f==="All") return true; return s.filter===f || s.dock===f; }
function drawMarks(){
  layerMarks.innerHTML="";
  marks.forEach(m=>{
    const rot=Number(m.rot)||0;
    const attrs={"data-mark":m.id,class:"dock-hit"+(selectedMark===m.id?" on":"")};
    if(rot) attrs.transform=`rotate(${rot} ${m.x} ${m.y})`;
    const g=el("g",attrs);
    if(m.kind==="box"){g.appendChild(el("rect",{class:"walk",x:m.x,y:m.y,width:m.w,height:m.h,rx:8,fill:m.fill||"#2b6d8a"}));g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2-6,"text-anchor":"middle",fill:m.ink||"#243018","font-size":13,"font-weight":700},m.t1||""));if(m.t2)g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2+12,"text-anchor":"middle",fill:m.ink||"#243018","font-size":11},m.t2));}
    else if(m.kind==="p"){const rx=m.w?m.w/2:70,ry=m.h?m.h/2:26;g.appendChild(el("ellipse",{class:"walk",cx:m.x,cy:m.y,rx,ry,fill:"none",stroke:"#9ad","stroke-width":3}));g.appendChild(el("text",{x:m.x,y:m.y+6,"text-anchor":"middle",fill:"#8ec4ea","font-size":18,"font-weight":800},"P"));}
    else if(m.kind==="pill"){g.appendChild(el("rect",{x:m.x,y:m.y,width:m.w,height:m.h,rx:4,fill:m.fill||"#2b6d8a",class:"walk"}));g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2+4,"text-anchor":"middle",fill:m.ink||"#fff","font-size":10},m.label||""));}
    else if(m.kind==="bridge"){g.appendChild(el("rect",{class:"walk",x:m.x,y:m.y,width:m.w,height:m.h,fill:"#8a8a84"}));g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+16,"text-anchor":"middle",fill:"#222","font-size":12},"Hwy 92 Bridge"));}
    else if(m.kind==="bar"){g.appendChild(el("rect",{x:m.x,y:m.y,width:m.w||12,height:m.h||20,rx:3,fill:"#bfb9ac",class:"walk"}));}
    else if(m.kind==="text"){const fs=m.size||13;g.appendChild(el("rect",{class:"walk",x:m.x-4,y:m.y-fs,width:Math.max(28,(m.text||"").length*fs*0.62),height:fs+8,fill:editing?"rgba(255,255,255,.08)":"none"}));g.appendChild(el("text",{x:m.x,y:m.y,fill:"#d7eceb","font-size":fs,"font-weight":700},m.text||""));}
    layerMarks.appendChild(g);
  });
}
function appendWalk(g,d){
  const geom=walkGeomFromDock(d);
  g.appendChild(el("rect",{class:"walk",x:geom.x,y:geom.y,width:geom.w,height:geom.h,rx:3,fill:"#bfb9ac"}));
  g.appendChild(el("text",{x:d.x,y:d.y-12,fill:"#d7eceb","font-size":14,"font-weight":700},d.name));
}
function redraw(){
  buildSlips();drawMarks();layerDocks.innerHTML="";layerSlips.innerHTML="";
  const byDock={};
  docks.forEach(d=>{const rot=Number(d.rot)||0;const attrs={"data-dock":d.id,class:"dock-hit"+(selectedDock===d.id?" on":"")};if(rot)attrs.transform=`rotate(${rot} ${d.x} ${d.y})`;const g=el("g",attrs);appendWalk(g,d);byDock[d.id]=g;layerDocks.appendChild(g);});
  slips.forEach(s=>{const parent=byDock[s.dockId]||layerSlips;const g=el("g",{class:"slip"+(selected===s.id?" on":"")+(match(s,filter)?"":" dim"),"data-id":s.id,"data-dock":s.dockId});g.appendChild(el("rect",{x:s.x,y:s.y,width:s.w,height:s.h,rx:2,fill:fill(s)}));g.appendChild(el("text",{x:s.x+s.w/2,y:s.y+s.h/2+3,"text-anchor":"middle"},String(s.num).replace(/^F|^C/,"")));parent.appendChild(g);});
  document.getElementById("count").textContent=slips.filter(s=>/^\d+$/.test(String(s.num))).length+" numbered slips";
}
const chips=["All","5","4","3","2","1","7","8","9","10","11","12","13","Houseboats","Cruiser","Fuel","Sales"];
const chipsEl=document.getElementById("chips");
chips.forEach(c=>{const b=document.createElement("button");b.className="chip"+(c==="All"?" on":"");b.textContent=c;b.onclick=()=>{filter=c;[...chipsEl.children].forEach(x=>x.classList.toggle("on",x.textContent===c));redraw();};chipsEl.appendChild(b);});
redraw();
function svgPoint(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const ctm=svg.getScreenCTM();return ctm?pt.matrixTransform(ctm.inverse()):{x:0,y:0};}
function showTab(name){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===name));document.getElementById("pane-slip").hidden=name!=="slip";document.getElementById("pane-dir").hidden=name!=="dir";document.getElementById("pane-layout").hidden=name!=="layout";}
function rotCtrl(val){return `<label>Rotation (degrees)<input id="ed-rot" type="range" min="-180" max="180" step="1" value="${val}"/></label><div class="row2"><label>Angle<input id="ed-rot-num" type="number" step="1" value="${val}"/></label><div class="st"><button type="button" data-rot="-90">-90</button><button type="button" data-rot="-15">-15</button><button type="button" data-rot="15">+15</button><button type="button" data-rot="90">+90</button><button type="button" data-rot="0">0</button></div></div>`;}
function bindRot(obj){const apply=v=>{obj.rot=((Number(v)%360)+360)%360;if(obj.rot>180)obj.rot-=360;if(Math.abs(obj.rot)<0.01)obj.rot=0;saveLayout();redraw();renderDockEditor();};document.getElementById("ed-rot").oninput=e=>{document.getElementById("ed-rot-num").value=e.target.value;obj.rot=+e.target.value;saveLayout();redraw();};document.getElementById("ed-rot").onchange=e=>apply(e.target.value);document.getElementById("ed-rot-num").onchange=e=>apply(e.target.value);document.querySelectorAll("[data-rot]").forEach(btn=>btn.onclick=()=>{const s=+btn.dataset.rot;apply(s===0?0:(Number(obj.rot)||0)+s);});}
function renderDockEditor(){
  const box=document.getElementById("dock-editor");
  const d=docks.find(x=>x.id===selectedDock);
  const m=marks.find(x=>x.id===selectedMark);
  if(d){
    box.innerHTML=`<h2>Dock ${d.name}</h2><label>Dock name<input id="ed-name" value="${d.name||""}"/></label><div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(d.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(d.y)}"/></label></div><div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div>${rotCtrl(Number(d.rot)||0)}<label>Left / top numbers<textarea id="ed-a" rows="3">${(d.a||[]).join(", ")}</textarea></label>${d.b?`<label>Right / bottom numbers<textarea id="ed-b" rows="3">${(d.b||[]).join(", ")}</textarea></label>`:""}`;
    document.getElementById("ed-name").oninput=()=>{d.name=document.getElementById("ed-name").value;saveLayout();redraw();};
    const applyPos=()=>{d.x=+document.getElementById("ed-x").value;d.y=+document.getElementById("ed-y").value;saveLayout();redraw();};
    document.getElementById("ed-x").onchange=applyPos;document.getElementById("ed-y").onchange=applyPos;
    bindRot(d);
    document.getElementById("ed-a").onchange=()=>{d.a=parseNums(document.getElementById("ed-a").value);saveLayout();redraw();};
    const eb=document.getElementById("ed-b"); if(eb) eb.onchange=()=>{d.b=parseNums(eb.value);saveLayout();redraw();};
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);d.x+=dx;d.y+=dy;saveLayout();redraw();renderDockEditor();});
  }else if(m){
    const kindName={bar:"Walkway",box:"Building",pill:"Building",bridge:"Bridge",text:"Label",p:"Parking"}[m.kind]||m.kind;
    box.innerHTML=`<h2>${kindName}</h2><p class="hint">${m.title||m.id}</p><div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(m.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(m.y)}"/></label></div>${m.kind!=="text"||m.w!=null?`<div class="row2"><label>Width<input id="ed-w" type="number" value="${Math.round(m.w||12)}"/></label><label>Height<input id="ed-h" type="number" value="${Math.round(m.h||20)}"/></label></div>`:""}<div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div>${rotCtrl(Number(m.rot)||0)}${m.kind==="text"||m.text!=null?`<label>Text<input id="ed-text" value="${m.text||""}"/></label>`:""}${m.t1!=null?`<label>Title<input id="ed-t1" value="${m.t1||""}"/></label>`:""}${m.label!=null?`<label>Label<input id="ed-label" value="${m.label||""}"/></label>`:""}<div class="st"><button type="button" id="ed-del">Delete this piece</button></div>`;
    const apply=()=>{m.x=+document.getElementById("ed-x").value;m.y=+document.getElementById("ed-y").value;const ew=document.getElementById("ed-w"),eh=document.getElementById("ed-h");if(ew)m.w=+ew.value;if(eh)m.h=+eh.value;saveLayout();redraw();};
    document.getElementById("ed-x").onchange=apply;document.getElementById("ed-y").onchange=apply;
    const ew=document.getElementById("ed-w"); if(ew) ew.onchange=apply; const eh=document.getElementById("ed-h"); if(eh) eh.onchange=apply;
    bindRot(m);
    const t=document.getElementById("ed-text"); if(t) t.oninput=()=>{m.text=t.value;saveLayout();redraw();};
    const t1=document.getElementById("ed-t1"); if(t1) t1.oninput=()=>{m.t1=t1.value;saveLayout();redraw();};
    const lb=document.getElementById("ed-label"); if(lb) lb.oninput=()=>{m.label=lb.value;saveLayout();redraw();};
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);m.x+=dx;m.y+=dy;saveLayout();redraw();renderDockEditor();});
    document.getElementById("ed-del").onclick=()=>{if(!confirm("Delete this piece?"))return;marks=marks.filter(x=>x.id!==m.id);selectedMark=null;saveLayout();redraw();renderDockEditor();};
  }else box.innerHTML="<p>Click a dock, walkway, building, or label.</p>";
}
function select(id){selected=id;selectedDock=null;selectedMark=null;const s=slips.find(x=>x.id===id);if(!s)return;const rec=data[id]||{status:"vacant",boat:"",notes:""};document.getElementById("slip-detail").hidden=false;document.getElementById("slip-title").textContent=(/^\d+$/.test(String(s.num))?"Slip ":"")+s.num;document.getElementById("slip-meta").textContent="Dock "+s.dock+" · "+s.size;document.getElementById("boat").value=rec.boat||"";document.getElementById("notes").value=rec.notes||"";document.querySelectorAll("#pane-slip .st button").forEach(b=>b.classList.toggle("on",b.dataset.st===(rec.status||"vacant")));if(!editing)showTab("slip");redraw();}
function selectDock(id){selectedDock=id;selectedMark=null;selected=null;showTab("layout");renderDockEditor();redraw();}
function selectMark(id){selectedMark=id;selectedDock=null;selected=null;showTab("layout");renderDockEditor();redraw();}
let dockDrag=null,pan=null,scale=1,tx=0,ty=0;
const chart=document.getElementById("chart");
const applyZoom=()=>svg.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
svg.addEventListener("click",e=>{if(dockDrag&&dockDrag.moved)return;if(editing){const d=e.target.closest("[data-dock]");const m=e.target.closest("[data-mark]");if(d){selectDock(d.getAttribute("data-dock"));return;}if(m){selectMark(m.getAttribute("data-mark"));return;}return;}const t=e.target.closest("[data-id]");if(t)select(t.getAttribute("data-id"));});
chart.addEventListener("pointerdown",e=>{if(editing){const dEl=e.target.closest("[data-dock]");const mEl=e.target.closest("[data-mark]");const p=svgPoint(e);if(dEl){const d=docks.find(x=>x.id===dEl.getAttribute("data-dock"));if(d){dockDrag={kind:"dock",id:d.id,x:d.x,y:d.y,px:p.x,py:p.y,moved:false};selectDock(d.id);chart.setPointerCapture(e.pointerId);return;}}if(mEl){const m=marks.find(x=>x.id===mEl.getAttribute("data-mark"));if(m){dockDrag={kind:"mark",id:m.id,x:m.x,y:m.y,px:p.x,py:p.y,moved:false};selectMark(m.id);chart.setPointerCapture(e.pointerId);return;}}pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);return;}if(e.target.closest("[data-id]"))return;pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);});
chart.addEventListener("pointermove",e=>{if(dockDrag){const p=svgPoint(e);const dx=p.x-dockDrag.px,dy=p.y-dockDrag.py;if(Math.abs(dx)+Math.abs(dy)>2)dockDrag.moved=true;if(dockDrag.kind==="dock"){const d=docks.find(x=>x.id===dockDrag.id);if(d){d.x=Math.round(dockDrag.x+dx);d.y=Math.round(dockDrag.y+dy);redraw();}}else{const m=marks.find(x=>x.id===dockDrag.id);if(m){m.x=Math.round(dockDrag.x+dx);m.y=Math.round(dockDrag.y+dy);redraw();}}return;}if(!pan)return;tx=e.clientX-pan.x;ty=e.clientY-pan.y;applyZoom();});
chart.addEventListener("pointerup",()=>{if(dockDrag){saveLayout();renderDockEditor();}dockDrag=null;pan=null;});
chart.addEventListener("wheel",e=>{e.preventDefault();scale=Math.min(3.5,Math.max(.35,scale*(e.deltaY<0?1.08:0.92)));applyZoom();},{passive:false});
document.getElementById("z-in").onclick=()=>{scale=Math.min(3.5,scale*1.15);applyZoom();};
document.getElementById("z-out").onclick=()=>{scale=Math.max(.35,scale/1.15);applyZoom();};
document.getElementById("z-full").onclick=()=>{scale=1;tx=0;ty=0;applyZoom();};
document.querySelectorAll("#pane-slip .st button").forEach(b=>b.onclick=()=>{if(!selected)return;data[selected]=data[selected]||{};data[selected].status=b.dataset.st;save(data);select(selected);});
["boat","notes"].forEach(fid=>document.getElementById(fid).addEventListener("input",()=>{if(!selected)return;data[selected]=data[selected]||{status:"vacant"};data[selected][fid]=document.getElementById(fid).value;save(data);renderDir();}));
document.getElementById("q").addEventListener("input",function(){const hit=slips.find(s=>String(s.num)===this.value.trim());if(hit)select(hit.id);});
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function renderDir(){const list=document.getElementById("dir-list");const rows=Object.keys(data).map(id=>({id,...data[id]})).filter(r=>r.boat||r.notes||(r.status&&r.status!=="vacant"));if(!rows.length){list.innerHTML="<p>No marked slips yet.</p>";return;}list.innerHTML=rows.map(r=>`<div class="dir-item" data-jump="${r.id}"><b>${/^\d+$/.test(r.id)?"Slip "+r.id:r.id}</b> · ${r.status||""}<br>${r.boat||""} ${r.notes||""}</div>`).join("");list.querySelectorAll("[data-jump]").forEach(n=>n.onclick=()=>select(n.dataset.jump));}
renderDir();
document.getElementById("edit-toggle").onclick=()=>{editing=!editing;document.body.classList.toggle("editing",editing);chart.classList.toggle("editing",editing);document.getElementById("edit-toggle").classList.toggle("on",editing);document.getElementById("edit-toggle").textContent=editing?"Done editing":"Edit docks";document.getElementById("hint").textContent=editing?"Drag a dock with its slips · main walkways move separately":"Click a numbered slip · drag to pan";if(editing)showTab("layout");redraw();};
document.getElementById("bg-op").oninput=function(){bgImg.setAttribute("opacity",String((+this.value)/100));};
document.getElementById("export-layout").onclick=async()=>{const json=JSON.stringify({docks,marks},null,2);try{await navigator.clipboard.writeText(json);alert("Layout JSON copied.");}catch{prompt("Copy this layout JSON:",json);}};
document.getElementById("download-layout").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({docks,marks},null,2)],{type:"application/json"}));a.download="laceys-layout.json";a.click();};
document.getElementById("import-layout").onclick=()=>document.getElementById("import-file").click();
document.getElementById("import-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);if(!raw.docks)throw 0;localStorage.setItem(LAYOUT_STORE,JSON.stringify(raw));({docks,marks}=loadLayout());saveLayout();redraw();renderDockEditor();}catch{alert("Could not read that JSON file.");}};r.readAsText(f);};
document.getElementById("reset-layout").onclick=()=>{if(!confirm("Reset all positions?"))return;docks=clone(DEFAULT_DOCKS);marks=clone(DEFAULT_MARKS);saveLayout();redraw();renderDockEditor();};
const uid=p=>p+"-"+Math.random().toString(36).slice(2,8);
document.getElementById("add-walk").onclick=()=>{const m={id:uid("mainwalk"),kind:"bar",x:200,y:200,w:14,h:220,title:"Walkway",rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
document.getElementById("add-box").onclick=()=>{const m={id:uid("box"),kind:"box",x:80,y:80,w:140,h:50,fill:"#2b6d8a",t1:"Building",t2:"",ink:"#fff",rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
document.getElementById("add-label").onclick=()=>{const m={id:uid("label"),kind:"text",x:200,y:80,text:"Label",size:13,rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
