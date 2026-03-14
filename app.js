const {useState, useMemo, useEffect, useRef} = React;

const AREAS=[
{id:"sk1",n:"篠崎町1丁目",la:35.7195,ln:139.8712,walk:80,housing:74,medical:62,mobility:58,community:77,fl:2},
{id:"sk2",n:"篠崎町2丁目",la:35.7168,ln:139.8695,walk:79,housing:74,medical:61,mobility:57,community:77,fl:2},
{id:"sk3",n:"篠崎町3丁目",la:35.7142,ln:139.8678,walk:78,housing:75,medical:60,mobility:56,community:76,fl:2},
{id:"sk4",n:"篠崎町4丁目",la:35.7115,ln:139.8661,walk:78,housing:75,medical:58,mobility:55,community:76,fl:2},
{id:"sk5",n:"篠崎町5丁目",la:35.7088,ln:139.8644,walk:77,housing:75,medical:57,mobility:54,community:75,fl:2},
{id:"sk6",n:"篠崎町6丁目",la:35.7062,ln:139.8627,walk:76,housing:76,medical:56,mobility:54,community:75,fl:2},
{id:"sk7",n:"篠崎町7丁目",la:35.7035,ln:139.8610,walk:76,housing:76,medical:55,mobility:53,community:74,fl:2},
{id:"sk8",n:"篠崎町8丁目",la:35.7008,ln:139.8593,walk:75,housing:76,medical:54,mobility:52,community:74,fl:2},
{id:"rk1",n:"臨海町1丁目",la:35.6412,ln:139.8598,walk:88,housing:50,medical:42,mobility:66,community:68,fl:5},
{id:"rk2",n:"臨海町2丁目",la:35.6378,ln:139.8628,walk:87,housing:50,medical:41,mobility:65,community:68,fl:5},
{id:"rk3",n:"臨海町3丁目",la:35.6344,ln:139.8658,walk:86,housing:51,medical:40,mobility:64,community:67,fl:5},
{id:"rk4",n:"臨海町4丁目",la:35.6310,ln:139.8688,walk:86,housing:51,medical:38,mobility:63,community:67,fl:5},
{id:"rk5",n:"臨海町5丁目",la:35.6276,ln:139.8718,walk:85,housing:51,medical:37,mobility:62,community:66,fl:4},
{id:"rk6",n:"臨海町6丁目",la:35.6242,ln:139.8748,walk:84,housing:52,medical:36,mobility:62,community:66,fl:4},
{id:"ss1",n:"清新町1丁目",la:35.6495,ln:139.8712,walk:72,housing:57,medical:61,mobility:70,community:70,fl:4},
{id:"ss2",n:"清新町2丁目",la:35.6462,ln:139.8742,walk:71,housing:57,medical:60,mobility:69,community:70,fl:4},
{id:"nk1",n:"西葛西1丁目",la:35.6578,ln:139.8578,walk:63,housing:60,medical:80,mobility:77,community:67,fl:4},
{id:"nk2",n:"西葛西2丁目",la:35.6612,ln:139.8542,walk:62,housing:60,medical:79,mobility:76,community:67,fl:4},
{id:"nk3",n:"西葛西3丁目",la:35.6645,ln:139.8512,walk:62,housing:61,medical:78,mobility:75,community:66,fl:3},
{id:"nk4",n:"西葛西4丁目",la:35.6628,ln:139.8478,walk:61,housing:61,medical:76,mobility:74,community:66,fl:3},
{id:"nk5",n:"西葛西5丁目",la:35.6595,ln:139.8455,walk:60,housing:61,medical:75,mobility:73,community:65,fl:3},
{id:"nk6",n:"西葛西6丁目",la:35.6548,ln:139.8598,walk:59,housing:62,medical:74,mobility:72,community:65,fl:3},
{id:"nk7",n:"西葛西7丁目",la:35.6522,ln:139.8628,walk:58,housing:62,medical:73,mobility:72,community:64,fl:3},
{id:"nk8",n:"西葛西8丁目",la:35.6495,ln:139.8658,walk:58,housing:62,medical:72,mobility:71,community:64,fl:3},
{id:"ks1",n:"中葛西1丁目",la:35.6678,ln:139.8712,walk:64,housing:65,medical:74,mobility:74,community:67,fl:3},
{id:"ks2",n:"中葛西2丁目",la:35.6645,ln:139.8742,walk:63,housing:65,medical:73,mobility:73,community:67,fl:3},
{id:"ks3",n:"中葛西3丁目",la:35.6612,ln:139.8772,walk:62,housing:66,medical:72,mobility:72,community:66,fl:3},
{id:"ks4",n:"中葛西4丁目",la:35.6578,ln:139.8802,walk:62,housing:66,medical:70,mobility:71,community:66,fl:3},
{id:"ks5",n:"中葛西5丁目",la:35.6545,ln:139.8832,walk:61,housing:66,medical:69,mobility:70,community:65,fl:3},
{id:"ks6",n:"中葛西6丁目",la:35.6512,ln:139.8862,walk:60,housing:66,medical:68,mobility:70,community:65,fl:3},
{id:"ks7",n:"中葛西7丁目",la:35.6478,ln:139.8892,walk:60,housing:67,medical:67,mobility:69,community:64,fl:3},
{id:"ks8",n:"中葛西8丁目",la:35.6445,ln:139.8922,walk:59,housing:67,medical:66,mobility:68,community:64,fl:3},
{id:"kt1",n:"北葛西1丁目",la:35.6695,ln:139.8648,walk:64,housing:64,medical:69,mobility:72,community:66,fl:3},
{id:"kt2",n:"北葛西2丁目",la:35.6678,ln:139.8712,walk:63,housing:64,medical:68,mobility:71,community:66,fl:3},
{id:"kt3",n:"北葛西3丁目",la:35.6662,ln:139.8762,walk:62,housing:65,medical:67,mobility:70,community:65,fl:3},
{id:"uk",n:"宇喜田町",la:35.6712,ln:139.8622,walk:66,housing:66,medical:72,mobility:72,community:68,fl:3},
{id:"hk1",n:"東葛西1丁目",la:35.6628,ln:139.8842,walk:63,housing:65,medical:66,mobility:72,community:65,fl:3},
{id:"hk2",n:"東葛西2丁目",la:35.6595,ln:139.8872,walk:62,housing:65,medical:65,mobility:71,community:65,fl:3},
{id:"hk3",n:"東葛西3丁目",la:35.6562,ln:139.8902,walk:62,housing:66,medical:64,mobility:70,community:64,fl:3},
{id:"kw1",n:"北小岩1丁目",la:35.7478,ln:139.8812,walk:69,housing:75,medical:67,mobility:61,community:77,fl:1},
{id:"kw2",n:"北小岩2丁目",la:35.7445,ln:139.8838,walk:68,housing:75,medical:66,mobility:60,community:77,fl:1},
{id:"kw3",n:"北小岩3丁目",la:35.7412,ln:139.8858,walk:68,housing:76,medical:65,mobility:59,community:76,fl:1},
{id:"kw4",n:"北小岩4丁目",la:35.7378,ln:139.8878,walk:67,housing:76,medical:63,mobility:58,community:76,fl:1},
{id:"mk1",n:"南小岩1丁目",la:35.7345,ln:139.8858,walk:64,housing:71,medical:72,mobility:64,community:73,fl:2},
{id:"mk2",n:"南小岩2丁目",la:35.7312,ln:139.8838,walk:63,housing:71,medical:71,mobility:63,community:73,fl:2},
{id:"mk3",n:"南小岩3丁目",la:35.7278,ln:139.8818,walk:62,housing:72,medical:70,mobility:62,community:72,fl:2},
{id:"hr1",n:"平井1丁目",la:35.7112,ln:139.8388,walk:70,housing:69,medical:61,mobility:64,community:72,fl:1},
{id:"hr2",n:"平井2丁目",la:35.7085,ln:139.8418,walk:69,housing:69,medical:60,mobility:63,community:72,fl:1},
{id:"hr3",n:"平井3丁目",la:35.7058,ln:139.8448,walk:68,housing:70,medical:59,mobility:62,community:71,fl:1},
{id:"hr4",n:"平井4丁目",la:35.7032,ln:139.8478,walk:68,housing:70,medical:57,mobility:61,community:71,fl:1},
{id:"hr5",n:"平井5丁目",la:35.7005,ln:139.8508,walk:67,housing:70,medical:56,mobility:60,community:70,fl:1},
{id:"sh1",n:"鹿骨1丁目",la:35.7062,ln:139.8598,walk:74,housing:76,medical:51,mobility:54,community:78,fl:2},
{id:"sh2",n:"鹿骨2丁目",la:35.7028,ln:139.8572,walk:73,housing:76,medical:50,mobility:53,community:78,fl:2},
{id:"sh3",n:"鹿骨3丁目",la:35.6995,ln:139.8548,walk:72,housing:77,medical:49,mobility:52,community:77,fl:2},
{id:"mt1",n:"松江1丁目",la:35.7028,ln:139.8672,walk:65,housing:71,medical:63,mobility:64,community:72,fl:3},
{id:"mt2",n:"松江2丁目",la:35.6995,ln:139.8698,walk:64,housing:71,medical:62,mobility:63,community:72,fl:3},
{id:"mt3",n:"松江3丁目",la:35.6962,ln:139.8724,walk:64,housing:72,medical:61,mobility:62,community:71,fl:3},
{id:"ic1",n:"一之江1丁目",la:35.7012,ln:139.8762,walk:64,housing:68,medical:65,mobility:62,community:70,fl:3},
{id:"ic2",n:"一之江2丁目",la:35.6978,ln:139.8788,walk:63,housing:68,medical:64,mobility:61,community:70,fl:3},
{id:"ic3",n:"一之江3丁目",la:35.6945,ln:139.8814,walk:62,housing:69,medical:63,mobility:60,community:69,fl:3},
{id:"fn1",n:"船堀1丁目",la:35.6895,ln:139.8712,walk:62,housing:65,medical:66,mobility:70,community:67,fl:3},
{id:"fn2",n:"船堀2丁目",la:35.6862,ln:139.8738,walk:61,housing:65,medical:65,mobility:69,community:67,fl:3},
{id:"fn3",n:"船堀3丁目",la:35.6828,ln:139.8764,walk:60,housing:66,medical:64,mobility:68,community:66,fl:3},
{id:"sd1",n:"新田1丁目",la:35.6612,ln:139.8648,walk:67,housing:67,medical:59,mobility:64,community:69,fl:3},
{id:"sd2",n:"新田2丁目",la:35.6578,ln:139.8618,walk:66,housing:67,medical:58,mobility:63,community:69,fl:3},
];

const WW={AX:{walk:12,housing:14,medical:42,mobility:10,community:12},AY:{walk:38,housing:22,medical:10,mobility:20,community:10},AZ:{walk:22,housing:10,medical:46,mobility:6,community:16},BX:{walk:14,housing:24,medical:30,mobility:8,community:24},BY:{walk:30,housing:24,medical:12,mobility:18,community:16},BZ:{walk:22,housing:22,medical:36,mobility:6,community:14}};
const AXES=[{k:"walk",lb:"🐾 散歩",co:"#2e7d32"},{k:"housing",lb:"🏠 住環境",co:"#1565c0"},{k:"medical",lb:"🎪🏥 サポート",co:"#c2185b"},{k:"mobility",lb:"🚗 移動",co:"#e65100"},{k:"community",lb:"👥 地域",co:"#6a1a9a"}];
const LS={A:{lb:"単身・共働き",em:"🏙️",co:"#1565c0",de:"仕事帰りの利便・医療アクセスを重視"},B:{lb:"子育てファミリー",em:"👨‍👩‍👧",co:"#6a1a9a",de:"子育て環境・公園・コミュニティを重視"}};
const DG={X:{lb:"小型犬",em:"🐩",co:"#c2185b",de:"室内派・カフェ/ドッグラン/ペットホテルが鍵"},Y:{lb:"中・大型犬",em:"🐕",co:"#2e7d32",de:"広い散歩スペース・モビリティが重要"},Z:{lb:"シニア・持病",em:"🏥",co:"#e65100",de:"動物病院・夜間救急へのアクセスが最重要"}};
const ML={AX:"☕🏨🐾 カフェ・ペットホテル・室内ドッグラン・動物病院",AY:"🏥 動物病院・夜間救急",AZ:"🏥 動物病院・夜間救急（最重要）",BX:"☕🏥 カフェ・サポート・動物病院",BY:"🏥 動物病院・SC・スーパー",BZ:"🏥 動物病院・夜間救急・買い物"};
const FC={1:"rgba(255,255,100,0.35)",2:"rgba(255,180,50,0.4)",3:"rgba(240,100,20,0.45)",4:"rgba(200,30,20,0.5)",5:"rgba(140,0,0,0.55)"};
const FL={1:"低 0-0.5m",2:"中 0.5-3m",3:"高 3-5m",4:"危 5m+",5:"最危 10m+"};

function calc(areas,w){const tot=Object.values(w).reduce((a,b)=>a+b,0);const rs=areas.map(d=>AXES.reduce((s,a)=>s+(d[a.k]||0)*w[a.k],0)/tot);const avg=rs.reduce((a,b)=>a+b,0)/rs.length;const sd=Math.sqrt(rs.reduce((a,b)=>a+(b-avg)**2,0)/rs.length)||1;return areas.map((d,i)=>({...d,dev:Math.round((rs[i]-avg)/sd*10+50)}));}
function gs(v){if(v>=65)return{c:"#1b5e20",b:"S"};if(v>=58)return{c:"#2e7d32",b:"A"};if(v>=50)return{c:"#e65100",b:"B"};if(v>=42)return{c:"#bf360c",b:"C"};return{c:"#b71c1c",b:"D"};}
function note(id,key){const dog=key[1];const a=AREAS.find(x=>x.id===id);if(!a)return["詳細はPhase2で追加予定"];const nm={walk:"散歩・公園",housing:"住環境・家賃",medical:"医療・サポート",mobility:"移動",community:"地域"};const top=Object.entries({walk:a.walk,housing:a.housing,medical:a.medical,mobility:a.mobility,community:a.community}).sort((x,y)=>y[1]-x[1]);return[`${nm[top[0][0]]}が区内上位（${top[0][1]}点）`,`${nm[top[1][0]]}も強み（${top[1][1]}点）`,`${nm[top[top.length-1][0]]}はやや低め（${top[top.length-1][1]}点）`,dog==="X"?"小型犬OKの物件・カフェを探せるエリア":dog==="Y"?"大型犬の散歩コースへのアクセスを確認して":"シニア犬のかかりつけ医は早めに確保を"];}

function MapView({scored, selId, onSel, flood, w}){
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const markersRef = useRef([]);
  const floodRef = useRef([]);
  const polyRef = useRef([]);

  useEffect(()=>{
    if(leafRef.current) return;
    leafRef.current = L.map(mapRef.current, {
      center:[35.685,139.870], zoom:13,
      zoomControl:true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors',
      maxZoom:19
    }).addTo(leafRef.current);
  },[]);

  useEffect(()=>{
    if(!leafRef.current||!scored.length) return;
    polyRef.current.forEach(l=>l.remove());
    polyRef.current=[];
    const GEOJSON_URL="https://raw.githubusercontent.com/14142001sagau-ai/inumap-Tokyo/main/data/edogawa.geojson";
    fetch(GEOJSON_URL)
      .then(r=>r.json())
      .then(gj=>{
        gj.features.forEach(f=>{
          const name=f.properties.name||"";
          const match=scored.find(d=>name.includes(d.n)||d.n.includes(name));
          if(!match) return;
          const s=gs(match.dev);
          const layer=L.geoJSON(f,{
            style:{
              fillColor:s.c,
              fillOpacity:0.55,
              color:"#fff",
              weight:1.5
            }
          }).addTo(leafRef.current);
          layer.on('click',()=>onSel(match.id===selId?null:match.id));
          polyRef.current.push(layer);
        });
      })
      .catch(e=>console.error(e));
  },[scored,selId]);

  useEffect(()=>{
    if(!leafRef.current) return;
    markersRef.current.forEach(m=>m.remove());
    markersRef.current=[];
    scored.forEach(d=>{
      const s=gs(d.dev);
      const iS=d.id===selId;
      const size=iS?40:28;
      const icon=L.divIcon({
        className:'',
        html:`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${s.c};border:${iS?'3px solid #fff':'2px solid rgba(255,255,255,0.8)'};display:flex;align-items:center;justify-content:center;font-size:${iS?12:10}px;font-weight:900;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">${s.b}</div>`,
        iconSize:[size,size],
        iconAnchor:[size/2,size/2]
      });
      const marker=L.marker([d.la,d.ln],{icon}).addTo(leafRef.current);
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
        const circle=L.circle([d.la,d.ln],{
          radius:350,
          color:'transparent',
          fillColor:FC[d.fl],
          fillOpacity:0.65
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
  const key=life&&dog?life+dog:null;
  const w=key?WW[key]:null;
  const lc=life?LS[life].co:"#2e7d32";
  const dc=dog?DG[dog].co:"#2e7d32";
  const scored=useMemo(()=>w?calc(AREAS,w):[],[key]);
  const sorted=useMemo(()=>[...scored].sort((a,b)=>b.dev-a.dev),[scored]);
  const selA=sel?scored.find(d=>d.id===sel):null;
  const selR=selA?sorted.findIndex(d=>d.id===sel)+1:null;

  if(phase==="select") return React.createElement("div",{style:{height:"100dvh",background:"linear-gradient(160deg,#f0f7f0,#e8f0e8)",display:"flex",flexDirection:"column",overflow:"hidden"}},
    React.createElement("div",{style:{padding:"16px 20px 8px",textAlign:"center",flexShrink:0}},
      React.createElement("div",{style:{fontSize:28}},"🐕"),
      React.createElement("div",{style:{fontSize:20,fontWeight:900,color:"#1b5e20"}},"INUMAP TOKYO"),
      React.createElement("div",{style:{fontSize:10,color:"#7a9a7a"}},"江戸川区 丁目レベル 犬連れスコア — Phase 1 Beta")
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
            w[ax.k]>=12&&React.createElement("span",{style:{fontSize:7.5,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 2px"}},ax.lb+" "+w[ax.k]+"%")
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
    React.createElement("div",{style:{padding:"6px",fontSize:7.5,color:"#aabcaa",textAlign:"center"}},"📊 OSM/国土数値情報/e-Stat推定値 ⚠️ Phase2実データ化予定")
  );

  return React.createElement("div",{style:{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}},
    React.createElement("div",{style:{background:"#fff",borderBottom:"1px solid #dde4dd",padding:"5px 10px",flexShrink:0}},
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:4}},
        React.createElement("button",{onClick:()=>{setPhase("select");setSel(null);},style:{background:"none",border:"1px solid #dde4dd",borderRadius:8,padding:"2px 7px",fontSize:8.5,cursor:"pointer",color:"#5a7a5a"}},"← 選び直す"),
        React.createElement("span",{style:{fontSize:12,fontWeight:900,color:"#1b5e20"}},"🐕 INUMAP"),
        React.createElement("span",{style:{fontSize:8,color:"#aac0aa"}},"江戸川区β"),
        React.createElement("span",{style:{fontSize:8.5,fontWeight:700,padding:"2px 7px",borderRadius:10,background:lc+"18",color:lc,border:"1px solid "+lc+"44"}},LS[life].em+life+" × "+DG[dog].em+dog),
        React.createElement("button",{onClick:()=>setFlood(f=>!f),style:{marginLeft:"auto",padding:"3px 9px",borderRadius:10,border:"1.5px solid "+(flood?"#d32f2f":"#dde4dd"),background:flood?"#ffebee":"#f5f5f5",color:flood?"#d32f2f":"#888",fontSize:8.5,fontWeight:700,cursor:"pointer"}},"🌊"+(flood?"ON":"洪水"))
      ),
      React.createElement("div",{style:{display:"flex",height:18,borderRadius:6,overflow:"hidden",marginBottom:4}},
        AXES.map(ax=>React.createElement("div",{key:ax.k,style:{flex:w[ax.k],background:ax.co,display:"flex",alignItems:"center",justifyContent:"center",minWidth:0}},
          w[ax.k]>=12&&React.createElement("span",{style:{fontSize:7,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 2px"}},ax.lb+" "+w[ax.k]+"%")
        ))
      ),
      React.createElement("div",{style:{display:"flex",gap:4,overflowX:"auto",alignItems:"center"}},
        React.createElement("span",{style:{fontSize:7,fontWeight:700,color:"#2e7d32",whiteSpace:"nowrap",flexShrink:0}},"TOP"),
        sorted.slice(0,5).map((d,i)=>{const s=gs(d.dev);const iS=d.id===sel;return React.createElement("div",{key:d.id,onClick:()=>setSel(iS?null:d.id),style:{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:7,cursor:"pointer",flexShrink:0,background:iS?s.c+"1a":"#f8f8f8",border:"1.5px solid "+(iS?s.c:"#e8e8e8")}},
          React.createElement("span",{style:{fontSize:7.5,color:"#aaa"}},i+1),
          React.createElement("span",{style:{width:14,height:14,borderRadius:3,background:s.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:900,color:"#fff"}},s.b),
          React.createElement("span",{style:{fontSize:9,fontWeight:700,color:"#2a3a2a",whiteSpace:"nowrap"}},d.n),
          React.createElement("span",{style:{fontSize:11,fontWeight:900,color:s.c}},d.dev)
        );})
      )
    ),
    React.createElement("div",{style:{flex:1,position:"relative",overflow:"hidden"}},
      React.createElement(MapView,{scored,selId:sel,onSel:setSel,flood,w}),
      React.createElement("div",{style:{position:"absolute",top:8,left:8,background:"rgba(255,255,255,0.92)",borderRadius:8,padding:"6px 9px",zIndex:1000,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}},
        React.createElement("div",{style:{fontSize:6.5,fontWeight:700,color:"#2e7d32",marginBottom:4}},"SCORE"),
        [{d:66,l:"S 65+"},{d:60,l:"A 58-64"},{d:53,l:"B 50-57"},{d:45,l:"C 42-49"},{d:38,l:"D ~41"}].map(item=>{const s=gs(item.d);return React.createElement("div",{key:item.l,style:{display:"flex",alignItems:"center",gap:4,marginBottom:2}},
          React.createElement("div",{style:{width:7,height:7,borderRadius:"50%",background:s.c}}),
          React.createElement("span",{style:{fontSize:7.5,color:"#3a5a3a"}},item.l)
        );})
      ),
      selA&&React.createElement("div",{style:{position:"absolute",top:0,right:0,width:"70%",maxWidth:280,height:"100%",background:"rgba(255,255,255,0.97)",borderLeft:"1px solid #dde4dd",boxShadow:"-4px 0 14px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",overflow:"hidden",zIndex:1000}},
        React.createElement("button",{onClick:()=>setSel(null),style:{position:"absolute",top:8,right:8,width:24,height:24,borderRadius:"50%",border:"none",background:"#eef2ee",color:"#6a8a6a",cursor:"pointer",fontSize:13,fontWeight:700}},"×"),
        React.createElement("div",{style:{flex:1,overflow:"auto",padding:"12px"}},
          React.createElement("div",{style:{fontSize:8.5,color:"#8a9a8a",marginBottom:2}},"#"+selR+"位"),
          React.createElement("div",{style:{fontSize:16,fontWeight:900,color:"#1a2a1a",marginBottom:3}},selA.n),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10}},
            React.createElement("div",{style:{fontSize:40,fontWeight:900,color:gs(selA.dev).c,lineHeight:1}},selA.dev),
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
          React.createElement("div",{style:{marginTop:8,padding:"8px 10px",background:dog==="X"?"#fce4ec":dog==="Y"?"#e8f5e9":"#fff3e0",borderLeft:"3px solid "+(dog==="X"?"#c2185b":dog==="Y"?"#2e7d32":"#e65100"),borderRadius:"0 6px 6px 0",fontSize:8.5,lineHeight:1.8}},
            note(selA.id,key).map((l,i)=>React.createElement("div",{key:i},"・"+l))
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
