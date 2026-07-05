import { useState } from "react";

type Pattern = {
  id: number;
  name: string;
  type: "Bullish" | "Bearish" | "Neutral";
  category: "Continuation" | "Reversal" | "Bilateral";
  reliability: number;
  avgMove: number;
  description: string;
  keyFeatures: string[];
  recent: { symbol: string; date: string; result: number }[];
};

const PATTERNS: Pattern[] = [
  { id:1, name:"Bull Flag",            type:"Bullish", category:"Continuation", reliability:78, avgMove:8.4,  description:"A sharp upward move (flagpole) followed by a tight, downward-sloping consolidation channel. Signals continuation of the prior uptrend.", keyFeatures:["Sharp flagpole","Parallel downward channel","Low volume in flag","Breakout on volume"], recent:[{symbol:"NVDA",date:"Jun 2",result:12.4},{symbol:"AMD",date:"May 28",result:6.8},{symbol:"META",date:"May 20",result:9.2}] },
  { id:2, name:"Head & Shoulders",     type:"Bearish", category:"Reversal",     reliability:83, avgMove:-9.2, description:"A central peak (head) flanked by two lower peaks (shoulders) on a neckline support. One of the most reliable reversal patterns in technical analysis.", keyFeatures:["Left shoulder","Head (highest peak)","Right shoulder (lower)","Neckline break"], recent:[{symbol:"TSLA",date:"Jun 1",result:-11.8},{symbol:"INTC",date:"May 25",result:-8.4},{symbol:"XOM",date:"May 18",result:-6.2}] },
  { id:3, name:"Cup & Handle",         type:"Bullish", category:"Continuation", reliability:76, avgMove:11.2, description:"A rounded base (cup) followed by a small downward drift (handle) before a breakout. Often forms over weeks to months and signals major continuation.", keyFeatures:["Smooth U-shaped cup","Handle pullback <15%","Volume dry-up in handle","Breakout above cup lip"], recent:[{symbol:"LLY",date:"May 30",result:14.6},{symbol:"AAPL",date:"May 15",result:8.8},{symbol:"JPM",date:"May 8",result:7.4}] },
  { id:4, name:"Ascending Triangle",   type:"Bullish", category:"Continuation", reliability:72, avgMove:7.8,  description:"Flat resistance with rising support line. Buyers are becoming more aggressive with each test of resistance, leading to a breakout.", keyFeatures:["Flat top resistance","Rising lows","Volume contraction","Breakout + volume surge"], recent:[{symbol:"META",date:"Jun 3",result:9.1},{symbol:"MSFT",date:"May 22",result:5.6},{symbol:"AMZN",date:"May 12",result:8.3}] },
  { id:5, name:"Double Top",           type:"Bearish", category:"Reversal",     reliability:74, avgMove:-7.4, description:"Two peaks at approximately the same price level, with a valley in between. Signals exhaustion of the uptrend and potential reversal.", keyFeatures:["Two peaks at same level","Volume lower on 2nd peak","Neckline (valley) break","Target = height of pattern"], recent:[{symbol:"XOM",date:"May 29",result:-8.2},{symbol:"QQQ",date:"May 20",result:-5.8},{symbol:"INTC",date:"May 10",result:-9.4}] },
  { id:6, name:"Inverse H&S",          type:"Bullish", category:"Reversal",     reliability:80, avgMove:10.8, description:"Mirror image of Head & Shoulders — a central trough flanked by two higher troughs. Powerful bullish reversal signal after a downtrend.", keyFeatures:["Left shoulder trough","Head (deepest)","Right shoulder (higher)","Neckline breakout"], recent:[{symbol:"AMD",date:"Jun 4",result:13.2},{symbol:"COIN",date:"May 26",result:18.6},{symbol:"RIVN",date:"May 14",result:22.4}] },
  { id:7, name:"Pennant",              type:"Bullish", category:"Continuation", reliability:69, avgMove:6.4,  description:"A small symmetrical triangle forming after a sharp price move. Similar to a flag but with converging trendlines rather than parallel ones.", keyFeatures:["Sharp flagpole move","Converging trendlines","Volume dry-up","Short-duration pattern"], recent:[{symbol:"MSFT",date:"Jun 2",result:5.8},{symbol:"NVDA",date:"May 24",result:7.6},{symbol:"AAPL",date:"May 16",result:4.2}] },
  { id:8, name:"Wedge (Falling)",      type:"Bullish", category:"Reversal",     reliability:71, avgMove:8.2,  description:"Price consolidates in a downward-sloping wedge with converging highs and lows. Despite the downward appearance, it signals a bullish reversal.", keyFeatures:["Both lines slope down","Lines converge","Volume drops in wedge","Breaks upper trendline"], recent:[{symbol:"LLY",date:"May 28",result:9.8},{symbol:"JPM",date:"May 19",result:6.4},{symbol:"NEE",date:"May 8",result:7.1}] },
];

const TYPE_COLOR = { Bullish: "#00e676", Bearish: "#ff4444", Neutral: "#ffd600" };
const CAT_COLOR  = { Continuation: "#00d4ff", Reversal: "#ff8c00", Bilateral: "#a78bfa" };

export function PatternLibrary() {
  const [selected, setSelected] = useState<Pattern>(PATTERNS[0]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = PATTERNS.filter((p) => {
    if (typeFilter !== "All" && p.type !== typeFilter) return false;
    if (catFilter !== "All" && p.category !== catFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Chart Pattern Library</span>
          <span className="text-xs text-[#8892a4]">{PATTERNS.length} patterns</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","Bullish","Bearish"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs transition-colors ${typeFilter === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","Continuation","Reversal"].map((c) => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1 text-xs transition-colors ${catFilter === c ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-[#1e2433] overflow-auto">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left px-4 py-3.5 border-b border-[#1e2433] transition-colors ${selected.id === p.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{p.name}</span>
                <span className="text-[10px] font-bold" style={{ color: TYPE_COLOR[p.type] }}>{p.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: CAT_COLOR[p.category] + "22", color: CAT_COLOR[p.category] }}>{p.category}</span>
                <span className="text-[10px] text-[#8892a4]">{p.reliability}% reliable</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{selected.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: TYPE_COLOR[selected.type] + "22", color: TYPE_COLOR[selected.type] }}>{selected.type}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: CAT_COLOR[selected.category] + "22", color: CAT_COLOR[selected.category] }}>{selected.category}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
                <p className="text-[10px] text-[#8892a4]">Reliability</p>
                <p className="text-xl font-bold" style={{ color: selected.reliability > 75 ? "#00e676" : "#ffd600" }}>{selected.reliability}%</p>
              </div>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
                <p className="text-[10px] text-[#8892a4]">Avg Move</p>
                <p className="text-xl font-bold" style={{ color: selected.avgMove >= 0 ? "#00e676" : "#ff4444" }}>
                  {selected.avgMove >= 0 ? "+" : ""}{selected.avgMove}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 mb-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Description</p>
            <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Key Features</p>
              {selected.keyFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#1e2433] text-xs">
                  <span className="w-4 h-4 rounded-full bg-[#1e2433] flex items-center justify-center text-[9px] text-[#8892a4] flex-shrink-0">{i + 1}</span>
                  <span className="text-[#c8d3e0]">{f}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Recent Occurrences</p>
              {selected.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e2433] text-xs">
                  <span className="font-bold text-white">{r.symbol}</span>
                  <span className="text-[#8892a4]">{r.date}</span>
                  <span className="font-bold font-mono" style={{ color: r.result >= 0 ? "#00e676" : "#ff4444" }}>
                    {r.result >= 0 ? "+" : ""}{r.result.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 text-xs">
                <div className="flex justify-between text-[#8892a4]">
                  <span>Avg outcome:</span>
                  <span className="font-bold" style={{ color: selected.avgMove >= 0 ? "#00e676" : "#ff4444" }}>
                    {selected.avgMove >= 0 ? "+" : ""}{selected.avgMove}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
