import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const SYMBOLS = ["SPY","QQQ","NVDA","AAPL","META","TSLA","AMZN","MSFT","BTC","GLD"];
const COLORS = ["#00d4ff","#ffd600","#00e676","#ff6b6b","#a78bfa","#ff8c00","#4ade80","#64748b","#f97316","#ec4899"];

const BASE_RETURNS: Record<string, number[]> = {
  SPY:  [0,0.8,0.4,1.2,0.6,1.8,1.4,2.4,1.8,2.8,3.2,2.4,3.8,4.4,3.8,4.8,5.2,4.4,5.8,6.4,5.8,6.8,7.2,6.4,8.2,8.8,8.4,9.2,8.8,9.8],
  QQQ:  [0,1.2,0.6,2.0,1.4,3.2,2.8,4.2,3.4,5.0,5.8,4.8,6.4,7.2,6.4,8.0,8.6,7.4,9.2,10.4,9.6,11.0,11.8,10.8,12.8,13.6,13.0,14.4,13.8,15.2],
  NVDA: [0,2.4,1.2,4.8,3.6,8.2,7.4,11.4,9.8,14.2,16.8,14.4,18.4,21.2,19.4,23.4,25.6,23.2,27.4,30.8,28.4,32.8,35.4,32.4,37.8,41.2,39.4,43.8,41.6,46.2],
  AAPL: [0,0.6,0.2,1.4,0.8,2.4,2.0,3.4,2.6,4.2,5.0,3.8,5.8,6.8,5.8,7.4,8.0,6.8,8.8,10.0,8.8,10.8,11.6,10.4,13.2,14.2,13.4,15.0,14.2,16.4],
  META: [0,1.8,0.8,3.4,2.4,5.8,5.0,7.8,6.4,9.4,11.0,9.2,12.4,14.4,12.8,15.8,17.2,15.4,18.8,21.4,19.6,22.8,24.6,22.2,26.8,29.4,27.8,31.2,29.6,33.0],
  TSLA: [0,-2.4,-4.2,-1.8,-3.4,0.8,-0.6,2.4,0.4,3.8,5.2,2.8,6.4,8.8,6.4,10.2,12.0,9.2,13.4,16.8,14.2,18.4,21.0,18.2,23.4,27.2,24.8,29.4,26.8,32.0],
  AMZN: [0,1.4,0.4,3.2,2.0,5.2,4.4,7.4,5.8,9.0,10.8,8.8,12.0,14.2,12.4,15.6,17.0,15.0,18.4,21.0,19.0,22.4,24.2,21.8,26.4,29.0,27.4,30.8,29.2,32.6],
  MSFT: [0,0.8,0.2,1.8,1.0,3.0,2.4,4.4,3.4,5.4,6.4,5.0,7.4,8.8,7.6,9.6,10.6,9.0,11.4,13.2,11.8,13.8,15.0,13.4,16.6,18.2,17.2,19.4,18.2,20.8],
  BTC:  [0,3.2,1.4,7.4,5.2,14.8,12.4,21.4,17.8,27.4,32.8,26.4,37.8,44.2,39.4,48.4,54.2,48.8,58.4,68.2,62.4,74.2,82.4,74.2,90.8,102.4,96.2,110.4,103.8,120.2],
  GLD:  [0,0.4,-0.2,1.0,0.4,2.2,1.6,3.4,2.4,4.2,5.4,4.0,6.2,7.4,6.2,8.2,9.4,7.8,10.4,12.0,10.4,12.8,13.8,12.2,15.4,17.0,15.8,18.0,16.8,19.4],
};

const DAYS = Array.from({length:30},(_,i)=>{const d=new Date("2025-05-01");d.setDate(d.getDate()+i);return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});

const CHART_DATA = DAYS.map((day, i) => {
  const entry: Record<string,number|string> = { day };
  SYMBOLS.forEach(sym => { entry[sym] = BASE_RETURNS[sym][i]; });
  return entry;
});

export function MultiSymbol() {
  const [active, setActive] = useState(["SPY","QQQ","NVDA","AAPL"]);
  const [period, setPeriod] = useState("1M");
  const [normalize, setNormalize] = useState(true);

  const toggle = (sym: string) => {
    setActive(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  const finalReturns = SYMBOLS.map(sym => ({
    sym, ret: BASE_RETURNS[sym][BASE_RETURNS[sym].length-1], color: COLORS[SYMBOLS.indexOf(sym)]
  })).sort((a,b) => b.ret - a.ret);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Multi-Symbol Comparison</span>
          <span className="text-xs text-[#8892a4]">{normalize ? "Normalized to 100" : "Absolute Returns"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["1W","1M","3M","YTD"].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${period===p?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{p}</button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setNormalize(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${normalize?"bg-[#00d4ff]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${normalize?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">Normalize</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[#1e2433]">
        {SYMBOLS.map(sym => {
          const color = COLORS[SYMBOLS.indexOf(sym)];
          const isActive = active.includes(sym);
          return (
            <button key={sym} onClick={() => toggle(sym)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isActive ? "border-current" : "border-[#1e2433] opacity-40 grayscale"}`}
              style={isActive ? {borderColor:color+"66",backgroundColor:color+"11",color} : {}}>
              <div className="w-2 h-2 rounded-full" style={{backgroundColor:isActive?color:"#8892a4"}}/>
              {sym}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
              <XAxis dataKey="day" tick={{fontSize:8,fill:"#8892a4"}} interval={6}/>
              <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`${v>=0?"+":""}${v.toFixed(1)}%`}/>
              <ReferenceLine y={0} stroke="#8892a4" strokeWidth={1.5}/>
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                formatter={(v:number, name:string) => {
                  const color = COLORS[SYMBOLS.indexOf(name)];
                  return [<span style={{color}}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>, name];
                }}/>
              {active.map(sym => (
                <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[SYMBOLS.indexOf(sym)]}
                  strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="w-52 flex flex-col gap-1">
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Period Leaderboard</p>
          {finalReturns.map((item, rank) => (
            <div key={item.sym} onClick={() => toggle(item.sym)}
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${active.includes(item.sym) ? "border-current" : "border-transparent opacity-50"}`}
              style={active.includes(item.sym) ? {borderColor:item.color+"44",backgroundColor:item.color+"08"} : {}}>
              <span className="text-xs font-bold text-[#8892a4] w-4">{rank+1}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:item.color}}/>
              <span className="text-sm font-bold flex-1" style={{color:item.color}}>{item.sym}</span>
              <span className="text-sm font-bold" style={{color:item.ret>=0?"#00e676":"#ff4444"}}>
                {item.ret>=0?"+":""}{item.ret.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
