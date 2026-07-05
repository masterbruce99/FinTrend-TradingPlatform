import { useState } from "react";

type CandlePattern = {
  name: string; category: string; type: "Bullish"|"Bearish"|"Continuation"|"Neutral";
  reliability: number; frequency: "Common"|"Moderate"|"Rare";
  description: string; signal: string; confirmation: string;
  shape: "single"|"double"|"triple";
  candles: { o:number; h:number; l:number; c:number; color?:string }[];
};

const PATTERNS: CandlePattern[] = [
  { name:"Doji",            category:"Reversal",     type:"Neutral",      reliability:62, frequency:"Common",   shape:"single", candles:[{o:50,h:80,l:20,c:51}], description:"Opening and closing prices are nearly equal, forming a cross. Indicates indecision between buyers and sellers.", signal:"Potential reversal at extremes", confirmation:"Wait for next candle direction" },
  { name:"Hammer",          category:"Reversal",     type:"Bullish",      reliability:74, frequency:"Common",   shape:"single", candles:[{o:70,h:75,l:10,c:72}], description:"Small body at the top with a long lower shadow, appearing at the bottom of a downtrend. Buyers rejected lower prices.", signal:"Bullish reversal at support", confirmation:"Confirm with next bullish candle" },
  { name:"Hanging Man",     category:"Reversal",     type:"Bearish",      reliability:68, frequency:"Common",   shape:"single", candles:[{o:30,h:35,l:10,c:28,color:"#ff4444"}], description:"Same shape as hammer but appears at top of uptrend. Sellers pushed price significantly lower before recovery.", signal:"Bearish reversal at resistance", confirmation:"Must gap down or close below" },
  { name:"Engulfing Bull",  category:"Reversal",     type:"Bullish",      reliability:83, frequency:"Common",   shape:"double", candles:[{o:60,h:65,l:45,c:48,color:"#ff4444"},{o:44,h:70,l:40,c:68}], description:"A large bullish candle completely engulfs the previous bearish candle. Strong buying momentum reversal.", signal:"Strong bullish reversal", confirmation:"Volume should increase on engulfing candle" },
  { name:"Engulfing Bear",  category:"Reversal",     type:"Bearish",      reliability:82, frequency:"Common",   shape:"double", candles:[{o:40,h:55,l:38,c:52},{o:54,h:58,l:30,c:32,color:"#ff4444"}], description:"A large bearish candle completely engulfs the previous bullish candle. Strong selling momentum reversal.", signal:"Strong bearish reversal", confirmation:"Volume should expand on engulfing candle" },
  { name:"Morning Star",    category:"Reversal",     type:"Bullish",      reliability:86, frequency:"Moderate", shape:"triple", candles:[{o:70,h:75,l:50,c:52,color:"#ff4444"},{o:48,h:55,l:45,c:50},{o:52,h:78,l:50,c:76}], description:"Three-candle bullish reversal: large bearish, small body (gap down), then large bullish. Classic bottom signal.", signal:"Bullish reversal after downtrend", confirmation:"Third candle should close well into first candle" },
  { name:"Evening Star",    category:"Reversal",     type:"Bearish",      reliability:85, frequency:"Moderate", shape:"triple", candles:[{o:30,h:52,l:28,c:50},{o:52,h:60,l:50,c:54},{o:58,h:62,l:32,c:34,color:"#ff4444"}], description:"Three-candle bearish reversal: large bullish, small body (gap up), then large bearish. Classic top signal.", signal:"Bearish reversal after uptrend", confirmation:"Third candle closes well into first candle" },
  { name:"Shooting Star",   category:"Reversal",     type:"Bearish",      reliability:72, frequency:"Common",   shape:"single", candles:[{o:30,h:80,l:28,c:32,color:"#ff4444"}], description:"Small body at bottom with long upper shadow, appearing in uptrend. Sellers rejected higher prices aggressively.", signal:"Bearish reversal at resistance", confirmation:"Must appear after rally, confirm gap down" },
  { name:"Marubozu Bull",   category:"Momentum",     type:"Bullish",      reliability:78, frequency:"Moderate", shape:"single", candles:[{o:20,h:20,l:20,c:80}], description:"Full-body bullish candle with no wicks. Buyers were in complete control from open to close.", signal:"Strong bullish momentum", confirmation:"Often continuation signal in uptrend" },
  { name:"Three White Sol.", category:"Continuation",type:"Bullish",      reliability:88, frequency:"Moderate", shape:"triple", candles:[{o:30,h:55,l:28,c:52},{o:52,h:70,l:50,c:68},{o:68,h:84,l:66,c:82}], description:"Three consecutive bullish candles with higher closes. Each opens within the prior body. Strong uptrend continuation.", signal:"Continuation of bullish trend", confirmation:"Each candle should close in upper half" },
  { name:"Three Black Crow",category:"Continuation",type:"Bearish",       reliability:87, frequency:"Moderate", shape:"triple", candles:[{o:70,h:72,l:48,c:50,color:"#ff4444"},{o:50,h:52,l:32,c:34,color:"#ff4444"},{o:34,h:36,l:18,c:20,color:"#ff4444"}], description:"Three consecutive large bearish candles with lower closes, each opening within the prior body. Strong downtrend signal.", signal:"Continuation of bearish trend", confirmation:"Volume should increase each session" },
  { name:"Harami Bull",     category:"Reversal",     type:"Bullish",      reliability:67, frequency:"Common",   shape:"double", candles:[{o:70,h:75,l:35,c:38,color:"#ff4444"},{o:44,h:60,l:42,c:58}], description:"Small bullish candle contained within the prior large bearish candle. The inside-bar shows the trend is losing momentum.", signal:"Potential bullish reversal", confirmation:"Weaker signal — needs confirmation" },
];

const TYPE_COLOR: Record<string,string> = { Bullish:"#00e676", Bearish:"#ff4444", Continuation:"#00d4ff", Neutral:"#ffd600" };

function MiniCandle({ c, pct }: { c: { o:number;h:number;l:number;c:number;color?:string }, pct: number }) {
  const isBull = c.c >= c.o;
  const color  = c.color || (isBull ? "#00e676" : "#ff4444");
  const scale  = pct / 100;
  const top  = (100 - c.h) * scale;
  const bodyTop = (100 - Math.max(c.o,c.c)) * scale;
  const bodyH   = Math.abs(c.c - c.o) * scale;
  const wickH   = (c.h - c.l) * scale;
  const w = 24, fullH = 80;
  return (
    <svg width={w} height={fullH} viewBox={`0 0 ${w} ${fullH}`} style={{display:"block"}}>
      <line x1={w/2} y1={top * fullH} x2={w/2} y2={(top + wickH) * fullH} stroke={color} strokeWidth={1.5}/>
      <rect x={4} y={bodyTop * fullH} width={w-8} height={Math.max(bodyH * fullH, 2)} fill={isBull ? color+"88" : color+"88"} stroke={color} strokeWidth={1.5} rx={1}/>
    </svg>
  );
}

const CATS = ["All","Reversal","Momentum","Continuation"];

export function CandlePatterns() {
  const [selected, setSelected] = useState<CandlePattern>(PATTERNS[0]);
  const [catFilter, setCatFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [detected] = useState(() => PATTERNS.filter(() => Math.random() > 0.5).slice(0,5));

  const filtered = PATTERNS.filter(p => {
    if (catFilter !== "All" && p.category !== catFilter) return false;
    if (typeFilter !== "All" && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Candlestick Pattern Library</span>
          <span className="text-xs text-[#8892a4]">{PATTERNS.length} patterns · AI-detected on chart</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {CATS.map(c => <button key={c} onClick={()=>setCatFilter(c)} className={`px-2.5 py-1 text-[10px] transition-colors ${catFilter===c?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{c}</button>)}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","Bullish","Bearish"].map(t => <button key={t} onClick={()=>setTypeFilter(t)} className={`px-2.5 py-1 text-[10px] transition-colors ${typeFilter===t?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{t}</button>)}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Pattern grid */}
        <div className="w-72 border-r border-[#1e2433] overflow-auto p-3 grid grid-cols-2 gap-2 content-start">
          {filtered.map(p => (
            <button key={p.name} onClick={() => setSelected(p)}
              className={`rounded-lg border p-3 text-left transition-all ${selected.name===p.name ? "border-[#00d4ff] bg-[#00d4ff08]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
              <div className="flex items-center justify-around mb-2 h-16">
                {p.candles.map((c,i) => <MiniCandle key={i} c={c} pct={0.8} />)}
              </div>
              <p className="text-[10px] font-bold text-white truncate">{p.name}</p>
              <p className="text-[9px] font-bold mt-0.5" style={{color:TYPE_COLOR[p.type]}}>{p.type}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1 bg-[#1e2433] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${p.reliability}%`,backgroundColor:TYPE_COLOR[p.type]}}/></div>
                <span className="text-[8px] text-[#8892a4]">{p.reliability}%</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 flex flex-col p-6 gap-5">
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-3 h-32">
              {selected.candles.map((c,i) => <MiniCandle key={i} c={c} pct={1.2} />)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:TYPE_COLOR[selected.type]+"22",color:TYPE_COLOR[selected.type]}}>{selected.type}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1e2433] text-[#8892a4]">{selected.category}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#1e2433] text-[#8892a4]">{selected.shape === "single" ? "1 candle" : selected.shape === "double" ? "2 candles" : "3 candles"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["Reliability",`${selected.reliability}%`,selected.reliability>=80?"#00e676":selected.reliability>=70?"#ffd600":"#ff8c00"],
                  ["Frequency",selected.frequency,"#00d4ff"],["Signal",selected.signal,TYPE_COLOR[selected.type]],
                  ["Confirmation",selected.confirmation,"#8892a4"]].map(([l,v,c])=>(
                  <div key={l as string} className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
                    <p className="text-[10px] text-[#8892a4] mb-0.5">{l}</p>
                    <p className="text-xs font-bold" style={{color:c as string}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.description}</p>
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Recently Detected on Chart (AAPL Daily)</p>
            <div className="flex flex-wrap gap-2">
              {detected.map(p => (
                <div key={p.name} onClick={() => setSelected(p)}
                  className="flex items-center gap-2 bg-[#131722] border border-[#1e2433] rounded-lg px-3 py-2 cursor-pointer hover:border-[#8892a4] transition-all">
                  <div className="flex items-center gap-0.5 h-8">{p.candles.slice(0,2).map((c,i)=><MiniCandle key={i} c={c} pct={0.6}/>)}</div>
                  <div>
                    <p className="text-[10px] font-bold text-white">{p.name}</p>
                    <p className="text-[9px]" style={{color:TYPE_COLOR[p.type]}}>{p.reliability}% reliable</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
