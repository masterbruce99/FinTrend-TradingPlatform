import { useState } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type PivotMethod = "Classic"|"Fibonacci"|"Camarilla"|"Woodie"|"DeMark";

function calcPivots(method: PivotMethod, high: number, low: number, close: number, open: number) {
  const range = high - low;
  if (method === "Classic") {
    const pp = (high + low + close) / 3;
    return { PP:pp, R1:2*pp-low, R2:pp+range, R3:pp+2*range, S1:2*pp-high, S2:pp-range, S3:pp-2*range };
  }
  if (method === "Fibonacci") {
    const pp = (high + low + close) / 3;
    return { PP:pp, R1:pp+0.382*range, R2:pp+0.618*range, R3:pp+1.000*range, S1:pp-0.382*range, S2:pp-0.618*range, S3:pp-1.000*range };
  }
  if (method === "Camarilla") {
    return { PP:(high+low+close)/3, R1:close+range*1.1/12, R2:close+range*1.1/6, R3:close+range*1.1/4, S1:close-range*1.1/12, S2:close-range*1.1/6, S3:close-range*1.1/4 };
  }
  if (method === "Woodie") {
    const pp = (high + low + 2*close) / 4;
    return { PP:pp, R1:2*pp-low, R2:pp+range, R3:high+2*(pp-low), S1:2*pp-high, S2:pp-range, S3:low-2*(high-pp) };
  }
  // DeMark
  const x = close < open ? high+2*low+close : close > open ? 2*high+low+close : high+low+2*close;
  const pp = x/4;
  return { PP:pp, R1:x/2-low, R2:null, R3:null, S1:x/2-high, S2:null, S3:null };
}

const DAILY = { high: 248.4, low: 234.2, close: 241.3, open: 236.8 };
const WEEKLY = { high: 258.4, low: 228.4, close: 241.3, open: 232.4 };
const MONTHLY = { high: 268.4, low: 218.4, close: 241.3, open: 224.8 };

const CURRENT_PRICE = 241.3;

const INTRADAY_DATA = Array.from({ length: 60 }, (_, i) => ({
  time: (() => { const h=9+Math.floor((30+i*5)/60),m=(30+i*5)%60; return `${h}:${m.toString().padStart(2,"0")}`; })(),
  price: parseFloat((DAILY.low + (DAILY.high - DAILY.low) * (0.3 + Math.sin(i*0.3)*0.3 + i/120) + Math.random()*1).toFixed(2)),
}));

const LEVEL_STYLES: Record<string, { color: string; dash?: string; width?: number }> = {
  R3:{ color:"#ff2222", dash:"2 4", width:1 },
  R2:{ color:"#ff6666", dash:"3 4", width:1.5 },
  R1:{ color:"#ff9999", dash:"4 4", width:2 },
  PP:{ color:"#ffd600",             width:2.5 },
  S1:{ color:"#99ee99", dash:"4 4", width:2 },
  S2:{ color:"#66cc66", dash:"3 4", width:1.5 },
  S3:{ color:"#22aa22", dash:"2 4", width:1 },
};

const METHODS: PivotMethod[] = ["Classic","Fibonacci","Camarilla","Woodie","DeMark"];
const TIMEFRAME_DATA = { Daily:DAILY, Weekly:WEEKLY, Monthly:MONTHLY };

export function PivotPoints() {
  const [method, setMethod]     = useState<PivotMethod>("Classic");
  const [tf, setTf]             = useState<"Daily"|"Weekly"|"Monthly">("Daily");
  const [showAll, setShowAll]   = useState(false);

  const src = TIMEFRAME_DATA[tf];
  const pivots = calcPivots(method, src.high, src.low, src.close, src.open);
  const levels = Object.entries(pivots).filter(([,v]) => v !== null) as [string,number][];
  const abovePP = CURRENT_PRICE > pivots.PP;
  const nearestR = levels.filter(([k,v]) => k.startsWith("R") && v > CURRENT_PRICE).sort((a,b)=>a[1]-b[1])[0];
  const nearestS = levels.filter(([k,v]) => k.startsWith("S") && v < CURRENT_PRICE).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — Pivot Points</span>
          <span className="text-xs text-[#8892a4]">Auto-calculated levels</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {METHODS.map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${method===m?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{m}</button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["Daily","Weekly","Monthly"] as const).map(t => (
              <button key={t} onClick={() => setTf(t)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${tf===t?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Method",method,"#00d4ff"],
          ["Pivot (PP)",`$${pivots.PP.toFixed(2)}`, "#ffd600"],
          ["vs PP", abovePP ? "Above PP ▲" : "Below PP ▼", abovePP?"#00e676":"#ff4444"],
          ["Nearest R",nearestR ? `${nearestR[0]} $${nearestR[1].toFixed(2)}` : "—","#ff6666"],
          ["Nearest S",nearestS ? `${nearestS[0]} $${nearestS[1].toFixed(2)}` : "—","#66cc66"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={INTRADAY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="time" tick={{fontSize:8,fill:"#8892a4"}} interval={11}/>
              <YAxis domain={[Math.min(...levels.map(([,v])=>v))-2, Math.max(...levels.map(([,v])=>v))+2]}
                tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`}/>
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`$${v.toFixed(2)}`]}/>
              {levels.map(([key, val]) => (
                <ReferenceLine key={key} y={val}
                  stroke={LEVEL_STYLES[key]?.color || "#8892a4"}
                  strokeDasharray={LEVEL_STYLES[key]?.dash || undefined}
                  strokeWidth={LEVEL_STYLES[key]?.width || 1}
                  label={{ value:`${key} $${val.toFixed(2)}`, position:"right", fill:LEVEL_STYLES[key]?.color||"#8892a4", fontSize:9 }}/>
              ))}
              <ReferenceLine y={CURRENT_PRICE} stroke="#ffffff55" strokeDasharray="3 4"
                label={{value:`Current $${CURRENT_PRICE}`,fill:"white",fontSize:9,position:"right"}}/>
              <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="w-52 flex flex-col gap-2">
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1">Pivot Levels ({tf})</p>
          {[...levels].sort((a,b)=>b[1]-a[1]).map(([key, val]) => {
            const dist = ((val - CURRENT_PRICE) / CURRENT_PRICE * 100);
            const color = LEVEL_STYLES[key]?.color || "#8892a4";
            const isNearest = (nearestR && key === nearestR[0]) || (nearestS && key === nearestS[0]);
            return (
              <div key={key} className={`flex items-center justify-between rounded-lg p-2.5 border ${isNearest?"border-current":"border-[#1e2433] bg-[#131722]"}`}
                style={isNearest ? {borderColor:color+"44",backgroundColor:color+"08"} : {}}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm w-6" style={{color}}>{key}</span>
                  <span className="font-mono text-white text-xs">${val.toFixed(2)}</span>
                </div>
                <span className="text-[10px] font-bold" style={{color:dist>0?"#ff6666":"#66cc66"}}>
                  {dist>0?"+":""}{dist.toFixed(2)}%
                </span>
              </div>
            );
          })}
          <div className="mt-3 bg-[#131722] border border-[#1e2433] rounded-lg p-3">
            <p className="text-[10px] text-[#8892a4] mb-2">Method Details</p>
            <p className="text-xs text-[#c8d3e0]">
              {method === "Classic" ? "Standard formula: PP=(H+L+C)/3. Most widely used." :
               method === "Fibonacci" ? "Fibonacci ratios (38.2%, 61.8%, 100%) applied to range." :
               method === "Camarilla" ? "Uses 1.1× multiplier of range from close. Tighter levels." :
               method === "Woodie" ? "Close weighted more: PP=(H+L+2C)/4." :
               "DeMark: based on relationship of open vs close. Asymmetric."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
