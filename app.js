const {useState, useMemo, useEffect, useRef} = React;

const WW={
  AX:{walk:12,housing:14,medical:42,mobility:10,community:12},
  AY:{walk:38,housing:22,medical:10,mobility:20,community:10},
  AZ:{walk:22,housing:10,medical:46,mobility:6,community:16},
  BX:{walk:14,housing:24,medical:30,mobility:8,community:24},
  BY:{walk:30,housing:24,medical:12,mobility:18,community:16},
  BZ:{walk:22,housing:22,medical:36,mobility:6,community:14}
};
const AXES=[
  {k:"walk",lb:"🐾 散歩・安全",co:"#2e7d32"},
  {k:"housing",lb:"🏠 住環境",co:"#1565c0"},
  {k:"medical",lb:"🎪🏥 サポート・医療",co:"#c2185b"},
  {k:"mobility",lb:"🚗 移動",co:"#e65100"},
  {k:"community",lb:"👥 地域",co:"#6a1a9a"}
];
const LS={
  A:{lb:"単身・共働き",em:"🏙️",co:"#1565c0",de:"仕事帰りの利便・医療アクセスを重視"},
  B:{lb:"子育てファミリー",em:"👨‍👩‍👧",co:"#6a1a9a",de:"子育て環境・公園・コミュニティを重視"}
};
const DG={
  X:{lb:"小型犬",em:"🐩",co:"#c2185b",de:"室内派・カフェ/ドッグラン/ペットホテルが鍵"},
  Y:{lb:"中・大型犬",em:"🐕",co:"#2e7d32",de:"広い散歩スペース・モビリティが重要"},
  Z:{lb:"シニア・持病",em:"🏥",co:"#e65100",de:"動物病院・夜間救急へのアクセスが最重要"}
};
const ML={
  AX:"☕🏨🐾 カフェ・ペットホテル・室内ドッグラン・動物病院",
  AY:"🏥 動物病院・夜間救急",
  AZ:"🏥 動物病院・夜間救急（最重要）",
  BX:"☕🏥 カフェ・サポート・動物病院",
  BY:"🏥 動物病院・SC・スーパー",
  BZ:"🏥 動物病院・夜間救急・買い物"
};
const FC={1:"rgba(255,255,100,0.35)",2:"rgba(255,180,50,0.4)",3:"rgba(240,100,20,0.45)",4:"rgba(200,30,20,0.5)",5:"rgba(140,0,0,0.55)"};
const FL={1:"低 0-0.5m",2:"中 0.5-3m",3:"高 3-5m",4:"危 5m+",5:"最危 10m+"};
const DATA_URL="https://raw.githubusercontent.com/14142001sagau-ai/inumap-Tokyo/main/data/stations.json";

function calc(areas,w){
  const tot=Object.values(w).reduce((a,b)=>a+b,0);
  const rs=areas.map(d=>AXES.reduce((s,a)=>s+(d[a.k]||0)*w[a.k],0)/tot);
  const avg=rs.reduce((a,b)=>a+b,0)/rs.length;
  const sd=Math.sqrt(rs.reduce((a,b)=>a+(b-avg)**2,0)/rs.length)||1;
  return areas.map((d,i)=>({...d,dev:Math.round((rs[i]-avg)/sd*10+50)}));
}
function gs(v){
  if(v>=65)return{c:"#1b5e20",b:"S"};
  if(v>=58)return{c:"#2e7d32",b:"A"};
  if(v>=50)return{c:"#e65100",b:"B"};
  if(v>=42)return{c:"#bf360c",b:"C"};
  return{c:"#b71c1c",b:"D"};
}
function getNote(station, key){
  // stations.jsonにnotesフィールドがあればそれを使用
  if(station.notes && station.notes[key]) return station.notes[key];
  // なければ自動生成
  const dog=key[1];
  const nm={walk:"散歩・公園",housing:"住環境・家賃",medical:"医療・サポート",mobility:"移動",community:"地域"};
  const top=Object.entries({
    walk:station.walk,housing:station.housing,
    medical:station.medical,mobility:station.mobility,community:station.community
  }).sort((x,y)=>y[1]-x[1]);
  const lines=[
    `${nm[top[0][0]]}が区内上位（${top[0][1]}点）`,
    `${nm[top[1][0]]}も強み（${top[1][1]}点）`,
    `${nm[top[top.length-1][0]]}はやや低め（${top[top.length-1][1]}点）`,
  ];
  if(dog==="X") lines.push("小型犬OKの物件・カフェを探せるエリア");
  else if(dog==="Y") lines.push("大型犬の散歩コースへのアクセスを確認して");
  else lines.push("シニア犬のかかりつけ医は早めに確保を");
  return lines;
}

function MapView({scored, selId, onSel, flood}){
  const mapRef=useRef(null);
  const leafRef=useRef(null);
  const markersRef=useRef([]);
  const floodRef=useRef([]);

  useEffect(()=>{
    if(leafRef.current) return;
    leafRef.current=L.map(mapRef.current,{center:[35.685,139.870],zoom:12,zoomControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors',maxZoom:19
    }).addTo(leafRef.current);
  },[]);

  useEffect(()=>{
    if(!leafRef.current) return;
    markersRef.current.forEach(m=>m.remove());
    markersRef.current=[];
    scored.forEach(d=>{
      const s=gs(d.dev);
      const iS=d.id===selId;
      const size=iS?44:32;
      const icon=L.divIcon({
        className:'',
        html:`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${s.c};border:${iS?'3px solid #fff':'2px solid rgba(255,255,255,0.8)'};display:flex;align-items:center;justify-content:center;font-size:${iS?13:10}px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer">${s.b}</div>`,
        iconSize:[size,size],iconAnchor:[size/2,size/2]
      });
      const marker=L.marker([d.lat,d.lng],{icon}).addTo(leafRef.current);
      marker.on('click',()=>onSel(d.id===selId?null:d.id));
      markersRef.current.push(marker);
    });
  },[scored,selId]);

  useEffect(()=>{
    if(!leafRef.current) return;
    floodRef.current.forEach(l=>l.remove());
    floodRef.current=[];
    if(flood){
      scored.forEach(d=>{
        if(!d.fl) return;
        const circle=L.circle([d.lat,d.lng],{
          radius:800,color:'transparent',
          fillColor:FC[d.fl],fillOpacity:0.6
        }).addTo(leafRef.current);
        floodRef.current.push(circle);
      });
    }
  },[flood,scored]);

  return React.createElement('div',{ref:mapRef,style:{width:'100%',height:'100%'}});
}
