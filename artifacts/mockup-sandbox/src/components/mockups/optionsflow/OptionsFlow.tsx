import { useState } from "react";

type FlowItem = {
  id: number;
  time: string;
  symbol: string;
  expiry: string;
  strike: number;
  type: "Call" | "Put";
  side: "Buy" | "Sell";
  contracts: number;
  premium: number;
  iv: number;
  unusual: boolean;
  sweep: boolean;
  sentiment: "Bullish" | "Bearish" | "Neutral";
};

const FLOW: FlowItem[] = [
  { id:1,  time:"14:32:18", symbol:"NVDA",  expiry:"Jun 20",  strike:900,  type:"Call", side:"Buy",  contracts:2400, premium:8.64,  iv:72, unusual:true,  sweep:true,  sentiment:"Bullish" },
  { id:2,  time:"14:31:55", symbol:"AAPL",  expiry:"Jun 27",  strike:250,  type:"Call", side:"Buy",  contracts:1850, premium:3.20,  iv:28, unusual:true,  sweep:false, sentiment:"Bullish" },
  { id:3,  time:"14:30:41", symbol:"SPY",   expiry:"Jun 30",  strike:515,  type:"Put",  side:"Buy",  contracts:3200, premium:2.85,  iv:18, unusual:true,  sweep:true,  sentiment:"Bearish" },
  { id:4,  time:"14:29:12", symbol:"TSLA",  expiry:"Jul 18",  strike:260,  type:"Put",  side:"Buy",  contracts:980,  premium:11.40, iv:68, unusual:false, sweep:false, sentiment:"Bearish" },
  { id:5,  time:"14:28:47", symbol:"META",  expiry:"Jun 20",  strike:550,  type:"Call", side:"Buy",  contracts:1420, premium:6.80,  iv:34, unusual:true,  sweep:true,  sentiment:"Bullish" },
  { id:6,  time:"14:27:33", symbol:"MSFT",  expiry:"Jul 18",  strike:430,  type:"Call", side:"Buy",  contracts:820,  premium:8.20,  iv:24, unusual:false, sweep:false, sentiment:"Bullish" },
  { id:7,  time:"14:26:18", symbol:"QQQ",   expiry:"Jun 30",  strike:455,  type:"Put",  side:"Buy",  contracts:2100, premium:3.60,  iv:20, unusual:true,  sweep:false, sentiment:"Bearish" },
  { id:8,  time:"14:25:44", symbol:"AMZN",  expiry:"Jul 18",  strike:205,  type:"Call", side:"Buy",  contracts:1100, premium:5.40,  iv:32, unusual:false, sweep:true,  sentiment:"Bullish" },
  { id:9,  time:"14:24:29", symbol:"XOM",   expiry:"Jun 20",  strike:115,  type:"Call", side:"Sell", contracts:600,  premium:2.10,  iv:22, unusual:false, sweep:false, sentiment:"Bearish" },
  { id:10, time:"14:23:15", symbol:"NVDA",  expiry:"Jul 18",  strike:850,  type:"Put",  side:"Buy",  contracts:1560, premium:14.80, iv:78, unusual:true,  sweep:true,  sentiment:"Bearish" },
  { id:11, time:"14:22:08", symbol:"LLY",   expiry:"Jun 20",  strike:900,  type:"Call", side:"Buy",  contracts:440,  premium:12.60, iv:36, unusual:false, sweep:false, sentiment:"Bullish" },
  { id:12, time:"14:21:52", symbol:"JPM",   expiry:"Jul 18",  strike:210,  type:"Call", side:"Buy",  contracts:780,  premium:4.20,  iv:26, unusual:false, sweep:false, sentiment:"Bullish" },
];

const SENTIMENT_COLOR = { Bullish: "#00e676", Bearish: "#ff4444", Neutral: "#ffd600" };

export function OptionsFlow() {
  const [filter, setFilter] = useState<"all" | "unusual" | "sweep">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Call" | "Put">("all");
  const [minPremium, setMinPremium] = useState(0);
  const [sortBy, setSortBy] = useState<"time" | "premium" | "contracts">("time");

  const filtered = FLOW
    .filter((f) => {
      if (filter === "unusual" && !f.unusual) return false;
      if (filter === "sweep" && !f.sweep) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (f.premium * f.contracts * 100 < minPremium * 1000) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "premium") return (b.premium * b.contracts) - (a.premium * a.contracts);
      if (sortBy === "contracts") return b.contracts - a.contracts;
      return b.id - a.id;
    });

  const totalBullPremium = FLOW.filter((f) => f.sentiment === "Bullish").reduce((s, f) => s + f.premium * f.contracts, 0);
  const totalBearPremium = FLOW.filter((f) => f.sentiment === "Bearish").reduce((s, f) => s + f.premium * f.contracts, 0);
  const bullPct = totalBullPremium / (totalBullPremium + totalBearPremium);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Options Flow</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">Unusual Activity Scanner</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs text-[#00e676]">Live</span>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-xs text-white outline-none"
            onChange={(e) => setMinPremium(Number(e.target.value))}>
            <option value={0}>All premiums</option>
            <option value={100}>$100K+</option>
            <option value={500}>$500K+</option>
            <option value={1000}>$1M+</option>
          </select>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["all", "Call", "Put"] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? (t === "Call" ? "bg-[#00e67633] text-[#00e676]" : t === "Put" ? "bg-[#ff444433] text-[#ff4444]" : "bg-[#1e3a5f] text-[#00d4ff]") : "text-[#8892a4]"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["all", "unusual", "sweep"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs capitalize transition-colors ${filter === f ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Time", "Symbol", "Expiry", "Strike", "Type", "Side", "Contracts", "Premium", "Total", "IV", "Flags"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const total = (f.premium * f.contracts * 100) / 1000;
                return (
                  <tr key={f.id} className={`border-b border-[#1e2433] hover:bg-[#0f1320] transition-colors ${f.unusual ? "bg-[#1a1200]" : ""}`}>
                    <td className="py-2.5 px-3 font-mono text-[#8892a4]">{f.time}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{f.symbol}</td>
                    <td className="py-2.5 px-3 text-[#8892a4]">{f.expiry}</td>
                    <td className="py-2.5 px-3 font-mono text-white">${f.strike}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${f.type === "Call" ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>
                        {f.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-bold ${f.side === "Buy" ? "text-[#00e676]" : "text-[#ff4444]"}`}>{f.side}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#8892a4]">{f.contracts.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-mono text-white">${f.premium.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 font-mono font-bold ${total > 500 ? "text-[#ffd600]" : "text-[#8892a4]"}`}>
                      ${total.toFixed(0)}K
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#8892a4]">{f.iv}%</td>
                    <td className="py-2.5 px-3 flex items-center gap-1">
                      {f.unusual && <span className="px-1 py-0.5 bg-[#ffd60022] text-[#ffd600] rounded text-[8px] font-bold">UOA</span>}
                      {f.sweep && <span className="px-1 py-0.5 bg-[#00d4ff22] text-[#00d4ff] rounded text-[8px] font-bold">SWEEP</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Sentiment Meter</p>
            <div className="w-full h-4 bg-[#1e2433] rounded-full overflow-hidden">
              <div className="h-full bg-[#00e676]" style={{ width: `${bullPct * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-[#00e676]">{(bullPct * 100).toFixed(0)}% Bullish</span>
              <span className="text-[#ff4444]">{((1 - bullPct) * 100).toFixed(0)}% Bearish</span>
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-3">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Sort By</p>
            {(["time", "premium", "contracts"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs capitalize mb-1 transition-colors ${sortBy === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="border-t border-[#1e2433] pt-3">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Top Symbols</p>
            {["NVDA", "SPY", "AAPL", "TSLA", "META"].map((sym) => {
              const symFlows = FLOW.filter((f) => f.symbol === sym);
              const bullish = symFlows.filter((f) => f.sentiment === "Bullish").length;
              return (
                <div key={sym} className="flex items-center justify-between py-1.5 text-xs border-b border-[#1e2433]">
                  <span className="font-bold text-white">{sym}</span>
                  <span className={bullish > symFlows.length / 2 ? "text-[#00e676]" : "text-[#ff4444]"}>
                    {bullish > symFlows.length / 2 ? "Bullish" : "Bearish"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
