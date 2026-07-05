import { useState } from "react";

type Gap = {
  id: number;
  symbol: string;
  name: string;
  prevClose: number;
  preMarket: number;
  gapPct: number;
  gapType: "Gap Up" | "Gap Down";
  volume: string;
  float: string;
  catalyst: string;
  filled: boolean;
  sector: string;
};

const GAPS: Gap[] = [
  { id:1,  symbol:"NVDA",  name:"Nvidia",           prevClose:840.20, preMarket:875.40, gapPct:4.19,  gapType:"Gap Up",   volume:"8.4M",  float:"24.4B", catalyst:"Earnings beat",      filled:false, sector:"Tech" },
  { id:2,  symbol:"LLY",   name:"Eli Lilly",        prevClose:872.30, preMarket:892.10, gapPct:2.27,  gapType:"Gap Up",   volume:"2.1M",  float:"950B",  catalyst:"FDA approval",       filled:false, sector:"Health" },
  { id:3,  symbol:"META",  name:"Meta Platforms",   prevClose:508.40, preMarket:524.30, gapPct:3.13,  gapType:"Gap Up",   volume:"5.6M",  float:"1.3T",  catalyst:"AI Studio launch",   filled:false, sector:"Tech" },
  { id:4,  symbol:"TSLA",  name:"Tesla",            prevClose:255.80, preMarket:245.10, gapPct:-4.18, gapType:"Gap Down", volume:"22.4M", float:"590B",  catalyst:"Layoff news",        filled:false, sector:"Consumer" },
  { id:5,  symbol:"INTC",  name:"Intel",            prevClose:32.30,  preMarket:31.20,  gapPct:-3.41, gapType:"Gap Down", volume:"18.2M", float:"130B",  catalyst:"Guidance cut",       filled:true,  sector:"Tech" },
  { id:6,  symbol:"SMCI",  name:"Super Micro",      prevClose:820.00, preMarket:882.40, gapPct:7.61,  gapType:"Gap Up",   volume:"3.2M",  float:"48B",   catalyst:"AI server contract", filled:false, sector:"Tech" },
  { id:7,  symbol:"MRNA",  name:"Moderna",          prevClose:148.20, preMarket:138.60, gapPct:-6.48, gapType:"Gap Down", volume:"6.8M",  float:"55B",   catalyst:"Trial data miss",    filled:false, sector:"Health" },
  { id:8,  symbol:"RIVN",  name:"Rivian",           prevClose:12.40,  preMarket:13.80,  gapPct:11.29, gapType:"Gap Up",   volume:"14.2M", float:"12B",   catalyst:"Amazon deal",        filled:false, sector:"Consumer" },
  { id:9,  symbol:"XOM",   name:"ExxonMobil",       prevClose:115.20, preMarket:112.30, gapPct:-2.52, gapType:"Gap Down", volume:"8.8M",  float:"480B",  catalyst:"Oil price drop",     filled:true,  sector:"Energy" },
  { id:10, symbol:"COIN",  name:"Coinbase",         prevClose:228.40, preMarket:244.80, gapPct:7.18,  gapType:"Gap Up",   volume:"5.4M",  float:"58B",   catalyst:"BTC rally",          filled:false, sector:"Finance" },
];

export function GapScanner() {
  const [type, setType] = useState<"all" | "Gap Up" | "Gap Down">("all");
  const [minGap, setMinGap] = useState(2);
  const [showFilled, setShowFilled] = useState(false);
  const [selected, setSelected] = useState<Gap | null>(GAPS[0]);
  const [sortBy, setSortBy] = useState<"gapPct" | "volume">("gapPct");

  const filtered = GAPS
    .filter((g) => {
      if (type !== "all" && g.gapType !== type) return false;
      if (Math.abs(g.gapPct) < minGap) return false;
      if (!showFilled && g.filled) return false;
      return true;
    })
    .sort((a, b) => sortBy === "gapPct" ? Math.abs(b.gapPct) - Math.abs(a.gapPct) : parseFloat(b.volume) - parseFloat(a.volume));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Gap Scanner</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">Pre-Market</span>
          <span className="w-2 h-2 rounded-full bg-[#ffd600] animate-pulse" />
          <span className="text-xs text-[#ffd600]">4:02 AM ET</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["all", "Gap Up", "Gap Down"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1 text-xs transition-colors ${type === t ? (t === "Gap Up" ? "bg-[#00e67633] text-[#00e676]" : t === "Gap Down" ? "bg-[#ff444433] text-[#ff4444]" : "bg-[#1e3a5f] text-[#00d4ff]") : "text-[#8892a4]"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8892a4]">Min gap %:</span>
            <input type="number" step="0.5" className="w-14 bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-white outline-none"
              value={minGap} onChange={(e) => setMinGap(Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showFilled ? "bg-[#00e676]" : "bg-[#1e2433]"}`} onClick={() => setShowFilled(!showFilled)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showFilled ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[#8892a4]">Show filled</span>
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Symbol", "Prev Close", "Pre-Market", "Gap %", "Type", "Volume", "Float", "Catalyst", "Status"].map((h) => (
                  <th key={h} onClick={() => h === "Gap %" ? setSortBy("gapPct") : h === "Volume" ? setSortBy("volume") : null}
                    className={`text-left py-3 px-3 text-[#8892a4] font-medium ${["Gap %","Volume"].includes(h) ? "cursor-pointer hover:text-white" : ""}`}>
                    {h}{sortBy === "gapPct" && h === "Gap %" ? " ↓" : sortBy === "volume" && h === "Volume" ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} onClick={() => setSelected(g)}
                  className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.id === g.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"} ${g.filled ? "opacity-50" : ""}`}>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{g.symbol}</div>
                    <div className="text-[10px] text-[#8892a4] truncate max-w-[90px]">{g.name}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">${g.prevClose.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-white">${g.preMarket.toFixed(2)}</td>
                  <td className={`py-3 px-3 font-mono font-bold text-base ${g.gapPct >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                    {g.gapPct >= 0 ? "+" : ""}{g.gapPct.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${g.gapType === "Gap Up" ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>{g.gapType}</span>
                  </td>
                  <td className="py-3 px-3 text-[#ffd600]">{g.volume}</td>
                  <td className="py-3 px-3 text-[#8892a4]">{g.float}</td>
                  <td className="py-3 px-3 text-[#c8d3e0]">{g.catalyst}</td>
                  <td className="py-3 px-3">
                    {g.filled
                      ? <span className="text-[9px] text-[#8892a4] border border-[#1e2433] px-1.5 py-0.5 rounded">Filled</span>
                      : <span className="text-[9px] text-[#00e676] border border-[#00e67644] px-1.5 py-0.5 rounded">Open</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-60 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{selected.symbol}</p>
                <p className="text-xs text-[#8892a4]">{selected.name}</p>
              </div>
              <span className={`text-lg font-bold ${selected.gapPct >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                {selected.gapPct >= 0 ? "+" : ""}{selected.gapPct.toFixed(2)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Prev Close", val: `$${selected.prevClose.toFixed(2)}`, color: "#8892a4" },
                { label: "Pre-Market", val: `$${selected.preMarket.toFixed(2)}`, color: "white" },
                { label: "Gap $", val: `${selected.gapPct >= 0 ? "+" : ""}$${(selected.preMarket - selected.prevClose).toFixed(2)}`, color: selected.gapPct >= 0 ? "#00e676" : "#ff4444" },
                { label: "Volume", val: selected.volume, color: "#ffd600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#131722] border border-[#1e2433] rounded p-2">
                  <p className="text-[9px] text-[#8892a4]">{label}</p>
                  <p className="text-sm font-bold" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded p-3">
              <p className="text-[10px] text-[#8892a4] mb-1">Catalyst</p>
              <p className="text-sm font-bold text-white">{selected.catalyst}</p>
              <p className="text-xs text-[#8892a4] mt-1">{selected.sector} sector</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Gap Fill Probability</p>
              <div className="w-full h-2 bg-[#1e2433] rounded-full overflow-hidden">
                <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: selected.filled ? "100%" : `${30 + Math.abs(selected.gapPct) * 3}%` }} />
              </div>
              <p className="text-[10px] text-[#8892a4] mt-1">{selected.filled ? "Filled" : `~${(30 + Math.abs(selected.gapPct) * 3).toFixed(0)}% chance today`}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
