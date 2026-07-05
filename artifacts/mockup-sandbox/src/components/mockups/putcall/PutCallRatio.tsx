import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, AreaChart, Area } from "recharts";

const DAYS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date("2025-04-01");
  d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});

const PCR_DATA = DAYS.map((day, i) => {
  const base = 0.85 + Math.sin(i * 0.3) * 0.25 + Math.cos(i * 0.15) * 0.15;
  const equity = 0.6 + Math.sin(i * 0.4) * 0.2 + Math.random() * 0.08;
  const index  = 1.1 + Math.sin(i * 0.25) * 0.3 + Math.random() * 0.1;
  return {
    day,
    total:  parseFloat(Math.max(0.4, Math.min(1.8, base)).toFixed(3)),
    equity: parseFloat(Math.max(0.3, Math.min(1.4, equity)).toFixed(3)),
    index:  parseFloat(Math.max(0.6, Math.min(2.2, index)).toFixed(3)),
  };
});

const SYMBOL_PCR = [
  { symbol:"AAPL", pcr:0.68, putVol:128400, callVol:188800, bias:"Bullish",   change:-0.04 },
  { symbol:"NVDA", pcr:0.52, putVol:284200, callVol:546400, bias:"Very Bullish", change:-0.08 },
  { symbol:"TSLA", pcr:1.24, putVol:482600, callVol:389200, bias:"Bearish",   change:+0.12 },
  { symbol:"META", pcr:0.61, putVol:98400,  callVol:161400, bias:"Bullish",   change:-0.03 },
  { symbol:"SPY",  pcr:1.18, putVol:2184000,callVol:1850000,bias:"Slightly Bearish",change:+0.06 },
  { symbol:"QQQ",  pcr:1.04, putVol:884000, callVol:850000, bias:"Neutral",   change:+0.02 },
  { symbol:"MSFT", pcr:0.74, putVol:82400,  callVol:111400, bias:"Bullish",   change:-0.01 },
  { symbol:"AMD",  pcr:0.58, putVol:198400, callVol:342000, bias:"Bullish",   change:-0.06 },
  { symbol:"INTC", pcr:1.42, putVol:248000, callVol:174600, bias:"Bearish",   change:+0.18 },
  { symbol:"LLY",  pcr:0.48, putVol:42400,  callVol:88300,  bias:"Very Bullish", change:-0.09 },
];

const latestPCR = PCR_DATA[PCR_DATA.length - 1].total;
const sentiment = latestPCR > 1.2 ? "Extreme Fear" : latestPCR > 1.0 ? "Fear" : latestPCR > 0.8 ? "Neutral" : latestPCR > 0.6 ? "Greed" : "Extreme Greed";
const sentColor  = latestPCR > 1.2 ? "#ff4444" : latestPCR > 1.0 ? "#ff8c00" : latestPCR > 0.8 ? "#ffd600" : latestPCR > 0.6 ? "#00e676" : "#00d4ff";

export function PutCallRatio() {
  const [view, setView] = useState<"history" | "symbols" | "gauge">("history");
  const [dataType, setDataType] = useState<"total" | "equity" | "index">("total");

  const pcrColor = (v: number) => v > 1.2 ? "#ff4444" : v > 1.0 ? "#ff8c00" : v > 0.8 ? "#ffd600" : v > 0.6 ? "#00e676" : "#00d4ff";

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Put/Call Ratio Dashboard</span>
          <div className="flex items-center gap-2 bg-[#131722] border border-[#1e2433] rounded px-3 py-1">
            <span className="text-xs text-[#8892a4]">Current PCR:</span>
            <span className="text-sm font-bold" style={{ color: sentColor }}>{latestPCR.toFixed(3)}</span>
            <span className="text-xs font-bold" style={{ color: sentColor }}>— {sentiment}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["history","symbols","gauge"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v === "gauge" ? "Meter" : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "history" && (
        <div className="flex-1 flex flex-col p-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
              {(["total","equity","index"] as const).map((t) => (
                <button key={t} onClick={() => setDataType(t)}
                  className={`px-3 py-1 text-xs capitalize transition-colors ${dataType === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                  {t}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#8892a4]">Bearish above 1.0 • Bullish below 0.7 • 60-day window</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PCR_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#8892a4" }} interval={9} />
                <YAxis domain={[0.3, 2.0]} tick={{ fontSize: 9, fill: "#8892a4" }} />
                <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                  formatter={(v: number) => [v.toFixed(3), "PCR"]} />
                <ReferenceLine y={1.0} stroke="#ff444466" strokeDasharray="4 4" label={{ value: "Fear (1.0)", fill: "#ff4444", fontSize: 9, position: "right" }} />
                <ReferenceLine y={0.7} stroke="#00e67666" strokeDasharray="4 4" label={{ value: "Greed (0.7)", fill: "#00e676", fontSize: 9, position: "right" }} />
                <Area type="monotone" dataKey={dataType} stroke={pcrColor(latestPCR)} fill={pcrColor(latestPCR) + "22"} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "symbols" && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Symbol","PCR","Bias","Put Vol","Call Vol","1D Change"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SYMBOL_PCR].sort((a, b) => b.pcr - a.pcr).map((s) => (
                <tr key={s.symbol} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                  <td className="py-3 px-4 font-bold text-white">{s.symbol}</td>
                  <td className="py-3 px-4">
                    <span className="text-base font-bold font-mono" style={{ color: pcrColor(s.pcr) }}>{s.pcr.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold" style={{ color: s.pcr < 0.7 ? "#00d4ff" : s.pcr < 0.85 ? "#00e676" : s.pcr < 1.0 ? "#ffd600" : "#ff4444" }}>{s.bias}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#ff4444]">{(s.putVol/1000).toFixed(0)}K</td>
                  <td className="py-3 px-4 font-mono text-[#00e676]">{(s.callVol/1000).toFixed(0)}K</td>
                  <td className="py-3 px-4 font-mono" style={{ color: s.change < 0 ? "#00e676" : "#ff4444" }}>
                    {s.change > 0 ? "+" : ""}{s.change.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "gauge" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center">
            <svg width={420} height={240} viewBox="0 0 420 240">
              {[["Extreme Greed","#00d4ff",0,72],["Greed","#00e676",72,108],["Neutral","#ffd600",108,144],["Fear","#ff8c00",144,180],["Extreme Fear","#ff4444",180,252]].map(([label,color,start,end]) => {
                const r = 160, cx = 210, cy = 210;
                const a1 = ((Number(start) - 126) * Math.PI) / 180;
                const a2 = ((Number(end)   - 126) * Math.PI) / 180;
                const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
                const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
                const lx = cx + (r - 20) * Math.cos((a1 + a2) / 2);
                const ly = cy + (r - 20) * Math.sin((a1 + a2) / 2);
                return (
                  <g key={label as string}>
                    <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={color as string} opacity={0.15} />
                    <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={color as string} strokeWidth={18} opacity={0.6} />
                    <text x={lx} y={ly} textAnchor="middle" fontSize={8} fill={color as string}>{label}</text>
                  </g>
                );
              })}

              {(() => {
                const pct = Math.max(0, Math.min(1, (latestPCR - 0.4) / 1.4));
                const angle = (-126 + pct * 252) * Math.PI / 180;
                const cx = 210, cy = 210;
                const nx = cx + 140 * Math.cos(angle), ny = cy + 140 * Math.sin(angle);
                return <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth={3} strokeLinecap="round" />;
              })()}

              <circle cx={210} cy={210} r={10} fill="white" />
              <text x={210} y={185} textAnchor="middle" fontSize={28} fill="white" fontWeight="700">{latestPCR.toFixed(2)}</text>
              <text x={210} y={202} textAnchor="middle" fontSize={12} fill={sentColor} fontWeight="700">{sentiment}</text>
            </svg>

            <div className="grid grid-cols-5 gap-4 mt-6 w-full max-w-xl">
              {[["Equity PCR", PCR_DATA[PCR_DATA.length-1].equity], ["Index PCR", PCR_DATA[PCR_DATA.length-1].index], ["Total PCR", PCR_DATA[PCR_DATA.length-1].total], ["5D Avg", (PCR_DATA.slice(-5).reduce((s, d) => s + d.total, 0) / 5)], ["20D Avg", (PCR_DATA.slice(-20).reduce((s, d) => s + d.total, 0) / 20)]].map(([l, v]) => (
                <div key={l as string} className="bg-[#131722] border border-[#1e2433] rounded-lg p-3 text-center">
                  <p className="text-[9px] text-[#8892a4]">{l}</p>
                  <p className="text-lg font-bold" style={{ color: pcrColor(Number(v)) }}>{Number(v).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
