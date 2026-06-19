import { useState, useEffect, useRef } from "react";

const TN=[{id:'A',x:78,y:185,label:'A'},{id:'B',x:210,y:75,label:'B'},{id:'C',x:274,y:292,label:'C'},{id:'D',x:428,y:75,label:'D'},{id:'E',x:466,y:292,label:'E'},{id:'F',x:572,y:185,label:'F'}];
const TE=[{id:'AB',from:'A',to:'B',w:4},{id:'AC',from:'A',to:'C',w:2},{id:'BC',from:'B',to:'C',w:5},{id:'BD',from:'B',to:'D',w:10},{id:'CE',from:'C',to:'E',w:3},{id:'DE',from:'D',to:'E',w:4},{id:'DF',from:'D',to:'F',w:11},{id:'EF',from:'E',to:'F',w:7}];
// 10-node graph for Ch5
const TN5=[{id:'A',x:70,y:90,label:'A'},{id:'B',x:225,y:55,label:'B'},{id:'C',x:395,y:55,label:'C'},{id:'D',x:570,y:90,label:'D'},{id:'E',x:95,y:230,label:'E'},{id:'F',x:260,y:215,label:'F'},{id:'G',x:425,y:215,label:'G'},{id:'H',x:580,y:215,label:'H'},{id:'I',x:225,y:360,label:'I'},{id:'J',x:500,y:360,label:'J'}];
const TE5=[{id:'AB',from:'A',to:'B',w:5},{id:'AE',from:'A',to:'E',w:3},{id:'BC',from:'B',to:'C',w:4},{id:'BF',from:'B',to:'F',w:2},{id:'CD',from:'C',to:'D',w:6},{id:'CG',from:'C',to:'G',w:3},{id:'DH',from:'D',to:'H',w:4},{id:'EF',from:'E',to:'F',w:5},{id:'EI',from:'E',to:'I',w:8},{id:'FG',from:'F',to:'G',w:4},{id:'FI',from:'F',to:'I',w:3},{id:'GH',from:'G',to:'H',w:5},{id:'GJ',from:'G',to:'J',w:7},{id:'HJ',from:'H',to:'J',w:6},{id:'IJ',from:'I',to:'J',w:4}];

function dijkstra(nodes,edges,sid){
  const d={},p={};
  nodes.forEach(n=>{d[n.id]=n.id===sid?0:Infinity;p[n.id]=null;});
  const uv=new Set(nodes.map(n=>n.id));
  const steps=[];
  const mk=(extra={})=>({visited:new Set(nodes.map(n=>n.id).filter(id=>!uv.has(id))),dist:{...d},prev:{...p},...extra});
  steps.push({phase:'init',current:null,updated:[],checking:null,checkEdge:null,...mk()});
  while(uv.size>0){
    let cur=null,mn=Infinity;
    uv.forEach((id: string)=>{if(d[id]<mn){mn=d[id];cur=id;}});
    if(!cur)break;
    // step1: 選択（このノードを次に確定すると宣言）
    steps.push({phase:'select',current:cur,updated:[],checking:null,checkEdge:null,...mk()});
    uv.delete(cur);
    const upd=[];
    const nbs=[];
    edges.forEach(e=>{
      const nb=e.from===cur?e.to:e.to===cur?e.from:null;
      if(nb&&uv.has(nb))nbs.push({nb,edge:e});
    });
    // step2: 隣接ノードを1つずつチェック
    nbs.forEach(({nb,edge})=>{
      const prevDist=d[nb];
      const nd=d[cur]+edge.w;
      const improved=nd<prevDist;
      if(improved){d[nb]=nd;p[nb]=cur;upd.push(nb);}
      steps.push({phase:'check_nb',current:cur,updated:[...upd],checking:nb,checkEdge:edge.id,improved,proposedDist:nd,prevDist,curDist:mn,edgeW:edge.w,...mk()});
    });
    // step3: 確定完了
    steps.push({phase:'done',current:cur,updated:[...upd],checking:null,checkEdge:null,...mk()});
  }
  return steps;
}
function gPath(prev,start,goal){
  if(!prev||!goal)return[];
  const path=[];let c=goal;const s=new Set();
  while(c&&!s.has(c)){s.add(c);path.unshift(c);c=prev[c];}
  return path[0]===start?path:[];
}
function onEP(e,path){
  for(let i=0;i<path.length-1;i++)
    if((path[i]===e.from&&path[i+1]===e.to)||(path[i]===e.to&&path[i+1]===e.from))return true;
  return false;
}
function pCost(path,edges){
  return path.length<=1?0:path.reduce((a,id,i)=>{
    if(i===0)return 0;
    const e=edges.find(e=>(e.from===path[i-1]&&e.to===id)||(e.from===id&&e.to===path[i-1]));
    return a+(e?.w||0);
  },0);
}
function nCol(id,st,path,start,goal){
  if(!st||st.phase==='init'){if(id===start)return'#0017C1';if(id===goal)return'#BE0000';return'#64748B';}
  if(path.length>1&&path.includes(id))return'#0017C1';
  if(id===st.checking)return'#9B4FCC';
  if(id===st.current&&st.phase!=='done')return'#D85600';
  if(st.visited?.has(id))return'#1B6B38';
  if(st.updated?.includes(id))return'#7A5200';
  return'#64748B';
}

const CARD={background:'var(--color-background-primary)',borderRadius:'var(--border-radius-lg)',padding:'18px',border:'1px solid var(--color-border-secondary)',marginBottom:14};

function Note({type,children}){
  const s={info:{bg:'var(--color-background-info)',bl:'var(--color-border-info)',c:'var(--color-text-info)'},tip:{bg:'var(--color-background-success)',bl:'var(--color-border-success)',c:'var(--color-text-success)'},warn:{bg:'var(--color-background-warning)',bl:'var(--color-border-warning)',c:'var(--color-text-warning)'}}[type]||{bg:'var(--color-background-info)',bl:'var(--color-border-info)',c:'var(--color-text-info)'};
  return <div style={{background:s.bg,borderLeft:'3px solid '+s.bl,borderRadius:'0 8px 8px 0',padding:'12px 16px',marginBottom:14,color:s.c,fontSize:14,lineHeight:1.7}}>{children}</div>;
}

function StepMsg({st,nodes}){
  if(!st)return null;
  const fi=v=>v===Infinity?'\u221e':String(v);
  const lb=id=>(nodes||TN).find(n=>n.id===id)?.label||id;
  if(st.phase==='init')return(<div style={{fontSize:13,lineHeight:2}}><b>初期化</b><br/>スタートの距離 = 0<br/>その他のノード = ∞（未到達）</div>);
  return(
    <div style={{fontSize:13,lineHeight:2}}>
      <b>「{lb(st.current)}」を確定</b><br/>
      最短距離 = {fi(st.dist[st.current])}
      {st.updated.length>0&&(<><br/>隣接ノードを更新:<br/>{st.updated.map(id=>(<span key={id} style={{display:'block',paddingLeft:12}}>{lb(id)} → {fi(st.dist[id])}</span>))}</>)}
      {st.updated.length===0&&(<><br/>更新できるノードはなし</>)}
    </div>
  );
}

function GSvg({nodes,edges,st,path,start,goal,W=660,H=370,onN=undefined,onE=undefined,onBg=undefined,eSrc=undefined,mode=undefined,sRef=undefined}){
  const gn=id=>nodes.find(n=>n.id===id);
  const fi=v=>v===Infinity?'\u221e':String(v);
  return(
    <svg ref={sRef} viewBox={'0 0 '+W+' '+H} style={{width:'100%',height:'auto',display:'block',cursor:mode==='addNode'?'crosshair':'default'}} onClick={onBg}>
      {nodes.length===0&&<text x={W/2} y={H/2} textAnchor="middle" style={{fill:'var(--color-text-secondary)',fontSize:'14px'}}>クリックしてノードを追加</text>}
      {edges.map(e=>{
        const a=gn(e.from),b=gn(e.to);if(!a||!b)return null;
        const op=onEP(e,path),isCheck=st?.checkEdge===e.id,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,ox=-dy/l*16,oy=dx/l*16;
        const ec=isCheck?'#9B4FCC':op?'#0017C1':'var(--color-border-secondary)',ew=isCheck||op?3.5:1.5;
        return(
          <g key={e.id} onClick={ev=>onE&&onE(ev,e)} style={{cursor:mode==='delete'?'pointer':'default'}}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{stroke:ec,strokeWidth:ew,strokeLinecap:'round'}}/>
            <circle cx={mx+ox} cy={my+oy} r={14} style={{fill:isCheck?'#F3E8FF':op?'var(--color-background-info)':'var(--color-background-primary)',stroke:ec,strokeWidth:0.5}}/>
            <text x={mx+ox} y={my+oy} textAnchor="middle" dominantBaseline="central" style={{fill:ec,fontSize:'12px'}}>{e.w}</text>
          </g>
        );
      })}
      {eSrc&&(()=>{const n=gn(eSrc);return n?(<circle cx={n.x} cy={n.y} r={32} fill="none" style={{stroke:'#D85600',strokeWidth:2,strokeDasharray:'6,3'}}/>):null;})()}
      {nodes.map(n=>{
        const c=nCol(n.id,st,path,start,goal),iC=n.id===st?.current,iS=n.id===eSrc;
        const dv=st&&st.phase!=='init'?fi(st.dist[n.id]):null;
        return(
          <g key={n.id} onClick={ev=>onN&&onN(ev,n)} style={{cursor:mode&&mode!=='addNode'?'pointer':'default'}}>
            {dv!=null&&<text x={n.x} y={n.y-35} textAnchor="middle" style={{fill:st.updated?.includes(n.id)?'#D85600':'var(--color-text-secondary)',fontSize:'13px',fontWeight:st.updated?.includes(n.id)?500:400}}>{dv}</text>}
            {(iC||iS)&&<circle cx={n.x} cy={n.y} r={30} fill="none" style={{stroke:c,strokeWidth:1.5,opacity:0.4}}/>}
            <circle cx={n.x} cy={n.y} r={24} style={{fill:c,stroke:'var(--color-background-primary)',strokeWidth:2}}/>
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" style={{fill:'white',fontSize:'15px',fontWeight:500,pointerEvents:'none'}}>{n.label||n.id}</text>
            {(n.id===start||n.id===goal)&&<text x={n.x} y={n.y+37} textAnchor="middle" style={{fill:n.id===start?'#0017C1':'#BE0000',fontSize:'11px',pointerEvents:'none'}}>{n.id===start?'\u30b9\u30bf\u30fc\u30c8':'\u30b4\u30fc\u30eb'}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function DTable({nodes,st}){
  if(!st)return null;
  const fi=v=>v===Infinity?'\u221e':String(v);
  const gn=id=>nodes.find(n=>n.id===id);
  const TH={padding:'7px 10px',background:'var(--color-background-secondary)',color:'var(--color-text-secondary)',textAlign:'center' as const,fontWeight:500,fontSize:13,borderBottom:'1px solid var(--color-border-secondary)'};
  const TD={padding:'7px 10px',textAlign:'center' as const,fontSize:13};
  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><th style={{...TH,textAlign:'left' as const}}></th>{nodes.map(n=>(<th key={n.id} style={TH}>{n.label||n.id}</th>))}</tr></thead>
        <tbody>
          <tr>
            <td style={{...TD,color:'var(--color-text-secondary)',fontWeight:500}}>最短距離</td>
            {nodes.map(n=>{
              const iC=st.current===n.id&&st.phase!=='done',iU=st.updated?.includes(n.id),iV=st.visited?.has(n.id);
              let bg='transparent',col='var(--color-text-secondary)';
              if(iC){bg='var(--color-background-warning)';col='var(--color-text-warning)';}
              else if(iU){bg='var(--color-background-warning)';col='var(--color-text-warning)';}
              else if(iV){bg='var(--color-background-success)';col='var(--color-text-success)';}
              return (<td key={n.id} style={{...TD,background:bg,color:col,fontWeight:iC||iU?500:400}}>{fi(st.dist[n.id])}</td>);
            })}
          </tr>
          <tr>
            <td style={{...TD,color:'var(--color-text-secondary)',fontWeight:500}}>経由</td>
            {nodes.map(n=>{const pid=st.prev[n.id];return (<td key={n.id} style={{...TD,color:'var(--color-text-secondary)'}}>{pid?(gn(pid)?.label||pid):'\u2014'}</td>);})}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Legend(){
  const items=[['#0017C1','\u30b9\u30bf\u30fc\u30c8'],['#BE0000','\u30b4\u30fc\u30eb'],['#D85600','\u51e6\u7406\u4e2d'],['#9B4FCC','\u8abf\u67fb\u4e2d'],['#7A5200','\u66f4\u65b0'],['#1B6B38','\u78ba\u5b9a\u6e08\u307f'],['#64748B','\u672a\u8a2a\u554f']];
  return(<div style={{display:'flex',gap:12,flexWrap:'wrap',padding:'10px 16px',borderTop:'1px solid var(--color-border-tertiary)'}}>{items.map(([c,l])=>(<div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><div style={{width:10,height:10,borderRadius:'50%',background:c}}/><span style={{color:'var(--color-text-secondary)'}}>{l}</span></div>))}</div>);
}

function StepControls({si,total,play,onPrev,onNext,onPlay,onReset,extra=undefined}){
  return(
    <div style={{...CARD,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <button onClick={onReset} className="btn">↺</button>
      <button onClick={onPrev} disabled={si===0} className="btn">◀ 前へ</button>
      <button onClick={onNext} disabled={si>=total} className="btn btn-primary">次へ ▶</button>
      <button onClick={onPlay} className={play?"btn btn-danger":"btn btn-success"}>{play?'\u23f8 停止':'\u25b6 自動'}</button>
      <span style={{color:'var(--color-text-secondary)',fontSize:12,marginLeft:'auto'}}>{si}/{total}</span>
      {extra}
    </div>
  );
}

// ─── Tutorial Chapters ───────────────────────────

function Ch1(){
  const [showW,setShowW]=useState(false);
  return(
    <div>
      <Note type="info">「グラフ」と聞いて棒グラフを思い浮かべた人も多いはず。でもコンピュータサイエンスでいう「グラフ」は全く違います！</Note>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
        {[['#0017C1','🔵 ノード（節点）','点のこと。駅・都市・ウェブページなど「もの」を表します。'],['#1B6B38','➖ エッジ（辺）','線のこと。道路・路線・友達関係など「つながり」を表します。']].map(([c,t,d])=>(
          <div key={t} style={{border:'1px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-lg)',overflow:'hidden'}}>
            <div style={{background:c,padding:'8px 14px',color:'white',fontWeight:500,fontSize:15}}>{t}</div>
            <div style={{padding:'12px 14px',fontSize:14,color:'var(--color-text-secondary)',lineHeight:1.7}}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{...CARD,padding:0,overflow:'hidden'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid var(--color-border-tertiary)',fontSize:14,fontWeight:500}}>例：町の道路グラフ{showW&&<span style={{fontWeight:400,color:'var(--color-text-secondary)'}}> （数字＝移動時間・分）</span>}</div>
        <div style={{background:'var(--color-background-secondary)'}}>
          <svg viewBox="0 0 460 340" style={{width:'100%',height:'auto',display:'block'}}>
            {[{f:'H',t:'S',w:15},{f:'H',t:'P',w:5},{f:'P',t:'T',w:8},{f:'S',t:'T',w:10},{f:'S',t:'P',w:12}].map((e,i)=>{
              const ns={H:{x:110,y:140},S:{x:320,y:75},P:{x:110,y:265},T:{x:320,y:200}};
              const a=ns[e.f],b=ns[e.t],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,ox=-dy/l*14,oy=dx/l*14;
              return(<g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{stroke:'var(--color-border-secondary)',strokeWidth:2,strokeLinecap:'round'}}/>{showW&&<><circle cx={mx+ox} cy={my+oy} r={13} style={{fill:'var(--color-background-primary)',stroke:'var(--color-border-secondary)',strokeWidth:0.5}}/><text x={mx+ox} y={my+oy} textAnchor="middle" dominantBaseline="central" style={{fill:'var(--color-text-secondary)',fontSize:'11px'}}>{e.w}</text></>}</g>);
            })}
            {[{id:'H',x:110,y:140,icon:'🏠',lb:'家'},{id:'S',x:320,y:75,icon:'🏫',lb:'学校'},{id:'P',x:110,y:265,icon:'🌳',lb:'公園'},{id:'T',x:320,y:200,icon:'🚉',lb:'駅'}].map(n=>(
              <g key={n.id}><circle cx={n.x} cy={n.y} r={26} style={{fill:'var(--color-background-info)',stroke:'#0017C1',strokeWidth:1.5}}/><text x={n.x} y={n.y-1} textAnchor="middle" dominantBaseline="central" style={{fontSize:'18px'}}>{n.icon}</text><text x={n.x} y={n.y+48} textAnchor="middle" style={{fill:'var(--color-text-primary)',fontSize:'12px',fontWeight:500}}>{n.lb}</text></g>
            ))}
          </svg>
        </div>
        <div style={{padding:'12px 18px',borderTop:'1px solid var(--color-border-tertiary)',display:'flex',gap:8,justifyContent:'center'}}>
          <button onClick={()=>setShowW(p=>!p)} className={showW?"btn btn-primary":"btn"}>{showW?'重みを隠す':'重み（コスト）を表示 →'}</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
        {[['🗺️','地図アプリ','交差点＝ノード、道路＝エッジ、距離・時間＝重み'],['🚃','乗換案内','駅＝ノード、路線＝エッジ、所要時間＝重み'],['🌐','インターネット','ルーター＝ノード、ケーブル＝エッジ、速度＝重み'],['👥','SNS','人＝ノード、フォロー＝エッジ、親密度＝重み']].map(([icon,t,d])=>(
          <div key={t} style={{...CARD,marginBottom:0,padding:'12px 14px',display:'flex',gap:10}}><span style={{fontSize:20,lineHeight:1}}>{icon}</span><div><div style={{fontWeight:500,fontSize:14}}>{t}</div><div style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.5}}>{d}</div></div></div>
        ))}
      </div>
    </div>
  );
}

function Ch2(){
  const [rev,setRev]=useState(false);
  return(
    <div>
      <Note type="info">「最も少ないコストでゴールに着くには？」という問いを<b>最短経路問題</b>といいます。地図アプリや乗換案内が毎日解いている問題です。</Note>
      <div style={{...CARD,padding:0,overflow:'hidden'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid var(--color-border-tertiary)',fontSize:14,fontWeight:500}}>問題：A から F への最短経路は？</div>
        <div style={{background:'var(--color-background-secondary)'}}>
          <svg viewBox="0 0 660 355" style={{width:'100%',height:'auto',display:'block'}}>
            {TE.map(e=>{const a=TN.find(n=>n.id===e.from),b=TN.find(n=>n.id===e.to),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,ox=-dy/l*16,oy=dx/l*16,sp=rev&&['AC','CE','EF'].includes(e.id);return(<g key={e.id}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{stroke:sp?'#0017C1':'var(--color-border-secondary)',strokeWidth:sp?4:1.5,strokeLinecap:'round'}}/><circle cx={mx+ox} cy={my+oy} r={14} style={{fill:sp?'var(--color-background-info)':'var(--color-background-primary)',stroke:sp?'#0017C1':'var(--color-border-secondary)',strokeWidth:0.5}}/><text x={mx+ox} y={my+oy} textAnchor="middle" dominantBaseline="central" style={{fill:sp?'#0017C1':'var(--color-text-secondary)',fontSize:'12px'}}>{e.w}</text></g>);})}
            {TN.map(n=>{const iS=n.id==='A',iG=n.id==='F',sp=rev&&['A','C','E','F'].includes(n.id);return(<g key={n.id}><circle cx={n.x} cy={n.y} r={24} style={{fill:iS?'#0017C1':iG?'#BE0000':sp?'var(--color-background-info)':'var(--color-background-secondary)',stroke:iS?'#0017C1':iG?'#BE0000':sp?'#0017C1':'var(--color-border-secondary)',strokeWidth:1.5}}/><text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" style={{fill:iS||iG?'white':sp?'#0017C1':'var(--color-text-primary)',fontSize:'16px',fontWeight:500}}>{n.label}</text>{(iS||iG)&&<text x={n.x} y={n.y+36} textAnchor="middle" style={{fill:iS?'#0017C1':'#BE0000',fontSize:'11px'}}>{iS?'スタート':'ゴール'}</text>}</g>);})}
          </svg>
        </div>
        <div style={{padding:'12px 18px',borderTop:'1px solid var(--color-border-tertiary)',textAlign:'center'}}>
          <button onClick={()=>setRev(p=>!p)} className={rev?"btn":"btn btn-primary"}>{rev?'隠す':'最短経路を見る →'}</button>
          {rev&&<div style={{marginTop:10,padding:'10px',background:'var(--color-background-info)',borderRadius:'var(--border-radius-md)',fontSize:14,color:'var(--color-text-info)',fontWeight:500}}>A → C → E → F （コスト = 2+3+7 = 12）</div>}
        </div>
      </div>
      <Note type="warn"><b>問題点：</b>6ノードなら目で見てもわかります。でも100・1000ノードになると全ルートを試す「力ずく」は現実的ではありません。スマートなアルゴリズムが必要です！</Note>
      <Note type="tip"><b>アルゴリズムとは？</b> 問題を解くための手順書（レシピ）のことです。コンピュータはこの手順通りに高速で計算を実行します。</Note>
    </div>
  );
}

function Ch3(){
  const [step,setStep]=useState(0);
  const msgs=[
    <span>スタート S（距離=0）から探索開始。<br/>A への道：コスト 5、B への道：コスト 2。</span>,
    <span>未確定の中で<b>最も近い B（コスト 2）</b>を選択。<br/>なぜ B を確定できる？ → 次へ</span>,
    <span><b>B を確定！</b> 最短距離 = 2<br/>別ルートを考えると… S→A→B = 5+1 = 6 &gt; 2<br/>他のどんなルートも A（コスト5以上）を経由するので 2 未満には絶対なれません。<br/><b style={{color:'#1B6B38'}}>だから B の最短距離 = 2 は確実！</b></span>,
  ];
  const confB=step>=2;
  return(
    <div>
      <Note type="warn"><b>核心のアイデア：</b>「未確定ノードの中で今最も近いノードは、もうこれ以上近くなることはない。だから確定できる。」</Note>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{flex:'1 1 280px'}}>
          <div style={{...CARD,padding:0,overflow:'hidden'}}>
            <div style={{background:'var(--color-background-secondary)'}}>
              <svg viewBox="0 0 560 330" style={{width:'100%',height:'auto',display:'block'}}>
                {[{f:'S',t:'A',w:5},{f:'S',t:'B',w:2},{f:'A',t:'B',w:1},{f:'A',t:'C',w:3},{f:'B',t:'C',w:8}].map((e,i)=>{
                  const ns={S:{x:80,y:165},A:{x:275,y:75},B:{x:275,y:255},C:{x:465,y:165}};
                  const a=ns[e.f],b=ns[e.t],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,ox=-dy/l*15,oy=dx/l*15;
                  const alt=step>=2&&(e.f+e.t==='SA'||e.f+e.t==='AB'),conf=confB&&e.f+e.t==='SB';
                  return(<g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{stroke:alt?'#D85600':conf?'#0017C1':'var(--color-border-secondary)',strokeWidth:alt||conf?3:1.5,strokeDasharray:alt?'8,4':'none',strokeLinecap:'round'}}/><circle cx={mx+ox} cy={my+oy} r={13} style={{fill:conf?'var(--color-background-info)':'var(--color-background-primary)',stroke:alt?'#D85600':conf?'#0017C1':'var(--color-border-secondary)',strokeWidth:0.5}}/><text x={mx+ox} y={my+oy} textAnchor="middle" dominantBaseline="central" style={{fill:alt?'#D85600':conf?'#0017C1':'var(--color-text-secondary)',fontSize:'12px'}}>{e.w}</text></g>);
                })}
                {[{id:'S',x:80,y:165},{id:'A',x:275,y:75},{id:'B',x:275,y:255},{id:'C',x:465,y:165}].map(n=>{
                  const isConf=n.id==='S'||(n.id==='B'&&confB);
                  const fill=n.id==='S'?'#0017C1':isConf?'#1B6B38':'var(--color-background-secondary)';
                  const stroke=n.id==='S'?'#0017C1':isConf?'#1B6B38':'var(--color-border-secondary)';
                  const dv={S:'0',A:step>=1?'5':'\u221e',B:step>=1?'2':'\u221e',C:'\u221e'}[n.id];
                  return(<g key={n.id}>{step>=1&&<text x={n.x} y={n.y-36} textAnchor="middle" style={{fill:isConf&&n.id!=='S'?'#1B6B38':'var(--color-text-secondary)',fontSize:'14px',fontWeight:isConf&&n.id!=='S'?500:400}}>{dv}</text>}<circle cx={n.x} cy={n.y} r={26} style={{fill,stroke,strokeWidth:1.5}}/><text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" style={{fill:n.id==='S'||isConf?'white':'var(--color-text-primary)',fontSize:'18px',fontWeight:500}}>{n.id}</text>{isConf&&n.id==='B'&&<text x={n.x} y={n.y+40} textAnchor="middle" style={{fill:'#1B6B38',fontSize:'12px',fontWeight:500}}>{'\u2713 確定！'}</text>}</g>);
                })}
              </svg>
            </div>
            <div style={{padding:'12px 16px',borderTop:'1px solid var(--color-border-tertiary)',display:'flex',gap:8,alignItems:'center',justifyContent:'center'}}>
              <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="btn">◀</button>
              <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{step+1}/3</span>
              <button onClick={()=>setStep(s=>Math.min(2,s+1))} disabled={step===2} className="btn btn-primary">次へ ▶</button>
            </div>
          </div>
        </div>
        <div style={{flex:'0 1 230px'}}>
          <div style={{...CARD,background:'var(--color-background-info)',border:'1px solid var(--color-border-info)',fontSize:14,lineHeight:1.8}}>{msgs[step]}</div>
        </div>
      </div>
      <Note type="tip"><b>波紋のイメージ：</b>池に石を落とすと波紋が広がるように、スタートから「コストの波」が広がります。最初に届いたルートが最短ルートです（コストが非負の場合）。</Note>
    </div>
  );
}

function Ch4(){
  return(
    <div>
      <Note type="info">第3章の「確定」のアイデアを使えば、最短経路を効率よく求める手順が作れます。ステップはたった4つです！</Note>
      <div style={CARD}>
        {[['①','初期化','スタートノードの距離を 0、それ以外をすべて ∞（無限大）に設定する。'],['②','最小ノードを確定','未確定のノードの中で距離が最も小さいものを選び「確定」する。'],['③','隣接ノードを更新','確定したノードの隣のノードへの距離を計算し、今より短いルートが見つかれば書き換える。'],['④','繰り返す','全ノードが確定するまで②③を繰り返す。']].map(([n,t,d])=>(
          <div key={n} style={{display:'flex',gap:14,marginBottom:18}}>
            <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,background:'var(--color-text-info)',color:'var(--color-background-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500,fontSize:14,marginTop:2}}>{n}</div>
            <div><div style={{fontWeight:500,fontSize:15,marginBottom:4}}>{t}</div><div style={{fontSize:14,color:'var(--color-text-secondary)',lineHeight:1.7}}>{d}</div></div>
          </div>
        ))}
      </div>
      <div style={{...CARD,padding:0,overflow:'hidden'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid var(--color-border-tertiary)',fontSize:14,fontWeight:500}}>擬似コード</div>
        <pre style={{margin:0,padding:'16px 20px',fontSize:13,lineHeight:1.9,color:'var(--color-text-primary)',background:'var(--color-background-secondary)',fontFamily:'monospace',overflowX:'auto'}}>{`dist[start]=0, dist[other]=INF
unconfirmed = all nodes

while unconfirmed is not empty:
  cur = node in unconfirmed with min dist
  confirm(cur)

  for each neighbor nb of cur:
    if dist[cur] + edge(cur,nb) < dist[nb]:
      dist[nb] = dist[cur] + edge(cur,nb)
      prev[nb] = cur`}</pre>
      </div>
      <Note type="warn"><b>歴史：</b>1959年、オランダの数学者エドスヘル・ダイクストラがペンと紙で約20分で考えついたアルゴリズム。今日、地図アプリ・カーナビ・ゲームAIなどで毎秒何百万回も実行されています。</Note>
    </div>
  );
}

function Ch5(){
  const [steps,setSteps]=useState([]);
  const [si,setSi]=useState(0);
  const [play,setPlay]=useState(false);
  const t=useRef(null);
  useEffect(()=>setSteps(dijkstra(TN5,TE5,'A')),[]);
  useEffect(()=>{
    if(play)t.current=setInterval(()=>setSi(s=>{if(s>=steps.length-1){setPlay(false);return s;}return s+1;}),1200);
    return()=>clearInterval(t.current);
  },[play,steps.length]);
  const st=steps[si];
  const path=st?gPath(st.prev,'A','J'):[];
  const isDone=steps.length>0&&si===steps.length-1;
  if(!st)return <div style={{padding:40,textAlign:'center',color:'var(--color-text-secondary)'}}>読み込み中...</div>;
  const phaseLabel={init:'① 初期化',select:'② 最小ノードを選択',check_nb:'③ 隣接ノードを確認',done:'④ ノード確定'}[st.phase]||'';
  return(
    <div>
      <Note type="tip">10ノードのグラフ！「次へ」を押してステップを1つずつ確認しよう。<b style={{color:'#D85600'}}>オレンジ</b>＝処理中、<b style={{color:'#9B4FCC'}}>紫</b>＝確認中、<b style={{color:'#1B6B38'}}>緑</b>＝確定済み</Note>
      <div style={{...CARD,padding:'8px 16px',background:'var(--color-background-secondary)',marginBottom:10,fontSize:13,display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontWeight:500,color:'var(--color-text-secondary)'}}>現在の操作：</span>
        <span style={{fontWeight:500,fontSize:14}}>{phaseLabel}</span>
        <span style={{marginLeft:'auto',color:'var(--color-text-secondary)',fontSize:12}}>ステップ {si} / {steps.length-1}</span>
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{flex:'1 1 400px'}}>
          <div style={{...CARD,padding:0,overflow:'hidden'}}>
            <div style={{background:'var(--color-background-secondary)'}}><GSvg nodes={TN5} edges={TE5} st={st} path={path} start="A" goal="J" W={660} H={420}/></div>
            <Legend/>
          </div>
          <StepControls si={si} total={steps.length-1} play={play} onPrev={()=>setSi(s=>Math.max(0,s-1))} onNext={()=>setSi(s=>Math.min(steps.length-1,s+1))} onPlay={()=>setPlay(p=>!p)} onReset={()=>{setSi(0);setPlay(false);}}/>
        </div>
        <div style={{flex:'0 1 260px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={{...CARD,background:'var(--color-background-info)',border:'1px solid var(--color-border-info)',flex:1}}><StepMsg st={st} nodes={TN5}/></div>
          {path.length>1&&<div style={{...CARD,background:'var(--color-background-success)',border:'1px solid var(--color-border-success)'}}>
            <div style={{fontSize:12,color:'var(--color-text-success)',fontWeight:500,marginBottom:4}}>{isDone?'✅ 最短経路':'📍 現在の最短候補'}</div>
            <div style={{fontSize:16,fontWeight:500,color:'var(--color-text-success)',letterSpacing:2,marginBottom:4}}>{path.join(' → ')}</div>
            <div style={{fontSize:13,color:'var(--color-text-success)'}}>コスト：{pCost(path,TE5)}</div>
          </div>}
        </div>
      </div>
      <div style={CARD}><div style={{fontSize:13,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:12}}>距離テーブル（全ノードの現在の最短距離）</div><DTable nodes={TN5} st={st}/></div>
    </div>
  );
}
const CHS=[{id:1,lb:'グラフとは？'},{id:2,lb:'最短経路問題'},{id:3,lb:'確定のアイデア'},{id:4,lb:'アルゴリズム手順'},{id:5,lb:'実際に動かす'}];
function Tutorial(){
  const [ch,setCh]=useState(1);
  const C=[null,Ch1,Ch2,Ch3,Ch4,Ch5][ch];
  return(
    <div>
      <div style={{overflowX:'auto',marginBottom:22}}><div style={{display:'flex',borderBottom:'1px solid var(--color-border-secondary)',minWidth:'fit-content'}}>{CHS.map(c=>(<button key={c.id} onClick={()=>setCh(c.id)} className={`btn-tab${ch===c.id?' btn-tab--active':''}`} style={{fontSize:13}}>{c.id}. {c.lb}</button>))}</div></div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <div style={{width:34,height:34,borderRadius:'50%',background:'var(--color-text-info)',color:'var(--color-background-primary)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500,fontSize:15,flexShrink:0}}>{ch}</div>
        <h2 style={{margin:0,fontSize:20,fontWeight:500}}>{CHS[ch-1].lb}</h2>
      </div>
      <C/>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:16,borderTop:'1px solid var(--color-border-tertiary)'}}>
        <button onClick={()=>setCh(c=>Math.max(1,c-1))} disabled={ch===1} className="btn">← 前の章</button>
        <button onClick={()=>setCh(c=>Math.min(5,c+1))} disabled={ch===5} className="btn btn-primary">次の章 →</button>
      </div>
    </div>
  );
}

function Freeform(){
  const [nodes,setNodes]=useState([]);const [edges,setEdges]=useState([]);
  const [mode,setMode]=useState('addNode');const [start,setStart]=useState(null);const [goal,setGoal]=useState(null);
  const [eSrc,setESrc]=useState(null);const [pend,setPend]=useState(null);const [wIn,setWIn]=useState('');
  const [steps,setSteps]=useState([]);const [si,setSi]=useState(0);const [play,setPlay]=useState(false);
  const t=useRef(null);const nid=useRef(0);const sRef=useRef(null);
  useEffect(()=>{
    if(play)t.current=setInterval(()=>setSi(s=>{if(s>=steps.length-1){setPlay(false);return s;}return s+1;}),1500);
    return()=>clearInterval(t.current);
  },[play,steps.length]);
  const gn=id=>nodes.find(n=>n.id===id);
  const handleBg=e=>{
    if(steps.length>0||mode!=='addNode')return;
    const r=sRef.current.getBoundingClientRect(),x=(e.clientX-r.left)*(700/r.width),y=(e.clientY-r.top)*(420/r.height);
    if(nodes.some(n=>Math.hypot(n.x-x,n.y-y)<40))return;
    const id='n'+(++nid.current),label=nodes.length<26?String.fromCharCode(65+nodes.length):('N'+(nodes.length+1));
    setNodes(p=>[...p,{id,x,y,label}]);
  };
  const handleN=(e,node)=>{
    e.stopPropagation();if(steps.length>0)return;
    if(mode==='delete'){setNodes(p=>p.filter(n=>n.id!==node.id));setEdges(p=>p.filter(e=>e.from!==node.id&&e.to!==node.id));if(start===node.id)setStart(null);if(goal===node.id)setGoal(null);if(eSrc===node.id)setESrc(null);}
    else if(mode==='setStart')setStart(node.id);
    else if(mode==='setGoal')setGoal(node.id);
    else if(mode==='addEdge'){
      if(!eSrc)setESrc(node.id);
      else if(eSrc!==node.id){if(!edges.some(ed=>(ed.from===eSrc&&ed.to===node.id)||(ed.from===node.id&&ed.to===eSrc)))setPend({from:eSrc,to:node.id});setESrc(null);}
      else setESrc(null);
    }
  };
  const handleE=(e,edge)=>{e.stopPropagation();if(mode==='delete')setEdges(p=>p.filter(ed=>ed.id!==edge.id));};
  const doConfirm=()=>{const w=parseInt(wIn);if(pend&&!isNaN(w)&&w>0){setEdges(p=>[...p,{...pend,w,id:'e'+Date.now()}]);setPend(null);setWIn('');}};
  const run=()=>{if(!start||nodes.length<2)return;setSteps(dijkstra(nodes,edges,start));setSi(0);setPlay(false);};
  const reset=()=>{setNodes([]);setEdges([]);setStart(null);setGoal(null);setESrc(null);setPend(null);setSteps([]);setSi(0);nid.current=0;};
  const st=steps[si];
  const path=st&&goal?gPath(st.prev,start,goal):[];
  const noPath=steps.length>0&&goal&&gPath(steps[steps.length-1]?.prev,start,goal).length<=1;
  return(
    <div>
      <div style={{...CARD,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        {[['addNode','ノード追加'],['addEdge','エッジ追加'],['setStart','スタート設定'],['setGoal','ゴール設定'],['delete','削除']].map(([m,l])=>(<button key={m} onClick={()=>{setMode(m);setESrc(null);}} className={mode===m?"btn btn-primary":"btn"}>{l}</button>))}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button onClick={run} disabled={!start||nodes.length<2} className="btn btn-success">▶ 計算実行</button>
          <button onClick={reset} className="btn btn-danger">↺ リセット</button>
        </div>
      </div>
      {pend&&<div style={{...CARD,background:'var(--color-background-info)',border:'1px solid var(--color-border-info)',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:14,color:'var(--color-text-info)',fontWeight:500}}>「{gn(pend.from)?.label}」↔「{gn(pend.to)?.label}」の重みを入力：</span><input type="number" min="1" value={wIn} onChange={e=>setWIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doConfirm();if(e.key==='Escape'){setPend(null);setWIn('');} }} autoFocus placeholder="例: 5" style={{width:80,padding:'6px 10px'}}/><button onClick={doConfirm} className="btn btn-primary">追加</button><button onClick={()=>{setPend(null);setWIn('');}} className="btn">×</button></div>}
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{flex:'1 1 400px'}}>
          <div style={{...CARD,padding:0,overflow:'hidden'}}><div style={{background:'var(--color-background-secondary)'}}><GSvg nodes={nodes} edges={edges} st={st} path={path} start={start} goal={goal} W={700} H={420} onN={handleN} onE={handleE} onBg={handleBg} eSrc={eSrc} mode={mode} sRef={sRef}/></div></div>
          {steps.length>0&&<StepControls si={si} total={steps.length-1} play={play} onPrev={()=>setSi(s=>Math.max(0,s-1))} onNext={()=>setSi(s=>Math.min(steps.length-1,s+1))} onPlay={()=>setPlay(p=>!p)} onReset={()=>{setSi(0);setPlay(false);}} extra={<button onClick={()=>{setSteps([]);setSi(0);}} className="btn btn-sm">✎ 編集に戻る</button>}/>}
        </div>
        <div style={{flex:'0 1 230px',display:'flex',flexDirection:'column',gap:12}}>
          <div style={CARD}><div style={{fontSize:12,color:'var(--color-text-secondary)',fontWeight:500,marginBottom:12}}>グラフ情報</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['ノード数',nodes.length],['エッジ数',edges.length],['スタート',gn(start)?.label||'—'],['ゴール',gn(goal)?.label||'—']].map(([k,v])=>(<div key={k} style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:'10px 12px'}}><div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{k}</div><div style={{fontSize:18,fontWeight:500}}>{v}</div></div>))}</div></div>
          {steps.length>0&&<div style={{...CARD,background:'var(--color-background-info)',border:'1px solid var(--color-border-info)',flex:1}}><StepMsg st={st} nodes={nodes}/></div>}
          {path.length>1&&<div style={{...CARD,background:'var(--color-background-success)',border:'1px solid var(--color-border-success)'}}><div style={{fontSize:12,color:'var(--color-text-success)',fontWeight:500}}>最短経路</div><div style={{fontSize:18,fontWeight:500,color:'var(--color-text-success)',margin:'4px 0'}}>{path.map(id=>gn(id)?.label||id).join(' → ')}</div><div style={{fontSize:13,color:'var(--color-text-success)'}}>コスト：{pCost(path,edges)}</div></div>}
          {noPath&&path.length<=1&&<div style={{...CARD,background:'var(--color-background-danger)',border:'1px solid var(--color-border-danger)'}}><div style={{color:'var(--color-text-danger)',fontSize:13}}>経路が見つかりませんでした</div></div>}
        </div>
      </div>
      {steps.length>0&&<div style={CARD}><div style={{fontSize:13,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:12}}>距離テーブル</div><DTable nodes={nodes} st={st}/></div>}
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState('tutorial');
  return(
    <div style={{fontFamily:'inherit',color:'var(--color-text-primary)'}}>
      <div style={{background:'var(--color-text-info)',padding:'16px 28px'}}><h1 style={{margin:0,fontSize:20,fontWeight:500,color:'var(--color-background-primary)'}}>ダイクストラ法を理解しよう</h1><p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,0.8)'}}>最短経路アルゴリズムを中学生にもわかるように解説</p></div>
      <div style={{background:'var(--color-background-primary)',borderBottom:'1px solid var(--color-border-secondary)'}}><div style={{display:'flex',padding:'0 28px',maxWidth:1100,margin:'0 auto'}}>{[['tutorial','チュートリアル（入門）'],['freeform','自由グラフ作成']].map(([v,l])=>(<button key={v} onClick={()=>setTab(v)} className={`btn-tab${tab===v?' btn-tab--active':''}`} style={{fontSize:14,padding:'12px 20px'}}>{l}</button>))}</div></div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 28px',background:'var(--color-background-secondary)',minHeight:'60vh'}}>{tab==='tutorial'?<Tutorial/>:<Freeform/>}</div>
    </div>
  );
}
