import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const SYMBOLS = ["AAPL", "NVDA", "MSFT", "META", "TSLA", "SPY"];
const COLORS: Record<string, string> = { AAPL:"#00d4ff", NVDA:"#00e676", MSFT:"#a78bfa", META:"#ffd600", TSLA:"#ff4444", SPY:"#8892a4" };

function generateReturns(seed: number, count: number, vol: number) {
  let cum = 100;
  return Array.from({ length: count }, (_, i) => {
    const r = (Math.sin(i * 0.6 + seed) * vol + Math.cos(i * 0.4 + seed) * vol * 0.5) / 100;
    cum *= (1 + r);
    return Math.round(cum * 100) / 100;
  });
}

const SEEDS: Record<string, [number, number]> = {
  AAPL: [1.2, 1.4], NVDA: [2.4, 3.2], MSFT: [0.8, 1.6], META: [3.1, 2.8], TSLA: [1.8, 4.8], SPY: [0.5, 1.0],
};

const DAYS = Array.from({ length: 60 }, (_, i) => `D${i + 1}`);

const DATA = DAYS.map((day, i) => {
  const row: Record<string, number | string> = { day };
  SYMBOLS.forEach((sym) => {
    const [seed, vol] = SEEDS[sym];
    row[sym] = generateReturns(seed, 60, vol)[i];
  });
  return row;
});

export function RelativeStrength() {
  const [active, setActive] = useState<string[]>(["AAPL", "NVDA", "SPY"]);
  const [period, setPeriod] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [normalize, setNormalize] = useState(true);

  const toggle = (sym: string) =>
    setActive((prev) => prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]);

  const latestData = DATA[DATA.length - 1];
  const performance = SYMBOLS.map((sym) => ({
    sym, val: (latestData[sym] as number) - 100,
  })).sort((a, b) => b.val - a.val);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Relative Strength</span>
          <span className="text-xs text-[#8892a4]">Multi-symbol overlay — normalized to 100</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["1M","3M","6M","1Y"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {p}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${normalize ? "bg-[#00d4ff]" : "bg-[#1e2433]"}`} onClick={() => setNormalize(!normalize)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${normalize ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[#8892a4]">Normalize</span>
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {SYMBOLS.map((sym) => (
              <button key={sym} onClick={() => toggle(sym)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all ${active.includes(sym) ? "border-transparent" : "border-[#1e2433] opacity-40 hover:opacity-70"}`}
                style={active.includes(sym) ? { backgroundColor: COLORS[sym] + "22", borderColor: COLORS[sym], color: COLORS[sym] } : {}}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[sym] }} />
                {sym}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8892a4" }} interval={9} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${(v - 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4, fontSize: 11 }}
                  formatter={(v: number, name: string) => [`${(v - 100).toFixed(2)}%`, name]}
                  labelStyle={{ color: "#8892a4" }}
                />
                <ReferenceLine y={100} stroke="#1e2433" strokeDasharray="4 4" />
                {SYMBOLS.filter((s) => active.includes(s)).map((sym) => (
                  <Line key={sym} type="monotone" dataKey={sym} stroke={COLORS[sym]} strokeWidth={sym === "SPY" ? 1.5 : 2}
                    dot={false} strokeDasharray={sym === "SPY" ? "5 3" : "none"} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-52 border-l border-[#1e2433] pl-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Performance Rank ({period})</p>
            {performance.map(({ sym, val }, i) => (
              <div key={sym} className="flex items-center gap-2 py-1.5 border-b border-[#1e2433]">
                <span className="text-[10px] text-[#8892a4] w-4">#{i + 1}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[sym] }} />
                <span className="text-xs font-bold text-white flex-1">{sym}</span>
                <span className="text-xs font-bold font-mono" style={{ color: val >= 0 ? "#00e676" : "#ff4444" }}>
                  {val >= 0 ? "+" : ""}{val.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">vs SPY Alpha</p>
            {performance.filter((p) => p.sym !== "SPY").map(({ sym, val }) => {
              const spy = performance.find((p) => p.sym === "SPY")?.val ?? 0;
              const alpha = val - spy;
              return (
                <div key={sym} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-[#8892a4]">{sym}</span>
                  <span style={{ color: alpha >= 0 ? "#00e676" : "#ff4444" }} className="font-mono">
                    {alpha >= 0 ? "+" : ""}{alpha.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Correlation to SPY</p>
            {["AAPL","NVDA","MSFT","META","TSLA"].map((sym) => {
              const corr = { AAPL:0.78, NVDA:0.64, MSFT:0.76, META:0.71, TSLA:0.41 }[sym] ?? 0.5;
              return (
                <div key={sym} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-[#8892a4] w-10">{sym}</span>
                  <div className="flex-1 h-1.5 bg-[#1e2433] rounded-full">
                    <div className="h-full rounded-full bg-[#a78bfa]" style={{ width: `${corr * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[#a78bfa] w-8 text-right">{corr.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
