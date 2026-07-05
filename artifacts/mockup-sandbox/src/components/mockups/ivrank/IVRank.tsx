import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

type IVStock = {
  symbol: string; name: string; price: number;
  currentIV: number; ivRank: number; ivPct: number;
  iv52wHigh: number; iv52wLow: number;
  hv30: number; ivPremium: number;
  earnings: string; strategy: string; sector: string;
};

const STOCKS: IVStock[] = [
  { symbol:"NVDA", name:"Nvidia",       price:875.4,  currentIV:62.4, ivRank:72, ivPct:78, iv52wHigh:94.2, iv52wLow:38.6, hv30:48.2, ivPremium:14.2, earnings:"Jun 25",  strategy:"Sell Premium",  sector:"Tech" },
  { symbol:"TSLA", name:"Tesla",        price:245.1,  currentIV:74.8, ivRank:84, ivPct:88, iv52wHigh:98.4, iv52wLow:42.1, hv30:62.4, ivPremium:12.4, earnings:"Jul 23",  strategy:"Sell Premium",  sector:"Consumer" },
  { symbol:"AAPL", name:"Apple",        price:241.3,  currentIV:24.2, ivRank:32, ivPct:28, iv52wHigh:48.4, iv52wLow:14.8, hv30:18.6, ivPremium:5.6,  earnings:"Aug 1",   strategy:"Buy Options",   sector:"Tech" },
  { symbol:"META", name:"Meta",         price:524.3,  currentIV:38.6, ivRank:45, ivPct:52, iv52wHigh:72.4, iv52wLow:28.2, hv30:32.4, ivPremium:6.2,  earnings:"Jul 30",  strategy:"Neutral",       sector:"Tech" },
  { symbol:"LLY",  name:"Eli Lilly",    price:892.1,  currentIV:28.4, ivRank:28, ivPct:24, iv52wHigh:58.2, iv52wLow:18.4, hv30:22.8, ivPremium:5.6,  earnings:"Aug 7",   strategy:"Buy Options",   sector:"Health" },
  { symbol:"GME",  name:"GameStop",     price:24.4,   currentIV:142.8,ivRank:88, ivPct:94, iv52wHigh:184.2,iv52wLow:82.4, hv30:118.6,ivPremium:24.2, earnings:"Sep 10",  strategy:"Sell Premium",  sector:"Consumer" },
  { symbol:"COIN", name:"Coinbase",     price:244.8,  currentIV:88.4, ivRank:68, ivPct:74, iv52wHigh:142.4,iv52wLow:52.8, hv30:72.4, ivPremium:16.0, earnings:"Aug 8",   strategy:"Sell Premium",  sector:"Finance" },
  { symbol:"AMD",  name:"AMD",          price:168.4,  currentIV:42.8, ivRank:48, ivPct:54, iv52wHigh:82.4, iv52wLow:28.6, hv30:36.2, ivPremium:6.6,  earnings:"Jul 29",  strategy:"Neutral",       sector:"Tech" },
  { symbol:"MSFT", name:"Microsoft",    price:418.9,  currentIV:22.4, ivRank:24, ivPct:18, iv52wHigh:48.2, iv52wLow:14.2, hv30:17.8, ivPremium:4.6,  earnings:"Jul 30",  strategy:"Buy Options",   sector:"Tech" },
  { symbol:"MRNA", name:"Moderna",      price:138.6,  currentIV:68.4, ivRank:58, ivPct:64, iv52wHigh:124.8,iv52wLow:44.2, hv30:54.8, ivPremium:13.6, earnings:"Aug 5",   strategy:"Neutral",       sector:"Health" },
];

const VOL_SURFACE = Array.from({ length: 7 }, (_, strikeIdx) => {
  const moneyness = (strikeIdx - 3) * 0.05;
  return {
    strike: `${moneyness >= 0 ? "+" : ""}${(moneyness * 100).toFixed(0)}%`,
    "7d":  28 + Math.abs(moneyness) * 80 + 4,
    "14d": 26 + Math.abs(moneyness) * 70 + 3,
    "30d": 24 + Math.abs(moneyness) * 60 + 2,
    "60d": 22 + Math.abs(moneyness) * 50 + 1,
    "90d": 21 + Math.abs(moneyness) * 45,
  };
});

const STRAT_COLOR: Record<string, string> = { "Sell Premium": "#00e676", "Buy Options": "#ff4444", "Neutral": "#ffd600" };

export function IVRank() {
  const [view, setView] = useState<"screener" | "surface" | "scatter">("screener");
  const [selected, setSelected] = useState<IVStock>(STOCKS[0]);
  const [minRank, setMinRank] = useState(0);
  const [strat, setStrat] = useState("All");

  const filtered = STOCKS.filter((s) => s.ivRank >= minRank && (strat === "All" || s.strategy === strat));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">IV Rank & Volatility Surface</span>
          <span className="text-xs text-[#8892a4]">Implied Volatility Analysis</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["screener","surface","scatter"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v === "screener" ? "IV Screener" : v === "surface" ? "Vol Surface" : "IV vs HV"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "screener" && (
        <>
          <div className="flex items-center gap-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8892a4]">Min IV Rank:</span>
              <input type="range" min={0} max={80} value={minRank} onChange={(e) => setMinRank(Number(e.target.value))} className="w-24 accent-[#00d4ff]" />
              <span className="text-[#00d4ff] w-8">{minRank}%+</span>
            </div>
            <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
              {["All","Sell Premium","Buy Options","Neutral"].map((s) => (
                <button key={s} onClick={() => setStrat(s)}
                  className={`px-2.5 py-1 text-xs transition-colors ${strat === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0b0e14]">
                  <tr className="border-b border-[#1e2433]">
                    {["Symbol","Current IV","IV Rank","IV Pct","52W High","52W Low","HV30","Premium","Earnings","Strategy"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a,b) => b.ivRank - a.ivRank).map((s) => (
                    <tr key={s.symbol} onClick={() => setSelected(s)}
                      className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected.symbol === s.symbol ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                      <td className="py-3 px-3 font-bold text-white">{s.symbol}</td>
                      <td className="py-3 px-3 font-mono font-bold" style={{ color: s.currentIV > 60 ? "#ff4444" : s.currentIV > 40 ? "#ffd600" : "#00e676" }}>{s.currentIV.toFixed(1)}%</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.ivRank}%`, backgroundColor: s.ivRank > 70 ? "#ff4444" : s.ivRank > 40 ? "#ffd600" : "#00e676" }} />
                          </div>
                          <span className="font-bold" style={{ color: s.ivRank > 70 ? "#ff4444" : s.ivRank > 40 ? "#ffd600" : "#00e676" }}>{s.ivRank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#8892a4]">{s.ivPct}%</td>
                      <td className="py-3 px-3 font-mono text-[#ff4444]">{s.iv52wHigh.toFixed(1)}%</td>
                      <td className="py-3 px-3 font-mono text-[#00e676]">{s.iv52wLow.toFixed(1)}%</td>
                      <td className="py-3 px-3 font-mono text-[#a78bfa]">{s.hv30.toFixed(1)}%</td>
                      <td className="py-3 px-3 font-mono text-[#ffd600]">+{s.ivPremium.toFixed(1)}%</td>
                      <td className="py-3 px-3 text-[#8892a4]">{s.earnings}</td>
                      <td className="py-3 px-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: STRAT_COLOR[s.strategy] + "22", color: STRAT_COLOR[s.strategy] }}>{s.strategy}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-white">{selected.symbol}</p>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-[#8892a4]">IV Rank</span>
                  <span className="text-xl font-bold" style={{ color: selected.ivRank > 70 ? "#ff4444" : selected.ivRank > 40 ? "#ffd600" : "#00e676" }}>{selected.ivRank}</span>
                </div>
                <div className="w-full h-2 bg-[#1e2433] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${selected.ivRank}%`, backgroundColor: selected.ivRank > 70 ? "#ff4444" : selected.ivRank > 40 ? "#ffd600" : "#00e676" }} />
                </div>
              </div>
              <div className="text-xs space-y-2">
                {[["Current IV",`${selected.currentIV.toFixed(1)}%`,"#ffd600"],["IV Pct",`${selected.ivPct}th`,"#8892a4"],["HV30",`${selected.hv30.toFixed(1)}%`,"#a78bfa"],["IV Premium",`+${selected.ivPremium.toFixed(1)}%`,"#00e676"],["Earnings",selected.earnings,"#00d4ff"]].map(([l,v,c]) => (
                  <div key={l as string} className="flex justify-between border-b border-[#1e2433] pb-1.5">
                    <span className="text-[#8892a4]">{l}</span>
                    <span className="font-bold" style={{ color: c as string }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="border rounded-lg p-2" style={{ borderColor: STRAT_COLOR[selected.strategy] + "44", backgroundColor: STRAT_COLOR[selected.strategy] + "11" }}>
                <p className="text-[9px] text-[#8892a4] mb-0.5">Suggested Strategy</p>
                <p className="text-xs font-bold" style={{ color: STRAT_COLOR[selected.strategy] }}>{selected.strategy}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {view === "surface" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Volatility Surface — AAPL implied vol by moneyness & expiry</p>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={VOL_SURFACE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="strike" tick={{ fontSize: 10, fill: "#8892a4" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, ""]} />
              {["7d","14d","30d","60d","90d"].map((exp, i) => (
                <Line key={exp} type="monotone" dataKey={exp} stroke={["#ff4444","#ffd600","#00e676","#00d4ff","#a78bfa"][i]} strokeWidth={2} dot />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === "scatter" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">IV vs HV30 — dots above diagonal = IV rich (sell premium candidate)</p>
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis type="number" dataKey="hv30" name="HV30" domain={[10, 130]} tick={{ fontSize: 9, fill: "#8892a4" }} label={{ value: "HV30 →", position: "bottom", fontSize: 10, fill: "#8892a4" }} />
              <YAxis type="number" dataKey="currentIV" name="IV" domain={[10, 160]} tick={{ fontSize: 9, fill: "#8892a4" }} label={{ value: "IV →", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8892a4" }} />
              <ReferenceLine segment={[{x:10,y:10},{x:160,y:160}]} stroke="#8892a4" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload as IVStock;
                  return <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs"><p className="font-bold text-white">{d.symbol}</p><p className="text-[#ffd600]">IV: {d.currentIV}% / HV30: {d.hv30}%</p><p style={{ color: STRAT_COLOR[d.strategy] }}>{d.strategy}</p></div>;
                }}
              />
              <Scatter data={STOCKS} fill="#00d4ff"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const c = STRAT_COLOR[payload.strategy];
                  return <g><circle cx={cx} cy={cy} r={8} fill={c + "44"} stroke={c} strokeWidth={2} /><text x={cx} y={cy - 10} textAnchor="middle" fontSize={8} fill={c}>{payload.symbol}</text></g>;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
