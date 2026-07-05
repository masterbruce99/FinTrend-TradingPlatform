import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SEASONAL_DATA: Record<string, number[]> = {
  SPY:  [1.2,  -0.4, 2.8,  1.8,  0.4,  -0.6, 1.4,  -0.8, -1.2, 2.4,  3.2,  1.8],
  AAPL: [2.4,  1.2,  3.8,  2.4,  1.2,  -0.4, 2.8,  3.2,  -2.4, 4.2,  4.8,  3.2],
  NVDA: [4.8,  2.4,  6.2,  3.8,  -0.8, 2.4,  4.2,  5.8,  -3.2, 6.4,  8.2,  5.4],
  TSLA: [-2.4, 3.2,  4.8,  -1.2, -3.4, 2.8,  1.4,  -4.2, -2.8, 8.4,  4.2,  -3.2],
  GLD:  [2.8,  0.4,  -1.2, 0.8,  1.4,  1.8,  2.4,  0.8,  1.6,  -0.4, -1.8, 0.4],
  QQQ:  [1.8,  0.2,  3.2,  2.2,  0.8,  -0.2, 2.0,  0.4,  -1.8, 3.2,  4.4,  2.4],
};

const WIN_RATES: Record<string, number[]> = {
  SPY:  [62,42,72,64,58,48,64,44,40,72,76,68],
  AAPL: [68,60,74,66,58,44,68,72,46,76,78,72],
  NVDA: [72,62,78,68,48,60,70,76,42,78,82,74],
  TSLA: [44,62,68,48,40,58,54,40,46,76,66,42],
  GLD:  [68,56,46,58,62,64,68,60,64,52,44,58],
  QQQ:  [64,52,72,64,58,46,64,52,44,70,76,68],
};

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

type YearlyData = Record<string, Record<number, number>>;
const YEARLY: YearlyData = {
  SPY:  { 2019:28.8, 2020:16.3, 2021:26.9, 2022:-19.4, 2023:24.2, 2024:23.3, 2025:8.4 },
  AAPL: { 2019:85.2, 2020:80.4, 2021:33.8, 2022:-26.4, 2023:48.2, 2024:28.4, 2025:12.4 },
  NVDA: { 2019:76.3, 2020:122.4, 2021:124.8, 2022:-50.2, 2023:238.9, 2024:168.4, 2025:24.8 },
  TSLA: { 2019:25.4, 2020:743.8, 2021:49.8, 2022:-65.0, 2023:101.7, 2024:-12.8, 2025:-18.4 },
  GLD:  { 2019:18.4, 2020:25.2, 2021:-3.6, 2022:-0.4, 2023:13.2, 2024:28.4, 2025:12.8 },
  QQQ:  { 2019:38.6, 2020:47.6, 2021:26.6, 2022:-32.6, 2023:54.1, 2024:26.5, 2025:10.2 },
};

export function Seasonality() {
  const [symbol, setSymbol] = useState("SPY");
  const [view, setView] = useState<"monthly" | "calendar" | "yearly">("monthly");

  const monthlyData = MONTHS.map((m, i) => ({
    month: m,
    avgReturn: SEASONAL_DATA[symbol][i],
    winRate: WIN_RATES[symbol][i],
  }));

  const yearlyData = YEARS.map((y) => ({
    year: y.toString(),
    return: YEARLY[symbol][y],
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Seasonality Patterns</span>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {Object.keys(SEASONAL_DATA).map((s) => (
              <button key={s} onClick={() => setSymbol(s)}
                className={`px-3 py-1 text-xs font-bold transition-colors ${symbol === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["monthly","calendar","yearly"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "monthly" ? "Avg Returns" : v === "calendar" ? "Heatmap" : "Annual"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Best Month",   MONTHS[SEASONAL_DATA[symbol].indexOf(Math.max(...SEASONAL_DATA[symbol]))], "#00e676"],
          ["Worst Month",  MONTHS[SEASONAL_DATA[symbol].indexOf(Math.min(...SEASONAL_DATA[symbol]))], "#ff4444"],
          ["Avg Annual",   `${(Object.values(YEARLY[symbol]).reduce((a,b) => a+b,0)/YEARS.length).toFixed(1)}%`, "#ffd600"],
          ["Win Rate (Avg)",`${Math.round(WIN_RATES[symbol].reduce((a,b) => a+b,0)/12)}%`, "#00d4ff"],
        ].map(([l,v,c]) => (
          <div key={l as string}>
            <p className="text-[10px] text-[#8892a4]">{l}</p>
            <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>

      {view === "monthly" && (
        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">Average Monthly Return % (2019–2025)</p>
            <ResponsiveContainer width="100%" height="55%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8892a4" }} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
                <ReferenceLine y={0} stroke="#8892a4" />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(2)}%`]} />
                <Bar dataKey="avgReturn" name="Avg Return" shape={(props: any) => {
                  const { x, y, width, height, value } = props;
                  return <rect x={x} y={value >= 0 ? y : y + height} width={Math.max(width - 2, 1)} height={Math.abs(height)} fill={value >= 0 ? "#00e67688" : "#ff444488"} stroke={value >= 0 ? "#00e676" : "#ff4444"} strokeWidth={1} />;
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">Monthly Win Rate %</p>
            <ResponsiveContainer width="100%" height="55%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8892a4" }} />
                <YAxis domain={[30, 90]} tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
                <ReferenceLine y={50} stroke="#8892a4" strokeDasharray="4 4" label={{ value:"50%", fill:"#8892a4", fontSize:9 }} />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v}%`, "Win Rate"]} />
                <Line type="monotone" dataKey="winRate" stroke="#00d4ff" strokeWidth={2} dot={{ fill:"#00d4ff", r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "calendar" && (
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-xs text-[#8892a4] mb-4">Monthly Return Heatmap — {symbol} (2019–2025)</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="py-2 px-3 text-left text-[#8892a4]">Year</th>
                {MONTHS.map((m) => <th key={m} className="py-2 px-2 text-[#8892a4] text-center">{m}</th>)}
                <th className="py-2 px-3 text-[#8892a4] text-right">Annual</th>
              </tr>
            </thead>
            <tbody>
              {YEARS.map((year) => (
                <tr key={year} className="border-t border-[#1e2433]">
                  <td className="py-2.5 px-3 font-bold text-[#8892a4]">{year}</td>
                  {MONTHS.map((_, mi) => {
                    const v = SEASONAL_DATA[symbol][mi] * (0.6 + Math.random() * 0.8);
                    const abs = Math.min(Math.abs(v) / 8, 1);
                    return (
                      <td key={mi} className="py-2.5 px-2 text-center rounded">
                        <div className="rounded px-1 py-0.5 text-[10px] font-bold font-mono"
                          style={{ backgroundColor: (v >= 0 ? "#00e676" : "#ff4444") + Math.round(abs * 80 + 15).toString(16).padStart(2,"0"), color: v >= 0 ? "#00e676" : "#ff4444" }}>
                          {v >= 0 ? "+" : ""}{v.toFixed(1)}%
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-bold font-mono" style={{ color: YEARLY[symbol][year] >= 0 ? "#00e676" : "#ff4444" }}>
                    {YEARLY[symbol][year] >= 0 ? "+" : ""}{YEARLY[symbol][year].toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "yearly" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Annual Returns — {symbol}</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#8892a4" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="#8892a4" />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(1)}%`, "Annual Return"]} />
              <Bar dataKey="return" name="Annual Return" shape={(props: any) => {
                const { x, y, width, height, value } = props;
                return <rect x={x} y={value >= 0 ? y : y + height} width={Math.max(width - 4, 1)} height={Math.abs(height)} fill={value >= 0 ? "#00e67688" : "#ff444488"} stroke={value >= 0 ? "#00e676" : "#ff4444"} strokeWidth={1} rx={2} />;
              }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
