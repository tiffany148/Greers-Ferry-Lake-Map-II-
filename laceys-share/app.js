
window.addEventListener("error",function(ev){
  var b=document.getElementById("error-banner");
  if(b){ b.style.display="block"; b.textContent="JavaScript error: "+(ev && ev.message ? ev.message : "unknown"); }
});
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
  return Object.assign({},s,{x:p.x,y:p.y,w:p.w!=null?p.w:s.w,h:p.h!=null?p.h:s.h,rot:p.rot||0,fill:p.fill});
}
function setPlaced(d,id,patch){
  d.placed=d.placed||{};
  d.placed[id]=Object.assign({},d.placed[id]||{},patch);
}
function moveDockSlips(d,dx,dy){
  if(!d.placed) return;
  Object.keys(d.placed).forEach(id=>{d.placed[id].x+=dx;d.placed[id].y+=dy;});
}

const MAP_W=2400, MAP_H=1700; // SVG viewBox -- hard edit working area
function unionBox(a,b){
  if(!a) return b; if(!b) return a;
  const x=Math.min(a.x,b.x), y=Math.min(a.y,b.y);
  return {x,y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y};
}
function dockBBox(d){
  let box=null;
  try{
    const g=walkGeomFromDock(d);
    box=unionBox(box,{x:g.x,y:g.y,w:Math.max(1,g.w),h:Math.max(1,g.h)});
  }catch(e){}
  box=unionBox(box,{x:(Number(d.x)||0)-30,y:(Number(d.y)||0)-28,w:60,h:22});
  try{
    generatedSlips(d).forEach(s=>{
      const p=applyPlaced(d,s);
      box=unionBox(box,{x:Number(p.x)||0,y:Number(p.y)||0,w:Math.max(1,Number(p.w)||10),h:Math.max(1,Number(p.h)||10)});
    });
  }catch(e){}
  return box||{x:Number(d.x)||0,y:Number(d.y)||0,w:10,h:10};
}
function markBBox(m){
  const box=markHitBox(m);
  return box||{x:Number(m.x)||0,y:Number(m.y)||0,w:10,h:10};
}
function slipBBoxFrom(d, slipId, fallback){
  try{
    const s=generatedSlips(d).map(x=>applyPlaced(d,x)).find(x=>String(x.id)===String(slipId));
    if(s) return {x:Number(s.x)||0,y:Number(s.y)||0,w:Math.max(1,Number(s.w)||10),h:Math.max(1,Number(s.h)||10)};
  }catch(e){}
  if(fallback) return {x:fallback.x,y:fallback.y,w:Math.max(1,fallback.w||10),h:Math.max(1,fallback.h||10)};
  return {x:0,y:0,w:10,h:10};
}
function keysBBox(keys){
  let box=null;
  (keys||[]).forEach(k=>{
    const {kind,id}=parseMemberKey(k);
    if(kind==="dock"){ const d=docks.find(x=>x.id===id); if(d) box=unionBox(box,dockBBox(d)); }
    else if(kind==="mark"){ const m=marks.find(x=>x.id===id); if(m) box=unionBox(box,markBBox(m)); }
  });
  return box;
}
/** Clamp a proposed translation so bbox stays inside the map. If already OOB, pulls back in. */
function clampDeltaForBox(box, dx, dy){
  if(!box) return {dx:0,dy:0};
  let ndx=Number(dx)||0, ndy=Number(dy)||0;
  const w=Math.max(1, Number(box.w)||1), h=Math.max(1, Number(box.h)||1);
  const x=Number(box.x)||0, y=Number(box.y)||0;
  if(w>=MAP_W) ndx=-x;
  else{
    if(x+ndx<0) ndx=-x;
    if(x+w+ndx>MAP_W) ndx=MAP_W-(x+w);
  }
  if(h>=MAP_H) ndy=-y;
  else{
    if(y+ndy<0) ndy=-y;
    if(y+h+ndy>MAP_H) ndy=MAP_H-(y+h);
  }
  return {dx:ndx,dy:ndy};
}
function clampLayoutIntoMap(){
  let changed=false;
  docks.forEach(d=>{
    const box=dockBBox(d);
    const {dx,dy}=clampDeltaForBox(box,0,0);
    if(dx||dy){
      if(isLocked(d)) moveDockSlips(d,dx,dy);
      d.x=(Number(d.x)||0)+dx; d.y=(Number(d.y)||0)+dy; changed=true;
    }
    if(d.placed){
      Object.keys(d.placed).forEach(id=>{
        const b=slipBBoxFrom(d,id,d.placed[id]);
        const c=clampDeltaForBox(b,0,0);
        if(c.dx||c.dy){
          const p=d.placed[id];
          setPlaced(d,id,{x:(Number(p.x)||b.x)+c.dx,y:(Number(p.y)||b.y)+c.dy});
          changed=true;
        }
      });
    }
  });
  marks.forEach(m=>{
    const box=markBBox(m);
    const {dx,dy}=clampDeltaForBox(box,0,0);
    if(dx||dy){ m.x=(Number(m.x)||0)+dx; m.y=(Number(m.y)||0)+dy; changed=true; }
  });
  return changed;
}
let mapBoundRect=null;
function syncMapBoundVisual(){
  if(!svg) return;
  if(!mapBoundRect){
    mapBoundRect=el("rect",{
      id:"map-edit-bound",
      x:"0",y:"0",width:String(MAP_W),height:String(MAP_H),
      fill:"none", stroke:"#9ad5d0", "stroke-width":"4",
      "stroke-dasharray":"22 14", opacity:"0.9",
      "pointer-events":"none"
    });
    svg.appendChild(mapBoundRect);
  }
  mapBoundRect.setAttribute("visibility", editing ? "visible" : "hidden");
  // Clip paint to the true chart so letterbox/chrome cannot act as a fake canvas
  svg.setAttribute("overflow", "hidden");
}

function isDockPieceMark(id){ return /^(walk|dlabel)-(7|8|9|10|11|12|13|4|3|2|1|5|sales|fuel|courtesy|cruiser|houseboats)$/.test(id); }
let deepZoom=true;
let photoMax=0.9;
let photoAlign={x:0,y:0,scale:1,scaleX:1,scaleY:1,rot:0}; // overlay registration vs chart
const PHOTO_ALIGN_STORE="laceys-share-photo-align-v1";

function clampPhotoScale(v){ return Math.max(0.2, Math.min(3, Number(v)||1)); }
/** Normalize saved align: old `scale` → both axes; prefer scaleX/scaleY when present. */
function normalizePhotoAlign(raw){
  if(!raw || typeof raw!=="object") return {x:0,y:0,scale:1,scaleX:1,scaleY:1,rot:0};
  const hasXY = raw.scaleX!=null || raw.scaleY!=null;
  const legacy = clampPhotoScale(raw.scale);
  const scaleX = clampPhotoScale(hasXY ? (raw.scaleX!=null?raw.scaleX:legacy) : legacy);
  const scaleY = clampPhotoScale(hasXY ? (raw.scaleY!=null?raw.scaleY:legacy) : legacy);
  return {
    x:Number(raw.x)||0,
    y:Number(raw.y)||0,
    scaleX, scaleY,
    scale: clampPhotoScale((scaleX+scaleY)/2),
    rot:Number(raw.rot)||0
  };
}
function syncPhotoAlignScaleAvg(){
  photoAlign.scale = clampPhotoScale(((Number(photoAlign.scaleX)||1)+(Number(photoAlign.scaleY)||1))/2);
}
const LABEL_SIZE_STORE="laceys-share-label-size-v1";
const LABEL_PX={small:8,classic:9,normal:11,large:14,xl:20};
let labelSizeKey="normal";
let photoMoveMode=false;
let dockAlignMode=false;
let scale=1,tx=0,ty=0; // view transform — must exist before first redraw/label sizing
const chart=document.getElementById("chart"); // must exist before first redraw → applyDeepZoomLod → chartSize
let photoDrag=null;
let dockAlignDrag=null;
const photoPointers=new Map(); // pinch while moving photo
const dockAlignPointers=new Map();

function loadPhotoAlign(){
  try{
    const raw=JSON.parse(localStorage.getItem(PHOTO_ALIGN_STORE)||"null");
    if(raw && typeof raw==="object"){
      photoAlign=normalizePhotoAlign(raw);
    }
  }catch(e){}
}
function savePhotoAlign(){
  try{
    syncPhotoAlignScaleAvg();
    localStorage.setItem(PHOTO_ALIGN_STORE, JSON.stringify(photoAlign));
  }catch(e){}
}
function loadLabelSize(){
  try{
    const raw=localStorage.getItem(LABEL_SIZE_STORE);
    if(raw && LABEL_PX[raw]!=null) labelSizeKey=raw;
  }catch(e){}
}
function saveLabelSize(){
  try{ localStorage.setItem(LABEL_SIZE_STORE, labelSizeKey); }catch(e){}
}
function targetLabelPx(){ return LABEL_PX[labelSizeKey]||10; }
/** Label size control sets world-unit slip fonts (not zoom-boosted). */
function screenAwareFontSize(worldBase){
  // Prefer the Label size setting; fall back to designed world base
  const fromUi=LABEL_PX[labelSizeKey];
  if(fromUi!=null) return fromUi;
  return Number(worldBase)||9;
}
function labelStrokeWidth(fs){ return 0; }
function slipLabelAttrs(x,y,worldBase){
  const fs=screenAwareFontSize(worldBase);
  return {
    x, y, "text-anchor":"middle",
    fill:"#1b2423", "font-size":String(fs), "font-weight":"700",
    style:"font-size:"+fs+"px",
    class:"slip-num"
  };
}
function dockNameLabelAttrs(x,y,worldBase){
  const slipFs=screenAwareFontSize(9);
  const fs=Math.round((Number(worldBase)||14) * (slipFs/9));
  return {
    x, y, fill:"#d7eceb", "font-size":String(fs), "font-weight":"700",
    class:"dock-name-label"
  };
}
function syncLabelFonts(){
  try{
    const slipFs=screenAwareFontSize(9);
    svg.querySelectorAll("text.slip-num").forEach(t=>{
      t.setAttribute("font-size", String(slipFs));
      t.style.fontSize=slipFs+"px";
    });
    const dockFs=Math.round(14*(slipFs/9));
    svg.querySelectorAll("text.dock-name-label").forEach(t=>{
      t.setAttribute("font-size", String(dockFs));
      t.style.fontSize=dockFs+"px";
    });
  }catch(e){}
}
loadLabelSize();
function applyPhotoAlign(){
  if(!bgImg) return;
  const sx=clampPhotoScale(photoAlign.scaleX!=null?photoAlign.scaleX:photoAlign.scale);
  const sy=clampPhotoScale(photoAlign.scaleY!=null?photoAlign.scaleY:photoAlign.scale);
  photoAlign.scaleX=sx; photoAlign.scaleY=sy; syncPhotoAlignScaleAvg();
  const cx=1200, cy=850; // chart working-area center (viewBox 2400×1700)
  const W=2400, H=1700;
  const rot=Number(photoAlign.rot)||0;
  // Base image rect stays chart-sized with meet (full aerial, no slice crop — v64+).
  // Non-uniform scaleX/scaleY applied via transform so Stretch width pulls docks L/R
  // without the same height change; uniform sx=sy matches prior scale behavior.
  const dx=Number(photoAlign.x)||0;
  const dy=Number(photoAlign.y)||0;
  bgImg.setAttribute("x", "0");
  bgImg.setAttribute("y", "0");
  bgImg.setAttribute("width", String(W));
  bgImg.setAttribute("height", String(H));
  bgImg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  // Center of photo working area after pan is (cx+dx, cy+dy); scale/rotate about that.
  const px=cx+dx, py=cy+dy;
  if(dx||dy||rot||Math.abs(sx-1)>1e-6||Math.abs(sy-1)>1e-6){
    const parts=[`translate(${px} ${py})`];
    if(rot) parts.push(`rotate(${rot})`);
    if(Math.abs(sx-1)>1e-6||Math.abs(sy-1)>1e-6) parts.push(`scale(${sx} ${sy})`);
    parts.push(`translate(${-cx} ${-cy})`);
    bgImg.setAttribute("transform", parts.join(" "));
  }else{
    bgImg.removeAttribute("transform");
  }
  const sxEl=document.getElementById("photo-scale-x");
  const syEl=document.getElementById("photo-scale-y");
  const sxv=document.getElementById("photo-scale-x-val");
  const syv=document.getElementById("photo-scale-y-val");
  const rv=document.getElementById("photo-rot-val");
  const rr=document.getElementById("photo-rot");
  // UI range 50–200%; still allow internal values outside via pinch/legacy
  if(sxEl) sxEl.value=String(Math.round(Math.max(50, Math.min(200, sx*100))));
  if(syEl) syEl.value=String(Math.round(Math.max(50, Math.min(200, sy*100))));
  if(sxv) sxv.textContent=Math.round(sx*100)+"%";
  if(syv) syv.textContent=Math.round(sy*100)+"%";
  if(rr) rr.value=String(rot);
  if(rv) rv.textContent=(Math.round(rot*10)/10)+"°";
}

function loadLayersStandalone(){
  try{
    const raw=JSON.parse(localStorage.getItem("laceys-share-layers-v1")||"null");
    return Array.isArray(raw)?raw:[];
  }catch{return [];}
}
function loadLayout(){
  try{
    const raw=JSON.parse(localStorage.getItem(LAYOUT_STORE)||"null");
    if(!raw||!Array.isArray(raw.docks)||!raw.docks.length){
      return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS),groups:[],layers:loadLayersStandalone(),stackOrder:[]};
    }
    // Saved layout is authoritative so deletes (parking oval, etc.) and positions stick.
    const docks=clone(raw.docks);
    const marks=clone((raw.marks||[]).filter(m=>m && !isDockPieceMark(m.id)));
    const layers=Array.isArray(raw.layers)?clone(raw.layers):loadLayersStandalone();
    const stackOrder=Array.isArray(raw.stackOrder)?clone(raw.stackOrder):[];
    if(raw.photoAlign){
      photoAlign=normalizePhotoAlign(raw.photoAlign);
      savePhotoAlign();
    }
    if(raw.photoMax!=null){ photoMax=Math.max(0, Math.min(1, Number(raw.photoMax))); }
    return {docks,marks,groups:Array.isArray(raw.groups)?clone(raw.groups):[],layers,stackOrder};
  }catch{return {docks:clone(DEFAULT_DOCKS),marks:clone(DEFAULT_MARKS),groups:[],layers:loadLayersStandalone(),stackOrder:[]};}
}
const hist=[], future=[];
let lastSnap=null;
function snap(){ return JSON.stringify({docks,marks,groups,layers,photoAlign,photoMax,stackOrder}); }
function restoreSnap(s){
  const raw=JSON.parse(s);
  docks=raw.docks; marks=raw.marks; groups=raw.groups||[];
  stackOrder=Array.isArray(raw.stackOrder)?raw.stackOrder:[];
  if(Array.isArray(raw.layers)) layers=raw.layers;
  if(raw.photoAlign){
    photoAlign=normalizePhotoAlign(raw.photoAlign);
    savePhotoAlign();
  }
  if(raw.photoMax!=null) photoMax=Math.max(0, Math.min(1, Number(raw.photoMax)));
  lastSnap=s;
  localStorage.setItem(LAYOUT_STORE, s);
  try{ localStorage.setItem("laceys-share-layers-v1", JSON.stringify(layers)); }catch(e){}
  selected=null; selectedDock=null; selectedMark=null; multi.clear(); moveWholeChart=false;
  redraw(); applyPhotoAlign(); applyDeepZoomLod(); renderDockEditor(); renderLayersEditor(); updateUndoBtns(); updateSelHint(); ensureMapVisible(); renderLayersEditor(); renderChips();
}
function undo(){ if(!hist.length) return; future.push(snap()); restoreSnap(hist.pop()); }
function redo(){ if(!future.length) return; hist.push(snap()); restoreSnap(future.pop()); }
function updateUndoBtns(){
  const u=document.getElementById("btn-undo"), r=document.getElementById("btn-redo");
  if(u){ u.disabled=!hist.length; u.style.opacity=hist.length?1:.45; }
  if(r){ r.disabled=!future.length; r.style.opacity=future.length?1:.45; }
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
let {docks,marks,groups,layers,stackOrder}=loadLayout();
if(!Array.isArray(layers)) layers=[];
if(!Array.isArray(stackOrder)) stackOrder=[];
let activeLayerId=null;
let layerOptFilter="All";
function sanitizeLayout(){
  let changed=false;
  // Hard clamp geometry into the real chart (viewBox 0,0,MAP_W x MAP_H) -- never keep OOB placements.
  if(clampLayoutIntoMap()) changed=true;
  docks.forEach(d=>{
    (d.extras||[]).forEach(ex=>{
      // Only stop absurd cover-the-map sizes -- do NOT shrink intentional tall slips (e.g. 839/840 at 40x300)
      if((ex.w||0)>900 && (ex.h||0)>900){ ex.w=Math.min(ex.w,120); ex.h=Math.min(ex.h,40); changed=true; }
    });
    if(d.placed){
      Object.keys(d.placed).forEach(id=>{
        const p=d.placed[id]; if(!p) return;
        if((p.w||0)>900 && (p.h||0)>900){
          p.w=d.sw||d.w||40; p.h=d.sh||d.h||16; changed=true;
        }
      });
    }
    // Keep dock default slip sizes reasonable, but allow large individual extras/placed above
    if((d.sw||0)>400){ d.sw=40; changed=true; }
    if((d.sh||0)>400){ d.sh=36; changed=true; }
  });
  const before=docks.length;
  docks=docks.filter(d=>{
    const name=(d.name||"").toLowerCase();
    if(name==="loose slips"||name==="extra slips") return false;
    return true;
  });
  if(docks.length!==before) changed=true;
  marks=marks.filter(m=>!((m.w||0)>1800 || (m.h||0)>1600));
  // If a bad save wiped almost everything, restore the baked main layout.
  if(docks.length < Math.min(8, DEFAULT_DOCKS.length)){
    docks=clone(DEFAULT_DOCKS);
    marks=clone(DEFAULT_MARKS);
    groups=[];
    changed=true;
  }
  return changed;
}
if(sanitizeLayout()) saveLayout(false);
lastSnap=snap();
let slips=[], selected=null, selectedDock=null, selectedMark=null, filter="All", editing=false;
const multi=new Set(); // "dock:id" or "mark:id"
let multiPick=false; // tap-to-toggle selection (mobile-friendly)
let moveWholeChart=false;
function updateSelHint(){
  const el=document.getElementById("sel-hint"); if(!el) return;
  document.querySelectorAll("#btn-multi, #btn-multi-hdr").forEach(btn=>{ if(btn) btn.classList.toggle("on", multiPick); });
  document.body.classList.toggle("multipick", !!(editing && multiPick));
  const countEl=document.getElementById("multi-count");
  if(countEl) countEl.textContent = multi.size ? (multi.size+" selected") : "Tap list or map to pick";
  const moveBtn=document.getElementById("btn-multi-move");
  if(moveBtn){ moveBtn.disabled = multi.size<1; moveBtn.textContent = multiPick ? "Move selected" : "Moving…"; }
  if(multiPick){
    el.textContent = multi.size ? (multi.size+" selected · tick more in the list, or tap Done") : "Tick docks/labels in the list below (or tap the map)";
  }else if(moveWholeChart || multi.size>1){
    el.textContent = (multi.size||"All")+" selected · drag on the map to move them · Multi-select to change the set";
  }else{
    el.textContent = "Multi-select opens a checklist — easiest on phones.";
  }
  renderPickList();
  updateSelChip();
}
function pieceLabel(kind,id){
  if(kind==="dock"){
    const d=docks.find(x=>x.id===id);
    return d ? ("Dock "+(d.name||d.id)) : ("Dock "+id);
  }
  const m=marks.find(x=>x.id===id);
  if(!m) return id;
  if(m.kind==="text") return "Label: "+(m.text||m.id);
  if(m.kind==="box") return "Building: "+(m.t1||m.id);
  if(m.kind==="bar") return "Walkway: "+(m.title||m.id);
  if(m.kind==="pill") return "Sign: "+(m.label||m.text||m.id);
  if(m.kind==="p") return "Parking";
  return (m.kind||"Piece")+": "+(m.title||m.text||m.id);
}
function currentSelectionLabel(){
  if(!editing) return "";
  if(multi.size>1) return multi.size+" selected";
  if(multi.size===1){
    const k=[...multi][0];
    const {kind,id}=parseMemberKey(k);
    return pieceLabel(kind==="mark"?"mark":"dock", id);
  }
  if(selected && editing){
    const s=slips.find(x=>x.id===selected);
    if(s){
      const num=String(s.num);
      return (/^\d+$/.test(num)?"Slip ":"")+num+(s.dock?(" · Dock "+s.dock):"");
    }
  }
  if(selectedDock) return pieceLabel("dock", selectedDock);
  if(selectedMark) return pieceLabel("mark", selectedMark);
  if(moveWholeChart) return "Entire map selected";
  return "";
}
function updateSelChip(){
  const label=currentSelectionLabel();
  const chips=[document.getElementById("edit-sel-chip"), document.getElementById("edit-sel-chip-desk")];
  chips.forEach(chip=>{
    if(!chip) return;
    if(!editing || !label){ chip.hidden=true; chip.textContent=""; return; }
    chip.hidden=false;
    chip.textContent=label;
  });
  // Keep mobile chrome height correct when chip appears/disappears
  if(editing){ try{ syncEditChromeHeight(); }catch(e){} }
}
function renderPickList(){
  const box=document.getElementById("pick-list");
  if(!box) return;
  if(!(editing && multiPick)){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  const rows=[];
  rows.push('<div class="pick-section">Docks</div>');
  docks.forEach(d=>{
    const k="dock:"+d.id;
    const on=multi.has(k);
    rows.push(`<label class="pick-row${on?" on":""}" data-k="${k}"><input type="checkbox" ${on?"checked":""}/><span>${pieceLabel("dock",d.id)}</span></label>`);
  });
  rows.push('<div class="pick-section">Labels & pieces</div>');
  marks.forEach(m=>{
    const k="mark:"+m.id;
    const on=multi.has(k);
    rows.push(`<label class="pick-row${on?" on":""}" data-k="${k}"><input type="checkbox" ${on?"checked":""}/><span>${pieceLabel("mark",m.id)}</span></label>`);
  });
  box.innerHTML=rows.join("");
  box.querySelectorAll(".pick-row").forEach(row=>{
    const inp=row.querySelector("input");
    const apply=()=>{
      const k=row.getAttribute("data-k");
      if(inp.checked) multi.add(k); else multi.delete(k);
      if(multi.size<=1) moveWholeChart=false;
      // sync selected for editor
      if(k.startsWith("dock:")){ selectedDock=k.slice(5); selectedMark=null; }
      else { selectedMark=k.slice(5); selectedDock=null; }
      selected=null;
      updateSelHint();
      redraw();
      renderDockEditor();
    };
    inp.onchange=apply;
    // whole row already toggles checkbox via label
  });
}
function setMultiPick(on){
  multiPick=!!on;
  if(multiPick){
    if(!editing){ document.getElementById("edit-toggle").click(); }
    moveWholeChart=false;
    showTab("layout");
    document.getElementById("hint").textContent="Multi-select · tick the list (or tap the map)";
  }else{
    document.getElementById("hint").textContent = multi.size>1 ? "Drag on the map to move the selection" : "Drag docks/labels · Multi-select to pick several";
  }
  updateSelHint();
  redraw();
}
function memberKey(kind,id){ return kind+":"+id; }
function findGroupFor(kind,id){
  const k=memberKey(kind,id);
  return groups.find(g=> (g.members||[]).includes(k));
}
function parseMemberKey(k){
  const i=String(k).indexOf(":");
  if(i<0) return {kind:"",id:k};
  return {kind:k.slice(0,i), id:k.slice(i+1)};
}
function moveMembersByKeys(keys,dx,dy){
  (keys||[]).forEach(k=>{
    const {kind,id}=parseMemberKey(k);
    if(kind==="dock"){ const d=docks.find(x=>x.id===id); if(d){ if(isLocked(d)) moveDockSlips(d,dx,dy); d.x+=dx; d.y+=dy; } }
    else if(kind==="mark"){ const m=marks.find(x=>x.id===id); if(m){ m.x+=dx; m.y+=dy; } }
  });
}
function moveGroupMembers(g,dx,dy){ moveMembersByKeys(g.members||[], dx, dy); }
function allLayoutKeys(){ return docks.map(d=>"dock:"+d.id).concat(marks.map(m=>"mark:"+m.id)); }
function markLodBucket(m){
  if(!m) return "site";
  if(m.kind==="bar") return "walk";
  if(m.kind==="pill"||m.kind==="text") return "labels";
  return "site";
}
function defaultStackOrder(){
  // Match prior LOD paint order: site marks → walk marks → docks → labels
  const site=[], walk=[], dockKeys=[], labels=[];
  marks.forEach(m=>{
    const k="mark:"+m.id; const b=markLodBucket(m);
    if(b==="labels") labels.push(k); else if(b==="walk") walk.push(k); else site.push(k);
  });
  docks.forEach(d=>dockKeys.push("dock:"+d.id));
  return site.concat(walk, dockKeys, labels);
}
function ensureStackOrder(){
  const want=allLayoutKeys();
  const wantSet=new Set(want);
  const keep=[];
  const seen=new Set();
  const src=(stackOrder&&stackOrder.length)?stackOrder:defaultStackOrder();
  src.forEach(k=>{ if(wantSet.has(k) && !seen.has(k)){ keep.push(k); seen.add(k); } });
  // New pieces append to front (end of list = painted last)
  want.forEach(k=>{ if(!seen.has(k)){ keep.push(k); seen.add(k); } });
  stackOrder=keep;
}
function stackCtrlHtml(){
  return `<p class="hint" style="margin-top:10px">Stack order (what sits in front)</p><div class="st"><button type="button" id="ed-stack-front">Bring to front</button><button type="button" id="ed-stack-forward">Forward</button></div><div class="st"><button type="button" id="ed-stack-back">Send to back</button><button type="button" id="ed-stack-backward">Back</button></div>`;
}
function stackKeysForEditor(){
  if(multi.size>1) return [...multi];
  if(selectedDock) return ["dock:"+selectedDock];
  if(selectedMark) return ["mark:"+selectedMark];
  return [];
}
function stackMove(keys, mode){
  ensureStackOrder();
  const set=new Set(keys||[]);
  if(!set.size) return false;
  const selected=stackOrder.filter(k=>set.has(k));
  if(!selected.length) return false;
  const rest=stackOrder.filter(k=>!set.has(k));
  if(mode==="front") stackOrder=rest.concat(selected);
  else if(mode==="back") stackOrder=selected.concat(rest);
  else if(mode==="forward"){
    const arr=stackOrder.slice();
    for(let i=arr.length-2;i>=0;i--){
      if(set.has(arr[i]) && !set.has(arr[i+1])){ const t=arr[i]; arr[i]=arr[i+1]; arr[i+1]=t; }
    }
    stackOrder=arr;
  }else if(mode==="backward"){
    const arr=stackOrder.slice();
    for(let i=1;i<arr.length;i++){
      if(set.has(arr[i]) && !set.has(arr[i-1])){ const t=arr[i]; arr[i]=arr[i-1]; arr[i-1]=t; }
    }
    stackOrder=arr;
  }else return false;
  return true;
}
function bindStackButtons(){
  const keys=stackKeysForEditor();
  const go=mode=>{ if(!stackMove(keys, mode)) return; saveLayout(); redraw(); renderDockEditor(); };
  const map={front:"ed-stack-front",forward:"ed-stack-forward",back:"ed-stack-back",backward:"ed-stack-backward"};
  Object.keys(map).forEach(mode=>{ const b=document.getElementById(map[mode]); if(b) b.onclick=()=>go(mode); });
}
function clearLayerNudge(){
  [layerBg, layerStack, layerSite, layerWalkMarks, layerDocks, layerSlips, layerLabels, layerMarks].forEach(L=>{ if(L) L.removeAttribute("transform"); });
}
function nudgeLayers(dx,dy,scaleF,cx,cy){
  // Never nudge layerBg — photo stays put while docks/marks move (Move photo owns the aerial)
  let t=`translate(${dx} ${dy})`;
  if(scaleF!=null && Math.abs(scaleF-1)>1e-6){
    const s=scaleF, ox=cx||1200, oy=cy||850;
    t=`translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy}) translate(${dx} ${dy})`;
  }
  [layerStack, layerSite, layerWalkMarks, layerDocks, layerSlips, layerLabels, layerMarks].forEach(L=>{ if(L) L.setAttribute("transform", t); });
}
function scalePointXY(x,y,cx,cy,f){ return {x:cx+(x-cx)*f, y:cy+(y-cy)*f}; }
function scaleMembersByKeys(keys,f,cx,cy){
  f=Number(f)||1; if(Math.abs(f-1)<1e-9) return;
  const seenD=new Set(), seenM=new Set();
  (keys||[]).forEach(k=>{
    const {kind,id}=parseMemberKey(k);
    if(kind==="dock"){
      const d=docks.find(x=>x.id===id); if(!d||seenD.has(d.id)) return; seenD.add(d.id);
      const p=scalePointXY(Number(d.x)||0, Number(d.y)||0, cx, cy, f);
      d.x=p.x; d.y=p.y;
      ["sw","sh","w","h","gap"].forEach(prop=>{ if(d[prop]!=null) d[prop]=Number(d[prop])*f; });
      (d.extras||[]).forEach(ex=>{
        if(ex.dx!=null) ex.dx=Number(ex.dx)*f;
        if(ex.dy!=null) ex.dy=Number(ex.dy)*f;
        if(ex.w!=null) ex.w=Number(ex.w)*f;
        if(ex.h!=null) ex.h=Number(ex.h)*f;
      });
      if(d.placed){
        Object.keys(d.placed).forEach(pid=>{
          const pl=d.placed[pid]; if(!pl) return;
          if(pl.x!=null && pl.y!=null){
            const q=scalePointXY(Number(pl.x)||0, Number(pl.y)||0, cx, cy, f);
            pl.x=q.x; pl.y=q.y;
          }
          if(pl.w!=null) pl.w=Number(pl.w)*f;
          if(pl.h!=null) pl.h=Number(pl.h)*f;
        });
      }
    }else if(kind==="mark"){
      const m=marks.find(x=>x.id===id); if(!m||seenM.has(m.id)) return; seenM.add(m.id);
      const p=scalePointXY(Number(m.x)||0, Number(m.y)||0, cx, cy, f);
      m.x=p.x; m.y=p.y;
      if(m.w!=null) m.w=Number(m.w)*f;
      if(m.h!=null) m.h=Number(m.h)*f;
      if(m.size!=null) m.size=Number(m.size)*f;
    }
  });
}
function keysForDrag(kind,id){
  const key=kind+":"+id;
  if(multi.has(key) && multi.size>1) return [...multi];
  const g=findGroupFor(kind,id);
  if(g && (g.members||[]).length>1) return [...(g.members||[])];
  if(moveWholeChart) return allLayoutKeys();
  return null;
}

function toggleMultiKey(k){
  if(multi.has(k)) multi.delete(k); else multi.add(k);
  if(multi.size<=1) moveWholeChart=false;
  updateSelHint();
  redraw();
}
function selectAllLayout(){
  multi.clear();
  allLayoutKeys().forEach(k=>multi.add(k));
  moveWholeChart=true;
  updateSelHint(); redraw();
}
function groupAllLayout(){
  selectAllLayout();
  groups=groups.filter(g=>g.name!=="Entire map");
  groups.push({id:uid("grp"),name:"Entire map",members:[...multi]});
  moveWholeChart=true;
  updateSelHint(); saveLayout(false); lastSnap=snap(); redraw();
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
const layerBg=el("g",{id:"bg"}), layerStack=el("g",{id:"stack"}), layerSite=el("g",{id:"lod-site"}), layerWalkMarks=el("g",{id:"lod-walkmarks"}), layerMarks=el("g",{id:"marks"}), layerDocks=el("g",{id:"docks"}), layerSlips=el("g",{id:"slips"}), layerLabels=el("g",{id:"lod-labels"});
svg.appendChild(el("rect",{width:2400,height:1700,fill:"#0c3c41"}));
const bgImg=el("image",{href:"dock-map.jpg",x:0,y:0,width:2400,height:1700,opacity:0.9,preserveAspectRatio:"xMidYMid meet"});
layerBg.appendChild(bgImg);
svg.setAttribute("overflow","hidden"); // clip to chart viewBox -- edit canvas = map, not letterbox
loadPhotoAlign();
applyPhotoAlign();
// layerStack paints docks+marks in stackOrder (cross-type z-order). Empty LOD groups kept for nudge/compat.
svg.appendChild(layerBg);svg.appendChild(layerStack);svg.appendChild(layerSite);svg.appendChild(layerWalkMarks);svg.appendChild(layerDocks);svg.appendChild(layerSlips);svg.appendChild(layerLabels);svg.appendChild(layerMarks);
syncMapBoundVisual();
function layerOptionFor(slipId, layerId){
  const rec=data[slipId];
  if(!rec||!rec.layerOpts) return null;
  return rec.layerOpts[layerId]||null;
}
function fill(s){
  if(activeLayerId){
    const layer=layers.find(l=>l.id===activeLayerId);
    const optId=layerOptionFor(s.id, activeLayerId);
    const opt=layer && (layer.options||[]).find(o=>o.id===optId);
    if(opt&&opt.color) return opt.color;
    return "#5a6866"; // unassigned under active layer
  }
  const rec=data[s.id];
  if(rec&&rec.status==="occupied")return "#b55a32";
  if(rec&&rec.status==="reserved")return "#d7b45a";
  if(s.fill)return s.fill;
  const dock=docks.find(x=>x.id===s.dockId);
  if(dock&&dock.fill)return dock.fill;
  return COLORS[s.kind]||"#e4dcc8";
}
function match(s,f){
  if(slipHiddenByLayer(s)) return false;
  if(activeLayerId){
    if(!layerOptFilter||layerOptFilter==="All") return true;
    if(layerOptFilter==="__none__") return !layerOptionFor(s.id, activeLayerId);
    return layerOptionFor(s.id, activeLayerId)===layerOptFilter;
  }
  if(!f||f==="All") return true;
  return s.filter===f || s.dock===f;
}
function activeLayer(){ return layers.find(l=>l.id===activeLayerId)||null; }
function slipHiddenByLayer(s){
  const layer=activeLayer();
  if(!layer) return false;
  if(layer.hidden) return true; // whole layer hidden → hide all slips while this layer is the active view
  const optId=layerOptionFor(s.id, layer.id);
  if(!optId) return !!layer.hideUnassigned;
  const opt=(layer.options||[]).find(o=>o.id===optId);
  return !!(opt && opt.hidden);
}
function buildMarkGroup(m){
  const rot=Number(m.rot)||0;
  const attrs={"data-mark":m.id,"data-lod":markLodBucket(m),class:"dock-hit"+(selectedMark===m.id?" on":"")+(multi.has("mark:"+m.id)?" multi":"")};
  if(rot) attrs.transform=`rotate(${rot} ${m.x} ${m.y})`;
  const g=el("g",attrs);
  if(m.kind==="box"){g.appendChild(el("rect",{class:"walk",x:m.x,y:m.y,width:m.w,height:m.h,rx:8,fill:m.fill||"#2b6d8a"}));g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2-6,"text-anchor":"middle",fill:m.ink||"#243018","font-size":13,"font-weight":700},m.t1||""));if(m.t2)g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2+12,"text-anchor":"middle",fill:m.ink||"#243018","font-size":11},m.t2));}
  else if(m.kind==="p"){const rx=m.w?m.w/2:70,ry=m.h?m.h/2:26;g.appendChild(el("ellipse",{class:"walk",cx:m.x,cy:m.y,rx,ry,fill:"none",stroke:"#9ad","stroke-width":3}));g.appendChild(el("text",{x:m.x,y:m.y+6,"text-anchor":"middle",fill:"#8ec4ea","font-size":18,"font-weight":800},"P"));}
  else if(m.kind==="bridge"){g.appendChild(el("rect",{class:"walk",x:m.x,y:m.y,width:m.w,height:m.h,fill:"#8a8a84"}));g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+16,"text-anchor":"middle",fill:"#222","font-size":12},"Hwy 92 Bridge"));}
  else if(m.kind==="bar"){g.appendChild(el("rect",{x:m.x,y:m.y,width:m.w||12,height:m.h||20,rx:3,fill:"#bfb9ac",class:"walk"}));}
  else if(m.kind==="pill"){
    g.appendChild(el("rect",{x:m.x,y:m.y,width:m.w,height:m.h,rx:4,fill:m.fill||"#2b6d8a",class:"walk"}));
    const pfs=screenAwareFontSize(10), psw=labelStrokeWidth(pfs);
    g.appendChild(el("text",{x:m.x+m.w/2,y:m.y+m.h/2+4,"text-anchor":"middle",fill:"#0a1210",stroke:"#f4fffe","stroke-width":String(psw),"paint-order":"stroke","font-size":String(pfs),"font-weight":800,class:"screen-label","data-world-fs":"10"},m.label||""));
  }
  else if(m.kind==="text"){
    const baseFs=m.size||13; const fs=screenAwareFontSize(baseFs); const sw=labelStrokeWidth(fs);
    const ink=m.ink||"#0a1210";
    g.appendChild(el("rect",{class:"walk",x:m.x-4,y:m.y-fs,width:Math.max(28,(m.text||"").length*fs*0.62),height:fs+8,fill:editing?"rgba(255,255,255,.12)":"none",stroke:editing?"rgba(255,255,255,.35)":"none","stroke-width":editing?1:0}));
    g.appendChild(el("text",{x:m.x,y:m.y,fill:ink,stroke:"#f4fffe","stroke-width":String(sw),"paint-order":"stroke","font-size":String(fs),"font-weight":800,class:"screen-label","data-world-fs":String(baseFs)},m.text||""));
  }
  return g;
}
function drawMarks(){ /* marks drawn in redraw via stackOrder */ }
function appendWalk(g,d){
  const geom=walkGeomFromDock(d);
  g.appendChild(el("rect",{class:"walk",x:geom.x,y:geom.y,width:geom.w,height:geom.h,rx:3,fill:"#bfb9ac"}));
  g.appendChild(el("text",dockNameLabelAttrs(d.x,d.y-12,14),d.name));
}
function redraw(){
  buildSlips();
  ensureStackOrder();
  layerStack.innerHTML="";
  layerSite.innerHTML=""; layerWalkMarks.innerHTML=""; layerLabels.innerHTML=""; layerMarks.innerHTML="";
  layerDocks.innerHTML=""; layerSlips.innerHTML="";
  const byDock={};
  const pieceG={};
  docks.forEach(d=>{
    const rot=Number(d.rot)||0;
    const attrs={"data-dock":d.id,"data-lod":"walk",class:"dock-hit"+(selectedDock===d.id?" on":"")+(multi.has("dock:"+d.id)?" multi":"")};
    if(rot) attrs.transform=`rotate(${rot} ${d.x} ${d.y})`;
    const g=el("g",attrs); appendWalk(g,d); byDock[d.id]=g; pieceG["dock:"+d.id]=g;
  });
  marks.forEach(m=>{ pieceG["mark:"+m.id]=buildMarkGroup(m); });
  slips.forEach(s=>{
    const parent=byDock[s.dockId]||layerSlips;
    const rot=Number(s.rot)||0;
    const hidden=slipHiddenByLayer(s);
    const dim=!hidden && !match(s,filter);
    const attrs={class:"slip"+(selected===s.id?" on":"")+(dim?" dim":"")+(hidden?" layer-hidden":""),"data-id":s.id,"data-dock":s.dockId};
    if(rot) attrs.transform=`rotate(${rot} ${s.x+s.w/2} ${s.y+s.h/2})`;
    const g=el("g",attrs);
    g.appendChild(el("rect",{x:s.x,y:s.y,width:s.w,height:s.h,rx:2,fill:fill(s)}));
    g.appendChild(el("text",slipLabelAttrs(s.x+s.w/2,s.y+s.h/2+3,9),String(s.num).replace(/^F|^C/,"")));
    parent.appendChild(g);
  });
  // Paint order = stackOrder (back → front). Orphan slips (no dock) stay in top-level layerSlips.
  stackOrder.forEach(k=>{ const g=pieceG[k]; if(g) layerStack.appendChild(g); });
  document.getElementById("count").textContent=slips.filter(s=>/^\d+$/.test(String(s.num))).length+" numbered slips";
  if(mapBoundRect && mapBoundRect.parentNode===svg) svg.appendChild(mapBoundRect);
  syncMapBoundVisual();
  applyDeepZoomLod();
}
const DOCK_CHIPS=["All","5","4","3","2","1","7","8","9","10","11","12","13","Houseboats","Cruiser","Fuel","Sales"];
const chipsEl=document.getElementById("chips");
function renderChips(){
  chipsEl.innerHTML="";
  if(activeLayerId){
    const layer=layers.find(l=>l.id===activeLayerId);
    if(layer && layer.hidden){
      const note=document.createElement("button");
      note.className="chip"; note.textContent="Layer hidden — click to show";
      note.onclick=()=>{ layer.hidden=false; saveLayersStore(); saveLayout(false); renderChips(); renderLayersEditor(); redraw(); };
      chipsEl.appendChild(note);
    }
    const opts=[{id:"All",name:"All",color:null},{id:"__none__",name:"Unassigned",color:null,isNone:true}].concat((layer&&layer.options)||[]);
    opts.forEach(o=>{
      const wrap=document.createElement("span");
      wrap.style.display="inline-flex"; wrap.style.gap="2px"; wrap.style.alignItems="center";
      const b=document.createElement("button");
      const isHidden = o.id==="__none__" ? !!(layer&&layer.hideUnassigned) : !!(o.hidden);
      b.className="chip"+(layerOptFilter===o.id?" on":"")+" layer-on"+(isHidden?" hidden-opt":"");
      b.textContent=o.name||o.id;
      if(o.color){ b.style.boxShadow="inset 0 -3px 0 "+o.color; }
      b.onclick=()=>{ layerOptFilter=o.id; renderChips(); redraw(); };
      wrap.appendChild(b);
      if(o.id!=="All"){
        const eye=document.createElement("button");
        eye.className="chip eye"+(isHidden?" off":"");
        eye.title=isHidden?"Show":"Hide";
        eye.textContent=isHidden?"🙈":"👁";
        eye.onclick=e=>{
          e.stopPropagation();
          if(o.id==="__none__"){ layer.hideUnassigned=!layer.hideUnassigned; }
          else { o.hidden=!o.hidden; }
          saveLayersStore(); saveLayout(false); renderChips(); renderLayersEditor(); redraw();
        };
        wrap.appendChild(eye);
      }
      chipsEl.appendChild(wrap);
    });
    const clear=document.createElement("button");
    clear.className="chip"; clear.textContent="Exit layer colors";
    clear.onclick=()=>{ activeLayerId=null; layerOptFilter="All"; renderChips(); renderLayersEditor(); redraw(); };
    chipsEl.appendChild(clear);
  }else{
    DOCK_CHIPS.forEach(c=>{
      const b=document.createElement("button");
      b.className="chip"+(filter===c?" on":"");
      b.textContent=c;
      b.onclick=()=>{ filter=c; renderChips(); redraw(); };
      chipsEl.appendChild(b);
    });
  }
}
renderChips();
redraw();
function svgPoint(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const ctm=svg.getScreenCTM();return ctm?pt.matrixTransform(ctm.inverse()):{x:0,y:0};}
function showTab(name){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.tab===name));document.getElementById("pane-slip").hidden=name!=="slip";document.getElementById("pane-dir").hidden=name!=="dir";const pl=document.getElementById("pane-layers"); if(pl) pl.hidden=name!=="layers";document.getElementById("pane-layout").hidden=name!=="layout"; if(name==="layers") renderLayersEditor();}
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
    const apply=()=>{const nx=+document.getElementById("ed-x").value,ny=+document.getElementById("ed-y").value,nw=+document.getElementById("ed-w").value,nh=+document.getElementById("ed-h").value;const box0={x:nx,y:ny,w:Math.max(1,nw),h:Math.max(1,nh)};const c=clampDeltaForBox(box0,0,0);setPlaced(d,s.id,{x:nx+c.dx,y:ny+c.dy,w:nw,h:nh,fill:document.getElementById("ed-fill").value});saveLayout();redraw();};
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
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);const box0=slipBBoxFrom(d,s.id,s);const c=clampDeltaForBox(box0,dx,dy);setPlaced(d,s.id,{x:s.x+c.dx,y:s.y+c.dy});saveLayout();redraw();renderDockEditor();});
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
      <div class="st"><button type="button" id="ed-add-slip">+ Slip on this dock</button><button type="button" id="ed-reset-slips">Reset slip layout</button></div>
      ${stackCtrlHtml()}`;
    document.getElementById("ed-lock").onclick=()=>{d.locked=!locked;saveLayout();redraw();renderDockEditor();};
    document.getElementById("ed-name").oninput=()=>{d.name=document.getElementById("ed-name").value;saveLayout();redraw();};
    document.getElementById("ed-type").onchange=()=>{d.type=document.getElementById("ed-type").value;d.placed={};saveLayout();redraw();renderDockEditor();};
    const applyPos=()=>{const nx=+document.getElementById("ed-x").value,ny=+document.getElementById("ed-y").value;const rawDx=nx-d.x, rawDy=ny-d.y;const c=clampDeltaForBox(dockBBox(d),rawDx,rawDy);if(isLocked(d)) moveDockSlips(d,c.dx,c.dy);d.x+=c.dx;d.y+=c.dy;saveLayout();redraw();};
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
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);const c=clampDeltaForBox(dockBBox(d),dx,dy);if(isLocked(d)) moveDockSlips(d,c.dx,c.dy);d.x+=c.dx;d.y+=c.dy;saveLayout();redraw();renderDockEditor();});
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
        docks.push(copy); ensureStackOrder(); stackMove(["dock:"+copy.id],"front"); selectedDock=copy.id; saveLayout(); redraw(); renderDockEditor();
      };
      document.getElementById("ed-del-dock").onclick=()=>{
        if(!confirm("Delete dock "+d.name+" and its slips?")) return;
        docks=docks.filter(x=>x.id!==d.id);
        groups.forEach(g=>g.members=(g.members||[]).filter(k=>k!=="dock:"+d.id));
        ensureStackOrder();
        selectedDock=null; selected=null; saveLayout(); redraw(); renderDockEditor();
      };
    }
    bindStackButtons();
  }else if(m){
    const kindName={bar:"Walkway",box:"Building",pill:"Building",bridge:"Bridge",text:"Label",p:"Parking"}[m.kind]||m.kind;
    const isText=m.kind==="text"||(m.text!=null&&m.kind!=="box"&&m.kind!=="pill");
    const colorVal=isText?(m.ink||"#d7eceb"):(m.fill||m.ink||"#2b6d8a");
    const colorLabel=isText?"Text color":(m.kind==="pill"||m.kind==="box"?"Fill color":"Color");
    box.innerHTML=`<h2>${kindName}</h2><p class="hint">${isText?"Drag on the map or use X/Y and arrows to move. Change text color below.":(m.title||m.id)}</p><div class="row2"><label>X<input id="ed-x" type="number" value="${Math.round(m.x)}"/></label><label>Y<input id="ed-y" type="number" value="${Math.round(m.y)}"/></label></div>${(!isText||m.w!=null)?`<div class="row2"><label>Width<input id="ed-w" type="number" value="${Math.round(m.w||12)}"/></label><label>Height<input id="ed-h" type="number" value="${Math.round(m.h||20)}"/></label></div>`:""}${isText?`<label>Font size<input id="ed-size" type="number" min="8" max="48" value="${Math.round(m.size||13)}"/></label>`:""}<label>${colorLabel}<input id="ed-fill" type="color" value="${colorVal}"/></label>${m.kind==="box"||m.kind==="pill"?`<label>Text / ink color<input id="ed-ink" type="color" value="${m.ink||"#ffffff"}"/></label>`:""}<div class="st"><button type="button" data-nudge="-10,0">←</button><button type="button" data-nudge="10,0">→</button><button type="button" data-nudge="0,-10">↑</button><button type="button" data-nudge="0,10">↓</button></div>${rotCtrl(Number(m.rot)||0)}${m.kind==="text"||m.text!=null?`<label>Text<input id="ed-text" value="${(m.text||"").replace(/"/g,"&quot;")}"/></label>`:""}${m.t1!=null?`<label>Title<input id="ed-t1" value="${(m.t1||"").replace(/"/g,"&quot;")}"/></label>`:""}${m.label!=null?`<label>Label<input id="ed-label" value="${(m.label||"").replace(/"/g,"&quot;")}"/></label>`:""}${stackCtrlHtml()}<div class="st"><button type="button" id="ed-dup-mark">Duplicate</button><button type="button" id="ed-del">Delete this piece</button></div>`;
    const apply=()=>{const nx=+document.getElementById("ed-x").value,ny=+document.getElementById("ed-y").value;const ew=document.getElementById("ed-w"),eh=document.getElementById("ed-h");if(ew)m.w=+ew.value;if(eh)m.h=+eh.value;const c=clampDeltaForBox(markBBox(Object.assign({},m,{x:m.x,y:m.y})),nx-m.x,ny-m.y);m.x+=c.dx;m.y+=c.dy; clampLayoutIntoMap(); saveLayout();redraw();};
    document.getElementById("ed-x").onchange=apply;document.getElementById("ed-y").onchange=apply;
    const ew=document.getElementById("ed-w"); if(ew) ew.onchange=apply; const eh=document.getElementById("ed-h"); if(eh) eh.onchange=apply;
    bindRot(m,()=>renderDockEditor());
    const t=document.getElementById("ed-text"); if(t) t.oninput=()=>{m.text=t.value;saveLayout();redraw();};
    const t1=document.getElementById("ed-t1"); if(t1) t1.oninput=()=>{m.t1=t1.value;saveLayout();redraw();};
    const lb=document.getElementById("ed-label"); if(lb) lb.oninput=()=>{m.label=lb.value;saveLayout();redraw();};
    const sz=document.getElementById("ed-size"); if(sz){ sz.oninput=()=>{m.size=+sz.value||13;saveLayout(false);redraw();}; sz.onchange=()=>saveLayout(); }
    box.querySelectorAll("[data-nudge]").forEach(btn=>btn.onclick=()=>{const [dx,dy]=btn.dataset.nudge.split(",").map(Number);const c=clampDeltaForBox(markBBox(m),dx,dy);m.x+=c.dx;m.y+=c.dy;saveLayout();redraw();renderDockEditor();});
    const cf=document.getElementById("ed-fill");
    if(cf){ cf.oninput=()=>{ if(m.kind==="text") m.ink=cf.value; else m.fill=cf.value; saveLayout(false); redraw(); }; cf.onchange=()=>saveLayout(); }
    const ink=document.getElementById("ed-ink");
    if(ink){ ink.oninput=()=>{ m.ink=ink.value; saveLayout(false); redraw(); }; ink.onchange=()=>saveLayout(); }
    document.getElementById("ed-dup-mark").onclick=()=>{ const copy=clone(m); copy.id=uid(m.kind||"mark"); copy.x+=30; copy.y+=30; marks.push(copy); ensureStackOrder(); stackMove(["mark:"+copy.id],"front"); selectedMark=copy.id; saveLayout(); redraw(); renderDockEditor(); };
    document.getElementById("ed-del").onclick=()=>{if(!confirm("Delete this piece?"))return;marks=marks.filter(x=>x.id!==m.id);groups.forEach(g=>g.members=(g.members||[]).filter(k=>k!=="mark:"+m.id));ensureStackOrder();selectedMark=null;saveLayout();redraw();renderDockEditor();};
    bindStackButtons();
  }else if(multi.size>1){
    box.innerHTML=`<h2>${multi.size} selected</h2><p class="hint">Change stack order for the whole selection.</p>${stackCtrlHtml()}`;
    bindStackButtons();
  }else box.innerHTML="<p>Click a dock, slip, walkway, building, or label.</p>";
}
function renderSlipLayerAssigns(slipId){
  const box=document.getElementById("slip-layer-assigns");
  if(!box) return;
  if(!layers.length){ box.innerHTML=""; return; }
  const rec=data[slipId]||{};
  const opts=rec.layerOpts||{};
  box.innerHTML="<p class=\"hint\" style=\"margin-top:10px\">Layer colors</p>"+layers.map(layer=>{
    const cur=opts[layer.id]||"";
    const options=["<option value=\"\">Unassigned</option>"].concat((layer.options||[]).map(o=>"<option value=\""+o.id+"\""+(cur===o.id?" selected":"")+">"+o.name+"</option>"));
    return "<label>"+layer.name+"<select data-layer-assign=\""+layer.id+"\">"+options.join("")+"</select></label>";
  }).join("");
  box.querySelectorAll("[data-layer-assign]").forEach(sel=>{
    sel.onchange=()=>{
      data[slipId]=data[slipId]||{status:"vacant"};
      data[slipId].layerOpts=data[slipId].layerOpts||{};
      const v=sel.value;
      if(!v) delete data[slipId].layerOpts[sel.dataset.layerAssign];
      else data[slipId].layerOpts[sel.dataset.layerAssign]=v;
      save(data); redraw();
    };
  });
}
function select(id){selected=id;selectedDock=null;selectedMark=null;const s=slips.find(x=>x.id===id);if(!s)return;const rec=data[id]||{status:"vacant",boat:"",notes:""};document.getElementById("slip-detail").hidden=false;document.getElementById("slip-title").textContent=(/^\d+$/.test(String(s.num))?"Slip ":"")+s.num;document.getElementById("slip-meta").textContent="Dock "+s.dock+" · "+s.size;document.getElementById("boat").value=rec.boat||"";document.getElementById("notes").value=rec.notes||"";document.querySelectorAll("#pane-slip .st button").forEach(b=>b.classList.toggle("on",b.dataset.st===(rec.status||"vacant")));renderSlipLayerAssigns(id);if(!editing)showTab("slip");redraw();}
function selectDock(id){selectedDock=id;selectedMark=null;if(!editing) selected=null;showTab("layout");if(!isMobileEdit()) openEditPanel(); else { const h=document.getElementById("hint"); if(h) h.textContent=pieceLabel("dock",id)+" · drag to move · Tools for properties"; } renderDockEditor();redraw();updateSelChip();}
function selectMark(id){selectedMark=id;selectedDock=null;selected=null;showTab("layout");if(!isMobileEdit()) openEditPanel(); else { const h=document.getElementById("hint"); if(h) h.textContent=pieceLabel("mark",id)+" · drag to move · Tools for properties"; } renderDockEditor();redraw();updateSelChip();}
function selectEditSlip(id){
  const s=slips.find(x=>x.id===id); if(!s) return;
  selected=id; selectedDock=s.dockId; selectedMark=null;
  showTab("layout"); if(!isMobileEdit()) openEditPanel(); else { const h=document.getElementById("hint"); if(h){ const num=String(s.num); h.textContent=((/^\d+$/.test(num)?"Slip ":"")+num)+" · drag to move · Tools for properties"; } } renderDockEditor(); redraw(); updateSelChip();
}
let dockDrag=null,pan=null; // scale/tx/ty declared earlier for screen-aware labels
function lodFade(t,a,b){ if(t<=a) return 0; if(t>=b) return 1; return (t-a)/(b-a); }
function zoomUnit(){ return scale/Math.max(1e-6, minFitScale()); }
function applyDeepZoomLod(){
  applyPhotoAlign();
  const btn=document.getElementById("btn-deep-zoom");
  if(btn) btn.classList.toggle("on", deepZoom);
  document.body.classList.toggle("deepzoom", deepZoom);
  const val=document.getElementById("photo-op-val");
  if(val) val.textContent=Math.round(photoMax*100)+"%";
  if(!deepZoom || editing || multiPick){
    bgImg.setAttribute("opacity", String(photoMax));
    if(layerStack) layerStack.setAttribute("opacity","1");
    [layerSite, layerWalkMarks, layerDocks, layerSlips, layerLabels].forEach(L=>{ if(L) L.setAttribute("opacity","1"); });
    if(layerStack) layerStack.querySelectorAll("[data-lod]").forEach(n=>n.setAttribute("opacity","1"));
    return;
  }
  const z=zoomUnit();
  // Photo strong when zoomed out; fades as vectors appear
  const photo = photoMax * (1 - lodFade(z, 0.95, 2.2));
  bgImg.setAttribute("opacity", String(Math.max(0, Math.min(1, photo))));
  const site = lodFade(z, 0.85, 1.35);
  const walk = lodFade(z, 1.15, 1.75);
  const labels = lodFade(z, 2.0, 2.9);
  if(layerStack){
    layerStack.setAttribute("opacity","1");
    layerStack.querySelectorAll("[data-lod]").forEach(n=>{
      const b=n.getAttribute("data-lod");
      n.setAttribute("opacity", String(b==="site"?site : b==="labels"?labels : walk));
    });
  }
  if(layerSite) layerSite.setAttribute("opacity", String(site));
  if(layerWalkMarks) layerWalkMarks.setAttribute("opacity", String(walk));
  if(layerDocks) layerDocks.setAttribute("opacity", String(walk));
  if(layerSlips) layerSlips.setAttribute("opacity", String(lodFade(z, 1.55, 2.35)));
  if(layerLabels) layerLabels.setAttribute("opacity", String(labels));
}
const WORLD_W=MAP_W, WORLD_H=MAP_H;
function applyZoom(){ svg.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`; applyDeepZoomLod(); syncLabelFonts(); }
function chartSize(){
  if(!chart) return {w:800, h:560};
  const r=chart.getBoundingClientRect();
  return {w:Math.max(320, r.width||800), h:Math.max(240, r.height||560)};
}
function minFitScale(){
  const {w,h}=chartSize();
  return Math.min(w/WORLD_W, h/WORLD_H)*0.96;
}
function minZoomScale(){
  // Allow zooming out well past "fit whole map" for more range
  return Math.max(0.06, minFitScale()*0.28);
}
function maxZoomScale(){ return deepZoom ? 9 : 5; }
function fitWholeMap(){
  const {w,h}=chartSize();
  scale=Math.max(minZoomScale(), Math.min(maxZoomScale(), minFitScale()));
  tx=(w-WORLD_W*scale)/2;
  ty=(h-WORLD_H*scale)/2;
  applyZoom();
}
function zoomToward(cx,cy,factor){
  const s1=Math.min(maxZoomScale(), Math.max(minZoomScale(), scale*factor));
  const k=s1/scale;
  tx=cx-(cx-tx)*k;
  ty=cy-(cy-ty)*k;
  scale=s1;
  applyZoom();
}
function defaultMarinaZoom(){
  // Start fit-to-page, then zoom in so docks are readable; ⛶ still fits the whole map
  fitWholeMap();
  const {w,h}=chartSize();
  zoomToward(w/2, h/2, 1.9);
}
svg.addEventListener("click",e=>{
  if(dockDrag&&dockDrag.moved)return;
  if(photoMoveMode||dockAlignMode){ e.preventDefault(); e.stopPropagation(); return; }
  if(editing){
    const sEl=e.target.closest("[data-id]");
    const dEl=e.target.closest("[data-dock]");
    const mEl=e.target.closest("[data-mark]");
    // Desktop Shift-click multi-select (phones use Multi-select + pointerup instead)
    if(e.shiftKey){
      if(dEl){
        const id=dEl.getAttribute("data-dock");
        toggleMultiKey("dock:"+id);
        selectedDock=id; selectedMark=null; selected=null;
        showTab("layout"); renderDockEditor();
        return;
      }
      if(mEl){
        const id=mEl.getAttribute("data-mark");
        toggleMultiKey("mark:"+id);
        selectedMark=id; selectedDock=null; selected=null;
        showTab("layout"); renderDockEditor();
        return;
      }
      return;
    }
    if(multiPick){
      // Handled on pointerup for touch — ignore click to avoid double-toggle
      return;
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
function markHitBox(m){
  if(!m) return null;
  if(m.kind==="text"){
    const fs=m.size||13;
    const w=Math.max(28,(m.text||"").length*fs*0.62);
    return {x:m.x-4,y:m.y-fs,w:w,h:fs+8};
  }
  if(m.kind==="p"){
    const rx=m.w?m.w/2:70, ry=m.h?m.h/2:26;
    return {x:m.x-rx,y:m.y-ry,w:rx*2,h:ry*2};
  }
  if(m.w!=null && m.h!=null) return {x:m.x,y:m.y,w:m.w,h:m.h};
  return {x:m.x-12,y:m.y-12,w:24,h:24};
}
function dist2ToRect(px,py,r){
  const cx=Math.max(r.x, Math.min(px, r.x+r.w));
  const cy=Math.max(r.y, Math.min(py, r.y+r.h));
  const dx=px-cx, dy=py-cy;
  return dx*dx+dy*dy;
}
function hitEditTarget(e){
  // Prefer real DOM hits (including stacked SVG under the finger)
  let sEl=null, dEl=null, mEl=null;
  const pickFrom = (node)=>{
    if(!node || !node.closest) return;
    if(!sEl){ const s=node.closest("[data-id]"); if(s && chart.contains(s)) sEl=s; }
    if(!dEl){ const d=node.closest("[data-dock]"); if(d && chart.contains(d)) dEl=d; }
    if(!mEl){ const m=node.closest("[data-mark]"); if(m && chart.contains(m)) mEl=m; }
  };
  pickFrom(e.target);
  if(!sEl && !dEl && !mEl && document.elementsFromPoint){
    const stack=document.elementsFromPoint(e.clientX, e.clientY)||[];
    for(const node of stack){
      const before=!(sEl||dEl||mEl);
      pickFrom(node);
      // Stop at the topmost interactive chart piece
      if(before && (sEl||dEl||mEl)) break;
    }
  }
  // Geometric slop: fat-finger near a dock/slip/mark should still grab it (not pan)
  if(!sEl && !dEl && !mEl){
    const p=svgPoint(e);
    const slop=Math.max(14, 22/Math.max(0.001, scale)); // ~22 screen px in world units
    const slop2=slop*slop;
    let best=null, bestD=slop2;
    slips.forEach(s=>{
      const r={x:s.x,y:s.y,w:s.w,h:s.h};
      const d=dist2ToRect(p.x,p.y,r);
      if(d<=bestD){ bestD=d; best={type:"slip",s}; }
    });
    docks.forEach(d=>{
      const g=walkGeomFromDock(d);
      const r={x:g.x,y:g.y,w:g.w,h:g.h};
      const dist=dist2ToRect(p.x,p.y,r);
      if(dist<=bestD){ bestD=dist; best={type:"dock",d}; }
      // also dock label area near name
      const lr={x:d.x-24,y:d.y-28,w:48,h:22};
      const distL=dist2ToRect(p.x,p.y,lr);
      if(distL<=bestD){ bestD=distL; best={type:"dock",d}; }
    });
    marks.forEach(m=>{
      const box=markHitBox(m); if(!box) return;
      const dist=dist2ToRect(p.x,p.y,box);
      if(dist<=bestD){ bestD=dist; best={type:"mark",m}; }
    });
    if(best){
      if(best.type==="slip"){
        // Synthesize via querying current DOM if present
        sEl=(layerStack && layerStack.querySelector('[data-id="'+best.s.id+'"]')) || (layerSlips && layerSlips.querySelector('[data-id="'+best.s.id+'"]'));
        if(!sEl){
          // fake minimal attrs object
          sEl={ getAttribute:(k)=>k==="data-id"?best.s.id:(k==="data-dock"?best.s.dockId:null), closest:(sel)=>sel.includes("data-id")?sEl:(sel.includes("data-dock")?sEl:null) };
        }
        dEl=sEl;
      }else if(best.type==="dock"){
        dEl=(layerStack && layerStack.querySelector('[data-dock="'+best.d.id+'"]')) || (layerDocks && layerDocks.querySelector('[data-dock="'+best.d.id+'"]'));
        if(!dEl) dEl={ getAttribute:(k)=>k==="data-dock"?best.d.id:null, closest:()=>dEl };
      }else if(best.type==="mark"){
        mEl=(layerStack && layerStack.querySelector('[data-mark="'+best.m.id+'"]')) || (
          (layerMarks && layerMarks.querySelector('[data-mark="'+best.m.id+'"]')) ||
          (layerWalkMarks && layerWalkMarks.querySelector('[data-mark="'+best.m.id+'"]')) ||
          (layerLabels && layerLabels.querySelector('[data-mark="'+best.m.id+'"]')) ||
          (layerSite && layerSite.querySelector('[data-mark="'+best.m.id+'"]'))
        );
        if(!mEl) mEl={ getAttribute:(k)=>k==="data-mark"?best.m.id:null, closest:()=>mEl };
      }
    }
  }
  // If we hit a slip that carries data-dock, treat as dock hit too for locked docks
  if(sEl && !dEl){
    const did=sEl.getAttribute("data-dock");
    if(did) dEl=sEl;
  }
  return {sEl,dEl,mEl};
}
chart.addEventListener("pointerdown",e=>{
  if(dockAlignMode){
    try{ e.preventDefault(); }catch(_){}
    if(e.target.closest && e.target.closest(".zoom,.pan,#dock-align-chip,#photo-move-chip,button,input,label")) return;
    dockAlignPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const p=svgPoint(e);
    const keys = multi.size ? [...multi] : allLayoutKeys();
    const box = keysBBox(keys) || {x:0,y:0,w:MAP_W,h:MAP_H};
    const cx = box.x + box.w/2, cy = box.y + box.h/2;
    if(dockAlignPointers.size>=2){
      const dist=dockAlignPinchDist();
      dockAlignDrag={kind:"pinch",keys,startDist:dist,startScale:1,cx,cy,sx:0,sy:0,moved:false};
    }else{
      dockAlignDrag={kind:"pan",keys,px:p.x,py:p.y,sx:0,sy:0,cx,cy,scaleF:1,moved:false,startBox:box};
    }
    try{ chart.setPointerCapture(e.pointerId); }catch(_){}
    return;
  }
  if(photoMoveMode){
    try{ e.preventDefault(); }catch(_){}
    if(e.target.closest && e.target.closest(".zoom,.pan,#photo-move-chip,#dock-align-chip,button,input,label")) return;
    photoPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const p=svgPoint(e);
    if(photoPointers.size>=2){
      const dist=photoPinchDist();
      photoDrag={kind:"pinch",startDist:dist,startScaleX:clampPhotoScale(photoAlign.scaleX!=null?photoAlign.scaleX:photoAlign.scale),startScaleY:clampPhotoScale(photoAlign.scaleY!=null?photoAlign.scaleY:photoAlign.scale),moved:false};
    }else{
      photoDrag={kind:"pan",ox:Number(photoAlign.x)||0,oy:Number(photoAlign.y)||0,px:p.x,py:p.y,moved:false};
    }
    try{ chart.setPointerCapture(e.pointerId); }catch(_){}
    return;
  }
  if(editing){
    // Prevent browser pan/zoom gestures from stealing the interaction
    try{ e.preventDefault(); }catch(_){}
    const {sEl,dEl,mEl}=hitEditTarget(e);
    const p=svgPoint(e);
    // Multi-select: tap toggles; if several already selected, dragging a selected piece moves the set
    if(multiPick){
      let tapKey=null, tapDock=null, tapMark=null;
      if(mEl && mEl.getAttribute("data-mark")){ tapMark=mEl.getAttribute("data-mark"); tapKey="mark:"+tapMark; }
      else if(dEl && dEl.getAttribute("data-dock")){ tapDock=dEl.getAttribute("data-dock"); tapKey="dock:"+tapDock; }
      else if(sEl){
        const did=sEl.getAttribute("data-dock");
        if(did){ tapDock=did; tapKey="dock:"+did; }
      }
      if(tapKey){
        if(multi.size>1 && multi.has(tapKey)){
          const _keys=[...multi]; dockDrag={kind:"chart",keys:_keys,px:p.x,py:p.y,sx:0,sy:0,moved:false,fromMultiPick:true,tapKey,tapDock,tapMark,startBox:keysBBox(_keys)};
          chart.style.cursor="grabbing";
          chart.setPointerCapture(e.pointerId);
          return;
        }
        dockDrag={kind:"pick",tapKey,tapDock,tapMark,px:p.x,py:p.y,moved:false};
        chart.setPointerCapture(e.pointerId);
        return;
      }
      pan={x:e.clientX-tx,y:e.clientY-ty}; chart.setPointerCapture(e.pointerId); return;
    }
    // Grouped / multi-selected / select-all: drag on a hit object moves the set; empty water pans
    if(moveWholeChart || multi.size>1){
      if(!(sEl||dEl||mEl)){
        pan={x:e.clientX-tx,y:e.clientY-ty}; chart.setPointerCapture(e.pointerId); return;
      }
      const keys = multi.size ? [...multi] : allLayoutKeys();
      dockDrag={kind:"chart",keys,px:p.x,py:p.y,sx:0,sy:0,moved:false,startBox:keysBBox(keys)};
      chart.style.cursor="grabbing";
      chart.setPointerCapture(e.pointerId);
      return;
    }
    if(sEl){
      const dock=docks.find(x=>x.id===sEl.getAttribute("data-dock"));
      const slip=slips.find(x=>x.id===sEl.getAttribute("data-id"));
      const bundle=dock ? keysForDrag("dock", dock.id) : null;
      if(bundle){
        dockDrag={kind:"chart",keys:bundle,px:p.x,py:p.y,sx:0,sy:0,moved:false,startBox:keysBBox(bundle)};
        chart.setPointerCapture(e.pointerId);
        return;
      }
      if(dock && slip && !isLocked(dock)){
        dockDrag={kind:"slip",dockId:dock.id,id:slip.id,x:slip.x,y:slip.y,px:p.x,py:p.y,moved:false,startBox:slipBBoxFrom(dock,slip.id,slip)};
        selectEditSlip(slip.id);
        chart.setPointerCapture(e.pointerId);
        return;
      }
    }
    if(dEl){
      const d=docks.find(x=>x.id===dEl.getAttribute("data-dock"));
      if(d){
        const bundle=keysForDrag("dock", d.id);
        if(bundle){ dockDrag={kind:"chart",keys:bundle,px:p.x,py:p.y,sx:0,sy:0,moved:false,startBox:keysBBox(bundle)}; chart.setPointerCapture(e.pointerId); return; }
        dockDrag={kind:"dock",id:d.id,x:d.x,y:d.y,px:p.x,py:p.y,moved:false,startBox:dockBBox(d)};selectDock(d.id);chart.setPointerCapture(e.pointerId);return;
      }
    }
    if(mEl){
      const m=marks.find(x=>x.id===mEl.getAttribute("data-mark"));
      if(m){
        const bundle=keysForDrag("mark", m.id);
        if(bundle){ dockDrag={kind:"chart",keys:bundle,px:p.x,py:p.y,sx:0,sy:0,moved:false,startBox:keysBBox(bundle)}; chart.setPointerCapture(e.pointerId); return; }
        dockDrag={kind:"mark",id:m.id,x:m.x,y:m.y,px:p.x,py:p.y,moved:false,startBox:markBBox(m)};selectMark(m.id);chart.setPointerCapture(e.pointerId);return;
      }
    }
    // Empty water / background only → pan the map
    pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);return;
  }
  if(e.target.closest("[data-id]")) return;
  pan={x:e.clientX-tx,y:e.clientY-ty};chart.setPointerCapture(e.pointerId);
});
chart.addEventListener("pointermove",e=>{
  if(dockAlignMode && dockAlignDrag){
    try{ e.preventDefault(); }catch(_){}
    if(dockAlignPointers.has(e.pointerId)) dockAlignPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(dockAlignDrag.kind==="pinch" || dockAlignPointers.size>=2){
      if(dockAlignDrag.kind!=="pinch"){
        const dist=dockAlignPinchDist();
        dockAlignDrag={kind:"pinch",keys:dockAlignDrag.keys,startDist:dist,startScale:1,cx:dockAlignDrag.cx,cy:dockAlignDrag.cy,sx:dockAlignDrag.sx||0,sy:dockAlignDrag.sy||0,moved:false};
      }
      const dist=dockAlignPinchDist();
      if(dist && dockAlignDrag.startDist){
        const ratio=dist/dockAlignDrag.startDist;
        if(Math.abs(ratio-1)>0.02) dockAlignDrag.moved=true;
        dockAlignDrag.scaleF=Math.max(0.35, Math.min(2.8, ratio));
        nudgeLayers(dockAlignDrag.sx||0, dockAlignDrag.sy||0, dockAlignDrag.scaleF, dockAlignDrag.cx, dockAlignDrag.cy);
      }
      return;
    }
    const p=svgPoint(e);
    const dx=p.x-dockAlignDrag.px, dy=p.y-dockAlignDrag.py;
    if(Math.abs(dx)+Math.abs(dy)>4) dockAlignDrag.moved=true;
    const c=clampDeltaForBox(dockAlignDrag.startBox||keysBBox(dockAlignDrag.keys), Math.round(dx), Math.round(dy));
    dockAlignDrag.sx=c.dx; dockAlignDrag.sy=c.dy;
    nudgeLayers(dockAlignDrag.sx, dockAlignDrag.sy, 1, dockAlignDrag.cx, dockAlignDrag.cy);
    return;
  }
  if(photoMoveMode && photoDrag){
    try{ e.preventDefault(); }catch(_){}
    if(photoPointers.has(e.pointerId)) photoPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(photoDrag.kind==="pinch" || photoPointers.size>=2){
      if(photoDrag.kind!=="pinch"){
        const dist=photoPinchDist();
        photoDrag={kind:"pinch",startDist:dist,startScaleX:clampPhotoScale(photoAlign.scaleX!=null?photoAlign.scaleX:photoAlign.scale),startScaleY:clampPhotoScale(photoAlign.scaleY!=null?photoAlign.scaleY:photoAlign.scale),moved:false};
      }
      const dist=photoPinchDist();
      if(dist && photoDrag.startDist){
        const ratio=dist/photoDrag.startDist;
        if(Math.abs(ratio-1)>0.02) photoDrag.moved=true;
        photoAlign.scaleX=clampPhotoScale(photoDrag.startScaleX*ratio);
        photoAlign.scaleY=clampPhotoScale(photoDrag.startScaleY*ratio);
        syncPhotoAlignScaleAvg();
        savePhotoAlign(); applyPhotoAlign();
      }
      return;
    }
    const p=svgPoint(e);
    const dx=p.x-photoDrag.px, dy=p.y-photoDrag.py;
    if(Math.abs(dx)+Math.abs(dy)>4) photoDrag.moved=true;
    photoAlign.x=photoDrag.ox+dx;
    photoAlign.y=photoDrag.oy+dy;
    savePhotoAlign(); applyPhotoAlign();
    return;
  }
  if(dockDrag){
    try{ e.preventDefault(); }catch(_){}
    const p=svgPoint(e); const dx=p.x-dockDrag.px, dy=p.y-dockDrag.py;
    if(Math.abs(dx)+Math.abs(dy)>6) dockDrag.moved=true; // slightly looser for fat fingers
    if(dockDrag.kind==="pick"){
      // Finger slid while multi-picking — treat as pan instead of a toggle
      if(dockDrag.moved){
        if(!pan) pan={x:e.clientX-tx, y:e.clientY-ty};
        tx=e.clientX-pan.x; ty=e.clientY-pan.y; applyZoom();
      }
      return;
    }
    if(dockDrag.kind==="chart"){
      const rawX=Math.round(dx), rawY=Math.round(dy);
      const c=clampDeltaForBox(dockDrag.startBox||keysBBox(dockDrag.keys), rawX, rawY);
      dockDrag.sx=c.dx; dockDrag.sy=c.dy;
      // Live nudge via SVG transform (no full redraw -- keeps it smooth)
      nudgeLayers(dockDrag.sx, dockDrag.sy);
      return;
    }
    if(dockDrag.kind==="slip"){
      const d=docks.find(x=>x.id===dockDrag.dockId);
      if(d){
        const c=clampDeltaForBox(dockDrag.startBox||{x:dockDrag.x,y:dockDrag.y,w:10,h:10}, Math.round(dx), Math.round(dy));
        setPlaced(d,dockDrag.id,{x:Math.round(dockDrag.x+c.dx),y:Math.round(dockDrag.y+c.dy)}); redraw();
      }
    }else if(dockDrag.kind==="dock"){
      const d=docks.find(x=>x.id===dockDrag.id);
      if(d){
        const c=clampDeltaForBox(dockDrag.startBox||dockBBox(d), Math.round(dx), Math.round(dy));
        const nx=Math.round(dockDrag.x+c.dx), ny=Math.round(dockDrag.y+c.dy);
        const mdx=nx-d.x, mdy=ny-d.y;
        const g=findGroupFor("dock", d.id);
        if(g){ moveGroupMembers(g, mdx, mdy); }
        else { if(isLocked(d)) moveDockSlips(d,mdx,mdy); d.x=nx; d.y=ny; }
        redraw();
      }
    }else{
      const m=marks.find(x=>x.id===dockDrag.id);
      if(m){
        const c=clampDeltaForBox(dockDrag.startBox||markBBox(m), Math.round(dx), Math.round(dy));
        const nx=Math.round(dockDrag.x+c.dx), ny=Math.round(dockDrag.y+c.dy);
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
  try{ e.preventDefault(); }catch(_){}
  tx=e.clientX-pan.x; ty=e.clientY-pan.y; applyZoom();
});
chart.addEventListener("pointerup",e=>{
  if(dockAlignMode){
    dockAlignPointers.delete(e.pointerId);
    if(dockAlignDrag){
      clearLayerNudge();
      if(dockAlignDrag.moved){
        const keys=dockAlignDrag.keys||allLayoutKeys();
        const sf=dockAlignDrag.scaleF!=null?dockAlignDrag.scaleF:1;
        if(Math.abs(sf-1)>1e-6){
          scaleMembersByKeys(keys, sf, dockAlignDrag.cx, dockAlignDrag.cy);
        }
        if(dockAlignDrag.sx || dockAlignDrag.sy){
          // If we also scaled, translation was applied in pre-scale space via SVG;
          // for pan-only, sx/sy are world deltas. When pinch+pan mixed we only pinch for now.
          if(Math.abs(sf-1)<=1e-6) moveMembersByKeys(keys, dockAlignDrag.sx, dockAlignDrag.sy);
        }
        sanitizeLayout();
        saveLayout();
        redraw();
        renderDockEditor();
      }
    }
    if(dockAlignPointers.size===0) dockAlignDrag=null;
    else dockAlignDrag=null;
    return;
  }
  if(photoMoveMode){
    photoPointers.delete(e.pointerId);
    if(photoDrag && photoDrag.moved) saveLayout(false);
    if(photoPointers.size===0) photoDrag=null;
    else if(photoPointers.size===1){
      // Fall back to pan with remaining finger
      const rem=[...photoPointers.keys()][0];
      // keep last align; next move will restart pan on next pointerdown typically
      photoDrag=null;
    }
    return;
  }
  if(dockDrag){
    if(dockDrag.kind==="pick"){
      if(!dockDrag.moved && dockDrag.tapKey){
        toggleMultiKey(dockDrag.tapKey);
        if(dockDrag.tapDock){ selectedDock=dockDrag.tapDock; selectedMark=null; selected=null; }
        if(dockDrag.tapMark){ selectedMark=dockDrag.tapMark; selectedDock=null; selected=null; }
        showTab("layout"); renderDockEditor();
      }
    }else if(dockDrag.kind==="chart"){
      clearLayerNudge();
      if(dockDrag.fromMultiPick && !dockDrag.moved && dockDrag.tapKey){
        // Tap (not drag) while a multi-selection exists — toggle that piece
        toggleMultiKey(dockDrag.tapKey);
        if(dockDrag.tapDock){ selectedDock=dockDrag.tapDock; selectedMark=null; selected=null; }
        if(dockDrag.tapMark){ selectedMark=dockDrag.tapMark; selectedDock=null; selected=null; }
        showTab("layout"); renderDockEditor();
      }else if(dockDrag.moved && (dockDrag.sx || dockDrag.sy)){
        // sx/sy already map-clamped during drag; soft-cap absurd pointer glitches
        const sx=Math.max(-MAP_W, Math.min(MAP_W, dockDrag.sx));
        const sy=Math.max(-MAP_H, Math.min(MAP_H, dockDrag.sy));
        moveMembersByKeys(dockDrag.keys, sx, sy);
        sanitizeLayout();
        saveLayout();
        redraw();
      }
      chart.style.cursor="";
      renderDockEditor();
    }else if(dockDrag.moved){
      sanitizeLayout();
      saveLayout(); renderDockEditor();
    }
  }
  dockDrag=null; pan=null;
});
chart.addEventListener("wheel",e=>{
  e.preventDefault();
  const r=chart.getBoundingClientRect();
  const cx=e.clientX-r.left, cy=e.clientY-r.top;
  zoomToward(cx, cy, e.deltaY<0?1.08:0.92);
},{passive:false});
function panBy(dx,dy){
  tx+=dx; ty+=dy; applyZoom();
}
function panStep(){
  // ~1/5 of the visible chart per tap — readable nudge when zoomed in
  const {w,h}=chartSize();
  return {x:Math.max(60, Math.round(w*0.22)), y:Math.max(60, Math.round(h*0.22))};
}
function bindHold(btn, fn){
  if(!btn) return;
  let timer=null, repeating=false;
  const start=e=>{
    e.preventDefault();
    fn();
    repeating=false;
    timer=setTimeout(function tick(){
      repeating=true; fn();
      timer=setTimeout(tick, 70);
    }, 320);
  };
  const stop=()=>{ if(timer){ clearTimeout(timer); timer=null; } };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", stop);
  btn.addEventListener("pointerleave", stop);
  btn.addEventListener("pointercancel", stop);
  // Prevent the synthetic click from double-firing after a hold
  btn.addEventListener("click", e=>{ e.preventDefault(); });
}
document.getElementById("z-in").onclick=()=>{ const {w,h}=chartSize(); zoomToward(w/2,h/2,1.15); };
document.getElementById("z-out").onclick=()=>{ const {w,h}=chartSize(); zoomToward(w/2,h/2,1/1.15); };
document.getElementById("z-full").onclick=()=>fitWholeMap();
bindHold(document.getElementById("pan-left"), ()=>{ const s=panStep(); panBy(s.x,0); });
bindHold(document.getElementById("pan-right"), ()=>{ const s=panStep(); panBy(-s.x,0); });
bindHold(document.getElementById("pan-up"), ()=>{ const s=panStep(); panBy(0,s.y); });
bindHold(document.getElementById("pan-down"), ()=>{ const s=panStep(); panBy(0,-s.y); });
const panCenter=document.getElementById("pan-center");
if(panCenter) panCenter.onclick=()=>fitWholeMap();
// Initial view: zoomed in for reading slips; use ⛶ to see whole map on one page
requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(deepZoom) fitWholeMap(); else defaultMarinaZoom(); }));
window.addEventListener("resize",()=>{
  // Keep current relative zoom band sane after rotate/resize
  if(scale<minZoomScale()) { scale=minZoomScale(); applyZoom(); }
});
document.querySelectorAll("#pane-slip .st button").forEach(b=>b.onclick=()=>{if(!selected)return;data[selected]=data[selected]||{};data[selected].status=b.dataset.st;save(data);select(selected);});
["boat","notes"].forEach(fid=>document.getElementById(fid).addEventListener("input",()=>{if(!selected)return;data[selected]=data[selected]||{status:"vacant"};data[selected][fid]=document.getElementById(fid).value;save(data);renderDir();}));
document.getElementById("q").addEventListener("input",function(){const hit=slips.find(s=>String(s.num)===this.value.trim());if(hit)select(hit.id);});
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function renderDir(){const list=document.getElementById("dir-list");const rows=Object.keys(data).map(id=>({id,...data[id]})).filter(r=>r.boat||r.notes||(r.status&&r.status!=="vacant"));if(!rows.length){list.innerHTML="<p>No marked slips yet.</p>";return;}list.innerHTML=rows.map(r=>`<div class="dir-item" data-jump="${r.id}"><b>${/^\d+$/.test(r.id)?"Slip "+r.id:r.id}</b> · ${r.status||""}<br>${r.boat||""} ${r.notes||""}</div>`).join("");list.querySelectorAll("[data-jump]").forEach(n=>n.onclick=()=>select(n.dataset.jump));}
renderDir();

function setEditPanelOpen(on){
  document.body.classList.toggle("panel-open", !!on);
  const b=document.getElementById("btn-panel-toggle");
  if(b){ b.classList.toggle("on", !!on); b.textContent = on ? "Map" : "Tools"; }
  const fab=document.getElementById("edit-fab-tools");
  if(fab){ fab.classList.toggle("on", !!on); fab.textContent = on ? "Map" : "Tools"; }
  requestAnimationFrame(()=>{ try{ syncEditChromeHeight(); }catch(e){} });
}
function openEditPanel(){ if(window.matchMedia && window.matchMedia("(max-width:860px)").matches) setEditPanelOpen(true); }
function isMobileEdit(){ return !!(window.matchMedia && window.matchMedia("(max-width:860px)").matches); }
function closeEditPanel(){ setEditPanelOpen(false); }
document.getElementById("edit-toggle").onclick=()=>{
  editing=!editing;
  document.body.classList.toggle("editing",editing);
  chart.classList.toggle("editing",editing);
  document.getElementById("edit-toggle").classList.toggle("on",editing);
  document.getElementById("edit-toggle").textContent=editing?"Done editing":"Edit docks";
  const em=document.getElementById("edit-toggle-mobile");
  if(em){ em.classList.toggle("on",editing); em.textContent="Done"; }
  if(!editing){ multiPick=false; closeEditPanel(); document.documentElement.style.removeProperty("--edit-chrome-h"); if(dockAlignMode) setDockAlignMode(false); if(photoMoveMode) setPhotoMoveMode(false); }
  document.getElementById("hint").textContent=editing
    ? (window.matchMedia("(max-width:860px)").matches
        ? "Tools = panel · drag docks · empty water pans · Done exits"
        : (multiPick?"Multi-select on · tap docks/labels":(moveWholeChart||multi.size>1?"Drag anywhere to move the whole chart · Ungroup to edit pieces":"Drag docks/labels · use Dock panel on the right · empty water pans")))
    : "Click a numbered slip · drag to pan";
  if(editing){
    showTab("layout");
    if(isMobileEdit()) closeEditPanel(); /* mobile: map full-screen until Tools */
    /* desktop: leave side panel visible — do not force sheet behavior */
  }
  updateSelHint(); updateSelChip(); syncMapBoundVisual(); redraw(); applyDeepZoomLod();
  // reflow zoom after layout change + pin chrome height so map never covers Tools/Done
  requestAnimationFrame(()=>{ try{ syncEditChromeHeight(); applyZoom(); }catch(e){} });
};

function syncEditChromeHeight(){
  const chrome=document.getElementById("edit-chrome");
  if(!chrome || !document.body.classList.contains("editing")) return;
  const h=Math.ceil(chrome.getBoundingClientRect().height);
  if(h>0) document.documentElement.style.setProperty("--edit-chrome-h", h+"px");
}
function wireMobileEditChrome(){
  const map={
    "btn-undo-m":"btn-undo",
    "btn-redo-m":"btn-redo",
    "btn-save-m":"btn-save",
    "edit-toggle-mobile":"edit-toggle"
  };
  Object.keys(map).forEach(id=>{
    const src=document.getElementById(id);
    const dst=document.getElementById(map[id]);
    if(src && dst) src.onclick=()=> dst.click();
  });
  window.addEventListener("resize", ()=>{ if(document.body.classList.contains("editing")) syncEditChromeHeight(); });
}
wireMobileEditChrome();

const _btnPanel=document.getElementById("btn-panel-toggle");
if(_btnPanel) _btnPanel.onclick=()=> setEditPanelOpen(!document.body.classList.contains("panel-open"));
const _btnSheetClose=document.getElementById("btn-sheet-close");
if(_btnSheetClose) _btnSheetClose.onclick=()=> closeEditPanel();
const _sheetHandle=document.getElementById("sheet-handle");
if(_sheetHandle) _sheetHandle.addEventListener("click", e=>{
  if(e.target.closest("button")) return;
  setEditPanelOpen(!document.body.classList.contains("panel-open"));
});
(function wireEditFabs(){
  const fabTools=document.getElementById("edit-fab-tools");
  const fabDone=document.getElementById("edit-fab-done");
  const peek=document.getElementById("edit-tools-peek");
  if(fabTools) fabTools.onclick=()=> setEditPanelOpen(!document.body.classList.contains("panel-open"));
  if(fabDone) fabDone.onclick=()=>{ const t=document.getElementById("edit-toggle"); if(t) t.click(); };
  if(peek) peek.onclick=()=> setEditPanelOpen(true);
})();

function setPhotoMoveMode(on){
  photoMoveMode=!!on;
  if(photoMoveMode && dockAlignMode) setDockAlignMode(false);
  if(!photoMoveMode){
    photoDrag=null;
    photoPointers.clear();
  }
  document.body.classList.toggle("photo-moving", photoMoveMode);
  const btn=document.getElementById("btn-photo-move");
  if(btn){
    btn.classList.toggle("on", photoMoveMode);
    btn.textContent=photoMoveMode?"Done moving photo":"Move photo";
  }
  const chip=document.getElementById("photo-move-chip");
  if(chip) chip.hidden=!photoMoveMode;
  const hint=document.getElementById("hint");
  if(hint){
    if(photoMoveMode) hint.textContent="Moving photo — drag to pan, Stretch width/height or pinch · docks locked";
    else if(dockAlignMode) hint.textContent="Aligning docks — drag to pan, pinch or −/+ to scale · photo locked";
    else if(editing) hint.textContent="Edit docks · drag pieces · empty water pans";
  }
  chart.style.cursor=photoMoveMode?"move":(dockAlignMode?"grab":"");
}
function setDockAlignMode(on){
  dockAlignMode=!!on;
  if(dockAlignMode){
    if(photoMoveMode) setPhotoMoveMode(false);
    if(!editing){
      const t=document.getElementById("edit-toggle");
      if(t) t.click();
    }
    // Treat whole layout as one group under the photo
    selectAllLayout();
    clearLayerNudge();
    dockAlignDrag=null;
    dockAlignPointers.clear();
  }else{
    clearLayerNudge();
    dockAlignDrag=null;
    dockAlignPointers.clear();
  }
  document.body.classList.toggle("dock-aligning", dockAlignMode);
  const btn=document.getElementById("btn-dock-align");
  if(btn){
    btn.classList.toggle("on", dockAlignMode);
    btn.textContent=dockAlignMode?"Done aligning":"Align docks to photo";
  }
  const chip=document.getElementById("dock-align-chip");
  if(chip) chip.hidden=!dockAlignMode;
  const hint=document.getElementById("hint");
  if(hint){
    if(dockAlignMode) hint.textContent="Aligning docks — drag to pan, pinch or −/+ to scale · photo locked · labels stay readable";
    else if(photoMoveMode) hint.textContent="Moving photo — drag to pan, Stretch width/height or pinch · docks locked";
    else if(editing) hint.textContent="Edit docks · drag pieces · empty water pans";
  }
  chart.style.cursor=dockAlignMode?"grab":(photoMoveMode?"move":"");
}
function photoPinchDist(){
  const pts=[...photoPointers.values()];
  if(pts.length<2) return null;
  const dx=pts[0].x-pts[1].x, dy=pts[0].y-pts[1].y;
  return Math.hypot(dx,dy)||null;
}
function dockAlignPinchDist(){
  const pts=[...dockAlignPointers.values()];
  if(pts.length<2) return null;
  const dx=pts[0].x-pts[1].x, dy=pts[0].y-pts[1].y;
  return Math.hypot(dx,dy)||null;
}
function bumpPhotoScale(delta){
  photoAlign.scaleX=clampPhotoScale((Number(photoAlign.scaleX)||1)+delta);
  photoAlign.scaleY=clampPhotoScale((Number(photoAlign.scaleY)||1)+delta);
  syncPhotoAlignScaleAvg();
  savePhotoAlign(); applyPhotoAlign();
}
function bumpDockLayoutScale(delta){
  const keys = multi.size ? [...multi] : allLayoutKeys();
  const box = keysBBox(keys) || {x:0,y:0,w:MAP_W,h:MAP_H};
  const cx = box.x + box.w/2, cy = box.y + box.h/2;
  const f = Math.max(0.35, Math.min(2.8, 1 + delta));
  scaleMembersByKeys(keys, f, cx, cy);
  sanitizeLayout();
  saveLayout();
  redraw();
  renderDockEditor();
}
function setLabelSizeKey(key){
  if(LABEL_PX[key]==null) return;
  labelSizeKey=key;
  saveLabelSize();
  syncLabelSizeUI();
  syncLabelFonts();
  // Full redraw keeps mark hit boxes in sync with new text metrics
  try{ redraw(); }catch(e){}
}
function syncLabelSizeUI(){
  const sel=document.getElementById("label-size");
  if(sel) sel.value=labelSizeKey;
  document.querySelectorAll("[data-label-size]").forEach(b=>{
    b.classList.toggle("on", b.getAttribute("data-label-size")===labelSizeKey);
  });
}

(function wirePhotoOpacity(){
  const sl=document.getElementById("photo-op");
  if(sl){
    sl.value=String(Math.round(photoMax*100));
    photoMax=Math.max(0, Math.min(1, (+sl.value)/100));
    const sync=()=>{ photoMax=Math.max(0, Math.min(1, (+sl.value)/100)); saveLayout(false); applyDeepZoomLod(); };
    sl.oninput=sync; sl.onchange=sync;
  }
  const dz=document.getElementById("btn-deep-zoom");
  if(dz) dz.onclick=()=>{
    deepZoom=!deepZoom;
    document.getElementById("hint").textContent = deepZoom
      ? "Deep zoom · zoom out = photo, zoom in = walkways → slips → labels"
      : "Classic view · Photo slider sets fixed overlay opacity";
    if(deepZoom) fitWholeMap(); else defaultMarinaZoom();
    redraw(); applyDeepZoomLod();
  };
  const stepEl=()=>Math.max(1, +(document.getElementById("photo-step")||{}).value || 20);
  const nudge=(dx,dy)=>{ photoAlign.x=(Number(photoAlign.x)||0)+dx; photoAlign.y=(Number(photoAlign.y)||0)+dy; savePhotoAlign(); saveLayout(false); applyPhotoAlign(); };
  const bind= (id, fn)=>{ const b=document.getElementById(id); if(b) b.onclick=fn; };
  bind("photo-nudge-l", ()=>nudge(-stepEl(),0));
  bind("photo-nudge-r", ()=>nudge(stepEl(),0));
  bind("photo-nudge-u", ()=>nudge(0,-stepEl()));
  bind("photo-nudge-d", ()=>nudge(0,stepEl()));
  const bindStretch=(id, axis)=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.oninput=()=>{
      const v=clampPhotoScale((+el.value)/100);
      if(axis==="x") photoAlign.scaleX=v; else photoAlign.scaleY=v;
      syncPhotoAlignScaleAvg();
      savePhotoAlign(); applyPhotoAlign();
    };
    el.onchange=()=>saveLayout(false);
  };
  bindStretch("photo-scale-x", "x");
  bindStretch("photo-scale-y", "y");
  const rr=document.getElementById("photo-rot");
  if(rr){ rr.oninput=()=>{ photoAlign.rot=+rr.value||0; savePhotoAlign(); applyPhotoAlign(); }; rr.onchange=()=>saveLayout(false); }
  bind("photo-reset-align", ()=>{
    photoAlign={x:0,y:0,scale:1,scaleX:1,scaleY:1,rot:0};
    savePhotoAlign(); saveLayout(false); applyPhotoAlign();
  });
  const moveBtn=document.getElementById("btn-photo-move");
  if(moveBtn) moveBtn.onclick=()=> setPhotoMoveMode(!photoMoveMode);
  const doneChip=document.getElementById("photo-move-done");
  if(doneChip) doneChip.onclick=()=> setPhotoMoveMode(false);
  const alignBtn=document.getElementById("btn-dock-align");
  if(alignBtn) alignBtn.onclick=()=> setDockAlignMode(!dockAlignMode);
  const alignDone=document.getElementById("dock-align-done");
  if(alignDone) alignDone.onclick=()=> setDockAlignMode(false);
  const dockScaleMinus=document.getElementById("dock-align-scale-minus");
  if(dockScaleMinus) dockScaleMinus.onclick=()=> bumpDockLayoutScale(-0.05);
  const dockScalePlus=document.getElementById("dock-align-scale-plus");
  if(dockScalePlus) dockScalePlus.onclick=()=> bumpDockLayoutScale(0.05);
  document.querySelectorAll("[data-align-opacity]").forEach(b=>{
    b.onclick=()=>{
      const pct=+b.getAttribute("data-align-opacity");
      if(!(pct>=0)) return;
      photoMax=Math.max(0, Math.min(1, pct/100));
      const sl=document.getElementById("photo-op");
      if(sl) sl.value=String(Math.round(photoMax*100));
      saveLayout(false); applyDeepZoomLod();
    };
  });
  const labelSel=document.getElementById("label-size");
  if(labelSel){
    labelSel.value=labelSizeKey;
    labelSel.onchange=()=> setLabelSizeKey(labelSel.value);
  }
  document.querySelectorAll("[data-label-size]").forEach(b=>{
    b.onclick=()=> setLabelSizeKey(b.getAttribute("data-label-size"));
  });
  syncLabelSizeUI();
  applyDeepZoomLod();
  syncLabelFonts();
})();
document.getElementById("export-layout").onclick=async()=>{ensureStackOrder();const json=JSON.stringify({docks,marks,groups,layers,stackOrder},null,2);try{await navigator.clipboard.writeText(json);alert("Layout JSON copied.");}catch{prompt("Copy this layout JSON:",json);}};
document.getElementById("download-layout").onclick=()=>{ensureStackOrder();const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({docks,marks,groups,layers,stackOrder},null,2)],{type:"application/json"}));a.download="laceys-layout.json";a.click();};
document.getElementById("import-layout").onclick=()=>document.getElementById("import-file").click();
document.getElementById("import-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);if(!raw.docks)throw 0;if(Array.isArray(raw.layers)) layers=raw.layers; localStorage.setItem(LAYOUT_STORE,JSON.stringify({docks:raw.docks,marks:raw.marks||[],groups:raw.groups||[],layers,stackOrder:Array.isArray(raw.stackOrder)?raw.stackOrder:[]})); saveLayersStore(); ({docks,marks,groups,layers,stackOrder}=loadLayout()); if(!Array.isArray(layers)) layers=[]; if(!Array.isArray(stackOrder)) stackOrder=[]; ensureStackOrder(); saveLayout(false);redraw();renderDockEditor();renderLayersEditor();renderChips();}catch{alert("Could not read that JSON file.");}};r.readAsText(f);};

function resetCruiserDock(){
  // MUST: deep-clone baked DEFAULT cruiser (locked, a/b sides, extras 801, placed 801-807)
  const src = (DEFAULT_DOCKS||[]).find(d=>d.id==='cruiser');
  if(!src){ alert('Built-in Cruiser dock not found.'); return; }
  const fresh = clone(src); // clone(DEFAULT_DOCKS.find(d=>d.id==='cruiser'))
  const i = docks.findIndex(d=>d.id==='cruiser');
  if(i>=0) docks[i]=fresh; else docks.push(fresh);
  selectedDock='cruiser'; selected=null; selectedMark=null;
  saveLayout(); // pushes undo
  redraw(); renderDockEditor(); updateSelHint();
  const h=document.getElementById('hint');
  if(h) h.textContent='Cruiser dock restored from original chart';
}
function restoreOriginalChart(){
  if(!confirm('Restore original chart layout? This resets all docks, marks, and groups to the baked defaults. Slip occupancy is kept. Photo align resets too.')) return;
  docks=clone(DEFAULT_DOCKS);
  marks=clone(DEFAULT_MARKS);
  groups=[];
  stackOrder=[]; ensureStackOrder();
  photoAlign={x:0,y:0,scale:1,scaleX:1,scaleY:1,rot:0};
  try{ savePhotoAlign(); }catch(e){}
  multi.clear(); moveWholeChart=false; selected=null; selectedDock=null; selectedMark=null;
  if(typeof dockAlignMode!=='undefined' && dockAlignMode) setDockAlignMode(false);
  if(typeof photoMoveMode!=='undefined' && photoMoveMode) setPhotoMoveMode(false);
  saveLayout(); // undoable restore
  applyPhotoAlign();
  redraw(); renderDockEditor(); updateUndoBtns(); updateSelHint(); ensureMapVisible();
  const h=document.getElementById('hint');
  if(h) h.textContent='Original chart restored · slip occupancy kept';
}
function showLayoutTipBannerOnce(){
  try{
    if(localStorage.getItem('laceys-share-v67-layout-tip')) return;
  }catch(e){}
  const ban=document.getElementById('layout-tip-banner');
  if(!ban) return;
  ban.style.display='block';
  const d=document.getElementById('layout-tip-dismiss');
  if(d) d.onclick=()=>{
    ban.style.display='none';
    try{ localStorage.setItem('laceys-share-v67-layout-tip','1'); }catch(e){}
  };
}

document.getElementById("reset-layout").onclick=()=>{if(!confirm("Reset to the saved main Lacey's layout? This clears hand edits on this device."))return;localStorage.removeItem(LAYOUT_STORE);docks=clone(DEFAULT_DOCKS);marks=clone(DEFAULT_MARKS);groups=[];stackOrder=[];ensureStackOrder();multi.clear();moveWholeChart=false;hist.length=0;future.length=0;lastSnap=snap();saveLayout(false);redraw();renderDockEditor();updateUndoBtns();updateSelHint();};

(function wireRestoreButtons(){
  const rc=document.getElementById('btn-reset-cruiser');
  if(rc) rc.onclick=()=>resetCruiserDock();
  const ro=document.getElementById('btn-restore-original');
  if(ro) ro.onclick=()=>restoreOriginalChart();
  // Align docks stays available but hidden in UI — do not auto-enter
  showLayoutTipBannerOnce();
})();
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
    dock={id:uid("dock"),name:"Extra slips",type:"col",x:80,y:80,kind:"std",size:"Custom",locked:true,gap:22,w:40,h:16,a:[],b:[],extras:[]};
    docks.push(dock);
  }
  dock.extras=dock.extras||[];
  dock.extras.push({num:String(num).trim(),dx:0,dy:-28,w:dock.sw||dock.w||40,h:dock.sh||dock.h||16});
  dock.locked=false; selectedDock=dock.id; selected=String(num).trim(); selectedMark=null;
  saveLayout(); showTab("layout"); redraw(); renderDockEditor();
};


function flashSave(msg){
  const hint=document.getElementById("hint");
  const prev=hint?hint.textContent:"";
  if(hint){ hint.textContent=msg; hint.style.color="#b8f5c5"; }
  const b=document.getElementById("btn-save");
  if(b){ b.textContent="Saved"; b.classList.add("on"); }
  setTimeout(()=>{
    if(hint){ hint.textContent=prev; hint.style.color=""; }
    if(b){ b.textContent="Save"; b.classList.remove("on"); }
  }, 1800);
}


function ensureMapVisible(){
  try{
    buildSlips();
    const slipCount=(typeof slips!=="undefined" && Array.isArray(slips)) ? slips.length : 0;
    const dockCount=Array.isArray(docks) ? docks.length : 0;
    if(dockCount < 3 || slipCount < 20){
      docks=clone(DEFAULT_DOCKS);
      marks=clone(DEFAULT_MARKS);
      groups=[];
      try{
        localStorage.removeItem(LAYOUT_STORE);
        /* share isolated — never touch main laceys-layout keys */
      }catch(e){}
      saveLayout(false);
      buildSlips();
    }
    redraw();
  }catch(err){
    const b=document.getElementById("error-banner");
    if(b){ b.style.display="block"; b.textContent="Chart failed to draw: "+(err && err.message ? err.message : String(err)); }
    console.error(err);
  }
}

function printChart(){
  // Snapshot current SVG (includes layer colors / hidden slips as drawn)
  const clone=svg.cloneNode(true);
  clone.removeAttribute("style");
  clone.setAttribute("width","2400");
  clone.setAttribute("height","1700");
  clone.setAttribute("viewBox","0 0 2400 1700");
  // Light paper-friendly water background (first big rect)
  const bgRect=clone.querySelector("rect");
  if(bgRect) bgRect.setAttribute("fill","#e8f2f1");
  // Soften white-ish label fills for print contrast if needed
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Lacey's Narrows · printable chart</title>
<style>
  @page{ size:landscape; margin:0.35in; }
  html,body{ margin:0; padding:0; background:#fff; }
  .wrap{ padding:8px 12px; }
  h1{ font:650 18px -apple-system,system-ui,sans-serif; margin:0 0 4px; color:#123; }
  .sub{ font:12px -apple-system,system-ui,sans-serif; color:#456; margin:0 0 8px; }
  svg{ width:100%; height:auto; max-height:7.2in; display:block; }
  .actions{ margin-top:10px; }
  @media print{ .actions{ display:none; } }
</style></head><body>
<div class="wrap">
  <h1>Lacey's Narrows</h1>
  <p class="sub">Greers Ferry Lake · Higden, AR · North up · Printed from live slip chart</p>
  ${clone.outerHTML}
  <div class="actions"><button onclick="window.print()">Print</button>
  <button onclick="window.close()">Close</button></div>
</div>
<script>window.onload=function(){ setTimeout(function(){ window.print(); }, 250); };<\/script>
</body></html>`;
  const w=window.open("", "_blank");
  if(!w){ alert("Allow pop-ups to open the printable chart."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function saveNow(){
  // Pull any OOB geometry back inside the chart before persist (undoable)
  const preClamp=snap();
  if(clampLayoutIntoMap()){
    hist.push(preClamp);
    if(hist.length>80) hist.shift();
    future.length=0;
    lastSnap=snap();
    updateUndoBtns();
    redraw();
    try{ renderDockEditor(); }catch(e){}
  }
  // Persist exact current docks/marks/groups/layers (deletes included)
  const s=snap();
  localStorage.setItem(LAYOUT_STORE, s);
  saveLayersStore();
  lastSnap=s;
  flashSave("Saved on this device · Download JSON for a backup copy");
}

function saveLayersStore(){
  try{ localStorage.setItem("laceys-share-layers-v1", JSON.stringify(layers)); }catch(e){}
}
function renderLayersEditor(){
  const box=document.getElementById("layers-editor");
  if(!box) return;
  if(!layers.length){
    box.innerHTML="<p class=\"hint\">No custom layers yet. Add one to color-code slips (Power, Lease, Season, …).</p>";
    return;
  }
  box.innerHTML=layers.map(layer=>{
    const on=activeLayerId===layer.id;
    const opts=(layer.options||[]).map((o,idx)=>`
      <div class="opt" data-layer="${layer.id}" data-opt="${o.id}">
        <button type="button" class="btn eye ${o.hidden?"off":""}" data-hide-opt title="${o.hidden?"Show":"Hide"}">${o.hidden?"🙈":"👁"}</button>
        <input type="color" value="${o.color||"#e4dcc8"}" data-k="color"/>
        <input type="text" value="${(o.name||"").replace(/"/g,"&quot;")}" data-k="name" placeholder="Option name" style="flex:1;min-width:100px"/>
        <button type="button" class="btn" data-del-opt>Remove</button>
      </div>`).join("");
    const layerHidden=!!layer.hidden;
    return `<div class="layer-card" data-layer-card="${layer.id}" style="${layerHidden?"opacity:.55":""}">
      <h3>
        <button type="button" class="btn eye ${layerHidden?"off":""}" data-hide-layer title="${layerHidden?"Show layer":"Hide layer"}">${layerHidden?"🙈 Hide":"👁 Show"}</button>
        <input type="text" value="${(layer.name||"").replace(/"/g,"&quot;")}" data-layer-name style="flex:1;min-width:120px"/>
        <button type="button" class="btn ${on?"on":""}" data-use-layer>${on?"Coloring on":"Use to color"}</button>
        <button type="button" class="btn" data-del-layer>Delete layer</button>
      </h3>
      <div class="opt" data-unassigned="${layer.id}">
        <span style="flex:1">Unassigned slips</span>
        <button type="button" class="btn eye ${layer.hideUnassigned?"off":""}" data-hide-unassigned>${layer.hideUnassigned?"🙈 Hidden":"👁 Visible"}</button>
      </div>
      ${opts}
      <div class="st"><button type="button" class="btn" data-add-opt>+ Option</button></div>
    </div>`;
  }).join("");

  box.querySelectorAll("[data-layer-name]").forEach(inp=>{
    inp.onchange=()=>{
      const id=inp.closest("[data-layer-card]").dataset.layerCard;
      const layer=layers.find(l=>l.id===id); if(!layer) return;
      layer.name=inp.value.trim()||"Layer";
      saveLayersStore(); saveLayout(false); renderChips();
    };
  });
  box.querySelectorAll("[data-use-layer]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.closest("[data-layer-card]").dataset.layerCard;
      const layer=layers.find(l=>l.id===id);
      if(layer && layer.hidden){ layer.hidden=false; }
      activeLayerId = activeLayerId===id ? null : id;
      layerOptFilter="All";
      saveLayersStore(); saveLayout(false);
      renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll("[data-hide-layer]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.closest("[data-layer-card]").dataset.layerCard;
      const layer=layers.find(l=>l.id===id); if(!layer) return;
      layer.hidden=!layer.hidden;
      activeLayerId=id;
      layerOptFilter="All";
      saveLayersStore(); saveLayout(false); renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll("[data-hide-unassigned]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.closest("[data-unassigned]").dataset.unassigned;
      const layer=layers.find(l=>l.id===id); if(!layer) return;
      layer.hideUnassigned=!layer.hideUnassigned;
      if(activeLayerId!==id){ activeLayerId=id; layerOptFilter="All"; }
      saveLayersStore(); saveLayout(false); renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll("[data-hide-opt]").forEach(btn=>{
    btn.onclick=()=>{
      const row=btn.closest(".opt");
      const layer=layers.find(l=>l.id===row.dataset.layer); if(!layer) return;
      const opt=(layer.options||[]).find(o=>o.id===row.dataset.opt); if(!opt) return;
      opt.hidden=!opt.hidden;
      if(activeLayerId!==layer.id){ activeLayerId=layer.id; layerOptFilter="All"; }
      saveLayersStore(); saveLayout(false); renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll("[data-del-layer]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.closest("[data-layer-card]").dataset.layerCard;
      if(!confirm("Delete this layer? Slip assignments for it will be ignored.")) return;
      layers=layers.filter(l=>l.id!==id);
      if(activeLayerId===id) activeLayerId=null;
      saveLayersStore(); saveLayout(); renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll("[data-add-opt]").forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.closest("[data-layer-card]").dataset.layerCard;
      const layer=layers.find(l=>l.id===id); if(!layer) return;
      layer.options=layer.options||[];
      const colors=["#5aa0c4","#6dad6a","#e3c35c","#e39a7a","#c9896a","#9b7bb8","#d2b48c"];
      layer.options.push({id:uid("opt"), name:"Option "+(layer.options.length+1), color:colors[layer.options.length%colors.length]});
      saveLayersStore(); saveLayout(); renderLayersEditor(); renderChips(); redraw();
    };
  });
  box.querySelectorAll(".opt").forEach(row=>{
    const layerId=row.dataset.layer, optId=row.dataset.opt;
    row.querySelectorAll("[data-k]").forEach(inp=>{
      const apply=()=>{
        const layer=layers.find(l=>l.id===layerId); if(!layer) return;
        const opt=(layer.options||[]).find(o=>o.id===optId); if(!opt) return;
        if(inp.dataset.k==="color") opt.color=inp.value;
        else opt.name=inp.value.trim()||"Option";
        saveLayersStore(); saveLayout(false); renderChips(); redraw();
      };
      inp.onchange=apply; inp.oninput=()=>{ if(inp.dataset.k==="color"){ apply(); } };
    });
    const del=row.querySelector("[data-del-opt]");
    if(del) del.onclick=()=>{
      const layer=layers.find(l=>l.id===layerId); if(!layer) return;
      layer.options=(layer.options||[]).filter(o=>o.id!==optId);
      saveLayersStore(); saveLayout(); renderLayersEditor(); renderChips(); redraw();
    };
  });
}
document.getElementById("add-layer").onclick=()=>{
  const name=prompt("Layer name?","Power");
  if(name==null) return;
  layers.push({
    id:uid("layer"),
    name:String(name).trim()||"Layer",
    options:[
      {id:uid("opt"), name:"Option A", color:"#5aa0c4"},
      {id:uid("opt"), name:"Option B", color:"#6dad6a"},
      {id:uid("opt"), name:"Option C", color:"#e3c35c"}
    ]
  });
  saveLayersStore(); saveLayout(); showTab("layers"); renderLayersEditor(); renderChips(); redraw();
};
document.getElementById("btn-undo").onclick=()=>undo();
document.getElementById("btn-redo").onclick=()=>redo();
document.getElementById("btn-save").onclick=()=>saveNow();
document.getElementById("btn-print").onclick=()=>printChart();
const _fixBlank=document.getElementById("btn-reset-blank");
if(_fixBlank) _fixBlank.onclick=()=>{
  if(!confirm("Restore the built-in Lacey\'s dock layout? (clears blank/corrupt offline save on this file)")) return;
  try{ localStorage.removeItem(LAYOUT_STORE); /* share isolated */ }catch(e){}
  docks=clone(DEFAULT_DOCKS); marks=clone(DEFAULT_MARKS); groups=[]; stackOrder=[]; ensureStackOrder(); layers=(typeof DEFAULT_LAYERS!=="undefined"&&Array.isArray(DEFAULT_LAYERS))?clone(DEFAULT_LAYERS):[];
  multi.clear(); moveWholeChart=false; hist.length=0; future.length=0; lastSnap=snap(); saveLayout(false); ensureMapVisible(); renderDockEditor(); renderChips(); updateUndoBtns(); alert("Layout restored.");
};
const _btnSaveLayout=document.getElementById("btn-save-layout"); if(_btnSaveLayout) _btnSaveLayout.onclick=()=>saveNow();
function wireMultiButtons(){
  const toggle=()=>setMultiPick(!multiPick);
  const b1=document.getElementById("btn-multi"); if(b1) b1.onclick=toggle;
  const b2=document.getElementById("btn-multi-hdr"); if(b2) b2.onclick=toggle;
  const clear=document.getElementById("btn-multi-clear");
  if(clear) clear.onclick=()=>{ multi.clear(); moveWholeChart=false; updateSelHint(); redraw(); };
  const done=document.getElementById("btn-multi-done");
  if(done) done.onclick=()=>{
    setMultiPick(false);
    if(multi.size>1){
      moveWholeChart=true;
      document.getElementById("hint").textContent="Drag on the map to move the "+multi.size+" selected pieces";
    }
  };
  const move=document.getElementById("btn-multi-move");
  if(move) move.onclick=()=>{
    if(multi.size<1){ alert("Pick at least one item in the list first."); return; }
    setMultiPick(false);
    moveWholeChart = multi.size>0;
    document.getElementById("hint").textContent = multi.size>1
      ? ("Drag on the map to move all "+multi.size+" selected pieces")
      : "Drag on the map to move the selected piece";
    updateSelHint();
  };
}
wireMultiButtons();
document.getElementById("btn-select-all").onclick=()=>{ if(!editing){ document.getElementById("edit-toggle").click(); } multiPick=false; selectAllLayout(); };
document.getElementById("btn-group-all").onclick=()=>{ if(!editing){ document.getElementById("edit-toggle").click(); } multiPick=false; groupAllLayout(); };
document.getElementById("btn-group").onclick=()=>{
  if(multi.size<2){ alert("Turn on Multi-select and tap at least two docks or labels first (or Shift-click on desktop)."); return; }
  const name=prompt("Group name?","Group "+(groups.length+1));
  if(name==null) return;
  groups.push({id:uid("grp"),name:String(name).trim()||"Group",members:[...multi]});
  // Keep selection + exit multi-pick so the group is immediately draggable on the map
  multiPick=false;
  moveWholeChart=true;
  updateSelHint();
  const h=document.getElementById("hint");
  if(h) h.textContent="Grouped · drag on the map to move all "+multi.size+" pieces";
  saveLayout(); redraw(); updateSelChip();
};
document.getElementById("btn-ungroup").onclick=()=>{
  const keys=[...multi];
  if(selectedDock) keys.push("dock:"+selectedDock);
  if(selectedMark) keys.push("mark:"+selectedMark);
  if(!keys.length){ alert("Select a grouped item (or multi-select) first."); return; }
  groups=groups.filter(g=>!(g.members||[]).some(k=>keys.includes(k)));
  multi.clear(); moveWholeChart=false; updateSelHint(); saveLayout(); redraw();
};
document.getElementById("btn-dup").onclick=()=>{
  if(selectedDock){
    const d=docks.find(x=>x.id===selectedDock); if(!d) return;
    const copy=clone(d); copy.id=uid("dock"); copy.name=(d.name||"Dock")+" copy"; copy.x+=40; copy.y+=40;
    docks.push(copy); ensureStackOrder(); stackMove(["dock:"+copy.id],"front"); selectedDock=copy.id; saveLayout(); redraw(); renderDockEditor(); return;
  }
  if(selectedMark){
    const m=marks.find(x=>x.id===selectedMark); if(!m) return;
    const copy=clone(m); copy.id=uid(m.kind||"mark"); copy.x+=30; copy.y+=30;
    marks.push(copy); ensureStackOrder(); stackMove(["mark:"+copy.id],"front"); selectedMark=copy.id; saveLayout(); redraw(); renderDockEditor(); return;
  }
  alert("Select a dock or label first.");
};
updateUndoBtns(); updateSelHint();
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="z"){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="y"){ e.preventDefault(); redo(); }
});

const _strip=document.getElementById("strip-cover"); if(_strip) _strip.addEventListener("click",()=>{
  if(!confirm("Remove oversized / covering pieces (keeps your dock layout)?")) return;
  if(sanitizeLayout()){ saveLayout(); redraw(); renderDockEditor(); alert("Cleared oversized covers."); }
  else alert("Nothing oversized found. Select the orange piece and Delete it.");
});
