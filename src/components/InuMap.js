'use client';
import { useState, useMemo } from 'react';
import {
  AREAS, WEIGHTS, AXES, LIFESTYLE, DOG_TYPES,
  MEDICAL_LABELS, FLOOD_COLORS, FLOOD_LABELS,
  calcScores, scoreStyle, getAreaNote,
} from '../lib/data';

const SW=520, SH=560, L0=139.820, L1=139.910, A0=35.755, A1=35.618;
const xy = (la,ln) => ({x:(ln-L0)/(L1-L0)*SW, y:(la-A0)/(A1-A0)*SH});

function MapBG() {
  const sts=[{n:"小岩",x:415,y:26},{n:"平井",x:92,y:138},{n:"篠崎",x:390,y:118},
    {n:"一之江",x:333,y:238},{n:"船堀",x:250,y:244},{n:"西葛西",x:178,y:296},
    {n:"葛西",x:288,y:296},{n:"北葛西",x:296,y:262},{n:"鹿骨",x:200,y:220},
    {n:"松江",x:270,y:218},{n:"清新町",x:196,y:338}];
  return (
    <g>
      <rect x={0} y={0} width={SW} height={SH} fill="#e8ebe8"/>
      <path d="M28,0 C28,150 20,320 12,560" fill="none" stroke="#b8d4ec" strokeWidth={22} strokeLinecap="round" opacity={0.9}/>
      <path d="M504,0 C502,150 496,320 488,560" fill="none" stroke="#b8d4ec" strokeWidth={16} strokeLinecap="round" opacity={0.9}/>
      <rect x={0} y={510} width={SW} height={50} fill="#c4d8ec" opacity={0.85}/>
      <text x={260} y={538} textAnchor="middle" fontSize={11} fill="#5a8aaa" fontWeight={500}>東京湾</text>
      <path d="M218,0 C222,150 228,320 234,510" fill="none" stroke="#ccdde8" strokeWidth={9} strokeLinecap="round" opacity={0.8}/>
      <path d="M308,0 C312,150 318,320 322,510" fill="none" stroke="#ccdde8" strokeWidth={7} strokeLinecap="round" opacity={0.7}/>
      <path d="M30,190 C200,186 400,183 504,182" fill="none" stroke="#d0c8c0" strokeWidth={3} opacity={0.6}/>
      <path d="M30,290 C200,286 400,283 504,282" fill="none" stroke="#d0c8c0" strokeWidth={2.5} opacity={0.5}/>
      <path d="M80,0 C83,150 88,320 92,510" fill="none" stroke="#d0c8c0" strokeWidth={3} opacity={0.55}/>
      <ellipse cx={375} cy={524} rx={55} ry={14} fill="#c4ddb8" opacity={0.85}/>
      <text x={375} y={528} textAnchor="middle" fontSize={8} fill="#3a6a32">葛西臨海公園</text>
      <ellipse cx={400} cy={74} rx={26} ry={12} fill="#c4ddb8" opacity={0.85}/>
      <text x={400} y={78} textAnchor="middle" fontSize={7} fill="#3a6a32">篠崎公園</text>
      {sts.map(s=>(
        <g key={s.n}>
          <circle cx={s.x} cy={s.y} r={3.5} fill="#fff" stroke="#777" strokeWidth={1}/>
          <text x={s.x+5} y={s.y+3.5} fontSize={8} fill="#444" fontWeight={600}>{s.n}</text>
        </g>
      ))}
    </g>
  );
}
export default function InuMap() {
  const [life, setLife] = useState(null);
  const [dog,  setDog]  = useState(null);
  const [sel,  setSel]  = useState(null);
  const [tip,  setTip]  = useState(null);
  const [flood,setFlood]= useState(false);
  const [phase,setPhase]= useState('select');

  const key = life && dog ? life+dog : null;
  const w   = key ? WEIGHTS[key] : null;
  const lc  = life ? LIFESTYLE[life].co : '#2e7d32';
  const dc  = dog  ? DOG_TYPES[dog].co  : '#2e7d32';

  const scored = useMemo(()=> w ? calcScores(AREAS, w) : [], [key]);
  const sorted = useMemo(()=> [...scored].sort((a,b)=>b.dev-a.dev), [scored]);
  const selA   = sel ? scored.find(d=>d.id===sel) : null;
  const selR   = selA ? sorted.findIndex(d=>d.id===sel)+1 : null;

  if (phase === 'select') return (
    <div style={{height:'100dvh',background:'linear-gradient(160deg,#f0f7f0,#e8f0e8)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'16px 20px 8px',textAlign:'center',flexShrink:0}}>
        <div style={{fontSize:28,marginBottom:2}}>🐕</div>
        <div style={{fontSize:20,fontWeight:900,color:'#1b5e20',letterSpacing:1}}>INUMAP TOKYO</div>
        <div style={{fontSize:10,color:'#7a9a7a',marginTop:2}}>江戸川区 丁目レベル 犬連れスコア — Phase 1 Beta</div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'0 14px 12px'}}>
        <div style={{fontSize:11,fontWeight:700,color:'#5a7a5a',marginBottom:7}}>① あなたのライフスタイルは？</div>
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          {Object.entries(LIFESTYLE).map(([k,v])=>(
            <div key={k} onClick={()=>setLife(k)} style={{flex:1,padding:'14px 10px',borderRadius:16,cursor:'pointer',textAlign:'center',border:'2.5px solid '+(life===k?v.co:'#dde8dd'),background:life===k?v.co+'14':'#fff',boxShadow:life===k?'0 4px 14px '+v.co+'30':'0 1px 4px rgba(0,0,0,0.05)',transition:'all 0.18s'}}>
              <div style={{fontSize:26,marginBottom:5}}>{v.em}</div>
              <div style={{fontSize:11,fontWeight:800,color:life===k?v.co:'#4a6a4a',marginBottom:4}}>{k}. {v.lb}</div>
              <div style={{fontSize:9,color:'#8a9a8a',lineHeight:1.5}}>{v.de}</div>
              {life===k&&<div style={{marginTop:7,width:22,height:22,borderRadius:'50%',background:v.co,color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',margin:'7px auto 0'}}>✓</div>}
            </div>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:'#5a7a5a',marginBottom:7}}>② 愛犬のタイプは？</div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {Object.entries(DOG_TYPES).map(([k,v])=>(
            <div key={k} onClick={()=>setDog(k)} style={{flex:1,padding:'12px 6px',borderRadius:14,cursor:'pointer',textAlign:'center',border:'2.5px solid '+(dog===k?v.co:'#dde8dd'),background:dog===k?v.co+'14':'#fff',boxShadow:dog===k?'0 4px 12px '+v.co+'30':'0 1px 4px rgba(0,0,0,0.05)',transition:'all 0.18s'}}>
              <div style={{fontSize:22,marginBottom:3}}>{v.em}</div>
              <div style={{fontSize:10,fontWeight:800,color:dog===k?v.co:'#4a6a4a',marginBottom:3}}>{k}. {v.lb}</div>
              <div style={{fontSize:8.5,color:'#8a9a8a',lineHeight:1.4}}>{v.de}</div>
              {dog===k&&<div style={{marginTop:5,width:18,height:18,borderRadius:'50%',background:v.co,color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',margin:'5px auto 0'}}>✓</div>}
            </div>
          ))}
        </div>
        {key&&(
          <div style={{background:'#fff',borderRadius:14,padding:'12px 14px',marginBottom:14,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:'#2e7d32',marginBottom:8}}>あなたの評価ウェイト</div>
            <div style={{display:'flex',height:22,borderRadius:8,overflow:'hidden',marginBottom:6}}>
              {AXES.map(ax=>(<div key={ax.k} style={{flex:w[ax.k],background:ax.co,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}}>
                {w[ax.k]>=12&&<span style={{fontSize:7.5,color:'#fff',fontWeight:700,whiteSpace:'nowrap',padding:'0 2px'}}>{ax.lb.split(' ')[0]} {w[ax.k]}%</span>}
              </div>))}
            </div>
            <div style={{fontSize:8.5,color:'#7a1a3a',background:'#fce4ec',borderRadius:8,padding:'6px 10px',lineHeight:1.7,border:'1px solid #f8bbd0'}}>
              🎪🏥 サポート・医療の中身: <span style={{color:'#c2185b',fontWeight:700}}>{MEDICAL_LABELS[key]}</span>
            </div>
          </div>
        )}
        <button onClick={()=>key&&setPhase('map')} disabled={!key} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',cursor:key?'pointer':'not-allowed',background:key?`linear-gradient(135deg,${lc},${dc})`:'#ccc',color:'#fff',fontSize:14,fontWeight:900,letterSpacing:1,boxShadow:key?'0 6px 18px rgba(0,0,0,0.18)':'none',opacity:key?1:0.5}}>
          {key?'🗺️ マップを見る →':'①と②を選んでください'}
        </button>
      </div>
      <div style={{padding:'6px',fontSize:7.5,color:'#aabcaa',textAlign:'center'}}>📊 OSM/国土数値情報/e-Stat推定値 ⚠️ Phase2実データ化予定</div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',background:'#f0f2f0',overflow:'hidden'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #dde4dd',padding:'5px 10px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
          <button onClick={()=>{setPhase('select');setSel(null);}} style={{background:'none',border:'1px solid #dde4dd',borderRadius:8,padding:'2px 7px',fontSize:8.5,cursor:'pointer',color:'#5a7a5a'}}>← 選び直す</button>
          <span style={{fontSize:12,fontWeight:900,color:'#1b5e20'}}>🐕 INUMAP</span>
          <span style={{fontSize:8,color:'#aac0aa'}}>江戸川区β</span>
          <span style={{fontSize:8.5,fontWeight:700,padding:'2px 7px',borderRadius:10,background:lc+'18',color:lc,border:'1px solid '+lc+'44'}}>{LIFESTYLE[life].em}{life} × {DOG_TYPES[dog].em}{dog}</span>
          <button onClick={()=>setFlood(f=>!f)} style={{marginLeft:'auto',padding:'3px 9px',borderRadius:10,border:'1.5px solid '+(flood?'#d32f2f':'#dde4dd'),background:flood?'#ffebee':'#f5f5f5',color:flood?'#d32f2f':'#888',fontSize:8.5,fontWeight:700,cursor:'pointer'}}>🌊 洪水{flood?'ON':''}</button>
        </div>
        <div style={{display:'flex',height:18,borderRadius:6,overflow:'hidden',marginBottom:4}}>
          {AXES.map(ax=>(<div key={ax.k} style={{flex:w[ax.k],background:ax.co,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}}>
            {w[ax.k]>=12&&<span style={{fontSize:7,color:'#fff',fontWeight:700,whiteSpace:'nowrap',padding:'0 2px'}}>{ax.lb.split(' ')[0]} {w[ax.k]}%</span>}
          </div>))}
        </div>
        <div style={{display:'flex',gap:4,overflowX:'auto',alignItems:'center'}}>
          <span style={{fontSize:7,fontWeight:700,color:'#2e7d32',whiteSpace:'nowrap',flexShrink:0}}>TOP</span>
          {sorted.slice(0,5).map((d,i)=>{const s=scoreStyle(d.dev);const iS=d.id===sel;return(
            <div key={d.id} onClick={()=>setSel(iS?null:d.id)} style={{display:'flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:7,cursor:'pointer',flexShrink:0,background:iS?s.c+'1a':'#f8f8f8',border:'1.5px solid '+(iS?s.c:'#e8e8e8'),transition:'all 0.12s'}}>
              <span style={{fontSize:7.5,color:'#aaa'}}>{i+1}</span>
              <span style={{width:14,height:14,borderRadius:3,background:s.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:900,color:'#fff'}}>{s.b}</span>
              <span style={{fontSize:9,fontWeight:700,color:'#2a3a2a',whiteSpace:'nowrap'}}>{d.n}</span>
              <span style={{fontSize:11,fontWeight:900,color:s.c}}>{d.dev}</span>
            </div>
          );})}
        </div>
      </div>
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        <svg viewBox={`0 0 ${SW} ${SH}`} style={{width:'100%',height:'100%'}} preserveAspectRatio="xMidYMid meet">
          <MapBG/>
          {flood&&scored.map(d=>{const {x,y}=xy(d.la,d.ln);return d.fl?<rect key={d.id+'f'} x={x-11} y={y-11} width={22} height={22} rx={3} fill={FLOOD_COLORS[d.fl]} stroke="none"/>:null;})}
          {scored.map(d=>{const {x,y}=xy(d.la,d.ln);const s=scoreStyle(d.dev);const iS=d.id===sel;return(
            <g key={d.id} style={{cursor:'pointer'}} onClick={()=>setSel(iS?null:d.id)} onMouseEnter={()=>!iS&&setTip({...d,x,y,s})} onMouseLeave={()=>setTip(null)}>
              {iS&&<circle cx={x} cy={y} r={19} fill={s.c} opacity={0.12}/>}
              <circle cx={x} cy={y} r={iS?12:8} fill={s.c} opacity={iS?1:0.85} stroke={iS?'#fff':'rgba(255,255,255,0.5)'} strokeWidth={iS?2:0.8}/>
              <text x={x} y={y+3.5} textAnchor="middle" fontSize={iS?8:6} fontWeight={900} fill="#fff" style={{pointerEvents:'none'}}>{s.b}</text>
            </g>
          );})}
          {tip&&tip.id!==sel&&(
            <g>
              <rect x={Math.min(tip.x+13,SW-122)} y={tip.y-46} width={118} height={tip.fl&&flood?50:36} rx={5} fill="rgba(255,255,255,0.97)" stroke="#ccc" strokeWidth={0.8}/>
              <text x={Math.min(tip.x+19,SW-116)} y={tip.y-28} fontSize={10} fontWeight={700} fill="#222">{tip.n}</text>
              <text x={Math.min(tip.x+19,SW-116)} y={tip.y-14} fontSize={9} fill={tip.s.c} fontWeight={700}>偏差値 {tip.dev}　{tip.s.b}ランク</text>
              {tip.fl&&flood&&<text x={Math.min(tip.x+19,SW-116)} y={tip.y} fontSize={8} fill="#d32f2f">🌊 {FLOOD_LABELS[tip.fl]}</text>}
            </g>
          )}
        </svg>
        <div style={{position:'absolute',top:8,left:8,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(4px)',border:'1px solid rgba(200,210,200,0.5)',borderRadius:8,padding:'6px 9px'}}>
          <div style={{fontSize:6.5,fontWeight:700,letterSpacing:2,color:'#2e7d32',marginBottom:4}}>SCORE</div>
          {[{d:66,l:'S 65+'},{d:60,l:'A 58-64'},{d:53,l:'B 50-57'},{d:45,l:'C 42-49'},{d:38,l:'D ~41'}].map(item=>{const s=scoreStyle(item.d);return(
            <div key={item.l} style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:s.c}}/>
              <span style={{fontSize:7.5,color:'#3a5a3a'}}>{item.l}</span>
            </div>
          );})}
          {flood&&(<div style={{marginTop:5,paddingTop:5,borderTop:'1px solid #eee'}}>
            <div style={{fontSize:6.5,fontWeight:700,color:'#d32f2f',marginBottom:3}}>🌊 洪水深</div>
            {Object.entries(FLOOD_LABELS).map(([lv,lb])=>(<div key={lv} style={{display:'flex',alignItems:'center',gap:3,marginBottom:1}}>
              <div style={{width:9,height:6,borderRadius:1,background:FLOOD_COLORS[lv]?.replace('0.5','0.9').replace('0.55','0.9')}}/>
              <span style={{fontSize:7,color:'#5a3a3a'}}>{lb}</span>
            </div>))}
            <div style={{fontSize:6,color:'#aaa',marginTop:2}}>出典:国土数値情報</div>
          </div>)}
        </div>
        {selA&&(()=>{const s=scoreStyle(selA.dev);const notes=getAreaNote(selA.id,key);const isX=dog==='X';const panelBg=isX?'#fce4ec':dog==='Y'?'#e8f5e9':'#fff3e0';const panelBorder=isX?'#c2185b':dog==='Y'?'#2e7d32':'#e65100';return(
          <div style={{position:'absolute',top:0,right:0,width:248,height:'100%',background:'rgba(255,255,255,0.97)',borderLeft:'1px solid #dde4dd',boxShadow:'-4px 0 14px rgba(0,0,0,0.1)',display:'flex',flexDirection:'column',overflow:'hidden',zIndex:10}}>
            <button onClick={()=>setSel(null)} style={{position:'absolute',top:8,right:8,width:22,height:22,borderRadius:'50%',border:'none',background:'#eef2ee',color:'#6a8a6a',cursor:'pointer',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            <div style={{flex:1,overflow:'auto',padding:'12px 12px 10px'}}>
              <div style={{fontSize:8.5,color:'#8a9a8a',marginBottom:2}}>#{selR}位 / {LIFESTYLE[life].em}{life} × {DOG_TYPES[dog].em}{dog}</div>
              <div style={{fontSize:16,fontWeight:900,color:'#1a2a1a',marginBottom:3}}>{selA.n}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{fontSize:40,fontWeight:900,color:s.c,lineHeight:1}}>{selA.dev}</div>
                <span style={{fontSize:10,fontWeight:900,color:'#fff',background:s.c,padding:'3px 9px',borderRadius:6}}>{s.b} ランク</span>
              </div>
              {selA.fl&&flood&&(<div style={{marginBottom:10,padding:'5px 8px',background:'#fff3f3',borderLeft:'3px solid #d32f2f',borderRadius:'0 6px 6px 0',fontSize:8.5,color:'#7a2a2a'}}>🌊 洪水リスク: <strong>{FLOOD_LABELS[selA.fl]}</strong></div>)}
              {AXES.map(ax=>{const v=selA[ax.k]||0;return(
                <div key={ax.k} style={{marginBottom:5}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:8.5,color:'#4a6a4a',marginBottom:1.5}}>
                    <span>{ax.lb}<span style={{fontSize:6.5,background:ax.co+'18',color:ax.co,padding:'1px 3px',borderRadius:6,fontWeight:700,marginLeft:3}}>×{w[ax.k]}%</span></span>
                    <span style={{fontWeight:900,color:ax.co,fontSize:10.5}}>{v}</span>
                  </div>
                  <div style={{height:3.5,background:'#eef2ee',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:v+'%',background:ax.co,borderRadius:2}}/></div>
                </div>
              );})}
              <div style={{marginTop:8,padding:'8px 10px',background:panelBg,borderLeft:'3px solid '+panelBorder,borderRadius:'0 6px 6px 0',fontSize:8.5,color:'#2a2a2a',lineHeight:1.8}}>
                {notes.map((l,i)=><div key={i}>・{l}</div>)}
              </div>
            </div>
          </div>
        );})()} 
        <div style={{position:'absolute',bottom:4,left:4,background:'rgba(255,255,255,0.7)',borderRadius:4,padding:'2px 5px',fontSize:6.5,color:'#8a9a8a'}}>📊 OSM/国土数値情報/e-Stat推定 ⚠️ Phase2予定</div>
      </div>
    </div>
  );
}
