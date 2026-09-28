const STORE="laceys-sandbox-slips-v1";
const LAYOUT_STORE="laceys-sandbox-layout-v1";
const load=()=>{try{return JSON.parse(localStorage.getItem(STORE)||"{}")}catch{return{}}};
const save=d=>localStorage.setItem(STORE,JSON.stringify(d));
let data=load();
const svg=document.getElementById("svg");
const NS="http://www.w3.org/2000/svg";
const el=(n,a,t)=>{const e=document.createElementNS(NS,n);Object.entries(a||{}).forEach(([k,v])=>e.setAttribute(k,v));if(t!=null)e.textContent=t;return e;};
const COLORS={pref:"#d2b48c",std:"#c9896a",wide:"#5aa0c4",sales:"#e39a7a",cruiser:"#e8c4b4",hb:"#6dad6a",fuel:"#e3c35c",courtesy:"#f3efe6"};
const clone=o=>JSON.parse(JSON.stringify(o));
const parseNums=str=>String(str||"").split(/[\s,]+/).map(s=>s.trim()).filter(Boolean).map(s=>/^\d+$/.test(s)?Number(s):s);
const uid=p=>p+"-"+Math.random().toString(36).slice(2,8);
const isLocked=d=>d.locked!==false;
let DEFAULT_DOCKS=[];
let DEFAULT_MARKS=[];
let DEFAULT_LAYERS=[];
let DEFAULT_STACK_ORDER=[];
let DEFAULT_GROUPS=[];
(function loadPublishedDefaults(){
  try{
    const xhr=new XMLHttpRequest();
    xhr.open("GET","./published-layout.json?v=94",false);
    xhr.send(null);
    if(xhr.status>=200 && xhr.status<300 && xhr.responseText){
      const j=JSON.parse(xhr.responseText);
      DEFAULT_DOCKS=j.docks||[];
      DEFAULT_MARKS=j.marks||[];
      DEFAULT_LAYERS=j.layers||[];
      DEFAULT_GROUPS=j.groups||[];
      DEFAULT_STACK_ORDER=j.stackOrder||[];
    }
  }catch(e){}
})();
