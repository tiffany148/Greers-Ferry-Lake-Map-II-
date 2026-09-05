function walkGeomFromDock(d){
  if(d.type==="ns"){const w=d.sw||40,h=d.sh||15,g=d.gap||3,n=Math.max((d.a||[]).length,(d.b||[]).length);return {x:d.x+w+2,y:d.y-4,w:12,h:n*(h+g)+10};}
  if(d.type==="ew"){const w=d.sw||16,h=d.sh||36,g=d.gap||3,n=Math.max((d.a||[]).length,(d.b||[]).length);return {x:d.x-4,y:d.y+h+2,w:n*(w+g)+10,h:12};}
  const n=(d.a||[]).length,g=d.gap||18,h=d.h||16;return {x:d.x+(d.w||40)+4,y:d.y-2,w:10,h:Math.max(20,n*g-g+h+8)};
}
function generatedSlips(d){
  const out=[];
  if(d.type==="ns"){const w=d.sw||40,h=d.sh||15,g=d.gap||3;(d.a||[]).forEach((num,i)=>out.push({id:String(num),num,x:d.x,y:d.y+i*(h+g),w,h}));(d.b||[]).forEach((num,i)=>out.push({id:String(num),num,x:d.x+w+16,y:d.y+i*(h+g),w,h}));}
  else if(d.type==="ew"){const w=d.sw||16,h=d.sh||36,g=d.gap||3;(d.a||[]).forEach((num,i)=>out.push({id:String(num),num,x:d.x+i*(w+g),y:d.y,w,h}));(d.b||[]).forEach((num,i)=>out.push({id:String(num),num,x:d.x+i*(w+g),y:d.y+h+16,w,h}));}
  else if(d.type==="col"){const w=d.w||40,h=d.h||16,g=d.gap||18;(d.a||[]).forEach((num,i)=>out.push({id:String(num),num,x:d.x,y:d.y+i*g,w,h}));}
  (d.extras||[]).forEach(ex=>out.push({id:String(ex.num),num:ex.num,x:d.x+(ex.dx||0),y:d.y+(ex.dy||0),w:ex.w,h:ex.h,kind:ex.kind,size:ex.size,filter:ex.filter}));
  return out;
}
function applyPlaced(d,s){
  const p=(d.placed||{})[s.id];
  if(!p) return s;
  return Object.assign({},s,{x:p.x,y:p.y,w:p.w!=null?p.w:s.w,h:p.h!=null?p.h:s.h,rot:p.rot||0});
}
function setPlaced(d,id,patch){
  d.placed=d.placed||{};
  d.placed[id]=Object.assign({},d.placed[id]||{},patch);
}
function moveDockSlips(d,dx,dy){
  if(!d.placed) return;
  Object.keys(d.placed).forEach(id=>{d.placed[id].x+=dx;d.placed[id].y+=dy;});
}
function isDockPieceMark(id){ return /^(walk|dlabel)-(7|8|9|10|11|12|13|4|3|2|1|5|sales|fuel|courtesy|cruiser|houseboats)$/.test(id); }
function loadLayout(){
  try{
    const raw=JSON.parse(localStorage.getItem(LAYOUT_STORE)||localStorage.getItem("laceys-layout-v2")||localStorage.getItem("laceys-layout-v1")||"null");
    if(!raw||!raw.docks) return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS),groups:[]};
    const byId=Object.fromEntries(raw.docks.map(d=>[d.id,d]));
    const docks=DEFAULT_DOCKS.map(d=>{
      const merged=Object.assign(clone(d), byId[d.id]||{});
      if(byId[d.id] && byId[d.id].locked===undefined && (d.id==="cruiser"||d.id==="houseboats")) merged.locked=false;
      return merged;
    });
    raw.docks.forEach(d=>{ if(!docks.find(x=>x.id===d.id)) docks.push(d); });
    const saved=(raw.marks||[]).filter(m=>!isDockPieceMark(m.id));
    const mBy=Object.fromEntries(saved.map(m=>[m.id,m]));
    const marks=DEFAULT_MARKS.map(m=>Object.assign(clone(m), mBy[m.id]||{}));
    saved.forEach(m=>{ if(!marks.find(x=>x.id===m.id)) marks.push(m); });
    return {docks,marks,groups:raw.groups||[]};
  }catch{return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS),groups:[]};}
}
const hist=[], future=[];
let lastSnap=null;
function snap(){ return JSON.stringify({docks,marks,groups}); }
function restoreSnap(s){
  const raw=JSON.parse(s);
  docks=raw.docks; marks=raw.marks; groups=raw.groups||[];
  lastSnap=s;
  localStorage.setItem(LAYOUT_STORE, s);
  selected=null; selectedDock=null; selectedMark=null; multi.clear();
  redraw(); renderDockEditor(); updateUndoBtns(); updateSelHint();
}
function undo(){ if(!hist.length) return; future.push(snap()); restoreSnap(hist.pop()); }
function redo(){ if(!future.length) return; hist.push(snap()); restoreSnap(future.pop()); }
function updateUndoBtns(){
  const u=document.getElementById("btn-undo"), r=document.getElementById("btn-redo");
  if(u) u.disabled=!hist.length; if(r) r.disabled=!future.length;
}
function saveLayout(record){
  if(record!==false){
    if(lastSnap==null) lastSnap=snap();
    hist.push(lastSnap);
    if(hist.length>80) hist.shift();
    future.length=0;
    lastSnap=snap();
  }
  localStorage.setItem(LAYOUT_STORE, snap());
  updateUndoBtns();
}
let {docks,marks,groups}=loadLayout();
lastSnap=snap();
let slips=[], selected=null, selectedDock=null, selectedMark=null, filter="All", editing=false;
const multi=new Set(); // "dock:id" or "mark:id"
function updateSelHint(){
  const el=document.getElementById("sel-hint"); if(!el) return;
  el.textContent = multi.size ? (multi.size+" selected · Group to move together") : "Shift-click docks or labels to select several, then Group.";
}
function memberKey(kind,id){ return kind+":"+id; }
function findGroupFor(kind,id){
  const k=memberKey(kind,id);
  return groups.find(g=> (g.members||[]).includes(k));
}
function moveGroupMembers(g,dx,dy){
  (g.members||[]).forEach(k=>{
    const [kind,id]=k.split(":");
    if(kind==="dock"){ const d=docks.find(x=>x.id===id); if(d){ if(isLocked(d)) moveDockSlips(d,dx,dy); d.x+=dx; d.y+=dy; } }
    else if(kind==="mark"){ const m=marks.find(x=>x.id===id); if(m){ m.x+=dx; m.y+=dy; } }
  });
}

function buildSlips(){
  slips=[];
  docks.forEach(d=>{
    generatedSlips(d).forEach(s=>{
      const p=applyPlaced(d,s);
      slips.push({id:p.id,num:p.num,dock:d.name,dockId:d.id,kind:p.kind||d.kind,size:p.size||d.size,x:p.x,y:p.y,w:p.w,h:p.h,rot:p.rot||0,filter:p.filter||d.name,fill:p.fill||d.fill});
    });
  });
}
const layerBg=el("g",{id:"bg"}), layerMarks=el("g",{id:"marks"}), layerDocks=el("g",{id:"docks"}), layerSlips=el("g",{id:"slips"});
svg.appendChild(el("rect",{width:2400,height:1700,fill:"#0c3c41"}));
const bgImg=el("image",{href:"dock-map.jpg",x:0,y:0,width:2400,height:1700,opacity:0,preserveAspectRatio:"xMidYMid meet"});
layerBg.appendChild(bgImg);
svg.appendChild(layerBg);svg.appendChild(layerMarks);svg.appendChild(layerDocks);svg.appendChild(layerSlips);
function fill(s){const rec=data[s.id];if(rec&&rec.status==="occupied")return "#b55a32";if(rec&&rec.status==="reserved")return "#d7b45a";if(s.fill)return s.fill;const dock=docks.find(x=>x.id===s.dockId);if(dock&&dock.fill)return dock.fill;return COLORS[s.kind]||"#e4dcc8";}
function match(s,f){ if(!f||f==="All") return true; return s.filter===f || s.dock===f; }
function drawMarks(){
  layerMarks.innerHTML="";
  marks.forEach(m=>{
    const rot=Number(m.rot)||0;
    const attrs={"data-mark":m.id,class:"dock-hit"+(selectedMark===m.id?" on":"")+(multi.has("mark:"+m.id)?" multi":"")};
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
  g.appendChild(el("text",{x:d.x,y:d.y-12,fill:"#d7eceb","font-size":14,"font-weight":700},d.name+(isLocked(d)?"":" • unlocked")));
}
function redraw(){
  buildSlips();drawMarks();layerDocks.innerHTML="";layerSlips.innerHTML="";
  const byDock={};
  docks.forEach(d=>{const rot=Number(d.rot)||0;const attrs={"data-dock":d.id,class:"dock-hit"+(selectedDock===d.id?" on":"")+(multi.has("dock:"+d.id)?" multi":"")};if(rot)attrs.transform=`rotate(${rot} ${d.x} ${d.y})`;const g=el("g",attrs);appendWalk(g,d);byDock[d.id]=g;layerDocks.appendChild(g);});
  slips.forEach(s=>{
    const parent=byDock[s.dockId]||layerSlips;
    const rot=Number(s.rot)||0;
    const attrs={class:"slip"+(selected===s.id?" on":"")+(match(s,filter)?"":" dim"),"data-id":s.id,"data-dock":s.dockId};
    if(rot) attrs.transform=`rotate(${rot} ${s.x+s.w/2} ${s.y+s.h/2})`;
    const g=el("g",attrs);
    g.appendChild(el("rect",{x:s.x,y:s.y,width:s.w,height:s.h,rx:2,fill:fill(s)}));
    g.appendChild(el("text",{x:s.x+s.w/2,y:s.y+s.h/2+3,"text-anchor":"middle"},String(s.num).replace(/^F|^C/,"")));
    parent.appendChild(g);
  });
  document.getElementById("count").textContent=slips.filter(s=>/^\d+$/.test(String(s.num))).length+" numbered slips";
}
const chips=["All","5","4","3","2","1","7","8","9","10","11","12","13","Houseboats","Cruiser","Fuel","Sales"];
const chipsEl=document.getElementById("chips");
chips.forEach(c=>{const b=document.createElement("button");b.className="chip"+(c==="All"?" on":"");b.textContent=c;b.onclick=()=>{filter=c;[...chipsEl.children].forEach(x=>x.classList.toggle("on",x.textContent===c));redraw();};chipsEl.appendChild(b);});
redraw();
function svgPoint(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const ctm=svg.getScreenCTM();return ctm?pt.matrixTransform(ctm.inverse()):{x:0,y:0};}
function showTab(name){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===name));document.getElementById("pane-slip").hidden=name!=="slip";document.getElementById("pane-dir").hidden=name!=="dir";document.getElementById("pane-layout").hidden=name!=="layout";}
function rotCtrl(val){return `<label>Rotation (degrees)<input id="ed-rot" type="range" min="-180" max="180" step="1" value="${val}"/></label><div class="row2"><label>Angle<input id="ed-rot-num" type="number" step="1" value="${val}"/></label><div class="st"><button type="button" data-rot="-90">-90</button><button type="button" data-rot="-15">-15</button><button type="button" data-rot="15">+15</button><button type="button" data-rot="90">+90</button><button type="button" data-rot="0">0</button></div></div>`;}
function bindRot(obj,after){const apply=v=>{obj.rot=((Number(v)%360)+360)%360;if(obj.rot>180)obj.rot-=360;if(Math.abs(obj.rot)<0.01)obj.rot=0;saveLayout();redraw();if(after)after();};document.getElementById("ed-rot").oninput=e=>{document.getElementById("ed-rot-num").value=e.target.value;obj.rot=+e.target.value;saveLayout();redraw();};document.getElementById("ed-rot").onchange=e=>apply(e.target.value);document.getElementById("ed-rot-num").onchange=e=>apply(e.target.value);document.querySelectorAll("[data-rot]").forEach(btn=>btn.onclick=()=>{const s=+btn.dataset.rot;apply(s===0?0:(Number(obj.rot)||0)+s);});}
function nextSlipNumber(){
  const used=new Set(slips.map(s=>s.id));
  let n=900;
  while(used.has(String(n))) n++;
  return n;
}
function resizeSide(arr,count,startHint){
  arr=arr?arr.slice():[];
  count=Math.max(0,Math.min(80,+count||0));
  if(arr.length>count) return arr.slice(0,count);
  let n=startHint!=null?startHint:nextSlipNumber();
  const used=new Set(slips.map(s=>String(s.num)).concat(arr.map(String)));
  while(arr.length<count){ while(used.has(String(n))) n++; arr.push(/^[A-Z]/.test(String(startHint))?String(startHint):n); used.add(String(n)); n++; }
  return arr;
}
function renderDockEditor(){
  const box=document.getElementById("dock-editor");
  const d=docks.find(x=>x.id===selectedDock);
  const m=marks.find(x=>x.id===selectedMark);
  const s=slips.find(x=>x.id===selected);
  if(s && editing && selectedDock && d && !isLocked(d)){
    const placed=(d.placed&&d.placed[s.id])||{};
    box.innerHTML=`<h2>Slip ${s.num}</h2><p class="hint">Unlocked · drag this slip on the chart</p><label>Number / label<input id="ed-num" value="${s.num}"/></label><div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(s.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(s.y)}"/></label></div><div class="row2"><label>Width<input id="ed-w" type="number" value="${Math.round(s.w)}"/></label><label>Height<input id="ed-h" type="number" value="${Math.round(s.h)}"/></label></div><label>Color<input id="ed-fill" type="color" value="${placed.fill||d.fill||COLORS[s.kind]||"#e4dcc8"}"/></label>${rotCtrl(Number(s.rot)||0)}<div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div><div class="st"><button type="button" id="ed-dup-slip">Duplicate slip</button><button type="button" id="ed-del-slip">Delete this slip</button></div>`;
    const apply=()=>{setPlaced(d,s.id,{x:+document.getElementById("ed-x").value,y:+document.getElementById("ed-y").value,w:+document.getElementById("ed-w").value,h:+document.getElementById("ed-h").value,fill:document.getElementById("ed-fill").value});saveLayout();redraw();};
    document.getElementById("ed-fill").oninput=()=>{setPlaced(d,s.id,{fill:document.getElementById("ed-fill").value});saveLayout(false);redraw();};
    document.getElementById("ed-fill").onchange=()=>saveLayout();
    document.getElementById("ed-num").onchange=()=>{
      const nn=String(document.getElementById("ed-num").value).trim(); if(!nn) return;
      const rename=arr=>(arr||[]).map(n=>String(n)===String(s.id)?(/^\d+$/.test(nn)?Number(nn):nn):n);
      d.a=rename(d.a); d.b=rename(d.b);
      (d.extras||[]).forEach(ex=>{ if(String(ex.num)===String(s.id)) ex.num=/^\d+$/.test(nn)?Number(nn):nn; });
      if(d.placed && d.placed[s.id]){ d.placed[nn]=d.placed[s.id]; delete d.placed[s.id]; }
      selected=nn; saveLayout(); redraw(); renderDockEditor();
    };
    document.getElementById("ed-dup-slip").onclick=()=>{
      const num=prompt("Duplicate as slip number?", String(nextSlipNumber())); if(num==null||!String(num).trim()) return;
      d.extras=d.extras||[];
      d.extras.push({num:String(num).trim(),dx:(s.x-d.x)+20,dy:(s.y-d.y)+20,w:s.w,h:s.h,kind:s.kind,size:s.size});
      d.locked=false; selected=String(num).trim(); saveLayout(); redraw(); renderDockEditor();
    };
    ["ed-x","ed-y","ed-w","ed-h"].forEach(id=>document.getElementById(id).onchange=apply);
    const rotObj={rot:Number(s.rot)||0};
    bindRot(rotObj,()=>{setPlaced(d,s.id,{rot:rotObj.rot});saveLayout();redraw();renderDockEditor();});
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);setPlaced(d,s.id,{x:s.x+dx,y:s.y+dy});saveLayout();redraw();renderDockEditor();});
    document.getElementById("ed-del-slip").onclick=()=>{
      if(!confirm("Delete slip "+s.num+"?")) return;
      d.a=(d.a||[]).filter(n=>String(n)!==s.id);
      d.b=(d.b||[]).filter(n=>String(n)!==s.id);
      d.extras=(d.extras||[]).filter(ex=>String(ex.num)!==s.id);
      if(d.placed) delete d.placed[s.id];
      selected=null;saveLayout();redraw();renderDockEditor();
    };
    return;
  }
  if(d){
    const locked=isLocked(d);
    box.innerHTML=`<h2>Dock ${d.name}</h2>
      <div class="st"><button type="button" id="ed-lock">${locked?"Unlock slips":"Lock slips together"}</button></div>
      <p class="hint">${locked?"Locked: the whole dock moves as one. Unlock to drag slips one at a time.":"Unlocked: drag slips individually. Lock when the layout looks right."}</p>
      <label>Dock name<input id="ed-name" value="${d.name||""}"/></label>
      <label>Layout<select id="ed-type"><option value="ns"${d.type==="ns"?" selected":""}>North–south finger</option><option value="ew"${d.type==="ew"?" selected":""}>East–west finger</option><option value="col"${d.type==="col"?" selected":""}>Single column</option></select></label>
      <div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(d.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(d.y)}"/></label></div>
      <div class="row2"><label>Slip width<input id="ed-sw" type="number" value="${Math.round(d.sw||d.w||40)}"/></label><label>Slip height<input id="ed-sh" type="number" value="${Math.round(d.sh||d.h||15)}"/></label></div>
      <div class="row2"><label>Gap<input id="ed-gap" type="number" value="${Math.round(d.gap||3)}"/></label><label>Side A count<input id="ed-acount" type="number" min="0" max="80" value="${(d.a||[]).length}"/></label></div>
      <label>Side B count<input id="ed-bcount" type="number" min="0" max="80" value="${(d.b||[]).length}"/></label>
      <div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div>
      ${rotCtrl(Number(d.rot)||0)}
      <label>Left / top numbers<textarea id="ed-a" rows="3">${(d.a||[]).join(", ")}</textarea></label>
      <label>Right / bottom numbers<textarea id="ed-b" rows="3">${(d.b||[]).join(", ")}</textarea></label>
      <div class="st"><button type="button" id="ed-add-slip">+ Slip on this dock</button><button type="button" id="ed-reset-slips">Reset slip layout</button></div>`;
    document.getElementById("ed-lock").onclick=()=>{d.locked=!locked;saveLayout();redraw();renderDockEditor();};
    document.getElementById("ed-name").oninput=()=>{d.name=document.getElementById("ed-name").value;saveLayout();redraw();};
    document.getElementById("ed-type").onchange=()=>{d.type=document.getElementById("ed-type").value;d.placed={};saveLayout();redraw();renderDockEditor();};
    const applyPos=()=>{const nx=+document.getElementById("ed-x").value,ny=+document.getElementById("ed-y").value;if(isLocked(d)) moveDockSlips(d,nx-d.x,ny-d.y);d.x=nx;d.y=ny;saveLayout();redraw();};
    document.getElementById("ed-x").onchange=applyPos;document.getElementById("ed-y").onchange=applyPos;
    const applySize=()=>{
      const sw=+document.getElementById("ed-sw").value,sh=+document.getElementById("ed-sh").value,gap=+document.getElementById("ed-gap").value;
      if(d.type==="col"){d.w=sw;d.h=sh;} else {d.sw=sw;d.sh=sh;}
      d.gap=gap;d.placed={};saveLayout();redraw();
    };
    ["ed-sw","ed-sh","ed-gap"].forEach(id=>document.getElementById(id).onchange=applySize);
    document.getElementById("ed-acount").onchange=()=>{d.a=resizeSide(d.a,+document.getElementById("ed-acount").value);d.placed={};saveLayout();redraw();renderDockEditor();};
    document.getElementById("ed-bcount").onchange=()=>{d.b=resizeSide(d.b,+document.getElementById("ed-bcount").value);d.placed={};saveLayout();redraw();renderDockEditor();};
    bindRot(d,()=>renderDockEditor());
    document.getElementById("ed-a").onchange=()=>{d.a=parseNums(document.getElementById("ed-a").value);saveLayout();redraw();};
    document.getElementById("ed-b").onchange=()=>{d.b=parseNums(document.getElementById("ed-b").value);saveLayout();redraw();};
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);if(isLocked(d)) moveDockSlips(d,dx,dy);d.x+=dx;d.y+=dy;saveLayout();redraw();renderDockEditor();});
    document.getElementById("ed-add-slip").onclick=()=>{
      const num=prompt("New slip number?", String(nextSlipNumber()));
      if(num==null||!String(num).trim()) return;
      d.extras=d.extras||[];
      d.extras.push({num:String(num).trim(),dx:0,dy:-30,w:d.sw||d.w||40,h:d.sh||d.h||16});
      d.locked=false;saveLayout();selected=String(num).trim();redraw();renderDockEditor();
    };
    document.getElementById("ed-reset-slips").onclick=()=>{d.placed={};saveLayout();redraw();renderDockEditor();};
    if(!document.getElementById("ed-fill-dock")){
      const colorRow=document.createElement("div");
      colorRow.innerHTML=`<label>Dock / slip color<input id="ed-fill-dock" type="color" value="${d.fill||COLORS[d.kind]||"#e4dcc8"}"/></label><div class="st"><button type="button" id="ed-dup-dock">Duplicate dock</button><button type="button" id="ed-del-dock">Delete dock</button></div>`;
      box.appendChild(colorRow);
      document.getElementById("ed-fill-dock").oninput=()=>{d.fill=document.getElementById("ed-fill-dock").value;saveLayout(false);redraw();};
      document.getElementById("ed-fill-dock").onchange=()=>saveLayout();
      document.getElementById("ed-dup-dock").onclick=()=>{
        const copy=clone(d); copy.id=uid("dock"); copy.name=(d.name||"Dock")+" copy"; copy.x+=40; copy.y+=40;
        docks.push(copy); selectedDock=copy.id; saveLayout(); redraw(); renderDockEditor();
      };
      document.getElementById("ed-del-dock").onclick=()=>{
        if(!confirm("Delete dock "+d.name+" and its slips?")) return;
        docks=docks.filter(x=>x.id!==d.id);
        groups.forEach(g=>g.members=(g.members||[]).filter(k=>k!=="dock:"+d.id));
        selectedDock=null; selected=null; saveLayout(); redraw(); renderDockEditor();
      };
    }
  }else if(m){
    const kindName={bar:"Walkway",box:"Building",pill:"Building",bridge:"Bridge",text:"Label",p:"Parking"}[m.kind]||m.kind;
    box.innerHTML=`<h2>${kindName}</h2><p class="hint">${m.title||m.id}</p><div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(m.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(m.y)}"/></label></div>${m.kind!=="text"||m.w!=null?`<div class="row2"><label>Width<input id="ed-w" type="number" value="${Math.round(m.w||12)}"/></label><label>Height<input id="ed-h" type="number" value="${Math.round(m.h||20)}"/></label></div>`:""}<label>Color<input id="ed-fill" type="color" value="${m.fill||m.ink||"#2b6d8a"}"/></label><div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div>${rotCtrl(Number(m.rot)||0)}${m.kind==="text"||m.text!=null?`<label>Text<input id="ed-text" value="${m.text||""}"/></label>`:""}${m.t1!=null?`<label>Title<input id="ed-t1" value="${m.t1||""}"/></label>`:""}${m.label!=null?`<label>Label<input id="ed-label" value="${m.label||""}"/></label>`:""}<div class="st"><button type="button" id="ed-dup-mark">Duplicate</button><button type="button" id="ed-del">Delete this piece</button></div>`;
    const apply=()=>{m.x=+document.getElementById("ed-x").value;m.y=+document.getElementById("ed-y").value;const ew=document.getElementById("ed-w"),eh=document.getElementById("ed-h");if(ew)m.w=+ew.value;if(eh)m.h=+eh.value;saveLayout();redraw();};
    document.getElementById("ed-x").onchange=apply;document.getElementById("ed-y").onchange=apply;
    const ew=document.getElementById("ed-w"); if(ew) ew.onchange=apply; const eh=document.getElementById("ed-h"); if(eh) eh.onchange=apply;
    bindRot(m,()=>renderDockEditor());
    const t=document.getElementById("ed-text"); if(t) t.oninput=()=>{m.text=t.value;saveLayout();redraw();};
    const t1=document.getElementById("ed-t1"); if(t1) t1.oninput=()=>{m.t1=t1.value;saveLayout();redraw();};
    const lb=document.getElementById("ed-label"); if(lb) lb.oninput=()=>{m.label=lb.value;saveLayout();redraw();};
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);m.x+=dx;m.y+=dy;saveLayout();redraw();renderDockEditor();});
    const cf=document.getElementById("ed-fill");
    if(cf){ cf.oninput=()=>{ if(m.kind==="text") m.ink=cf.value; else m.fill=cf.value; saveLayout(false); redraw(); }; cf.onchange=()=>saveLayout(); }
    document.getElementById("ed-dup-mark").onclick=()=>{ const copy=clone(m); copy.id=uid(m.kind||"mark"); copy.x+=30; copy.y+=30; marks.push(copy); selectedMark=copy.id; saveLayout(); redraw(); renderDockEditor(); };
    document.getElementById("ed-del").onclick=()=>{if(!confirm("Delete this piece?"))return;marks=marks.filter(x=>x.id!==m.id);groups.forEach(g=>g.members=(g.members||[]).filter(k=>k!=="mark:"+m.id));selectedMark=null;saveLayout();redraw();renderDockEditor();};
  }else box.innerHTML="<p>Click a dock, slip, walkway, building, or label.</p>";
}
function select(id){selected=id;selectedDock=null;selectedMark=null;const s=slips.find(x=>x.id===id);if(!s)return;const rec=data[id]||{status:"vacant",boat:"",notes:""};document.getElementById("slip-detail").hidden=false;document.getElementById("slip-title").textContent=(/^\d+$/.test(String(s.num))?"Slip ":"")+s.num;document.getElementById("slip-meta").textContent="Dock "+s.dock+" · "+s.size;document.getElementById("boat").value=rec.boat||"";document.getElementById("notes").value=rec.notes||"";document.querySelectorAll("#pane-slip .st button").forEach(b=>b.classList.toggle("on",b.dataset.st===(rec.status||"vacant")));if(!editing)showTab("slip");redraw();}
function selectDock(id){selectedDock=id;selectedMark=null;if(!editing) selected=null;showTab("layout");renderDockEditor();redraw();}
function selectMark(id){selectedMark=id;selectedDock=null;selected=null;showTab("layout");renderDockEditor();redraw();}
function selectEditSlip(id){
  const s=slips.find(x=>x.id===id); if(!s) return;
  selected=id; selectedDock=s.dockId; selectedMark=null;
  showTab("layout"); renderDockEditor(); redraw();
}
let dockDrag=null,pan=null,scale=1,tx=0,ty=0;
const chart=document.getElementById("chart");
const applyZoom=()=>svg.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;
svg.addEventListener("click",e=>{
  if(dockDrag&&dockDrag.moved)return;
  if(editing){
    const sEl=e.target.closest("[data-id]");
    const dEl=e.target.closest("[data-dock]");
    const mEl=e.target.closest("[data-mark]");
    if(e.shiftKey){
      if(dEl){ const k="dock:"+dEl.getAttribute("data-dock"); if(multi.has(k)) multi.delete(k); else multi.add(k); updateSelHint(); redraw(); return; }
      if(mEl){ const k="mark:"+mEl.getAttribute("data-mark"); if(multi.has(k)) multi.delete(k); else multi.add(k); updateSelHint(); redraw(); return; }
    }
    if(sEl){
      const dock=docks.find(x=>x.id===sEl.getAttribute("data-dock"));
      if(dock && !isLocked(dock)){ selectEditSlip(sEl.getAttribute("data-id")); return; }
      if(dEl){ selectDock(dEl.getAttribute("data-dock")); return; }
    }
    if(dEl){selectDock(dEl.getAttribute("data-dock"));return;}
    if(mEl){selectMark(mEl.getAttribute("data-mark"));return;}
    return;
  }
  const t=e.target.closest("[data-id]"); if(t) select(t.getAttribute("data-id"));
});
chart.addEventListener("pointerdown",e=>{
  if(editing){
    const sEl=e.target.closest("[data-id]");
    const dEl=e.target.closest("[data-dock]");
    const mEl=e.target.closest("[data-mark]");
    const p=svgPoint(e);
    if(sEl){
      const dock=docks.find(x=>x.id===sEl.getAttribute("data-dock"));
      const slip=slips.find(x=>x.id===sEl.getAttribute("data-id"));
      if(dock && slip && !isLocked(dock)){
        dockDrag={kind:"slip",dockId:dock.id,id:slip.id,x:slip.x,y:slip.y,px:p.x,py:p.y,moved:false};
        selectEditSlip(slip.id);
        chart.setPointerCapture(e.pointerId);
        return;
      }
    }
    if(dEl){
      const d=docks.find(x=>x.id===dEl.getAttribute("data-dock"));
      if(d){dockDrag={kind:"dock",id:d.id,x:d.x,y:d.y,px:p.x,py:p.y,moved:false};selectDock(d.id);chart.setPointerCapture(e.pointerId);return;}
    }
    if(mEl){
      const m=marks.find(x=>x.id===mEl.getAttribute("data-mark"));
      if(m){dockDrag={kind:"mark",id:m.id,x:m.x,y:m.y,px:p.x,py:p.y,moved:false};selectMark(m.id);chart.setPointerCapture(e.pointerId);return;}
    }
    pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);return;
  }
  if(e.target.closest("[data-id]")) return;
  pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);
});
chart.addEventListener("pointermove",e=>{
  if(dockDrag){
    const p=svgPoint(e); const dx=p.x-dockDrag.px, dy=p.y-dockDrag.py;
    if(Math.abs(dx)+Math.abs(dy)>2) dockDrag.moved=true;
    if(dockDrag.kind==="slip"){
      const d=docks.find(x=>x.id===dockDrag.dockId);
      if(d){ setPlaced(d,dockDrag.id,{x:Math.round(dockDrag.x+dx),y:Math.round(dockDrag.y+dy)}); redraw(); }
    }else if(dockDrag.kind==="dock"){
      const d=docks.find(x=>x.id===dockDrag.id);
      if(d){
        const nx=Math.round(dockDrag.x+dx), ny=Math.round(dockDrag.y+dy);
        const mdx=nx-d.x, mdy=ny-d.y;
        const g=findGroupFor("dock", d.id);
        if(g){ moveGroupMembers(g, mdx, mdy); }
        else { if(isLocked(d)) moveDockSlips(d,mdx,mdy); d.x=nx; d.y=ny; }
        redraw();
      }
    }else{
      const m=marks.find(x=>x.id===dockDrag.id);
      if(m){
        const nx=Math.round(dockDrag.x+dx), ny=Math.round(dockDrag.y+dy);
        const mdx=nx-m.x, mdy=ny-m.y;
        const g=findGroupFor("mark", m.id);
        if(g) moveGroupMembers(g, mdx, mdy);
        else { m.x=nx; m.y=ny; }
        redraw();
      }
    }
    return;
  }
  if(!pan) return;
  tx=e.clientX-pan.x; ty=e.clientY-pan.y; applyZoom();
});
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
document.getElementById("edit-toggle").onclick=()=>{editing=!editing;document.body.classList.toggle("editing",editing);chart.classList.toggle("editing",editing);document.getElementById("edit-toggle").classList.toggle("on",editing);document.getElementById("edit-toggle").textContent=editing?"Done editing":"Edit docks";document.getElementById("hint").textContent=editing?"Unlocked docks: drag slips · locked docks move as one":"Click a numbered slip · drag to pan";if(editing)showTab("layout");redraw();};
document.getElementById("bg-op").oninput=function(){bgImg.setAttribute("opacity",String((+this.value)/100));};
document.getElementById("export-layout").onclick=async()=>{const json=JSON.stringify({docks,marks,groups},null,2);try{await navigator.clipboard.writeText(json);alert("Layout JSON copied.");}catch{prompt("Copy this layout JSON:",json);}};
document.getElementById("download-layout").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({docks,marks,groups},null,2)],{type:"application/json"}));a.download="laceys-layout.json";a.click();};
document.getElementById("import-layout").onclick=()=>document.getElementById("import-file").click();
document.getElementById("import-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);if(!raw.docks)throw 0;localStorage.setItem(LAYOUT_STORE,JSON.stringify(raw));({docks,marks,groups}=loadLayout());saveLayout(false);redraw();renderDockEditor();}catch{alert("Could not read that JSON file.");}};r.readAsText(f);};
document.getElementById("reset-layout").onclick=()=>{if(!confirm("Reset all positions?"))return;docks=clone(DEFAULT_DOCKS);marks=clone(DEFAULT_MARKS);groups=[];saveLayout();redraw();renderDockEditor();};
document.getElementById("add-walk").onclick=()=>{const m={id:uid("mainwalk"),kind:"bar",x:200,y:200,w:14,h:220,title:"Walkway",rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;selected=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
document.getElementById("add-box").onclick=()=>{const m={id:uid("box"),kind:"box",x:80,y:80,w:140,h:50,fill:"#2b6d8a",t1:"Building",t2:"",ink:"#fff",rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;selected=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
document.getElementById("add-label").onclick=()=>{const m={id:uid("label"),kind:"text",x:200,y:80,text:"Label",size:13,rot:0};marks.push(m);selectedMark=m.id;selectedDock=null;selected=null;saveLayout();showTab("layout");redraw();renderDockEditor();};
document.getElementById("add-dock").onclick=()=>{
  const name=prompt("Dock name?","New dock"); if(name==null||!String(name).trim()) return;
  const type=(prompt("Layout: ns (finger up/down), ew (finger left/right), or col (stack)?","ns")||"ns").toLowerCase();
  const aCount=Math.max(1,Math.min(40,+(prompt("How many slips on side A?","8")||8)));
  const bCount=Math.max(0,Math.min(40,+(prompt("How many slips on side B?","8")||0)));
  const start=+(prompt("Starting slip number?",String(nextSlipNumber()))||nextSlipNumber());
  const a=[],b=[]; let n=start; const used=new Set(slips.map(s=>String(s.num)));
  const take=()=>{while(used.has(String(n))) n++; const v=n; used.add(String(v)); n++; return v;};
  for(let i=0;i<aCount;i++) a.push(take());
  for(let i=0;i<bCount;i++) b.push(take());
  const d={id:uid("dock"),name:String(name).trim(),type:type==="ew"?"ew":type==="col"?"col":"ns",x:200,y:200,kind:"std",size:"Custom",locked:false,sw:type==="ew"?16:40,sh:type==="ew"?36:15,gap:3,w:40,h:16,a,b};
  docks.push(d); selectedDock=d.id; selected=null; selectedMark=null; saveLayout(); showTab("layout"); redraw(); renderDockEditor();
};
document.getElementById("add-slip-free").onclick=()=>{
  const num=prompt("Slip number?", String(nextSlipNumber())); if(num==null||!String(num).trim()) return;
  let dock=docks.find(x=>x.id===selectedDock);
  if(!dock){
    dock={id:uid("dock"),name:"Loose slips",type:"col",x:80,y:80,kind:"std",size:"Custom",locked:false,gap:22,w:40,h:16,a:[],b:[],extras:[]};
    docks.push(dock);
  }
  dock.extras=dock.extras||[];
  dock.extras.push({num:String(num).trim(),dx:0,dy:-28,w:dock.sw||dock.w||40,h:dock.sh||dock.h||16});
  dock.locked=false; selectedDock=dock.id; selected=String(num).trim(); selectedMark=null;
  saveLayout(); showTab("layout"); redraw(); renderDockEditor();
};

document.getElementById("btn-undo").onclick=()=>undo();
document.getElementById("btn-redo").onclick=()=>redo();
document.getElementById("btn-group").onclick=()=>{
  if(multi.size<2){ alert("Shift-click at least two docks or labels first."); return; }
  const name=prompt("Group name?","Group "+(groups.length+1));
  if(name==null) return;
  groups.push({id:uid("grp"),name:String(name).trim()||"Group",members:[...multi]});
  multi.clear(); updateSelHint(); saveLayout(); redraw();
};
document.getElementById("btn-ungroup").onclick=()=>{
  const keys=[...multi];
  if(selectedDock) keys.push("dock:"+selectedDock);
  if(selectedMark) keys.push("mark:"+selectedMark);
  if(!keys.length){ alert("Select a grouped item (or multi-select) first."); return; }
  groups=groups.filter(g=>!(g.members||[]).some(k=>keys.includes(k)));
  multi.clear(); updateSelHint(); saveLayout(); redraw();
};
document.getElementById("btn-dup").onclick=()=>{
  if(selectedDock){
    const d=docks.find(x=>x.id===selectedDock); if(!d) return;
    const copy=clone(d); copy.id=uid("dock"); copy.name=(d.name||"Dock")+" copy"; copy.x+=40; copy.y+=40;
    docks.push(copy); selectedDock=copy.id; saveLayout(); redraw(); renderDockEditor(); return;
  }
  if(selectedMark){
    const m=marks.find(x=>x.id===selectedMark); if(!m) return;
    const copy=clone(m); copy.id=uid(m.kind||"mark"); copy.x+=30; copy.y+=30;
    marks.push(copy); selectedMark=copy.id; saveLayout(); redraw(); renderDockEditor(); return;
  }
  alert("Select a dock or label first.");
};
updateUndoBtns(); updateSelHint();
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="z"){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="y"){ e.preventDefault(); redo(); }
});
