import { useState } from "react";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, ComposedChart, Area } from "recharts";

const TICKERS = ["AAPL","NVDA","META","TSLA","AMZN"];

type TickerData = {
  price: number; consensus: "Strong Buy"|"Buy"|"Hold"|"Sell"|"Strong Sell";
  targetMean: number; targetHigh: number; targetLow: number; targetMedian: number;
  numAnalysts: number; buys: number; holds: number; sells: number;
  epsHistory: { quarter: string; actual: number|null; estimate: number; beat: boolean|null }[];
  epsForward: { period: string; est: number; low: number; high: number }[];
  revisions: { date: string; analyst: string; firm: string; from: string; to: string; oldTarget: number; newTarget: number }[];
  targetHistory: { date: string; target: number }[];
};

const DATA: Record<string, TickerData> = {
  AAPL: {
    price:241.30, consensus:"Buy", targetMean:248.40, targetHigh:310.00, targetLow:180.00, targetMedian:245.00, numAnalysts:42,
    buys:28, holds:12, sells:2,
    epsHistory:[{quarter:"Q2 FY24",actual:1.53,estimate:1.50,beat:true},{quarter:"Q3 FY24",actual:1.40,estimate:1.35,beat:true},{quarter:"Q4 FY24",actual:1.64,estimate:1.60,beat:true},{quarter:"Q1 FY25",actual:2.40,estimate:2.35,beat:true},{quarter:"Q2 FY25",actual:1.65,estimate:1.57,beat:true},{quarter:"Q3 FY25",actual:null,estimate:1.48,beat:null}],
    epsForward:[{period:"FY2025",est:7.25,low:6.90,high:7.80},{period:"FY2026",est:7.78,low:7.20,high:8.40},{period:"FY2027",est:8.60,low:7.80,high:9.40}],
    revisions:[{date:"Jun 12",analyst:"Shannon Cross",firm:"Cross Research",from:"Hold",to:"Buy",oldTarget:200,newTarget:265},{date:"Jun 10",analyst:"Erik Woodring",firm:"Morgan Stanley",from:"Overweight",to:"Overweight",oldTarget:235,newTarget:270},{date:"Jun 8",analyst:"Ben Bollin",firm:"Cleveland Research",from:"Neutral",to:"Buy",oldTarget:210,newTarget:255},{date:"Jun 5",analyst:"Daniel Ives",firm:"Wedbush",from:"Outperform",to:"Outperform",oldTarget:275,newTarget:325}],
    targetHistory:[{date:"Jan",target:210},{date:"Feb",target:218},{date:"Mar",target:224},{date:"Apr",target:232},{date:"May",target:238},{date:"Jun",target:248}],
  },
  NVDA: {
    price:912.40, consensus:"Strong Buy", targetMean:1050.00, targetHigh:1500.00, targetLow:650.00, targetMedian:1020.00, numAnalysts:52,
    buys:44, holds:7, sells:1,
    epsHistory:[{quarter:"Q2 FY24",actual:2.70,estimate:2.09,beat:true},{quarter:"Q3 FY24",actual:4.02,estimate:3.37,beat:true},{quarter:"Q4 FY24",actual:5.16,estimate:4.64,beat:true},{quarter:"Q1 FY25",actual:6.12,estimate:5.65,beat:true},{quarter:"Q2 FY25",actual:6.84,estimate:6.42,beat:true},{quarter:"Q3 FY25",actual:null,estimate:7.40,beat:null}],
    epsForward:[{period:"FY2025",est:26.72,low:24.00,high:30.00},{period:"FY2026",est:38.40,low:32.00,high:46.00},{period:"FY2027",est:52.20,low:42.00,high:64.00}],
    revisions:[{date:"Jun 15",analyst:"Vivek Arya",firm:"Bank of America",from:"Buy",to:"Buy",oldTarget:1200,newTarget:1400},{date:"Jun 14",analyst:"Mark Lipacis",firm:"Evercore ISI",from:"Outperform",to:"Outperform",oldTarget:1000,newTarget:1200},{date:"Jun 12",analyst:"Hans Mosesmann",firm:"Rosenblatt",from:"Buy",to:"Buy",oldTarget:1400,newTarget:1800},{date:"Jun 10",analyst:"Timothy Arcuri",firm:"UBS",from:"Buy",to:"Buy",oldTarget:1100,newTarget:1250}],
    targetHistory:[{date:"Jan",target:720},{date:"Feb",target:780},{date:"Mar",target:840},{date:"Apr",target:900},{date:"May",target:960},{date:"Jun",target:1050}],
  },
  META: {
    price:524.80, consensus:"Strong Buy", targetMean:620.00, targetHigh:780.00, targetLow:430.00, targetMedian:610.00, numAnalysts:48,
    buys:38, holds:9, sells:1,
    epsHistory:[{quarter:"Q2 FY24",actual:5.16,estimate:4.72,beat:true},{quarter:"Q3 FY24",actual:6.03,estimate:5.25,beat:true},{quarter:"Q4 FY24",actual:8.02,estimate:6.78,beat:true},{quarter:"Q1 FY25",actual:6.43,estimate:5.28,beat:true},{quarter:"Q2 FY25",actual:7.12,estimate:6.02,beat:true},{quarter:"Q3 FY25",actual:null,estimate:6.80,beat:null}],
    epsForward:[{period:"FY2025",est:27.20,low:24.00,high:31.00},{period:"FY2026",est:32.80,low:28.00,high:38.00},{period:"FY2027",est:39.40,low:33.00,high:46.00}],
    revisions:[{date:"Jun 12",analyst:"Justin Post",firm:"Bank of America",from:"Buy",to:"Buy",oldTarget:580,newTarget:700},{date:"Jun 11",analyst:"Eric Sheridan",firm:"Goldman Sachs",from:"Buy",to:"Buy",oldTarget:560,newTarget:660},{date:"Jun 9",analyst:"Brian Nowak",firm:"Morgan Stanley",from:"Overweight",to:"Overweight",oldTarget:590,newTarget:680},{date:"Jun 7",analyst:"Mark Mahaney",firm:"Evercore ISI",from:"Outperform",to:"Outperform",oldTarget:550,newTarget:640}],
    targetHistory:[{date:"Jan",target:480},{date:"Feb",target:510},{date:"Mar",target:540},{date:"Apr",target:570},{date:"May",target:595},{date:"Jun",target:620}],
  },
  TSLA: {
    price:241.30, consensus:"Hold", targetMean:238.00, targetHigh:500.00, targetLow:85.00, targetMedian:220.00, numAnalysts:38,
    buys:14, holds:12, sells:12,
    epsHistory:[{quarter:"Q2 FY24",actual:0.52,estimate:0.62,beat:false},{quarter:"Q3 FY24",actual:0.72,estimate:0.60,beat:true},{quarter:"Q4 FY24",actual:0.73,estimate:0.76,beat:false},{quarter:"Q1 FY25",actual:0.27,estimate:0.40,beat:false},{quarter:"Q2 FY25",actual:0.42,estimate:0.45,beat:false},{quarter:"Q3 FY25",actual:null,estimate:0.52,beat:null}],
    epsForward:[{period:"FY2025",est:2.20,low:0.80,high:4.20},{period:"FY2026",est:3.20,low:1.20,high:6.40},{period:"FY2027",est:5.40,low:1.80,high:10.80}],
    revisions:[{date:"Jun 14",analyst:"Adam Jonas",firm:"Morgan Stanley",from:"Equal-weight",to:"Overweight",oldTarget:250,newTarget:310},{date:"Jun 12",analyst:"Dan Ives",firm:"Wedbush",from:"Outperform",to:"Outperform",oldTarget:400,newTarget:500},{date:"Jun 10",analyst:"Gordon Johnson",firm:"GLJ Research",from:"Sell",to:"Sell",oldTarget:100,newTarget:85},{date:"Jun 8",analyst:"Rod Lache",firm:"Wolfe Research",from:"Peer Perform",to:"Peer Perform",oldTarget:200,newTarget:220}],
    targetHistory:[{date:"Jan",target:220},{date:"Feb",target:210},{date:"Mar",target:215},{date:"Apr",target:225},{date:"May",target:230},{date:"Jun",target:238}],
  },
  AMZN: {
    price:212.40, consensus:"Strong Buy", targetMean:252.00, targetHigh:310.00, targetLow:195.00, targetMedian:248.00, numAnalysts:54,
    buys:48, holds:6, sells:0,
    epsHistory:[{quarter:"Q2 FY24",actual:1.26,estimate:1.03,beat:true},{quarter:"Q3 FY24",actual:1.43,estimate:1.14,beat:true},{quarter:"Q4 FY24",actual:1.86,estimate:1.49,beat:true},{quarter:"Q1 FY25",actual:1.59,estimate:1.36,beat:true},{quarter:"Q2 FY25",actual:1.72,estimate:1.52,beat:true},{quarter:"Q3 FY25",actual:null,estimate:1.64,beat:null}],
    epsForward:[{period:"FY2025",est:6.90,low:6.00,high:7.80},{period:"FY2026",est:8.60,low:7.20,high:10.00},{period:"FY2027",est:11.20,low:9.20,high:13.40}],
    revisions:[{date:"Jun 15",analyst:"Doug Anmuth",firm:"JPMorgan",from:"Overweight",to:"Overweight",oldTarget:240,newTarget:280},{date:"Jun 13",analyst:"Brian Nowak",firm:"Morgan Stanley",from:"Overweight",to:"Overweight",oldTarget:230,newTarget:270},{date:"Jun 11",analyst:"Mark Mahaney",firm:"Evercore ISI",from:"Outperform",to:"Outperform",oldTarget:225,newTarget:265},{date:"Jun 9",analyst:"Justin Post",firm:"Bank of America",from:"Buy",to:"Buy",oldTarget:220,newTarget:260}],
    targetHistory:[{date:"Jan",target:215},{date:"Feb",target:224},{date:"Mar",target:232},{date:"Apr",target:238},{date:"May",target:245},{date:"Jun",target:252}],
  },
};

const CONSENSUS_COLOR: Record<string,string> = {"Strong Buy":"#00e676","Buy":"#4ade80","Hold":"#ffd600","Sell":"#ff8c00","Strong Sell":"#ff4444"};

export function AnalystConsensus() {
  const [ticker, setTicker] = useState("AAPL");
  const [tab, setTab] = useState<"ratings"|"eps"|"revisions"|"targets">("ratings");
  const d = DATA[ticker];

  const ratingData = [
    { name:"Strong Buy", value: Math.round(d.buys * 0.4), color:"#00e676" },
    { name:"Buy",        value: d.buys - Math.round(d.buys * 0.4), color:"#4ade80" },
    { name:"Hold",       value: d.holds, color:"#ffd600" },
    { name:"Sell",       value: Math.round(d.sells * 0.5), color:"#ff8c00" },
    { name:"Strong Sell",value: d.sells - Math.round(d.sells * 0.5), color:"#ff4444" },
  ];

  const upside = ((d.targetMean - d.price) / d.price * 100);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Analyst Consensus — {ticker}</span>
          <span className="text-xs text-[#8892a4]">{d.numAnalysts} analysts covering</span>
        </div>
        <div className="flex items-center gap-2">
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded border transition-all ${ticker===t?"border-[#00d4ff] bg-[#00d4ff11] text-[#00d4ff]":"border-[#1e2433] text-[#8892a4]"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Consensus",  d.consensus,               CONSENSUS_COLOR[d.consensus]],
          ["Mean Target",`$${d.targetMean.toFixed(2)}`, "#00d4ff"],
          ["Upside",     `${upside>=0?"+":""}${upside.toFixed(1)}%`, upside>=0?"#00e676":"#ff4444"],
          ["Target Range",`$${d.targetLow}–$${d.targetHigh}`,"#8892a4"],
          ["Buy/Hold/Sell",`${d.buys}/${d.holds}/${d.sells}`,"#ffffff"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex border-b border-[#1e2433]">
        {(["ratings","eps","revisions","targets"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${tab===t?"border-[#00d4ff] text-[#00d4ff]":"border-transparent text-[#8892a4]"}`}>
            {t==="eps"?"EPS Estimates":t==="targets"?"Price Targets":t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "ratings" && (
        <div className="flex-1 flex p-5 gap-6">
          <div className="flex flex-col justify-center gap-4 w-64">
            {ratingData.map(r => (
              <div key={r.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{color:r.color}}>{r.name}</span>
                  <span className="text-white font-bold">{r.value}</span>
                </div>
                <div className="w-full h-4 bg-[#1e2433] rounded overflow-hidden">
                  <div className="h-full rounded" style={{width:`${(r.value/d.numAnalysts)*100}%`,backgroundColor:r.color+"99",borderRight:`2px solid ${r.color}`}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">Price Target Distribution ({d.numAnalysts} analysts)</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={[...Array(12)].map((_,i)=>{
                const lo=d.targetLow; const hi=d.targetHigh; const step=(hi-lo)/12;
                const bucketLo=lo+i*step; const bucketHi=lo+(i+1)*step;
                const count = Math.round(Math.exp(-Math.pow((bucketLo+bucketHi)/2-d.targetMean,2)/(2*Math.pow((hi-lo)/5,2)))*d.numAnalysts*0.8);
                return {range:`$${Math.round(bucketLo)}`+`–$${Math.round(bucketHi)}`,count,inRange:(d.price>=bucketLo&&d.price<=bucketHi)};
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                <XAxis dataKey="range" tick={{fontSize:7,fill:"#8892a4"}} angle={-30} textAnchor="end" height={40}/>
                <YAxis tick={{fontSize:9,fill:"#8892a4"}}/>
                <ReferenceLine x={`$${Math.round(d.price)}`} stroke="#ffd60066"/>
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${v} analysts`,"Count"]}/>
                <Bar dataKey="count" shape={(p:any)=>{const{x,y,width,height,payload}=p;const isMode=payload.count===Math.max(...[...Array(12)].map((_,i)=>{const lo=d.targetLow,hi=d.targetHigh,step=(hi-lo)/12;return Math.round(Math.exp(-Math.pow((lo+i*step+lo+(i+1)*step)/2-d.targetMean,2)/(2*Math.pow((hi-lo)/5,2)))*d.numAnalysts*0.8);}));return<rect x={x} y={y} width={Math.max(width-2,1)} height={height} fill={isMode?"#00d4ff99":"#00d4ff33"} stroke={isMode?"#00d4ff":"#00d4ff44"} strokeWidth={1} rx={2}/>;}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "eps" && (
        <div className="flex-1 flex p-5 gap-5">
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">EPS Beat/Miss History</p>
            <ResponsiveContainer width="100%" height="45%">
              <BarChart data={d.epsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                <XAxis dataKey="quarter" tick={{fontSize:9,fill:"#8892a4"}}/>
                <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(2)}`}/>
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number,n:string)=>[`$${v.toFixed(2)}`,n]}/>
                <Bar dataKey="estimate" fill="#8892a444" stroke="#8892a4" strokeWidth={1} name="Estimate" radius={[2,2,0,0]}/>
                <Bar dataKey="actual" name="Actual" shape={(p:any)=>{const{x,y,width,height,payload}=p;if(payload.actual===null)return null as any;return<rect x={x} y={y} width={Math.max(width-1,1)} height={height} fill={payload.beat?"#00e67688":"#ff444488"} stroke={payload.beat?"#00e676":"#ff4444"} strokeWidth={1.5} rx={2}/>;}}/>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#8892a4] mt-4 mb-3">Forward EPS Estimates</p>
            <div className="flex gap-4">
              {d.epsForward.map(f => (
                <div key={f.period} className="flex-1 bg-[#131722] border border-[#1e2433] rounded-lg p-4 text-center">
                  <p className="text-xs text-[#8892a4] mb-1">{f.period}</p>
                  <p className="text-2xl font-bold text-[#00d4ff]">${f.est.toFixed(2)}</p>
                  <p className="text-[10px] text-[#8892a4]">${f.low.toFixed(2)} – ${f.high.toFixed(2)}</p>
                  <p className="text-[10px] text-[#8892a4]">Range</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "revisions" && (
        <div className="flex-1 overflow-auto p-5">
          <p className="text-xs text-[#8892a4] mb-3">Recent Analyst Rating & Target Changes</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#1e2433]">
              {["Date","Analyst","Firm","Rating Change","Target Change"].map(h=>(
                <th key={h} className="text-left py-2 px-3 text-[#8892a4] font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>{d.revisions.map((r,i)=>(
              <tr key={i} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                <td className="py-3 px-3 text-[#8892a4]">{r.date}</td>
                <td className="py-3 px-3 font-medium text-white">{r.analyst}</td>
                <td className="py-3 px-3 text-[#8892a4]">{r.firm}</td>
                <td className="py-3 px-3">
                  {r.from === r.to ? (
                    <span className="text-[#8892a4]">→ Maintained {r.to}</span>
                  ) : (
                    <span>{r.from} → <span className="font-bold text-[#00e676]">{r.to}</span></span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono">
                  ${r.oldTarget} → <span className="font-bold" style={{color:r.newTarget>r.oldTarget?"#00e676":"#ff4444"}}>${r.newTarget}</span>
                  <span className="text-[#8892a4] ml-1">({r.newTarget>r.oldTarget?"+":""}${r.newTarget-r.oldTarget})</span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "targets" && (
        <div className="flex-1 p-5">
          <p className="text-xs text-[#8892a4] mb-3">Mean Price Target Trend</p>
          <ResponsiveContainer width="100%" height="80%">
            <ComposedChart data={d.targetHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
              <XAxis dataKey="date" tick={{fontSize:9,fill:"#8892a4"}}/>
              <YAxis domain={[d.targetLow*0.95,d.targetHigh*1.05]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`}/>
              <ReferenceLine y={d.price} stroke="#ffd60088" strokeDasharray="4 4" label={{value:`Price $${d.price}`,fill:"#ffd600",fontSize:9}}/>
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`$${v.toFixed(2)}`,"Mean Target"]}/>
              <defs><linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="target" stroke="#00d4ff" fill="url(#targetGrad)" strokeWidth={2.5} dot={{r:4,fill:"#00d4ff"}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
