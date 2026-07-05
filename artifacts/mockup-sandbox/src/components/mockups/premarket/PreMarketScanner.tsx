import { useState, useEffect } from "react";

type PreMarketStock = {
  id: number;
  symbol: string;
  name: string;
  prevClose: number;
  lastPrice: number;
  change: number;
  changePct: number;
  volume: number;
  avgVol: number;
  catalyst: string;
  session: "Pre" | "After";
  sector: string;
};

function makeStocks(session: "Pre" | "After"): PreMarketStock[] {
  const base: Omit<PreMarketStock, "session">[] = [
    { id:1,  symbol:"NVDA",  name:"Nvidia",          prevClose:840.20, lastPrice:875.40, change:35.20,  changePct:4.19,   volume:3200000, avgVol:2800000, catalyst:"Earnings beat",       sector:"Tech" },
    { id:2,  symbol:"RIVN",  name:"Rivian",          prevClose:12.40,  lastPrice:13.80,  change:1.40,   changePct:11.29,  volume:8400000, avgVol:2100000, catalyst:"Amazon order",        sector:"Consumer" },
    { id:3,  symbol:"LLY",   name:"Eli Lilly",       prevClose:872.30, lastPrice:892.10, change:19.80,  changePct:2.27,   volume:840000,  avgVol:680000,  catalyst:"FDA approval",        sector:"Health" },
    { id:4,  symbol:"SMCI",  name:"Super Micro",     prevClose:820.00, lastPrice:882.40, change:62.40,  changePct:7.61,   volume:1600000, avgVol:920000,  catalyst:"AI contract",         sector:"Tech" },
    { id:5,  symbol:"COIN",  name:"Coinbase",        prevClose:228.40, lastPrice:244.80, change:16.40,  changePct:7.18,   volume:2200000, avgVol:1800000, catalyst:"BTC rally",           sector:"Finance" },
    { id:6,  symbol:"TSLA",  name:"Tesla",           prevClose:255.80, lastPrice:245.10, change:-10.70, changePct:-4.18,  volume:12400000,avgVol:9800000, catalyst:"Layoff news",         sector:"Consumer" },
    { id:7,  symbol:"MRNA",  name:"Moderna",         prevClose:148.20, lastPrice:138.60, change:-9.60,  changePct:-6.48,  volume:3400000, avgVol:1200000, catalyst:"Trial miss",          sector:"Health" },
    { id:8,  symbol:"INTC",  name:"Intel",           prevClose:32.30,  lastPrice:31.20,  change:-1.10,  changePct:-3.41,  volume:8800000, avgVol:6400000, catalyst:"Guidance cut",        sector:"Tech" },
    { id:9,  symbol:"META",  name:"Meta Platforms",  prevClose:508.40, lastPrice:524.30, change:15.90,  changePct:3.13,   volume:2800000, avgVol:2200000, catalyst:"AI Studio",           sector:"Tech" },
    { id:10, symbol:"AAPL",  name:"Apple",           prevClose:238.10, lastPrice:241.32, change:3.22,   changePct:1.35,   volume:2100000, avgVol:3400000, catalyst:"M5 chip reveal",      sector:"Tech" },
    { id:11, symbol:"AMD",   name:"Advanced Micro",  prevClose:162.40, lastPrice:168.80, change:6.40,   changePct:3.94,   volume:4200000, avgVol:3100000, catalyst:"Data center deal",     sector:"Tech" },
    { id:12, symbol:"XOM",   name:"ExxonMobil",      prevClose:115.20, lastPrice:112.30, change:-2.90,  changePct:-2.52,  volume:3600000, avgVol:4800000, catalyst:"Oil price decline",    sector:"Energy" },
  ];
  return base.map((s) => ({ ...s, session }));
}

export function PreMarketScanner() {
  const [session, setSession] = useState<"Pre" | "After">("Pre");
  const [sortBy, setSortBy] = useState<"changePct" | "volume">("changePct");
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");
  const [minVolRatio, setMinVolRatio] = useState(1.0);
  const [time, setTime] = useState("4:02 AM");
  const [stocks, setStocks] = useState(makeStocks("Pre"));

  useEffect(() => {
    setStocks(makeStocks(session));
  }, [session]);

  useEffect(() => {
    const id = setInterval(() => {
      setStocks((prev) => prev.map((s) => ({
        ...s,
        lastPrice: s.lastPrice + (Math.random() - 0.49) * 0.2,
        changePct: s.changePct + (Math.random() - 0.49) * 0.05,
        volume: s.volume + Math.floor(Math.random() * 5000),
      })));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const filtered = stocks
    .filter((s) => {
      if (filter === "up" && s.changePct < 0) return false;
      if (filter === "down" && s.changePct >= 0) return false;
      if (s.volume / s.avgVol < minVolRatio) return false;
      return true;
    })
    .sort((a, b) => sortBy === "changePct" ? Math.abs(b.changePct) - Math.abs(a.changePct) : b.volume - a.volume);

  const gainers = stocks.filter((s) => s.changePct > 0).length;
  const losers = stocks.filter((s) => s.changePct < 0).length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            <button onClick={() => setSession("Pre")} className={`px-4 py-2 text-sm font-bold transition-colors ${session === "Pre" ? "bg-[#ffd60022] text-[#ffd600]" : "text-[#8892a4]"}`}>
              🌅 Pre-Market
            </button>
            <button onClick={() => setSession("After")} className={`px-4 py-2 text-sm font-bold transition-colors ${session === "After" ? "bg-[#a78bfa22] text-[#a78bfa]" : "text-[#8892a4]"}`}>
              🌙 After-Hours
            </button>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs" style={{ color: session === "Pre" ? "#ffd600" : "#a78bfa" }}>
            {session === "Pre" ? "4:02 AM ET" : "5:18 PM ET"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#00e676]">{gainers} ↑</span>
          <span className="text-xs text-[#ff4444]">{losers} ↓</span>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["all","up","down"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs capitalize transition-colors ${filter === f ? (f === "up" ? "bg-[#00e67633] text-[#00e676]" : f === "down" ? "bg-[#ff444433] text-[#ff4444]" : "bg-[#1e3a5f] text-[#00d4ff]") : "text-[#8892a4]"}`}>
                {f === "all" ? "All" : f === "up" ? "Gainers" : "Losers"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#8892a4]">Min vol ratio:</span>
            <select className="bg-[#131722] border border-[#1e2433] rounded px-1.5 py-1 text-white outline-none"
              value={minVolRatio} onChange={(e) => setMinVolRatio(Number(e.target.value))}>
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((v) => <option key={v} className="bg-[#131722]">{v}×</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-6">
        {[
          { label: "Total Gainers", val: `${gainers}`, color: "#00e676" },
          { label: "Total Losers", val: `${losers}`, color: "#ff4444" },
          { label: "Avg Vol Ratio", val: `${(filtered.reduce((s, st) => s + st.volume / st.avgVol, 0) / Math.max(filtered.length, 1)).toFixed(2)}×`, color: "#ffd600" },
        ].map(({ label, val, color }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-[#8892a4]">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#0b0e14]">
            <tr className="border-b border-[#1e2433]">
              {["Symbol","Prev Close","Last","Change","% Change","Volume","Avg Vol","Vol Ratio","Catalyst","Sector"].map((h) => (
                <th key={h} onClick={() => { if (h === "% Change") setSortBy("changePct"); if (h === "Volume") setSortBy("volume"); }}
                  className={`text-left py-3 px-3 text-[#8892a4] font-medium ${["% Change","Volume"].includes(h) ? "cursor-pointer hover:text-white" : ""}`}>
                  {h}{sortBy === "changePct" && h === "% Change" ? " ↓" : sortBy === "volume" && h === "Volume" ? " ↓" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const volRatio = s.volume / s.avgVol;
              return (
                <tr key={s.id} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{s.symbol}</div>
                    <div className="text-[10px] text-[#8892a4] truncate max-w-[80px]">{s.name}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">${s.prevClose.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-white">${s.lastPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono" style={{ color: s.change >= 0 ? "#00e676" : "#ff4444" }}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-lg" style={{ color: s.changePct >= 0 ? "#00e676" : "#ff4444" }}>
                    {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{(s.volume / 1000000).toFixed(1)}M</td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{(s.avgVol / 1000000).toFixed(1)}M</td>
                  <td className="py-3 px-3">
                    <span className={`font-bold font-mono text-sm ${volRatio > 2 ? "text-[#ffd600]" : "text-[#8892a4]"}`}>{volRatio.toFixed(2)}×</span>
                  </td>
                  <td className="py-3 px-3 text-[#c8d3e0]">{s.catalyst}</td>
                  <td className="py-3 px-3 text-[#8892a4]">{s.sector}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
