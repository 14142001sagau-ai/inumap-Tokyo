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
function App(){
  const[life,setLife]=useState(null);
  const[dog,setDog]=useState(null);
  const[sel,setSel]=useState(null);
  const[flood,setFlood]=useState(false);
  const[phase,setPhase]=useState("select");
  const[stations,setStations]=useState([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);

  // データベースから駅データを取得
  useEffect(()=>{
    fetch(DATA_URL)
      .then(r=>r.json())
      .then(data=>{setStations(data);setLoading(false);})
      .catch(e=>{setError("データ取得エラー");setLoading(false);});
  },[]);

  const key=life&&dog?life+dog:null;
  const w=key?WW[key]:null;
  const lc=life?LS[life].co:"#2e7d32";
  const dc=dog?DG[dog].co:"#2e7d32";
  const scored=useMemo(()=>w&&stations.length?calc(stations,w):[],[key,stations]);
  const sorted=useMemo(()=>[...scored].sort((a,b)=>b.dev-a.dev),[scored]);
  const selA=sel?scored.find(d=>d.id===sel):null;
  const selR=selA?sorted.findIndex(d=>d.id===sel)+1:null;

  if(loading) return React.createElement("div",{style:{height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f7f0",flexDirection:"column",gap:16}},
    React.createElement("div",{style:{fontSize:32}},"🐕"),
    React.createElement("div",{style:{fontSize:14,color:"#2e7d32",fontWeight:700}},"データを読み込み中...")
  );

  if(error) return React.createElement("div",{style:{height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f7f0",flexDirection:"column",gap:16}},
    React.createElement("div",{style:{fontSize:32}},"⚠️"),
    React.createElement("div",{style:{fontSize:14,color:"#c62828"}},"データの読み込みに失敗しました")
  );

  if(phase==="select") return React.createElement("div",{style:{height:"100dvh",background:"linear-gradient(160deg,#f0f7f0,#e8f0e8)",display:"flex",flexDirection:"column",overflow:"hidden"}},
    React.createElement("div",{style:{padding:"16px 20px 8px",textAlign:"center",flexShrink:0}},
      React.createElement("div",{style:{fontSize:28}},"🐕"),
      React.createElement("div",{style:{fontSize:20,fontWeight:900,color:"#1b5e20"}},"INUMAP TOKYO"),
      React.createElement("div",{style:{fontSize:10,color:"#7a9a7a"}},"東京23区 駅周辺エリア 犬連れスコア — Beta")
    ),
    React.createElement("div",{style:{flex:1,overflow:"auto",padding:"0 14px 12px"}},
      React.createElement("div",{style:{fontSize:11,fontWeight:700,color:"#5a7a5a",marginBottom:7}},"① あなたのライフスタイルは？"),
      React.createElement("div",{style:{display:"flex",gap:10,marginBottom:14}},
        Object.entries(LS).map(([k,v])=>React.createElement("div",{key:k,onClick:()=>setLife(k),style:{flex:1,padding:"14px 10px",borderRadius:16,cursor:"pointer",textAlign:"center",border:"2.5px solid "+(life===k?v.co:"#dde8dd"),background:life===k?v.co+"14":"#fff",transition:"all 0.18s"}},
          React.createElement("div",{style:{fontSize:26,marginBottom:5}},v.em),
          React.createElement("div",{style:{fontSize:11,fontWeight:800,color:life===k?v.co:"#4a6a4a",marginBottom:4}},k+". "+v.lb),
          React.createElement("div",{style:{fontSize:9,color:"#8a9a8a",lineHeight:1.5}},v.de),
          life===k&&React.createElement("div",{style:{marginTop:7,width:22,height:22,borderRadius:"50%",background:v.co,color:"#fff",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",margin:"7px auto 0"}},"✓")
        ))
      ),
      React.createElement("div",{style:{fontSize:11,fontWeight:700,color:"#5a7a5a",marginBottom:7}},"② 愛犬のタイプは？"),
      React.createElement("div",{style:{display:"flex",gap:8,marginBottom:14}},
        Object.entries(DG).map(([k,v])=>React.createElement("div",{key:k,onClick:()=>setDog(k),style:{flex:1,padding:"12px 6px",borderRadius:14,cursor:"pointer",textAlign:"center",border:"2.5px solid "+(dog===k?v.co:"#dde8dd"),background:dog===k?v.co+"14":"#fff",transition:"all 0.18s"}},
          React.createElement("div",{style:{fontSize:22,marginBottom:3}},v.em),
          React.createElement("div",{style:{fontSize:10,fontWeight:800,color:dog===k?v.co:"#4a6a4a",marginBottom:3}},k+". "+v.lb),
          React.createElement("div",{style:{fontSize:8.5,color:"#8a9a8a",lineHeight:1.4}},v.de),
          dog===k&&React.createElement("div",{style:{marginTop:5,width:18,height:18,borderRadius:"50%",background:v.co,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",margin:"5px auto 0"}},"✓")
        ))
      ),
      key&&React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}},
        React.createElement("div",{style:{fontSize:10,fontWeight:700,color:"#2e7d32",marginBottom:8}},"あなたの評価ウェイト"),
        React.createElement("div",{style:{display:"flex",height:22,borderRadius:8,overflow:"hidden",marginBottom:6}},
          AXES.map(ax=>React.createElement("div",{key:ax.k,style:{flex:w[ax.k],background:ax.co,display:"flex",alignItems:"center",justifyContent:"center",minWidth:0}},
            w[ax.k]>=12&&React.createElement("span",{style:{fontSize:7.5,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 2px"}},ax.lb.split(" ")[0]+" "+w[ax.k]+"%")
          ))
        ),
        React.createElement("div",{style:{fontSize:8.5,color:"#7a1a3a",background:"#fce4ec",borderRadius:8,padding:"6px 10px",lineHeight:1.7,border:"1px solid #f8bbd0"}},
          "🎪🏥 サポート・医療の中身: ",React.createElement("span",{style:{color:"#c2185b",fontWeight:700}},ML[key])
        )
      ),
      React.createElement("button",{onClick:()=>key&&setPhase("map"),disabled:!key,style:{width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:key?"pointer":"not-allowed",background:key?"linear-gradient(135deg,"+lc+","+dc+")":"#ccc",color:"#fff",fontSize:14,fontWeight:900,boxShadow:key?"0 6px 18px rgba(0,0,0,0.18)":"none",opacity:key?1:0.5}},
        key?"🗺️ マップを見る →":"①と②を選んでください"
      )
    ),
    React.createElement("div",{style:{padding:"6px",fontSize:7.5,color:"#aabcaa",textAlign:"center"}},"📊 OSM/国土数値情報/e-Stat推定値 ⚠️ データは月次自動更新")
  );

  return React.createElement("div",{style:{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}},
    React.createElement("div",{style:{background:"#fff",borderBottom:"1px solid #dde4dd",padding:"5px 10px",flexShrink:0}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:4}},
        React.createElement("button",{onClick:()=>{setPhase("select");setSel(null);},style:{background:"none",border:"1px solid #dde4dd",borderRadius:8,padding:"2px 7px",fontSize:8.5,cursor:"pointer",color:"#5a7a5a"}},"← 選び直す"),
        React.createElement("span",{style:{fontSize:12,fontWeight:900,color:"#1b5e20"}},"🐕 INUMAP"),
        React.createElement("span",{style:{fontSize:8,color:"#aac0aa"}},"Beta"),
        React.createElement("span",{style:{fontSize:8.5,fontWeight:700,padding:"2px 7px",borderRadius:10,background:lc+"18",color:lc,border:"1px solid "+lc+"44"}},LS[life].em+life+" × "+DG[dog].em+dog),
        React.createElement("button",{onClick:()=>setFlood(f=>!f),style:{marginLeft:"auto",padding:"3px 9px",borderRadius:10,border:"1.5px solid "+(flood?"#d32f2f":"#dde4dd"),background:flood?"#ffebee":"#f5f5f5",color:flood?"#d32f2f":"#888",fontSize:8.5,fontWeight:700,cursor:"pointer"}},"🌊"+(flood?"ON":"洪水"))
      ),
      React.createElement("div",{style:{display:"flex",height:18,borderRadius:6,overflow:"hidden",marginBottom:4}},
        AXES.map(ax=>React.createElement("div",{key:ax.k,style:{flex:w[ax.k],background:ax.co,display:"flex",alignItems:"center",justifyContent:"center",minWidth:0}},
          w[ax.k]>=12&&React.createElement("span",{style:{fontSize:7,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 2px"}},ax.lb.split(" ")[0]+" "+w[ax.k]+"%")
        ))
      ),
      React.createElement("div",{style:{display:"flex",gap:4,overflowX:"auto",alignItems:"center"}},
        React.createElement("span",{style:{fontSize:7,fontWeight:700,color:"#2e7d32",whiteSpace:"nowrap",flexShrink:0}},"TOP"),
        sorted.slice(0,5).map((d,i)=>{const s=gs(d.dev);const iS=d.id===sel;return React.createElement("div",{key:d.id,onClick:()=>setSel(iS?null:d.id),style:{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:7,cursor:"pointer",flexShrink:0,background:iS?s.c+"1a":"#f8f8f8",border:"1.5px solid "+(iS?s.c:"#e8e8e8")}},
          React.createElement("span",{style:{fontSize:7.5,color:"#aaa"}},i+1),
          React.createElement("span",{style:{width:14,height:14,borderRadius:3,background:s.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:"#fff"}},s.b),
          React.createElement("span",{style:{fontSize:9,fontWeight:700,color:"#2a3a2a",whiteSpace:"nowrap"}},d.name),
          React.createElement("span",{style:{fontSize:11,fontWeight:900,color:s.c}},d.dev)
        );})
      )
    ),
    React.createElement("div",{style:{flex:1,position:"relative",overflow:"hidden"}},
      React.createElement(MapView,{scored,selId:sel,onSel:setSel,flood}),
      React.createElement("div",{style:{position:"absolute",top:8,left:8,background:"rgba(255,255,255,0.92)",borderRadius:8,padding:"6px 9px",zIndex:1000,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}},
        React.createElement("div",{style:{fontSize:6.5,fontWeight:700,color:"#2e7d32",marginBottom:4}},"SCORE"),
        [{d:66,l:"S 65+"},{d:60,l:"A 58-64"},{d:53,l:"B 50-57"},{d:45,l:"C 42-49"},{d:38,l:"D ~41"}].map(item=>{const s=gs(item.d);return React.createElement("div",{key:item.l,style:{display:"flex",alignItems:"center",gap:4,marginBottom:2}},
          React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:s.c}}),
          React.createElement("span",{style:{fontSize:7.5,color:"#3a5a3a"}},item.l)
        );})
      ),
      selA&&React.createElement("div",{style:{position:"absolute",top:0,right:0,width:"72%",maxWidth:290,height:"100%",background:"rgba(255,255,255,0.97)",borderLeft:"1px solid #dde4dd",boxShadow:"-4px 0 14px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:1000}},
        React.createElement("button",{onClick:()=>setSel(null),style:{position:"absolute",top:8,right:8,width:24,height:24,borderRadius:"50%",border:"none",background:"#eef2ee",color:"#6a8a6a",cursor:"pointer",fontSize:13,fontWeight:700}},"×"),
        React.createElement("div",{style:{flex:1,overflow:"auto",padding:"12px"}},
          React.createElement("div",{style:{fontSize:8,color:"#8a9a8a",marginBottom:1}},"#"+selR+"位　"+selA.line),
          React.createElement("div",{style:{fontSize:17,fontWeight:900,color:"#1a2a1a",marginBottom:3}},selA.name+"駅"),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10}},
            React.createElement("div",{style:{fontSize:42,fontWeight:900,color:gs(selA.dev).c,lineHeight:1}},selA.dev),
            React.createElement("span",{style:{fontSize:10,fontWeight:900,color:"#fff",background:gs(selA.dev).c,padding:"3px 9px",borderRadius:6}},gs(selA.dev).b+" ランク")
          ),
          flood&&selA.fl&&React.createElement("div",{style:{marginBottom:10,padding:"5px 8px",background:"#fff3f3",borderLeft:"3px solid #d32f2f",borderRadius:"0 6px 6px 0",fontSize:8.5,color:"#7a2a2a"}},"🌊 洪水リスク: "+FL[selA.fl]),
          AXES.map(ax=>{const v=selA[ax.k]||0;return React.createElement("div",{key:ax.k,style:{marginBottom:5}},
            React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:8.5,color:"#4a6a4a",marginBottom:1.5}},
              React.createElement("span",null,ax.lb,React.createElement("span",{style:{fontSize:6.5,background:ax.co+"18",color:ax.co,padding:"1px 3px",borderRadius:6,fontWeight:700,marginLeft:3}},"×"+w[ax.k]+"%")),
              React.createElement("span",{style:{fontWeight:900,color:ax.co,fontSize:10.5}},v)
            ),
            React.createElement("div",{style:{height:3.5,background:"#eef2ee",borderRadius:2,overflow:"hidden"}},
              React.createElement("div",{style:{height:"100%",width:v+"%",background:ax.co,borderRadius:2}})
            )
          );}),
          selA.facilities&&React.createElement("div",{style:{marginTop:8,padding:"8px 10px",background:"#f8f8f8",borderRadius:6,fontSize:8.5,color:"#3a3a3a",lineHeight:1.8}},
            React.createElement("div",{style:{fontWeight:700,marginBottom:4,color:"#2e7d32"}},"📍 周辺施設"),
            selA.facilities.parks&&React.createElement("div",null,"🌳 "+selA.facilities.parks.join("・")),
            selA.facilities.shops&&React.createElement("div",null,"🛒 "+selA.facilities.shops.join("・")),
            selA.facilities.vets&&React.createElement("div",null,"🏥 "+selA.facilities.vets.join("・")),
            selA.facilities.cafes&&React.createElement("div",null,"☕ "+selA.facilities.cafes.join("・"))
          ),
          React.createElement("div",{style:{marginTop:8,padding:"8px 10px",background:dog==="X"?"#fce4ec":dog==="Y"?"#e8f5e9":"#fff3e0",borderLeft:"3px solid "+(dog==="X"?"#c2185b":dog==="Y"?"#2e7d32":"#e65100"),borderRadius:"0 6px 6px 0",fontSize:8.5,lineHeight:1.8}},
            getNote(selA,key).map((l,i)=>React.createElement("div",{key:i},"・"+l))
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
