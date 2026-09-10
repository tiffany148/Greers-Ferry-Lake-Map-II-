const STORE="laceys-view-slips-v1";
const LAYOUT_STORE="laceys-view-layout-v2";
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
  {
    "id": "7",
    "name": "7",
    "type": "ns",
    "x": 1489,
    "y": 848,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      65,
      66,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78,
      79,
      80
    ],
    "b": [
      96,
      95,
      94,
      93,
      92,
      91,
      90,
      89,
      88,
      87,
      86,
      85,
      84,
      83,
      82,
      81
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "8",
    "name": "8",
    "type": "ns",
    "x": 1489,
    "y": 727,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      97,
      98,
      99,
      100,
      101,
      102,
      103,
      104,
      105,
      106,
      107,
      108,
      109,
      110,
      111,
      112
    ],
    "b": [
      128,
      127,
      126,
      125,
      124,
      123,
      122,
      121,
      120,
      119,
      118,
      117,
      116,
      115,
      114,
      113
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "9",
    "name": "9",
    "type": "ns",
    "x": 1490,
    "y": 607,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      129,
      130,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      139,
      140,
      141,
      142,
      143,
      144
    ],
    "b": [
      160,
      159,
      158,
      157,
      156,
      155,
      154,
      153,
      152,
      151,
      150,
      149,
      148,
      147,
      146,
      145
    ],
    "rot": -90,
    "extras": [],
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "10",
    "name": "10",
    "type": "ns",
    "x": 1489,
    "y": 486,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      161,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      171,
      172,
      173,
      174,
      175,
      176
    ],
    "b": [
      192,
      191,
      190,
      189,
      188,
      187,
      186,
      185,
      184,
      183,
      182,
      181,
      180,
      179,
      178,
      177
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "11",
    "name": "11",
    "type": "ns",
    "x": 1488,
    "y": 364,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      193,
      194,
      195,
      196,
      197,
      198,
      199,
      200,
      201,
      202,
      203,
      204,
      205,
      206,
      207,
      208
    ],
    "b": [
      224,
      223,
      222,
      221,
      220,
      219,
      218,
      217,
      216,
      215,
      214,
      213,
      212,
      211,
      210,
      209
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "12",
    "name": "12",
    "type": "ns",
    "x": 1491,
    "y": 242,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      293,
      294,
      295,
      296,
      297,
      298,
      299,
      300,
      301,
      302,
      303,
      304,
      305,
      306,
      307,
      308
    ],
    "b": [
      324,
      323,
      322,
      321,
      320,
      319,
      318,
      317,
      316,
      315,
      314,
      313,
      312,
      311,
      310,
      309
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "13",
    "name": "13",
    "type": "ns",
    "x": 1490,
    "y": 122,
    "kind": "std",
    "size": "10x30 Standard",
    "locked": true,
    "sw": 50,
    "sh": 40,
    "gap": 3,
    "a": [
      325,
      326,
      327,
      328,
      329,
      330,
      331,
      332,
      333,
      334,
      335,
      336,
      337,
      338,
      339,
      340
    ],
    "b": [
      356,
      355,
      354,
      353,
      352,
      351,
      350,
      349,
      348,
      347,
      346,
      345,
      344,
      343,
      342,
      341
    ],
    "rot": -90,
    "placed": {},
    "fill": "#0efffd"
  },
  {
    "id": "3",
    "name": "3",
    "type": "ns",
    "x": 628,
    "y": 942,
    "kind": "pref",
    "size": "10x30 Preferred",
    "locked": true,
    "sw": 70,
    "sh": 30,
    "gap": 3,
    "a": [
      64,
      63,
      62,
      61,
      60,
      59,
      58,
      57,
      56,
      55,
      54,
      53,
      52,
      51,
      50,
      49
    ],
    "b": [
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48
    ],
    "placed": {},
    "fill": "#00fbaf"
  },
  {
    "id": "2",
    "name": "2",
    "type": "ns",
    "x": 900,
    "y": 960,
    "kind": "wide",
    "size": "16x42",
    "locked": true,
    "sw": 90,
    "sh": 35,
    "gap": 3,
    "a": [
      272,
      271,
      270,
      269,
      268,
      267,
      266,
      265,
      264,
      263,
      262,
      261
    ],
    "b": [
      249,
      250,
      251,
      252,
      253,
      254,
      255,
      256,
      257,
      258,
      259,
      260
    ],
    "placed": {},
    "fill": "#00fbaf"
  },
  {
    "id": "1",
    "name": "1",
    "type": "ns",
    "x": 1206,
    "y": 973,
    "kind": "wide",
    "size": "16x42",
    "locked": true,
    "sw": 90,
    "sh": 40,
    "gap": 3,
    "a": [
      "Blank",
      247,
      246,
      245,
      244,
      243,
      242,
      241,
      240,
      239,
      238,
      237
    ],
    "b": [
      225,
      226,
      227,
      228,
      229,
      230,
      231,
      232,
      233,
      234,
      235,
      236
    ],
    "extras": [],
    "placed": {},
    "rot": 0,
    "fill": "#00fbaf"
  },
  {
    "id": "5",
    "name": "5",
    "type": "ew",
    "x": 30,
    "y": 1330,
    "kind": "pref",
    "size": "10x30 Preferred",
    "locked": true,
    "sw": 30,
    "sh": 70,
    "gap": 3,
    "a": [
      283,
      284,
      285,
      286,
      287,
      288,
      289,
      290,
      291,
      292
    ],
    "b": [
      282,
      281,
      280,
      279,
      278,
      277,
      276,
      275,
      274,
      273
    ],
    "placed": {},
    "rot": -19,
    "fill": "#00fbaf"
  },
  {
    "id": "sales",
    "name": "",
    "type": "col",
    "x": 1443,
    "y": 1054,
    "kind": "sales",
    "size": "10x34",
    "locked": true,
    "gap": 30,
    "w": 70,
    "h": 30,
    "a": [
      851,
      852,
      853,
      854,
      855,
      856,
      841,
      842,
      843,
      844,
      845,
      846,
      847,
      848,
      849,
      850
    ],
    "placed": {},
    "fill": "#07e000"
  },
  {
    "id": "fuel",
    "name": "",
    "type": "ns",
    "x": 1576,
    "y": 926,
    "kind": "fuel",
    "size": "Fuel stall",
    "locked": true,
    "gap": 15,
    "w": 45,
    "h": 30,
    "a": [],
    "placed": {},
    "b": [
      "1/2",
      "3/4",
      "5/6",
      "7/8"
    ],
    "sw": 60,
    "sh": 40
  },
  {
    "id": "courtesy",
    "name": "Courtesy",
    "type": "ns",
    "x": 1594,
    "y": 1170,
    "kind": "courtesy",
    "size": "Courtesy",
    "locked": true,
    "gap": 15,
    "w": 45,
    "h": 23,
    "a": [],
    "placed": {},
    "b": [
      1,
      2,
      3
    ],
    "sw": 50,
    "sh": 30
  },
  {
    "id": "cruiser",
    "name": "Cruiser",
    "type": "ew",
    "x": 1560,
    "y": 1338,
    "kind": "cruiser",
    "size": "Cruiser",
    "locked": false,
    "sw": 35,
    "sh": 90,
    "gap": 2,
    "a": [
      802,
      803,
      804,
      805,
      806,
      807
    ],
    "b": [
      "RB",
      800,
      808,
      809,
      810,
      811,
      812,
      813,
      814,
      815,
      816
    ],
    "extras": [
      {
        "num": "801",
        "dx": 0,
        "dy": -28,
        "w": 30,
        "h": 60
      }
    ],
    "placed": {
      "800": {
        "x": 1597,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "801": {
        "x": 1634,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "802": {
        "x": 1671,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "803": {
        "x": 1708,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "804": {
        "x": 1745,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "805": {
        "x": 1782,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "806": {
        "x": 1819,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "807": {
        "x": 1856,
        "y": 1338,
        "w": 35,
        "h": 90,
        "fill": "#ff7291"
      },
      "808": {
        "x": 1634,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "809": {
        "x": 1671,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "810": {
        "x": 1708,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "811": {
        "x": 1745,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "812": {
        "x": 1782,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "813": {
        "x": 1819,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "814": {
        "x": 1856,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "815": {
        "x": 1893,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "816": {
        "x": 1930,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      },
      "RB": {
        "x": 1560,
        "y": 1444,
        "w": 35,
        "h": 120,
        "fill": "#ff7291"
      }
    },
    "fill": "#ff7291"
  },
  {
    "id": "houseboats",
    "name": "Houseboats",
    "type": "ns",
    "x": 1888,
    "y": 865,
    "kind": "hb",
    "size": "12x38",
    "locked": true,
    "sw": 90,
    "sh": 30,
    "gap": 3,
    "a": [
      817,
      818,
      819,
      820,
      821,
      822,
      823,
      824,
      825,
      826,
      827,
      828,
      829,
      830
    ],
    "b": [
      831,
      832,
      833,
      834,
      835,
      836,
      837,
      838
    ],
    "extras": [
      {
        "num": 839,
        "dx": 0,
        "dy": 248,
        "w": 96,
        "h": 22,
        "kind": "fuel",
        "size": "20x87",
        "filter": "Fuel"
      },
      {
        "num": 840,
        "dx": 26,
        "dy": 248,
        "w": 96,
        "h": 22,
        "kind": "fuel",
        "size": "20x87",
        "filter": "Fuel"
      }
    ],
    "placed": {
      "831": {
        "x": 1994.1999999999998,
        "y": 865,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "832": {
        "x": 1994.1999999999998,
        "y": 898,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "833": {
        "x": 1994.1999999999998,
        "y": 931,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "834": {
        "x": 1994.1999999999998,
        "y": 964,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "835": {
        "x": 1994.1999999999998,
        "y": 997,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "836": {
        "x": 1994.1999999999998,
        "y": 1030,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "837": {
        "x": 1994.1999999999998,
        "y": 1063,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "838": {
        "x": 1994.1999999999998,
        "y": 1096,
        "w": 120,
        "h": 30,
        "fill": "#866eff"
      },
      "839": {
        "x": 1997,
        "y": 1171,
        "w": 60,
        "h": 480,
        "fill": "#e3c35c"
      },
      "840": {
        "x": 2067,
        "y": 1171,
        "w": 60,
        "h": 480,
        "fill": "#e3c35c"
      }
    },
    "fill": "#866eff"
  },
  {
    "id": "dock-ey4v4d",
    "name": "4",
    "type": "ns",
    "x": 399,
    "y": 1030,
    "kind": "std",
    "size": "Custom",
    "locked": true,
    "sw": 70,
    "sh": 30,
    "gap": 3,
    "w": 40,
    "h": 16,
    "a": [
      32,
      31,
      30,
      29,
      28,
      27,
      26,
      25,
      24,
      23,
      22,
      21,
      20,
      19
    ],
    "b": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ],
    "placed": {},
    "fill": "#00fbaf",
    "rot": 0
  },
  {
    "id": "dock-kx4nwg",
    "name": "Wave Runners",
    "type": "ew",
    "x": 1456,
    "y": 877,
    "kind": "std",
    "size": "Custom",
    "locked": true,
    "sw": 25,
    "sh": 30,
    "gap": 5,
    "w": 40,
    "h": 16,
    "a": [
      "WR1",
      "WR2",
      "WR3",
      "WR4",
      "WR5",
      "WR6",
      "WR7",
      "WR8",
      "WR9",
      "WR10"
    ],
    "b": [],
    "placed": {},
    "fill": "#9c31ff"
  }
];
const DEFAULT_MARKS=[
  {
    "id": "shop",
    "kind": "box",
    "x": 828,
    "y": 156,
    "w": 220,
    "h": 80,
    "fill": "#f400a5",
    "t1": "SHOP / Service Dept.",
    "t2": "Office",
    "ink": "#0efffd"
  },
  {
    "id": "restroom",
    "kind": "pill",
    "x": 1197,
    "y": 952,
    "w": 100,
    "h": 60,
    "label": "Restroom",
    "fill": "#ff4efd",
    "ink": "#fff8f6"
  },
  {
    "id": "picnic-store",
    "kind": "pill",
    "x": 1933,
    "y": 1303,
    "w": 50,
    "h": 70,
    "label": "Picnic",
    "fill": "#e7a0b8",
    "ink": "#4a2430"
  },
  {
    "id": "picnic-cru",
    "kind": "pill",
    "x": 1549,
    "y": 1358,
    "w": 80,
    "h": 60,
    "label": "Picnic",
    "fill": "#e7a0b8",
    "ink": "#4a2430"
  },
  {
    "id": "bridge",
    "kind": "bridge",
    "x": 1001,
    "y": 2,
    "w": 1100,
    "h": 22,
    "fill": "#10e100"
  },
  {
    "id": "label-walk",
    "kind": "text",
    "x": 1137,
    "y": 726,
    "text": "Main walkway",
    "size": 11,
    "rot": 28
  },
  {
    "id": "label-emma",
    "kind": "text",
    "x": 1916,
    "y": 1442,
    "text": "Emma's Room",
    "size": 11,
    "rot": -90
  },
  {
    "id": "north",
    "kind": "text",
    "x": 1105.8000000000002,
    "y": 104,
    "text": "NORTH",
    "size": 13
  },
  {
    "id": "channel",
    "kind": "text",
    "x": 2273.8,
    "y": 972,
    "text": "NARROWS CHANNEL",
    "size": 14,
    "rot": 90
  },
  {
    "id": "mainwalk-16bjl6",
    "kind": "bar",
    "x": 1023,
    "y": 669,
    "w": 14,
    "h": 400,
    "title": "Walkway",
    "rot": -62,
    "fill": "#c0c100"
  },
  {
    "id": "box-pgvqry",
    "kind": "box",
    "x": 1412,
    "y": 983,
    "w": 60,
    "h": 40,
    "fill": "#ff9541",
    "t1": "Dock House ",
    "t2": "",
    "ink": "#0000c3",
    "rot": 0
  },
  {
    "id": "label-9haiji",
    "kind": "text",
    "x": 1479,
    "y": 1008,
    "text": "Office 1",
    "size": 13,
    "rot": 0,
    "ink": "#f400a5"
  },
  {
    "id": "label-rlhuce",
    "kind": "text",
    "x": 1480,
    "y": 1034,
    "text": "Office 2",
    "size": 13,
    "rot": 0,
    "ink": "#f400a5"
  },
  {
    "id": "mainwalk-13wys1",
    "kind": "bar",
    "x": 410,
    "y": 812,
    "w": 14,
    "h": 220,
    "title": "Walkway",
    "rot": -6
  },
  {
    "id": "label-waj0ir",
    "kind": "text",
    "x": 1986,
    "y": 1128,
    "text": "Fuel Pump 9",
    "size": 13,
    "rot": 0,
    "ink": "#038800"
  },
  {
    "id": "mainwalk-6u8stj",
    "kind": "bar",
    "x": 1442,
    "y": 0,
    "w": 14,
    "h": 870,
    "title": "Walkway",
    "rot": 0
  },
  {
    "id": "box-5jd39q",
    "kind": "box",
    "x": 1404,
    "y": 894,
    "w": 220,
    "h": 80,
    "fill": "#f400a5",
    "t1": "Marina Store",
    "t2": "",
    "ink": "#6ae9ff",
    "rot": 0
  },
  {
    "id": "mainwalk-la5lig",
    "kind": "bar",
    "x": 1435,
    "y": 408,
    "w": 14,
    "h": 220,
    "title": "Walkway",
    "rot": 90
  }
];
const DEFAULT_LAYERS=[
  {
    "id": "layer-ov5r7o",
    "name": "Available",
    "options": [
      {
        "id": "opt-g3qp21",
        "name": "Vacant",
        "color": "#10e9ff"
      },
      {
        "id": "opt-0yhx94",
        "name": "Occupied",
        "color": "#0bf400"
      }
    ]
  },
  {
    "id": "layer-nskmae",
    "name": "Winterized?",
    "options": [
      {
        "id": "opt-uc3ps3",
        "name": "Winterized",
        "color": "#5aa0c4"
      },
      {
        "id": "opt-vera6l",
        "name": "Not Winterized",
        "color": "#db0000"
      }
    ],
    "hideUnassigned": false
  },
  {
    "id": "layer-ebev5d",
    "name": "Size",
    "options": [
      {
        "id": "opt-knlcjh",
        "name": "10x30 Standard",
        "color": "#ff805c",
        "hidden": false
      },
      {
        "id": "opt-gfievj",
        "name": "10x30 Premium",
        "color": "#086b00"
      },
      {
        "id": "opt-xau23q",
        "name": "10x30 Preferred",
        "color": "#f5f400"
      },
      {
        "id": "opt-pbib7h",
        "name": "10x34 Preferred",
        "color": "#4dfeff"
      },
      {
        "id": "opt-l34i0t",
        "name": "10x42 Preferred",
        "color": "#0000e2"
      },
      {
        "id": "opt-5qe1aa",
        "name": "12x30 Premium",
        "color": "#8d68ff"
      },
      {
        "id": "opt-ilp8a9",
        "name": "12x38 Preferred",
        "color": "#5900fc"
      },
      {
        "id": "opt-d9h0lh",
        "name": "14x42 Preferred",
        "color": "#40ff9c"
      },
      {
        "id": "opt-odysj7",
        "name": "16x42 Preferred",
        "color": "#f69aff"
      },
      {
        "id": "opt-zx49ly",
        "name": "20x87 Houseboat",
        "color": "#ff0f86"
      },
      {
        "id": "opt-epizyh",
        "name": "24x100 Houseboat",
        "color": "#470089"
      }
    ]
  },
  {
    "id": "layer-alhzt0",
    "name": "Empty",
    "options": [
      {
        "id": "opt-d0br1q",
        "name": "Blank",
        "color": "#000000"
      }
    ]
  }
];
const DEFAULT_STACK_ORDER=[
  "dock:dock-kx4nwg",
  "mark:shop",
  "mark:bridge",
  "mark:box-pgvqry",
  "mark:box-5jd39q",
  "mark:mainwalk-16bjl6",
  "mark:mainwalk-13wys1",
  "mark:mainwalk-6u8stj",
  "mark:mainwalk-la5lig",
  "dock:7",
  "dock:8",
  "dock:9",
  "dock:10",
  "dock:11",
  "dock:12",
  "dock:13",
  "dock:3",
  "dock:2",
  "dock:1",
  "dock:5",
  "dock:sales",
  "dock:fuel",
  "dock:courtesy",
  "dock:cruiser",
  "dock:houseboats",
  "dock:dock-ey4v4d",
  "mark:restroom",
  "mark:picnic-store",
  "mark:picnic-cru",
  "mark:label-walk",
  "mark:label-emma",
  "mark:north",
  "mark:channel",
  "mark:label-9haiji",
  "mark:label-rlhuce",
  "mark:label-waj0ir"
];
const DEFAULT_GROUPS=[];
