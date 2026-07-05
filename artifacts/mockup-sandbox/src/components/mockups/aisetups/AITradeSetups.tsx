import { useState } from "react";

type Setup = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  direction: "Long" | "Short";
  confidence: number;
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  rr: number;
  timeframe: string;
  catalyst: string[];
  pattern: string;
  aiRationale: string;
  tags: string[];
  generatedAt: string;
};

const SETUPS: Setup[] = [
  { id:1, symbol:"NVDA",  name:"Nvidia",         price:875.40, direction:"Long",  confidence:94, entry:870,  stop:845,  target1:920,  target2:980,  rr:2.8, timeframe:"1D", catalyst:["Earnings beat","AI demand","Bull flag"],  pattern:"Bull Flag + Volume",         aiRationale:"NVDA is forming a textbook bull flag after a 4.2% gap up on earnings. The consolidation is tight with declining volume — classic accumulation. EMA(9) > EMA(21) > EMA(50) all aligned bullishly. AI infrastructure spending cycle is accelerating. Target 1 aligns with the measured move from the flagpole, Target 2 is the ATH zone.",  tags:["High conviction","Earnings play","AI theme"],  generatedAt:"14:32" },
  { id:2, symbol:"LLY",   name:"Eli Lilly",      price:892.10, direction:"Long",  confidence:88, entry:885,  stop:862,  target1:935,  target2:975,  rr:2.6, timeframe:"1D", catalyst:["FDA approval","Obesity boom","Cup handle"], pattern:"Cup & Handle",               aiRationale:"LLY completed a perfect 7-week cup & handle formation. The handle pulled back just 12% — well within the 15% rule. FDA breakthrough therapy designation acts as a catalyst for an outsized move. The obesity/GLP-1 theme has sustained institutional support with 3× above-average accumulation in the handle.",  tags:["FDA catalyst","Strong sector","Institutional"],  generatedAt:"13:55" },
  { id:3, symbol:"META",  name:"Meta Platforms", price:524.30, direction:"Long",  confidence:85, entry:518,  stop:498,  target1:558,  target2:592,  rr:2.4, timeframe:"4H", catalyst:["AI monetization","Ascending triangle","Breakout"], pattern:"Ascending Triangle Breakout", aiRationale:"META is breaking out of a 3-week ascending triangle on the 4H chart with volume 2.1× the 20-day average. The AI Studio enterprise launch provides a fundamental catalyst for re-rating. All major MAs are stacked bullishly. Previous resistance at $518 should act as new support on any retest.",  tags:["Momentum","AI theme","Volume"],  generatedAt:"14:08" },
  { id:4, symbol:"TSLA",  name:"Tesla",          price:245.10, direction:"Short", confidence:87, entry:248,  stop:262,  target1:228,  target2:210,  rr:2.1, timeframe:"1D", catalyst:["Layoffs","Demand concerns","H&S"],  pattern:"Head & Shoulders",           aiRationale:"TSLA is completing a head & shoulders top on the daily chart. The right shoulder is forming below the neckline level with RSI diverging bearishly. Layoff news provides a fundamental headwind. Volume on the breakdown bar was 4.8× average — strong distribution signal. Targets align with major support levels from prior base.",  tags:["Short setup","Distribution","Bearish catalyst"],  generatedAt:"14:22" },
  { id:5, symbol:"AMD",   name:"AMD",            price:168.40, direction:"Long",  confidence:81, entry:165,  stop:156,  target1:185,  target2:202,  rr:2.3, timeframe:"4H", catalyst:["Data center","Inverse H&S","Momentum"],  pattern:"Inverse Head & Shoulders",   aiRationale:"AMD is breaking out of an inverse H&S on the 4H chart. The right shoulder is higher than the left — a sign of improving buying pressure. Data center GPU market share is expanding. The stock is reclaiming all key moving averages simultaneously, which historically precedes 15-20% moves over the following 4-6 weeks.",  tags:["Reversal","Data center","4H breakout"],  generatedAt:"13:41" },
];

export function AITradeSetups() {
  const [selected, setSelected] = useState<Setup>(SETUPS[0]);
  const [dirFilter, setDirFilter] = useState<"all" | "Long" | "Short">("all");
  const [minConf, setMinConf] = useState(80);

  const filtered = SETUPS.filter((s) => {
    if (dirFilter !== "all" && s.direction !== dirFilter) return false;
    if (s.confidence < minConf) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AI Trade Setups</span>
          <span className="text-xs bg-[#a78bfa22] text-[#a78bfa] px-2 py-0.5 rounded border border-[#a78bfa44]">✦ Powered by TrendSpider AI</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["all","Long","Short"] as const).map((d) => (
              <button key={d} onClick={() => setDirFilter(d)}
                className={`px-3 py-1 text-xs transition-colors ${dirFilter === d ? (d === "Long" ? "bg-[#00e67633] text-[#00e676]" : d === "Short" ? "bg-[#ff444433] text-[#ff4444]" : "bg-[#1e3a5f] text-[#00d4ff]") : "text-[#8892a4]"}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8892a4]">Min AI score:</span>
            <input type="range" min={60} max={95} value={minConf} onChange={(e) => setMinConf(Number(e.target.value))} className="w-20 accent-[#a78bfa]" />
            <span className="text-[#a78bfa] font-bold w-8">{minConf}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-72 border-r border-[#1e2433] overflow-auto">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full text-left px-4 py-4 border-b border-[#1e2433] transition-colors ${selected.id === s.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-white">{s.symbol}</span>
                  <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${s.direction === "Long" ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>{s.direction}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: s.confidence >= 90 ? "#a78bfa" : s.confidence >= 80 ? "#00e676" : "#ffd600" }}>{s.confidence}%</div>
                  <div className="text-[9px] text-[#8892a4]">AI Score</div>
                </div>
              </div>
              <p className="text-xs text-[#8892a4] mb-2">{s.pattern}</p>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div><span className="text-[#8892a4]">Entry</span><br /><span className="text-white font-mono">${s.entry}</span></div>
                <div><span className="text-[#ff4444]">Stop</span><br /><span className="text-white font-mono">${s.stop}</span></div>
                <div><span className="text-[#00e676]">T1</span><br /><span className="text-white font-mono">${s.target1}</span></div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {s.tags.map((t) => <span key={t} className="text-[8px] bg-[#1e2433] text-[#8892a4] px-1 py-0.5 rounded">{t}</span>)}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{selected.symbol}</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selected.direction === "Long" ? "bg-[#00e67622] text-[#00e676] border border-[#00e67644]" : "bg-[#ff444422] text-[#ff4444] border border-[#ff444444]"}`}>{selected.direction}</span>
                <span className="text-xs text-[#8892a4]">{selected.timeframe} • Generated {selected.generatedAt}</span>
              </div>
              <p className="text-sm text-[#8892a4]">{selected.name} • {selected.pattern}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: selected.confidence >= 90 ? "#a78bfa" : "#00e676" }}>{selected.confidence}%</div>
              <div className="text-xs text-[#8892a4]">AI Confidence</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Entry", val: `$${selected.entry}`, color: "#ffffff" },
              { label: "Stop Loss", val: `$${selected.stop}`, color: "#ff4444" },
              { label: "Target 1", val: `$${selected.target1}`, color: "#00e676" },
              { label: "Target 2", val: `$${selected.target2}`, color: "#00d4ff" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#131722] border border-[#1e2433] rounded-lg p-3 text-center">
                <p className="text-[10px] text-[#8892a4]">{label}</p>
                <p className="text-lg font-bold font-mono mt-0.5" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
              <p className="text-[10px] text-[#8892a4]">Risk/Reward</p>
              <p className="text-xl font-bold text-[#00e676]">1:{selected.rr.toFixed(1)}</p>
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
              <p className="text-[10px] text-[#8892a4]">Current Price</p>
              <p className="text-xl font-bold text-white">${selected.price}</p>
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
              <p className="text-[10px] text-[#8892a4]">Timeframe</p>
              <p className="text-xl font-bold text-[#00d4ff]">{selected.timeframe}</p>
            </div>
          </div>

          <div className="bg-[#131722] border border-[#a78bfa44] rounded-lg p-5 mb-4">
            <p className="text-[10px] text-[#a78bfa] uppercase tracking-widest mb-3">✦ AI Rationale</p>
            <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.aiRationale}</p>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Catalysts & Confluences</p>
            <div className="flex flex-wrap gap-2">
              {selected.catalyst.map((c) => (
                <span key={c} className="px-2.5 py-1 bg-[#1e2433] text-[#c8d3e0] rounded text-xs border border-[#1e2433]">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
