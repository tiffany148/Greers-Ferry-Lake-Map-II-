const STORE="laceys-slips-v5";
const LAYOUT_STORE="laceys-layout-edit-v1";
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
const DEFAULT_DOCKS=[
  {id:"7",name:"7",type:"ns",x:1020,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80],b:[96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81]},
  {id:"8",name:"8",type:"ns",x:1170,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112],b:[128,127,126,125,124,123,122,121,120,119,118,117,116,115,114,113]},
  {id:"9",name:"9",type:"ns",x:1320,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144],b:[160,159,158,157,156,155,154,153,152,151,150,149,148,147,146,145]},
  {id:"10",name:"10",type:"ns",x:1470,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176],b:[192,191,190,189,188,187,186,185,184,183,182,181,180,179,178,177]},
  {id:"11",name:"11",type:"ns",x:1620,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208],b:[224,223,222,221,220,219,218,217,216,215,214,213,212,211,210,209]},
  {id:"12",name:"12",type:"ns",x:1770,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308],b:[324,323,322,321,320,319,318,317,316,315,314,313,312,311,310,309]},
  {id:"13",name:"13",type:"ns",x:1920,y:110,kind:"std",size:"10x30 Standard",locked:true,sw:40,sh:15,gap:3,a:[325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340],b:[356,355,354,353,352,351,350,349,348,347,346,345,344,343,342,341]},
  {id:"4",name:"4",type:"ns",x:40,y:290,kind:"pref",size:"10x30 Preferred",locked:true,sw:40,sh:15,gap:3,a:[32,31,30,29,28,27,26,25,24,23,22,21,20,19],b:[1,2,3,4,5,6,7,8,9,10,11,12,13,14]},
  {id:"3",name:"3",type:"ns",x:150,y:290,kind:"pref",size:"10x30 Preferred",locked:true,sw:40,sh:15,gap:3,a:[64,63,62,61,60,59,58,57,56,55,54,53,52,51,50,49],b:[33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]},
  {id:"2",name:"2",type:"ns",x:260,y:290,kind:"wide",size:"16x42",locked:true,sw:40,sh:15,gap:3,a:[272,271,270,269,268,267,266,265,264,263,262,261],b:[249,250,251,252,253,254,255,256,257,258,259,260]},
  {id:"1",name:"1",type:"ns",x:370,y:290,kind:"wide",size:"16x42",locked:true,sw:40,sh:15,gap:3,a:[248,247,246,245,244,243,242,241,240,239,238,237],b:[225,226,227,228,229,230,231,232,233,234,235,236]},
  {id:"5",name:"5",type:"ew",x:40,y:600,kind:"pref",size:"10x30 Preferred",locked:true,sw:16,sh:36,gap:3,a:[283,284,285,286,287,288,289,290,291,292],b:[273,274,275,276,277,278,279,280,281,282]},
  {id:"sales",name:"Sales",type:"col",x:520,y:352,kind:"sales",size:"10x34",locked:true,gap:18,w:40,h:16,a:[851,852,853,854,855,856,841,842,843,844,845,846,847,848,849,850]},
  {id:"fuel",name:"Fuel",type:"col",x:584,y:352,kind:"fuel",size:"Fuel stall",locked:true,gap:20,w:40,h:18,a:["F1","F2","F3","F4"]},
  {id:"courtesy",name:"Courtesy",type:"col",x:584,y:440,kind:"courtesy",size:"Courtesy",locked:true,gap:20,w:40,h:18,a:["C1","C2","C3","C4","C5","C6"]},
  {id:"cruiser",name:"Cruiser",type:"ew",x:700,y:980,kind:"cruiser",size:"Cruiser",locked:false,sw:16,sh:36,gap:3,a:[801,802,803,804,805,806,807],b:[800,808,809,810,811,812,813,814,815,816]},
  {id:"houseboats",name:"Houseboats",type:"ns",x:1100,y:720,kind:"hb",size:"12x38",locked:false,sw:40,sh:15,gap:3,a:[817,818,819,820,821,822,823,824,825,826,827,828,829,830],b:[831,832,833,834,835,836,837,838],extras:[{num:839,dx:0,dy:248,w:22,h:96,kind:"fuel",size:"20x87",filter:"Fuel"},{num:840,dx:26,dy:248,w:22,h:96,kind:"fuel",size:"20x87",filter:"Fuel"}]}
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
