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
  {k:'walk',lb:'\uD83D\uDC3E \u6563\u6B69\u30FB\u5B89\u5168',co:'#2e7d32'},
  {k:'housing',lb:'\uD83C\uDFE0 \u4F4F\u74B0\u5883',co:'#1565c0'},
  {k:'medical',lb:'\uD83C\uDFAA\uD83C\uDFE5 \u30B5\u30DD\u30FC\u30C8\u30FB\u533B\u7642',co:'#c2185b'},
  {k:'mobility',lb:'\uD83D\uDE97 \u79FB\u52D5',co:'#e65100'},
  {k:'community',lb:'\uD83D\uDC65 \u5730\u57DF',co:'#6a1a9a'}
];
const LS={
  A:{lb:'\u5358\u8EAB\u30FB\u5171\u5171\u304D',em:'\uD83C\uDFD9',co:'#1565c0',de:'\u4ED5\u4E8B\u5E30\u308A\u306E\u5229\u4FBF\u30FB\u533B\u7642\u30A2\u30AF\u30BB\u30B9\u3092\u91CD\u8996'},
  B:{lb:'\u5B50\u80B2\u3066\u30D5\u30A1\u30DF\u30EA\u30FC',em:'\uD83D\uDC6A',co:'#6a1a9a',de:'\u5B50\u80B2\u3066\u74B0\u5883\u30FB\u516C\u5712\u30FB\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u3092\u91CD\u8996'}
};
const DG={
  X:{lb:'\u5C0F\u578B\u72AC',em:'\uD83D\uDC29',co:'#c2185b',de:'\u5BA4\u5185\u6D3E\u30FB\u30AB\u30D5\u30A7/\u30C9\u30C3\u30B0\u30E9\u30F3/\u30DA\u30C3\u30C8\u30DB\u30C6\u30EB\u304C\u9375'},
  Y:{lb:'\u4E2D\u30FB\u5927\u578B\u72AC',em:'\uD83D\uDC15',co:'#2e7d32',de:'\u5E83\u3044\u6563\u6B69\u30B9\u30DA\u30FC\u30B9\u30FB\u30E2\u30D3\u30EA\u30C6\u30A3\u304C\u91CD\u8981'},
  Z:{lb:'\u30B7\u30CB\u30A2\u30FB\u6301\u75C5',em:'\uD83C\uDFE5',co:'#e65100',de:'\u52D5\u7269\u75C5\u9662\u30FB\u591C\u9593\u6551\u6025\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u304C\u6700\u91CD\u8981'}
};
const ML={
  AX:'\u2615\uD83C\uDFE8\uD83D\uDC3E \u30AB\u30D5\u30A7\u30FB\u30DA\u30C3\u30C8\u30DB\u30C6\u30EB\u30FB\u5BA4\u5185\u30C9\u30C3\u30B0\u30E9\u30F3\u30FB\u52D5\u7269\u75C5\u9662',
  AY:'\uD83C\uDFE5 \u52D5\u7269\u75C5\u9662\u30FB\u591C\u9593\u6551\u6025',
  AZ:'\uD83C\uDFE5 \u52D5\u7269\u75C5\u9662\u30FB\u591C\u9593\u6551\u6025\uFF08\u6700\u91CD\u8981\uFF09',
  BX:'\u2615\uD83C\uDFE5 \u30AB\u30D5\u30A7\u30FB\u30B5\u30DD\u30FC\u30C8\u30FB\u52D5\u7269\u75C5\u9662',
  BY:'\uD83C\uDFE5 \u52D5\u7269\u75C5\u9662\u30FBSC\u30FB\u30B9\u30FC\u30D1\u30FC',
  BZ:'\uD83C\uDFE5 \u52D5\u7269\u75C5\u9662\u30FB\u591C\u9593\u6551\u6025\u30FB\u8CB7\u3044\u7269'
};
const FC={1:'rgba(255,255,100,0.35)',2:'rgba(255,180,50,0.4)',3:'rgba(240,100,20,0.45)',4:'rgba(200,30,20,0.5)',5:'rgba(140,0,0,0.55)'};
const FL={1:'\u4F4E 0-0.5m',2:'\u4E2D 0.5-3m',3:'\u9AD8 3-5m',4:'\u5371 5m+',5:'\u6700\u5371 10m+'};
const DATA_URL='https://raw.githubusercontent.com/14142001sagau-ai/inumap-Tokyo/main/data/stations.json';
const COMMENTS_URL='https://raw.githubusercontent.com/14142001sagau-ai/inumap-Tokyo/main/data/comments.json';

function calc(areas,w){
  const tot=Object.values(w).reduce((a,b)=>a+b,0);
  const rs=areas.map(d=>AXES.reduce((s,a)=>s+(d[a.k]||0)*w[a.k],0)/tot);
  const avg=rs.reduce((a,b)=>a+b,0)/rs.length;
  const sd=Math.sqrt(rs.reduce((a,b)=>a+(b-avg)**2,0)/rs.length)||1;
  return areas.map((d,i)=>({...d,dev:Math.round((rs[i]-avg)/sd*10+50)}));
}
function gs(v){
  if(v>=65)return{c:'#1b5e20',b:'S'};
  if(v>=58)return{c:'#2e7d32',b:'A'};
  if(v>=50)return{c:'#e65100',b:'B'};
  if(v>=42)return{c:'#bf360c',b:'C'};
  return{c:'#b71c1c',b:'D'};
}
function getNote(station,key){
  if(station.notes&&station.notes[key])return station.notes[key];
  const dog=key[1];
  const lines=[];
  const parks=station.parks||[];
  const dogruns=station.dogruns||[];
  let walkLine='';
  if(dogruns.length>0){
    walkLine=dogruns[0]+'のドッグランあり。';
    if(parks.length>0)walkLine+=parks[0]+'など'+parks.length+'つの公園が徒歩圏内。';
  }else if(parks.length>=3){
    walkLine=parks[0]+'など'+parks.length+'つの公園が徒歩圏内。';
    walkLine+=station.walk>=70?'散歩コースが充実している。':'日常の散歩には十分な環境。';
  }else if(parks.length>0){
    walkLine=parks[0]+'が最寄り公園。';
    walkLine+=station.walk<55?'大型公園へは移動が必要。':'散歩環境は標準的。';
  }else{
    walkLine='徒歩圏内の公園は少なめ。近隣エリアへの移動を推奨。';
  }
  if(dog==='Y')walkLine+=station.walk>=65?'大型犬の散歩スペースも確保しやすい。':'大型犬は広い公園への遠出を検討して。';
  lines.push(walkLine);
  const housing=station.housing||65;
  const safety=station.safety||70;
  let houseLine='';
  if(safety>=78)houseLine+='治安は区内でも良好な部類。';
  else if(safety>=68)houseLine+='治安は平均的で落ち着いたエリア。';
  else houseLine+='治安はやや注意が必要なエリア。';
  if(housing>=72)houseLine+='ペット可物件の選択肢が多く、大型犬OKも見つけやすい。';
  else if(housing>=65)houseLine+='ペット可物件は標準的な密度。';
  else houseLine+='ペット可・大型犬OKの物件は少なめ、早めの情報収集を。';
  lines.push(houseLine);
  const vets=station.vets||[];
  const medical=station.medical||50;
  let medLine='';
  if(vets.length>=3){
    medLine+=vets.slice(0,2).join('、')+'など'+vets.length+'院が徒歩圏内。';
    medLine+=medical>=65?'医療環境は充実。':'動物病院の選択肢が多い。';
  }else if(vets.length>0){
    medLine+=vets[0]+'が最寄り動物病院。';
    medLine+=dog==='Z'?'シニア犬のかかりつけは早めに確保を。':'夜間救急は近隣エリアで要確認。';
  }else{
    medLine+='徒歩圏内の動物病院は少なめ。';
    medLine+=dog==='Z'?'シニア犬には医療アクセスが重要、要確認。':'近隣駅エリアで探すことを推奨。';
  }
  lines.push(medLine);
  const carshares=station.carshares||[];
  const mobility=station.mobility||50;
  let mobLine='';
  if(carshares.length>0){
    mobLine+=carshares[0]+'などカーシェア'+carshares.length+'拠点あり。';
    mobLine+=dog==='Y'?'大型犬の遠出に活用できる。':'週末のお出かけに便利。';
  }else if(mobility>=60){
    mobLine+='駅周辺のモビリティ環境は良好。レンタカーも利用しやすい。';
  }else{
    mobLine+='カーシェア拠点は少なめ。愛犬との遠出はレンタカーの事前予約を推奨。';
  }
  lines.push(mobLine);
  const community=station.community||68;
  let comLine='';
  if(community>=75)comLine+='犬の飼育率が高く、愛犬家コミュニティが充実。同行避難所の整備も進んでいる。';
  else if(community>=68)comLine+='犬連れ住民も多く、地域のつながりが感じられるエリア。';
  else comLine+='犬の飼育率は平均的。地域の犬友達コミュニティは自分から開拓を。';
  lines.push(comLine);
  return lines;
}

function MapView({scored,selId,onSel,flood}){
  const mapRef=useRef(null);
  const leafRef=useRef(null);
  const markersRef=useRef([]);
  const floodRef=useRef([]);
  useEffect(()=>{
    if(leafRef.current)return;
    leafRef.current=L.map(mapRef.current,{center:[35.685,139.870],zoom:12,zoomControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'\u00A9 OpenStreetMap contributors',maxZoom:19
    }).addTo(leafRef.current);
  },[]);
  useEffect(()=>{
    if(!leafRef.current)return;
    markersRef.current.forEach(m=>m.remove());
    markersRef.current=[];
    scored.forEach(d=>{
      const s=gs(d.dev);
      const iS=d.id===selId;
      const size=iS?44:32;
      const icon=L.divIcon({
        className:'',
        html:'<div style=\'width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+s.c+';border:'+(iS?'3px solid #fff':'2px solid rgba(255,255,255,0.8)')+';display:flex;align-items:center;justify-content:center;font-size:'+(iS?13:10)+'px;font-weight:900;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer\'>'+s.b+'</div>',
        iconSize:[size,size],iconAnchor:[size/2,size/2]
      });
      const marker=L.marker([d.lat,d.lng],{icon}).addTo(leafRef.current);
      marker.on('click',()=>onSel(d.id===selId?null:d.id));
      markersRef.current.push(marker);
    });
  },[scored,selId]);
  useEffect(()=>{
    if(!leafRef.current)return;
    floodRef.current.forEach(l=>l.remove());
    floodRef.current=[];
    if(flood){
      scored.forEach(d=>{
        if(!d.fl)return;
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
  const[phase,setPhase]=useState('select');
  const[stations,setStations]=useState([]);
  const[comments,setComments]=useState({});
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  useEffect(()=>{
    fetch(DATA_URL)
      .then(r=>r.json())
      .then(data=>{setStations(data);setLoading(false);})
      .catch(e=>{setError('データ取得エラー');setLoading(false);});
  },[]);
  useEffect(()=>{
    fetch(COMMENTS_URL)
      .then(r=>r.json())
      .then(data=>setComments(data))
      .catch(()=>{});
  },[]);
  const key=life&&dog?life+dog:null;
  const w=key?WW[key]:null;
  const lc=life?LS[life].co:'#2e7d32';
  const dc=dog?DG[dog].co:'#2e7d32';
  const scored=useMemo(()=>w&&stations.length?calc(stations,w):[],[key,stations]);
  const sorted=useMemo(()=>[...scored].sort((a,b)=>b.dev-a.dev),[scored]);
  const selA=sel?scored.find(d=>d.id===sel):null;
  const selR=selA?sorted.findIndex(d=>d.id===sel)+1:null;

  if(loading)return React.createElement('div',{style:{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f7f0',flexDirection:'column',gap:16}},
    React.createElement('div',{style:{fontSize:32}},'\uD83D\uDC15'),
    React.createElement('div',{style:{fontSize:14,color:'#2e7d32',fontWeight:700}},'\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D...')
  );
  if(error)return React.createElement('div',{style:{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f7f0',flexDirection:'column',gap:16}},
    React.createElement('div',{style:{fontSize:32}},'\u26A0\uFE0F'),
    React.createElement('div',{style:{fontSize:14,color:'#c62828'}},'\u30C7\u30FC\u30BF\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F')
  );

  if(phase==='select')return React.createElement('div',{style:{height:'100dvh',background:'linear-gradient(160deg,#f0f7f0,#e8f0e8)',display:'flex',flexDirection:'column',overflow:'hidden'}},
    React.createElement('div',{style:{padding:'16px 20px 8px',textAlign:'center',flexShrink:0}},
      React.createElement('div',{style:{fontSize:28}},'\uD83D\uDC15'),
      React.createElement('div',{style:{fontSize:20,fontWeight:900,color:'#1b5e20'}},'INUMAP TOKYO'),
      React.createElement('div',{style:{fontSize:10,color:'#7a9a7a'}},'\u6771\u4EAC23\u533A \u99C5\u5468\u8FBA\u30A8\u30EA\u30A2 \u72AC\u9023\u308C\u30B9\u30B3\u30A2 \u2014 Beta')
    ),
    React.createElement('div',{style:{flex:1,overflow:'auto',padding:'0 14px 12px'}},
      React.createElement('div',{style:{fontSize:11,fontWeight:700,color:'#5a7a5a',marginBottom:7}},'\u2460 \u3042\u306A\u305F\u306E\u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\u306F\uFF1F'),
      React.createElement('div',{style:{display:'flex',gap:10,marginBottom:14}},
        Object.entries(LS).map(([k,v])=>React.createElement('div',{key:k,onClick:()=>setLife(k),style:{flex:1,padding:'14px 10px',borderRadius:16,cursor:'pointer',textAlign:'center',border:'2.5px solid '+(life===k?v.co:'#dde8dd'),background:life===k?v.co+'14':'#fff',transition:'all 0.18s'}},
          React.createElement('div',{style:{fontSize:26,marginBottom:5}},v.em),
          React.createElement('div',{style:{fontSize:11,fontWeight:800,color:life===k?v.co:'#4a6a4a',marginBottom:4}},k+'. '+v.lb),
          React.createElement('div',{style:{fontSize:9,color:'#8a9a8a',lineHeight:1.5}},v.de),
          life===k&&React.createElement('div',{style:{marginTop:7,width:22,height:22,borderRadius:'50%',background:v.co,color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',margin:'7px auto 0'}},'\u2713')
        ))
      ),
      React.createElement('div',{style:{fontSize:11,fontWeight:700,color:'#5a7a5a',marginBottom:7}},'\u2461 \u611B\u72AC\u306E\u30BF\u30A4\u30D7\u306F\uFF1F'),
      React.createElement('div',{style:{display:'flex',gap:8,marginBottom:14}},
        Object.entries(DG).map(([k,v])=>React.createElement('div',{key:k,onClick:()=>setDog(k),style:{flex:1,padding:'12px 6px',borderRadius:14,cursor:'pointer',textAlign:'center',border:'2.5px solid '+(dog===k?v.co:'#dde8dd'),background:dog===k?v.co+'14':'#fff',transition:'all 0.18s'}},
          React.createElement('div',{style:{fontSize:22,marginBottom:3}},v.em),
          React.createElement('div',{style:{fontSize:10,fontWeight:800,color:dog===k?v.co:'#4a6a4a',marginBottom:3}},k+'. '+v.lb),
          React.createElement('div',{style:{fontSize:8.5,color:'#8a9a8a',lineHeight:1.4}},v.de),
          dog===k&&React.createElement('div',{style:{marginTop:5,width:18,height:18,borderRadius:'50%',background:v.co,color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',margin:'5px auto 0'}},'\u2713')
        ))
      ),
      key&&React.createElement('div',{style:{background:'#fff',borderRadius:14,padding:'12px 14px',marginBottom:14,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}},
        React.createElement('div',{style:{fontSize:10,fontWeight:700,color:'#2e7d32',marginBottom:8}},'\u3042\u306A\u305F\u306E\u8A55\u4FA1\u30A6\u30A7\u30A4\u30C8'),
        React.createElement('div',{style:{display:'flex',height:22,borderRadius:8,overflow:'hidden',marginBottom:6}},
          AXES.map(ax=>React.createElement('div',{key:ax.k,style:{flex:w[ax.k],background:ax.co,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}},
            w[ax.k]>=12&&React.createElement('span',{style:{fontSize:7.5,color:'#fff',fontWeight:700,whiteSpace:'nowrap',padding:'0 2px'}},ax.lb.split(' ')[0]+' '+w[ax.k]+'%')
          ))
        ),
        React.createElement('div',{style:{fontSize:8.5,color:'#7a1a3a',background:'#fce4ec',borderRadius:8,padding:'6px 10px',lineHeight:1.7,border:'1px solid #f8bbd0'}},
          '\uD83C\uDFAA\uD83C\uDFE5 \u30B5\u30DD\u30FC\u30C8\u30FB\u533B\u7642\u306E\u4E2D\u8EAB: ',React.createElement('span',{style:{color:'#c2185b',fontWeight:700}},ML[key])
        )
      ),
      React.createElement('button',{onClick:()=>key&&setPhase('map'),disabled:!key,style:{width:'100%',padding:'15px',borderRadius:16,border:'none',cursor:key?'pointer':'not-allowed',background:key?'linear-gradient(135deg,'+lc+','+dc+')':'#ccc',color:'#fff',fontSize:14,fontWeight:900,boxShadow:key?'0 6px 18px rgba(0,0,0,0.18)':'none',opacity:key?1:0.5}},
        key?'\uD83D\uDDFA \u30DE\u30C3\u30D7\u3092\u898B\u308B \u2192':'\u2460\u3068\u2461\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044'
      )
    ),
    React.createElement('div',{style:{padding:'6px',fontSize:7.5,color:'#aabcaa',textAlign:'center'}},'\uD83D\uDCCA OSM/\u56FD\u571F\u6570\u5024\u60C5\u5831/e-Stat\u63A8\u5B9A\u5024 \u26A0\uFE0F \u30C7\u30FC\u30BF\u306F\u6708\u6B21\u81EA\u52D5\u66F4\u65B0')
  );

  return React.createElement('div',{style:{display:'flex',flexDirection:'column',height:'100dvh',overflow:'hidden'}},
    React.createElement('div',{style:{background:'#fff',borderBottom:'1px solid #dde4dd',padding:'5px 10px',flexShrink:0}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:5,marginBottom:5}},
        React.createElement('button',{onClick:()=>{setPhase('select');setSel(null);},style:{background:'none',border:'1px solid #dde4dd',borderRadius:8,padding:'2px 7px',fontSize:8.5,cursor:'pointer',color:'#5a7a5a'}},'\u2190 \u9078\u3073\u76F4\u3059'),
        React.createElement('span',{style:{fontSize:12,fontWeight:900,color:'#1b5e20'}},'\uD83D\uDC15 INUMAP'),
        React.createElement('span',{style:{fontSize:8,color:'#aac0aa'}},'Beta'),
        React.createElement('span',{style:{fontSize:8.5,fontWeight:700,padding:'2px 7px',borderRadius:10,background:lc+'18',color:lc,border:'1px solid '+lc+'44'}},LS[life].em+life+' x '+DG[dog].em+dog)
      ),
      React.createElement('div',{style:{display:'flex',height:26,borderRadius:6,overflow:'hidden',marginBottom:0}},
        AXES.map(ax=>React.createElement('div',{key:ax.k,style:{flex:w[ax.k],background:ax.co,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}},
          w[ax.k]>=12&&React.createElement('span',{style:{fontSize:8,color:'#fff',fontWeight:700,whiteSpace:'nowrap',padding:'0 2px'}},ax.lb.split(' ')[0]+' '+w[ax.k]+'%')
        ))
      )
    ),
    React.createElement('div',{style:{flex:1,position:'relative',overflow:'hidden'}},
      React.createElement(MapView,{scored,selId:sel,onSel:setSel,flood}),
      React.createElement('div',{style:{position:'absolute',top:8,left:8,background:'rgba(255,255,255,0.92)',borderRadius:8,padding:'8px 11px',zIndex:1000,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}},
        React.createElement('div',{style:{fontSize:7,fontWeight:700,color:'#2e7d32',marginBottom:5}},'SCORE'),
        [{d:66,l:'S 65+'},{d:60,l:'A 58-64'},{d:53,l:'B 50-57'},{d:45,l:'C 42-49'},{d:38,l:'D ~41'}].map(item=>{const s=gs(item.d);return React.createElement('div',{key:item.l,style:{display:'flex',alignItems:'center',gap:5,marginBottom:4}},
          React.createElement('div',{style:{width:11,height:11,borderRadius:'50%',background:s.c}}),
          React.createElement('span',{style:{fontSize:8.5,color:'#3a5a3a'}},item.l)
        );}),
        React.createElement('div',{style:{marginTop:8,marginBottom:8,borderTop:'1px solid #dde4dd'}}),
        React.createElement('button',{onClick:()=>setFlood(f=>!f),style:{width:'100%',padding:'5px 0',borderRadius:20,border:'2px solid '+(flood?'#d32f2f':'#bbb'),background:flood?'rgba(211,47,47,0.12)':'rgba(200,200,200,0.18)',color:flood?'#d32f2f':'#888',fontSize:9,fontWeight:700,cursor:'pointer',boxShadow:flood?'0 0 6px rgba(211,47,47,0.25)':'none'}},'\uD83C\uDF0A '+(flood?'\u6D2A\u6C34 ON':'\u6D2A\u6C34')),
        React.createElement('div',{style:{marginTop:8,marginBottom:5,borderTop:'1px solid #dde4dd'}}),
        React.createElement('div',{style:{fontSize:7,fontWeight:700,color:'#2e7d32',marginBottom:4}},'TOP 5'),
        sorted.slice(0,5).map((d,i)=>{const s=gs(d.dev);const iS=d.id===sel;return React.createElement('div',{key:d.id,onClick:()=>setSel(iS?null:d.id),style:{display:'flex',alignItems:'center',gap:4,padding:'2px 4px',borderRadius:5,cursor:'pointer',marginBottom:2,background:iS?s.c+'18':'transparent',border:'1px solid '+(iS?s.c:'transparent')}},
          React.createElement('span',{style:{fontSize:7.5,color:'#aaa',width:8}},i+1),
          React.createElement('span',{style:{width:13,height:13,borderRadius:3,background:s.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:900,color:'#fff',flexShrink:0}},s.b),
          React.createElement('span',{style:{fontSize:8.5,fontWeight:700,color:'#2a3a2a',whiteSpace:'nowrap'}},d.name),
          React.createElement('span',{style:{fontSize:10,fontWeight:900,color:s.c,marginLeft:'auto'}},d.dev)
        );})
      ),
      selA&&React.createElement('div',{style:{position:'absolute',top:0,right:0,width:'72%',maxWidth:290,height:'100%',background:'rgba(255,255,255,0.97)',borderLeft:'1px solid #dde4dd',boxShadow:'-4px 0 14px rgba(0,0,0,0.1)',display:'flex',flexDirection:'column',overflow:'hidden',zIndex:1000}},
        React.createElement('button',{onClick:()=>setSel(null),style:{position:'absolute',top:8,right:8,width:24,height:24,borderRadius:'50%',border:'none',background:'#eef2ee',color:'#6a8a6a',cursor:'pointer',fontSize:13,fontWeight:700}},'x'),
        React.createElement('div',{style:{flex:1,overflow:'auto',padding:'12px'}},
          React.createElement('div',{style:{fontSize:8,color:'#8a9a8a',marginBottom:1}},'#'+selR+'\u4F4D\u3000'+selA.line),
          React.createElement('div',{style:{fontSize:17,fontWeight:900,color:'#1a2a1a',marginBottom:3}},selA.name+'\u99C5'),
          React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:10}},
            React.createElement('div',{style:{fontSize:42,fontWeight:900,color:gs(selA.dev).c,lineHeight:1}},selA.dev),
            React.createElement('span',{style:{fontSize:10,fontWeight:900,color:'#fff',background:gs(selA.dev).c,padding:'3px 9px',borderRadius:6}},gs(selA.dev).b+' \u30E9\u30F3\u30AF')
          ),
          flood&&selA.fl&&React.createElement('div',{style:{marginBottom:10,padding:'5px 8px',background:'#fff3f3',borderLeft:'3px solid #d32f2f',borderRadius:'0 6px 6px 0',fontSize:8.5,color:'#7a2a2a'}},'\uD83C\uDF0A \u6D2A\u6C34\u30EA\u30B9\u30AF: '+FL[selA.fl]),
          AXES.map(ax=>{const v=selA[ax.k]||0;return React.createElement('div',{key:ax.k,style:{marginBottom:5}},
            React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:8.5,color:'#4a6a4a',marginBottom:1.5}},
              React.createElement('span',null,ax.lb,React.createElement('span',{style:{fontSize:6.5,background:ax.co+'18',color:ax.co,padding:'1px 3px',borderRadius:6,fontWeight:700,marginLeft:3}},'x'+w[ax.k]+'%')),
              React.createElement('span',{style:{fontWeight:900,color:ax.co,fontSize:10.5}},v)
            ),
            React.createElement('div',{style:{height:3.5,background:'#eef2ee',borderRadius:2,overflow:'hidden'}},
              React.createElement('div',{style:{height:'100%',width:v+'%',background:ax.co,borderRadius:2}})
            )
          );}),
          selA.facilities&&React.createElement('div',{style:{marginTop:8,padding:'8px 10px',background:'#f8f8f8',borderRadius:6,fontSize:8.5,color:'#3a3a3a',lineHeight:1.8}},
            React.createElement('div',{style:{fontWeight:700,marginBottom:4,color:'#2e7d32'}},'\uD83D\uDCCD \u5468\u8FBA\u65BD\u8A2D'),
            selA.facilities.parks&&React.createElement('div',null,'\uD83C\uDF33 '+selA.facilities.parks.join('\u30FB')),
            selA.facilities.shops&&React.createElement('div',null,'\uD83D\uDED2 '+selA.facilities.shops.join('\u30FB')),
            selA.facilities.vets&&React.createElement('div',null,'\uD83C\uDFE5 '+selA.facilities.vets.join('\u30FB')),
            selA.facilities.cafes&&React.createElement('div',null,'\u2615 '+selA.facilities.cafes.join('\u30FB'))
          ),
          React.createElement('div',{style:{marginTop:8,padding:'8px 10px',background:dog==='X'?'#fce4ec':dog==='Y'?'#e8f5e9':'#fff3e0',borderLeft:'3px solid '+(dog==='X'?'#c2185b':dog==='Y'?'#2e7d32':'#e65100'),borderRadius:'0 6px 6px 0',fontSize:11,lineHeight:1.9}},
            (comments[selA.id]&&comments[selA.id][dog]
              ?['walk','housing','medical','mobility','community'].map((k,i)=>React.createElement('div',{key:i,style:{marginBottom:10}},
                  React.createElement('div',{style:{fontWeight:700,fontSize:10,color:dog==='X'?'#c2185b':dog==='Y'?'#2e7d32':'#e65100',marginBottom:2}},
                    k==='walk'?'\uD83D\uDC3E \u6563\u6B69\u30FB\u5B89\u5168':k==='housing'?'\uD83C\uDFE0 \u4F4F\u74B0\u5883':k==='medical'?'\uD83C\uDFE5 \u533B\u7642\u30FB\u30B5\u30DD\u30FC\u30C8':k==='mobility'?'\uD83D\uDE97 \u79FB\u52D5':'\uD83D\uDC65 \u5730\u57DF'
                  ),
                  React.createElement('div',null,comments[selA.id][dog][k])
                ))
              :getNote(selA,key).map((l,i)=>React.createElement('div',{key:i,style:{marginBottom:8}},'・'+l)))
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
