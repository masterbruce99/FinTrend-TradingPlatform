import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SEASONALITY: Record<string, number[]> = {
  AAPL:  [ 2.1, -0.8, 3.4,  1.2, -1.5, 0.8,  4.2,  2.8,  1.9, -2.4,  6.8,  4.1],
  NVDA:  [ 8.4,  3.2, 6.8, -2.1,  4.5, 3.2,  9.4,  5.6,  3.2, -4.8, 12.4,  7.8],
  TSLA:  [-3.2, 12.4, 8.6, -5.1, -2.8, 7.4, -4.2,  8.9,  6.4, -8.2,  4.6,  9.8],
  SPY:   [ 1.4, -0.4, 2.8,  1.8, -0.2, 0.6,  2.4,  1.2, -0.8, -1.4,  3.8,  2.1],
  QQQ:   [ 2.8,  0.8, 4.2,  1.4,  0.4, 1.8,  4.8,  2.6, -0.4, -2.8,  6.4,  3.8],
  GLD:   [ 2.4,  1.8,-0.4, -0.8,  0.6,-1.2,  1.8, -0.6,  2.8,  1.4,  0.4,  1.2],
};

const YEAR_DATA: Record<string, Record<number, number[]>> = {
  AAPL: {
    2021: [7.2, -6.1, 8.4, 2.8, -4.2, 3.8, 9.4, 4.6, -3.2, -2.8, 11.4, 6.8],
    2022: [-4.1, -1.8, -3.4, -8.2, -4.6, -6.8, 11.2, -3.8, -9.4, 8.4, 2.1, -3.8],
    2023: [4.2, 0.8, 6.8, -2.4, 0.6, 6.2, 1.8, 2.4, -4.8, -2.1, 12.4, 8.2],
    2024: [3.8, 4.1, -1.2, -4.8, 8.2, -2.4, 6.8, 4.2, 2.8, -4.1, 9.8, 2.4],
  }
};

export function SeasonalityChart() {
  const [symbol, setSymbol] = useState("AAPL");
  const [view, setView] = useState<"avg" | "heatmap">("avg");
  const [years] = useState([2021, 2022, 2023, 2024]);

  const avgData = MONTHS.map((month, i) => ({
    month,
    avg: SEASONALITY[symbol]?.[i] ?? 0,
    positive: (SEASONALITY[symbol]?.[i] ?? 0) >= 0,
  }));

  const bestMonth = avgData.reduce((best, d) => (d.avg > best.avg ? d : best), avgData[0]);
  const worstMonth = avgData.reduce((worst, d) => (d.avg < worst.avg ? d : worst), avgData[0]);
  const positiveMonths = avgData.filter((d) => d.avg > 0).length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Seasonality</span>
          <select className="bg-[#131722] border border-[#1e2433] rounded px-3 py-1.5 text-sm font-bold text-white outline-none"
            value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {Object.keys(SEASONALITY).map((s) => <option key={s} className="bg-[#131722]">{s}</option>)}
          </select>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["avg", "heatmap"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "avg" ? "Avg Return" : "Year Heatmap"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-6 flex flex-col gap-4">
          {view === "avg" ? (
            <>
              <p className="text-xs text-[#8892a4]">Average monthly return — {symbol} (last 10 years)</p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={avgData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8892a4" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4, fontSize: 11 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, "Avg Return"]}
                    cursor={{ fill: "#1e2433" }}
                  />
                  <ReferenceLine y={0} stroke="#8892a4" strokeWidth={1} />
                  <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                    {avgData.map((d, i) => (
                      <Cell key={i} fill={d.avg >= 0 ? "#00e676" : "#ff4444"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <>
              <p className="text-xs text-[#8892a4]">Monthly returns by year — {symbol}</p>
              <div className="overflow-auto">
                <table className="text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-4 text-[#8892a4] font-medium w-14">Year</th>
                      {MONTHS.map((m) => <th key={m} className="text-center py-2 px-1 text-[#8892a4] font-medium w-12">{m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {years.map((year) => {
                      const yearData = YEAR_DATA[symbol]?.[year] ?? avgData.map((d) => d.avg + (Math.random() - 0.5) * 3);
                      return (
                        <tr key={year}>
                          <td className="py-1.5 pr-4 text-[#8892a4] font-medium">{year}</td>
                          {yearData.map((val, i) => (
                            <td key={i} className="py-1.5 px-1">
                              <div
                                className="w-12 h-9 flex items-center justify-center rounded text-[10px] font-bold"
                                style={{
                                  backgroundColor: val >= 0
                                    ? `rgba(0, 230, 118, ${Math.min(0.8, Math.abs(val) / 12)})`
                                    : `rgba(255, 68, 68, ${Math.min(0.8, Math.abs(val) / 12)})`,
                                  color: Math.abs(val) > 4 ? "white" : "#8892a4",
                                }}
                              >
                                {val >= 0 ? "+" : ""}{val.toFixed(1)}%
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Summary</p>
            <div className="space-y-2 text-xs">
              {[
                { label: "Best month", val: bestMonth.month, sub: `+${bestMonth.avg.toFixed(2)}%`, color: "#00e676" },
                { label: "Worst month", val: worstMonth.month, sub: `${worstMonth.avg.toFixed(2)}%`, color: "#ff4444" },
                { label: "Positive months", val: `${positiveMonths}/12`, sub: `${((positiveMonths / 12) * 100).toFixed(0)}%`, color: "#00d4ff" },
                { label: "Avg annual", val: `+${avgData.reduce((s, d) => s + d.avg, 0).toFixed(1)}%`, sub: "sum of months", color: "#00e676" },
              ].map(({ label, val, sub, color }) => (
                <div key={label} className="bg-[#131722] rounded p-2.5 border border-[#1e2433]">
                  <p className="text-[#8892a4] text-[10px]">{label}</p>
                  <p className="font-bold mt-0.5" style={{ color }}>{val}</p>
                  <p className="text-[#8892a4] text-[10px]">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Monthly Rank</p>
            {[...avgData].sort((a, b) => b.avg - a.avg).map((d, i) => (
              <div key={d.month} className="flex items-center justify-between py-1 text-xs">
                <span className="text-[#8892a4]">#{i + 1} {d.month}</span>
                <span className={d.avg >= 0 ? "text-[#00e676] font-mono" : "text-[#ff4444] font-mono"}>
                  {d.avg >= 0 ? "+" : ""}{d.avg.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
