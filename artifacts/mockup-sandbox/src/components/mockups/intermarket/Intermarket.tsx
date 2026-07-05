import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from "recharts";

const ASSETS = [
  { symbol:"SPY",  name:"S&P 500",    color:"#00e676", category:"Equity" },
  { symbol:"QQQ",  name:"Nasdaq 100", color:"#00d4ff", category:"Equity" },
  { symbol:"TLT",  name:"20Y Bonds",  color:"#a78bfa", category:"Bonds"  },
  { symbol:"GLD",  name:"Gold",       color:"#ffd600", category:"Commodity" },
  { symbol:"USO",  name:"Crude Oil",  color:"#ff8c00", category:"Commodity" },
  { symbol:"DXY",  name:"US Dollar",  color:"#8892a4", category:"Currency" },
  { symbol:"BTC",  name:"Bitcoin",    color:"#f7931a", category:"Crypto"  },
  { symbol:"VIX",  name:"Volatility", color:"#ff4444", category:"Risk"   },
];

const CORR_MATRIX: Record<string,Record<string,number>> = {
  SPY:  { SPY:1,     QQQ:0.96, TLT:-0.42, GLD:0.18, USO:0.28, DXY:-0.34, BTC:0.52, VIX:-0.78 },
  QQQ:  { SPY:0.96,  QQQ:1,    TLT:-0.38, GLD:0.14, USO:0.24, DXY:-0.30, BTC:0.58, VIX:-0.74 },
  TLT:  { SPY:-0.42, QQQ:-0.38,TLT:1,     GLD:0.44, USO:-0.18,DXY:0.12,  BTC:-0.24,VIX:0.38  },
  GLD:  { SPY:0.18,  QQQ:0.14, TLT:0.44,  GLD:1,    USO:0.32, DXY:-0.62, BTC:0.38, VIX:0.12  },
  USO:  { SPY:0.28,  QQQ:0.24, TLT:-0.18, GLD:0.32, USO:1,    DXY:-0.28, BTC:0.22, VIX:-0.14 },
  DXY:  { SPY:-0.34, QQQ:-0.30,TLT:0.12,  GLD:-0.62,USO:-0.28,DXY:1,     BTC:-0.42,VIX:0.18  },
  BTC:  { SPY:0.52,  QQQ:0.58, TLT:-0.24, GLD:0.38, USO:0.22, DXY:-0.42, BTC:1,    VIX:-0.48 },
  VIX:  { SPY:-0.78, QQQ:-0.74,TLT:0.38,  GLD:0.12, USO:-0.14,DXY:0.18,  BTC:-0.48,VIX:1     },
};

const DAYS = Array.from({ length: 90 }, (_, i) => {
  const d = new Date("2025-01-15"); d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
});

const NORM_PERF: Record<string, number[]> = {
  SPY: [100], QQQ: [100], TLT: [100], GLD: [100], USO: [100], DXY: [100], BTC: [100], VIX: [100],
};
const BIASES: Record<string, number> = { SPY:0.12, QQQ:0.15, TLT:-0.04, GLD:0.08, USO:-0.05, DXY:0.02, BTC:0.25, VIX:-0.08 };
for (let i = 1; i < 90; i++) {
  Object.keys(NORM_PERF).forEach((sym) => {
    const last = NORM_PERF[sym][i - 1];
    NORM_PERF[sym].push(parseFloat((last * (1 + BIASES[sym] / 100 + (Math.random() - 0.49) * 0.012)).toFixed(3)));
  });
}

const PERF_DATA = DAYS.map((day, i) => {
  const row: Record<string, string | number> = { day };
  Object.keys(NORM_PERF).forEach((sym) => { row[sym] = NORM_PERF[sym][i]; });
  return row;
});

const corrColor = (v: number) =>
  v >= 0.8 ? "#00e676" : v >= 0.5 ? "#4ade80" : v >= 0.2 ? "#a0cfa0" :
  v >= -0.2 ? "#8892a4" : v >= -0.5 ? "#ffa0a0" : v >= -0.8 ? "#ff6666" : "#ff4444";

export function Intermarket() {
  const [view, setView] = useState<"matrix" | "perf" | "pairs">("matrix");
  const [activeAssets, setActiveAssets] = useState<string[]>(["SPY","TLT","GLD","BTC"]);
  const [pairA, setPairA] = useState("SPY");
  const [pairB, setPairB] = useState("BTC");

  const toggleAsset = (s: string) =>
    setActiveAssets((prev) => prev.includes(s) ? prev.filter((a) => a !== s) : [...prev, s].slice(0, 6));

  const pairCorr = CORR_MATRIX[pairA]?.[pairB] ?? 0;
  const scatterData = DAYS.slice(0, 60).map((_, i) => ({
    x: NORM_PERF[pairA][i],
    y: NORM_PERF[pairB][i],
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Intermarket Analysis</span>
          <span className="text-xs text-[#8892a4]">Cross-asset correlations & relative performance</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["matrix","perf","pairs"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "matrix" ? "Correlation Matrix" : v === "perf" ? "Rel. Performance" : "Pair Analysis"}
            </button>
          ))}
        </div>
      </div>

      {view === "matrix" && (
        <div className="flex-1 p-6 overflow-auto">
          <p className="text-xs text-[#8892a4] mb-4">90-Day Rolling Correlation Matrix</p>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-16 p-2" />
                {ASSETS.map((a) => <th key={a.symbol} className="p-2 text-center w-14" style={{ color: a.color }}>{a.symbol}</th>)}
              </tr>
            </thead>
            <tbody>
              {ASSETS.map((rowA) => (
                <tr key={rowA.symbol}>
                  <td className="p-2 font-bold" style={{ color: rowA.color }}>{rowA.symbol}</td>
                  {ASSETS.map((colA) => {
                    const v = CORR_MATRIX[rowA.symbol][colA.symbol];
                    const bg = corrColor(v);
                    return (
                      <td key={colA.symbol} className="p-1 text-center">
                        <div className="w-12 h-10 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: bg + "33", border: `1px solid ${bg}44`, color: bg }}>
                          {rowA.symbol === colA.symbol ? "—" : v.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-6 text-[10px] text-[#8892a4]">
            {[["Strong +","#00e676"],["Moderate +","#4ade80"],["Neutral","#8892a4"],["Moderate −","#ff6666"],["Strong −","#ff4444"]].map(([l,c]) => (
              <div key={l as string} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c as string }} />
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "perf" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4 flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            {ASSETS.map((a) => (
              <button key={a.symbol} onClick={() => toggleAsset(a.symbol)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-all ${activeAssets.includes(a.symbol) ? "border-transparent" : "border-[#1e2433] opacity-40"}`}
                style={activeAssets.includes(a.symbol) ? { backgroundColor: a.color + "22", borderColor: a.color, color: a.color } : {}}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                {a.symbol}
              </button>
            ))}
            <span className="text-[10px] text-[#8892a4] ml-2">Max 6 assets</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PERF_DATA.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#8892a4" }} interval={9} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${((v - 1) * 100).toFixed(0)}%`} />
                <ReferenceLine y={1} stroke="#8892a4" strokeDasharray="3 4" />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }}
                  formatter={(v:number, name:string) => [`${((v-1)*100).toFixed(2)}%`, name]} />
                {activeAssets.map((sym) => {
                  const asset = ASSETS.find((a) => a.symbol === sym)!;
                  return <Line key={sym} type="monotone" dataKey={sym} stroke={asset.color} strokeWidth={2} dot={false} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "pairs" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4">
          <div className="w-48 flex flex-col gap-4">
            {["A","B"].map((label, li) => {
              const val = li === 0 ? pairA : pairB;
              const setter = li === 0 ? setPairA : setPairB;
              return (
                <div key={label}>
                  <p className="text-[10px] text-[#8892a4] mb-2">Asset {label}</p>
                  <div className="space-y-1">
                    {ASSETS.map((a) => (
                      <button key={a.symbol} onClick={() => setter(a.symbol)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors ${val === a.symbol ? "bg-[#131722] border border-[#1e2433]" : "hover:bg-[#0f1320]"}`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span style={{ color: a.color }}>{a.symbol}</span>
                        <span className="text-[#8892a4] text-[10px]">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3 text-center">
              <p className="text-[10px] text-[#8892a4] mb-1">Correlation</p>
              <p className="text-2xl font-bold" style={{ color: corrColor(pairCorr) }}>{pairCorr.toFixed(2)}</p>
              <p className="text-[10px] mt-1" style={{ color: corrColor(pairCorr) }}>
                {pairCorr >= 0.7 ? "Strong +" : pairCorr >= 0.4 ? "Moderate +" : pairCorr >= -0.1 ? "Neutral" : pairCorr >= -0.5 ? "Moderate −" : "Strong −"}
              </p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">{pairA} vs {pairB} — Normalized Performance Scatter</p>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis type="number" dataKey="x" name={pairA} tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${((v-1)*100).toFixed(0)}%`} />
                <YAxis type="number" dataKey="y" name={pairB} tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${((v-1)*100).toFixed(0)}%`} />
                <ReferenceLine x={1} stroke="#8892a4" strokeDasharray="3 4" />
                <ReferenceLine y={1} stroke="#8892a4" strokeDasharray="3 4" />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }}
                  formatter={(v:number, name:string) => [`${((v-1)*100).toFixed(2)}%`, name]} />
                <Scatter data={scatterData} fill={corrColor(pairCorr) + "88"} stroke={corrColor(pairCorr)} strokeWidth={1} r={3} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
