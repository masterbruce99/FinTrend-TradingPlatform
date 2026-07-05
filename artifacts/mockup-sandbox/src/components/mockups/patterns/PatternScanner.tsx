import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type Pattern = {
  id: number; symbol: string; pattern: string; type: "Bullish"|"Bearish"|"Neutral";
  timeframe: string; completion: number; priceTarget: number; stopLoss: number;
  confidence: number; volume: "Confirming"|"Weak"|"N/A"; bars: number;
  description: string;
};

const PATTERNS: Pattern[] = [
  { id:1, symbol:"NVDA", pattern:"Bull Flag",           type:"Bullish", timeframe:"1H", completion:92, priceTarget:940.0, stopLoss:848.0, confidence:87, volume:"Confirming", bars:8,  description:"Tight consolidation after impulse leg. Volume contracting on pullback — textbook bull flag." },
  { id:2, symbol:"AAPL", pattern:"Cup & Handle",        type:"Bullish", timeframe:"D",  completion:78, priceTarget:268.0, stopLoss:228.0, confidence:82, volume:"Confirming", bars:42, description:"18-week cup formation with 3-week handle. Breakout above 242 targets measured move to 268." },
  { id:3, symbol:"META", pattern:"Ascending Triangle",  type:"Bullish", timeframe:"D",  completion:88, priceTarget:568.0, stopLoss:498.0, confidence:85, volume:"Weak",       bars:28, description:"Horizontal resistance at 530 with rising lows. Watch for volume expansion on breakout." },
  { id:4, symbol:"TSLA", pattern:"Head & Shoulders",    type:"Bearish", timeframe:"D",  completion:95, priceTarget:198.0, stopLoss:268.0, confidence:84, volume:"Confirming", bars:38, description:"Classic H&S with neckline at 220. Right shoulder complete. Measured target 198." },
  { id:5, symbol:"INTC", pattern:"Descending Triangle", type:"Bearish", timeframe:"W",  completion:82, priceTarget:22.0,  stopLoss:36.0,  confidence:80, volume:"Confirming", bars:16, description:"Lower highs into support at 28. Breakdown targets 22 measured move." },
  { id:6, symbol:"AMD",  pattern:"Inv. Head & Shoulders",type:"Bullish",timeframe:"D",  completion:88, priceTarget:198.0, stopLoss:148.0, confidence:83, volume:"Confirming", bars:32, description:"Right shoulder forming near 168. Neckline at 178. Target 198 on breakout." },
  { id:7, symbol:"SPY",  pattern:"Symmetrical Triangle", type:"Neutral", timeframe:"D",  completion:72, priceTarget:548.0, stopLoss:498.0, confidence:75, volume:"Weak",       bars:22, description:"Compression coil. Breakout direction will determine next move. Watch for 534 break." },
  { id:8, symbol:"LLY",  pattern:"Breakout Pullback",   type:"Bullish", timeframe:"D",  completion:64, priceTarget:980.0, stopLoss:848.0, confidence:79, volume:"Confirming", bars:12, description:"Clean breakout from 868 resistance. Pulling back to retest support. Entry opportunity." },
  { id:9, symbol:"COIN", pattern:"Double Bottom",       type:"Bullish", timeframe:"D",  completion:90, priceTarget:298.0, stopLoss:218.0, confidence:81, volume:"Confirming", bars:24, description:"W pattern with neckline at 268. Break above activates 298 measured target." },
  { id:10,symbol:"GLD",  pattern:"Channel Breakout",    type:"Bullish", timeframe:"W",  completion:76, priceTarget:2480,  stopLoss:2280,  confidence:77, volume:"Confirming", bars:8,  description:"Breaking above 6-month descending channel. Target prior high at 2480." },
];

const TYPE_COLOR: Record<string, string> = { Bullish:"#00e676", Bearish:"#ff4444", Neutral:"#ffd600" };

function generatePatternChart(pattern: Pattern) {
  const base = pattern.priceTarget * 0.91;
  return Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const price = pattern.type === "Bullish"
      ? base + Math.sin(i * 0.8) * base * 0.02 + t * (pattern.priceTarget - base) * 0.6
      : pattern.priceTarget * 1.12 - Math.sin(i * 0.7) * base * 0.02 - t * (pattern.priceTarget * 1.12 - pattern.priceTarget) * 0.5;
    return { bar: i+1, price: parseFloat(price.toFixed(2)) };
  });
}

export function PatternScanner() {
  const [selected, setSelected] = useState<Pattern>(PATTERNS[0]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [tfFilter, setTfFilter] = useState("All");
  const [minConf, setMinConf] = useState(70);
  const chartData = generatePatternChart(selected);

  const filtered = PATTERNS.filter(p => {
    if (typeFilter !== "All" && p.type !== typeFilter) return false;
    if (tfFilter !== "All" && p.timeframe !== tfFilter) return false;
    if (p.confidence < minConf) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Pattern Recognition Scanner</span>
          <span className="text-xs text-[#8892a4]">AI-detected chart patterns — {filtered.length} signals</span>
        </div>
        <div className="flex items-center gap-3">
          {[
            [["All","Bullish","Bearish","Neutral"], typeFilter, setTypeFilter],
            [["All","1H","D","W"], tfFilter, setTfFilter],
          ].map(([opts, val, setter], i) => (
            <div key={i} className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
              {(opts as string[]).map(o => (
                <button key={o} onClick={() => (setter as (v:string)=>void)(o)}
                  className={`px-2.5 py-1 text-xs transition-colors ${val === o ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{o}</button>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#8892a4]">Min conf:</span>
            <input type="range" min={60} max={90} value={minConf} onChange={e => setMinConf(Number(e.target.value))} className="w-16 accent-[#00d4ff]" />
            <span className="text-[#00d4ff] w-6">{minConf}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 border-r border-[#1e2433] overflow-auto">
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3 border-b border-[#1e2433] transition-colors ${selected.id === p.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{p.symbol}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:TYPE_COLOR[p.type]+"22",color:TYPE_COLOR[p.type]}}>{p.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8892a4]">{p.pattern}</span>
                <span className="text-[10px] text-[#00d4ff]">{p.timeframe}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 bg-[#1e2433] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${p.completion}%`,backgroundColor:TYPE_COLOR[p.type]}} />
                </div>
                <span className="text-[9px] font-bold" style={{color:TYPE_COLOR[p.type]}}>{p.completion}%</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col p-4 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xl font-bold text-white">{selected.symbol} — {selected.pattern}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:TYPE_COLOR[selected.type]+"22",color:TYPE_COLOR[selected.type]}}>{selected.type}</span>
                <span className="text-xs text-[#8892a4]">{selected.timeframe} timeframe</span>
                <span className="text-xs text-[#8892a4]">• {selected.bars} bars forming</span>
              </div>
            </div>
            <div className="ml-auto flex gap-4">
              <div className="text-center"><p className="text-[10px] text-[#8892a4]">Target</p><p className="text-base font-bold text-[#00e676]">${selected.priceTarget.toLocaleString()}</p></div>
              <div className="text-center"><p className="text-[10px] text-[#8892a4]">Stop</p><p className="text-base font-bold text-[#ff4444]">${selected.stopLoss.toLocaleString()}</p></div>
              <div className="text-center"><p className="text-[10px] text-[#8892a4]">Confidence</p><p className="text-base font-bold text-[#00d4ff]">{selected.confidence}%</p></div>
            </div>
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="bar" tick={{fontSize:9,fill:"#8892a4"}} />
                <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} />
                <ReferenceLine y={selected.priceTarget} stroke="#00e67666" strokeDasharray="5 4" label={{value:"Target",fill:"#00e676",fontSize:9,position:"right"}} />
                <ReferenceLine y={selected.stopLoss}    stroke="#ff444466" strokeDasharray="5 4" label={{value:"Stop",fill:"#ff4444",fontSize:9,position:"right"}} />
                <Line type="monotone" dataKey="price" stroke={TYPE_COLOR[selected.type]} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-[#8892a4] uppercase tracking-widest">Pattern Analysis</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:(selected.volume === "Confirming" ? "#00e676" : "#ff4444")+"22",color:selected.volume === "Confirming" ? "#00e676" : "#ff4444"}}>Volume {selected.volume}</span>
            </div>
            <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
