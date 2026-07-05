import { useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];

const SEEDS: Record<string, number> = {
  SPY: 42, AAPL: 17, NVDA: 93, TSLA: 55, QQQ: 28, BTC: 81
};

function seededRand(seed: number, i: number): number {
  const x = Math.sin(seed * 9999 + i * 37.4321) * 43758.5453;
  return x - Math.floor(x);
}

function monthlyReturn(sym: string, year: number, month: number): number {
  const i = year * 12 + month;
  const r = seededRand(SEEDS[sym], i);
  const bias = sym === "BTC" ? 6 : sym === "NVDA" ? 4 : sym === "TSLA" ? 3 : 1.5;
  return parseFloat(((r - 0.44) * 12 * bias).toFixed(2));
}

function annualReturn(sym: string, year: number): number {
  return parseFloat(MONTHS.reduce((s, _, m) => s + monthlyReturn(sym, year, m), 0).toFixed(1));
}

const HEAT_COLOR = (v: number, maxAbs: number) => {
  const t = Math.min(Math.abs(v) / maxAbs, 1);
  if (v > 0) return `rgba(0, 230, 118, ${0.15 + t * 0.7})`;
  return `rgba(255, 68, 68, ${0.15 + t * 0.7})`;
};

export function ReturnsHeatmap() {
  const [symbol, setSymbol] = useState("SPY");
  const [mode, setMode] = useState<"calendar" | "row" | "stats">("calendar");
  const [hoveredCell, setHoveredCell] = useState<{ year: number; month: number; val: number } | null>(null);

  const allReturns = YEARS.flatMap((y) => MONTHS.map((_, m) => monthlyReturn(symbol, y, m)));
  const maxAbs = Math.max(...allReturns.map(Math.abs));

  const monthAvgs = MONTHS.map((_, m) => ({
    month: MONTHS[m],
    avg: parseFloat((YEARS.reduce((s, y) => s + monthlyReturn(symbol, y, m), 0) / YEARS.length).toFixed(2)),
    wins: YEARS.filter((y) => monthlyReturn(symbol, y, m) > 0).length,
    best: Math.max(...YEARS.map((y) => monthlyReturn(symbol, y, m))),
    worst: Math.min(...YEARS.map((y) => monthlyReturn(symbol, y, m))),
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Monthly Returns Heatmap</span>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {Object.keys(SEEDS).map((s) => (
              <button key={s} onClick={() => setSymbol(s)}
                className={`px-3 py-1 text-xs font-bold transition-colors ${symbol === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["calendar","row","stats"] as const).map((v) => (
            <button key={v} onClick={() => setMode(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${mode === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "calendar" ? "Calendar" : v === "row" ? "Row View" : "Stats"}
            </button>
          ))}
        </div>
      </div>

      {hoveredCell && (
        <div className="px-5 py-1.5 border-b border-[#1e2433] bg-[#0d1018] text-xs flex items-center gap-4">
          <span className="text-[#8892a4]">{MONTHS[hoveredCell.month]} {hoveredCell.year}</span>
          <span className="font-bold font-mono" style={{ color: hoveredCell.val >= 0 ? "#00e676" : "#ff4444" }}>
            {hoveredCell.val >= 0 ? "+" : ""}{hoveredCell.val.toFixed(2)}%
          </span>
        </div>
      )}

      {(mode === "calendar" || mode === "row") && (
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="py-2 px-2 text-left text-[#8892a4] w-14">Year</th>
                {MONTHS.map((m) => <th key={m} className="py-2 px-1 text-[#8892a4] text-center text-[10px] w-16">{m}</th>)}
                <th className="py-2 px-2 text-[#8892a4] text-right text-[10px]">Annual</th>
              </tr>
            </thead>
            <tbody>
              {YEARS.map((year) => {
                const annual = annualReturn(symbol, year);
                return (
                  <tr key={year}>
                    <td className="py-1 px-2 font-bold text-[#8892a4] text-[11px]">{year}</td>
                    {MONTHS.map((_, mi) => {
                      const v = monthlyReturn(symbol, year, mi);
                      return (
                        <td key={mi} className="py-0.5 px-0.5"
                          onMouseEnter={() => setHoveredCell({ year, month: mi, val: v })}
                          onMouseLeave={() => setHoveredCell(null)}>
                          <div className="rounded text-center py-1.5 cursor-default transition-all hover:scale-105"
                            style={{ backgroundColor: HEAT_COLOR(v, maxAbs), minWidth: 44 }}>
                            <span className="text-[9px] font-bold font-mono" style={{ color: v >= 0 ? "#b3ffde" : "#ffb3b3" }}>
                              {v >= 0 ? "+" : ""}{v.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 text-right">
                      <span className="font-bold font-mono text-[11px]" style={{ color: annual >= 0 ? "#00e676" : "#ff4444" }}>
                        {annual >= 0 ? "+" : ""}{annual.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-[#1e2433]">
                <td className="py-2 px-2 text-[10px] font-bold text-[#8892a4]">Avg</td>
                {monthAvgs.map((ma) => (
                  <td key={ma.month} className="py-1 px-0.5">
                    <div className="rounded text-center py-1.5" style={{ backgroundColor: HEAT_COLOR(ma.avg, maxAbs) }}>
                      <span className="text-[9px] font-bold font-mono" style={{ color: ma.avg >= 0 ? "#b3ffde" : "#ffb3b3" }}>
                        {ma.avg >= 0 ? "+" : ""}{ma.avg.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {mode === "stats" && (
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-[#8892a4] mb-4">Monthly Statistics — {symbol} (2015–2025)</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e2433]">
                {["Month","Avg Return","Win Rate","Best","Worst","Consistency"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthAvgs.map((ma) => {
                const winRate = Math.round((ma.wins / YEARS.length) * 100);
                return (
                  <tr key={ma.month} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                    <td className="py-3 px-3 font-bold text-white">{ma.month}</td>
                    <td className="py-3 px-3 font-bold font-mono" style={{ color: ma.avg >= 0 ? "#00e676" : "#ff4444" }}>
                      {ma.avg >= 0 ? "+" : ""}{ma.avg.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${winRate}%`, backgroundColor: winRate >= 60 ? "#00e676" : winRate >= 50 ? "#ffd600" : "#ff4444" }} />
                        </div>
                        <span className="font-bold" style={{ color: winRate >= 60 ? "#00e676" : winRate >= 50 ? "#ffd600" : "#ff4444" }}>{winRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#00e676]">+{ma.best.toFixed(1)}%</td>
                    <td className="py-3 px-3 font-mono text-[#ff4444]">{ma.worst.toFixed(1)}%</td>
                    <td className="py-3 px-3">
                      <div className="w-20 h-2 bg-[#1e2433] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#00d4ff]" style={{ width: `${winRate}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
