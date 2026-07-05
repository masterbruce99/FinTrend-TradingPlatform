import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Position = {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  current: number;
  sector: string;
};

const POSITIONS: Position[] = [
  { symbol: "AAPL",  name: "Apple",       qty: 50,  avgCost: 178.40, current: 241.32, sector: "Tech" },
  { symbol: "NVDA",  name: "Nvidia",      qty: 20,  avgCost: 612.00, current: 875.40, sector: "Tech" },
  { symbol: "MSFT",  name: "Microsoft",   qty: 30,  avgCost: 310.20, current: 418.90, sector: "Tech" },
  { symbol: "LLY",   name: "Eli Lilly",   qty: 10,  avgCost: 720.00, current: 892.10, sector: "Health" },
  { symbol: "JPM",   name: "JP Morgan",   qty: 40,  avgCost: 162.50, current: 201.50, sector: "Finance" },
  { symbol: "NEE",   name: "NextEra",     qty: 80,  avgCost: 68.20,  current: 76.40,  sector: "Utility" },
  { symbol: "TSLA",  name: "Tesla",       qty: 15,  avgCost: 280.00, current: 245.10, sector: "Consumer" },
  { symbol: "XOM",   name: "ExxonMobil", qty: 35,  avgCost: 98.30,  current: 112.30, sector: "Energy" },
];

const EQUITY_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const base = 82000 + i * 600;
  const noise = Math.sin(i * 0.9) * 1200 + Math.cos(i * 0.5) * 800;
  return { day: `Day ${i + 1}`, value: Math.round(base + noise) };
});

const SECTOR_COLORS: Record<string, string> = {
  Tech: "#00d4ff",
  Health: "#00e676",
  Finance: "#ffd600",
  Utility: "#a78bfa",
  Consumer: "#ff8c00",
  Energy: "#ff4444",
};

export function PortfolioTracker() {
  const [tab, setTab] = useState<"overview" | "positions" | "history">("overview");

  const positions = POSITIONS.map((p) => ({
    ...p,
    marketVal: p.qty * p.current,
    costBasis: p.qty * p.avgCost,
    pnl: p.qty * (p.current - p.avgCost),
    pnlPct: ((p.current - p.avgCost) / p.avgCost) * 100,
  }));

  const totalVal = positions.reduce((s, p) => s + p.marketVal, 0);
  const totalCost = positions.reduce((s, p) => s + p.costBasis, 0);
  const totalPnl = totalVal - totalCost;
  const totalPnlPct = (totalPnl / totalCost) * 100;
  const dayPnl = totalVal * 0.0136;

  const sectorData = Object.entries(
    positions.reduce((acc, p) => {
      acc[p.sector] = (acc[p.sector] || 0) + p.marketVal;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold">Portfolio</span>
          <div>
            <span className="text-2xl font-bold text-white">${totalVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${totalPnl >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })} ({totalPnlPct.toFixed(2)}%) Total
            </span>
            <span className={`text-xs ${dayPnl >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
              +${dayPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })} Today
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["overview", "positions", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-xs capitalize font-medium transition-colors ${tab === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Value", val: `$${(totalVal / 1000).toFixed(1)}K`, color: "white" },
                { label: "Total Return", val: `+${totalPnlPct.toFixed(2)}%`, color: "#00e676" },
                { label: "Day Gain", val: `+$${dayPnl.toFixed(0)}`, color: "#00e676" },
                { label: "Positions", val: `${POSITIONS.length}`, color: "#8892a4" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-xl font-bold" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-xs text-[#8892a4] mb-3">30-Day Equity Curve</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={EQUITY_HISTORY}>
                  <defs>
                    <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8892a4" }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4, fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Portfolio"]} />
                  <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#pf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-56 flex flex-col gap-4">
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-xs text-[#8892a4] mb-3">Sector Allocation</p>
              <PieChart width={180} height={130}>
                <Pie data={sectorData} cx={90} cy={65} innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={2}>
                  {sectorData.map((entry) => (
                    <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? "#8892a4"} />
                  ))}
                </Pie>
              </PieChart>
              {sectorData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[10px] mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[s.name] }} />
                    <span className="text-[#8892a4]">{s.name}</span>
                  </div>
                  <span className="text-white">{((s.value / totalVal) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex-1">
              <p className="text-xs text-[#8892a4] mb-3">Best / Worst</p>
              {[...positions].sort((a, b) => b.pnlPct - a.pnlPct).slice(0, 3).map((p) => (
                <div key={p.symbol} className="flex justify-between text-xs mb-2">
                  <span className="font-bold text-white">{p.symbol}</span>
                  <span className="text-[#00e676]">+{p.pnlPct.toFixed(1)}%</span>
                </div>
              ))}
              <div className="border-t border-[#1e2433] my-2" />
              {[...positions].sort((a, b) => a.pnlPct - b.pnlPct).slice(0, 2).map((p) => (
                <div key={p.symbol} className="flex justify-between text-xs mb-2">
                  <span className="font-bold text-white">{p.symbol}</span>
                  <span className="text-[#ff4444]">{p.pnlPct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "positions" && (
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#8892a4] border-b border-[#1e2433]">
                {["Symbol", "Qty", "Avg Cost", "Current", "Mkt Value", "P&L", "P&L %", "Sector"].map((h) => (
                  <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol} className="border-b border-[#1e2433] hover:bg-[#131722]">
                  <td className="py-3 pr-4 font-bold text-white">{p.symbol}</td>
                  <td className="py-3 pr-4 text-[#8892a4]">{p.qty}</td>
                  <td className="py-3 pr-4 font-mono text-[#8892a4]">${p.avgCost.toFixed(2)}</td>
                  <td className="py-3 pr-4 font-mono text-white">${p.current.toFixed(2)}</td>
                  <td className="py-3 pr-4 font-mono text-white">${p.marketVal.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                  <td className={`py-3 pr-4 font-mono font-bold ${p.pnl >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                    {p.pnl >= 0 ? "+" : ""}${p.pnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`py-3 pr-4 font-mono font-bold ${p.pnlPct >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                    {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%
                  </td>
                  <td className="py-3 pr-4 text-[#8892a4]">{p.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "history" && (
        <div className="flex-1 p-4">
          <p className="text-xs text-[#8892a4] mb-3">Portfolio Value — Last 30 Days</p>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={EQUITY_HISTORY}>
              <defs>
                <linearGradient id="pf2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#8892a4" }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
              <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
              <Area type="monotone" dataKey="value" stroke="#00e676" strokeWidth={2} fill="url(#pf2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
