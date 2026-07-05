import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const AD_LINE = Array.from({ length: 30 }, (_, i) => {
  const base = 1200 + i * 18;
  return {
    day: `D${i + 1}`,
    ad: Math.round(base + Math.sin(i * 0.7) * 120 + Math.cos(i * 0.4) * 80),
    advancing: Math.round(280 + Math.sin(i * 0.8) * 60),
    declining: Math.round(210 + Math.cos(i * 0.6) * 50),
    unchanged: Math.round(10 + Math.random() * 10),
  };
});

const MCO_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  mco: Math.round((Math.sin(i * 0.5) * 40 + Math.cos(i * 0.8) * 25) * 10) / 10,
}));

const NEW_HIGHS_LOWS = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  highs: Math.round(80 + Math.sin(i * 0.6) * 40 + i * 1.5),
  lows: Math.round(30 + Math.cos(i * 0.7) * 20),
}));

const BREADTH_INDICATORS = [
  { label: "Advance/Decline Ratio", value: "1.48", status: "Positive", color: "#00e676" },
  { label: "McClellan Oscillator", value: "+32.4", status: "Bullish", color: "#00e676" },
  { label: "NYSE New Highs", value: "142", status: "Strong", color: "#00e676" },
  { label: "NYSE New Lows", value: "28", status: "Low", color: "#00e676" },
  { label: "% Above 200 MA", value: "64.2%", status: "Neutral", color: "#ffd600" },
  { label: "% Above 50 MA", value: "71.8%", status: "Positive", color: "#00e676" },
  { label: "TRIN (Arms Index)", value: "0.82", status: "Bullish", color: "#00e676" },
  { label: "VIX", value: "14.2", status: "Low Fear", color: "#00e676" },
  { label: "Put/Call Ratio", value: "0.72", status: "Bullish", color: "#00e676" },
  { label: "SPX % of ADV", value: "58%", status: "Neutral", color: "#ffd600" },
];

export function MarketBreadth() {
  const [activeChart, setActiveChart] = useState<"ad" | "mco" | "highs">("ad");
  const latest = AD_LINE[AD_LINE.length - 1];
  const adRatio = (latest.advancing / (latest.advancing + latest.declining)).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Market Breadth</span>
          <span className="text-xs text-[#8892a4]">NYSE / Nasdaq</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#00e676] font-bold">{latest.advancing}</span>
            <span className="text-[#8892a4]">Adv</span>
            <span className="text-[#ff4444] font-bold">{latest.declining}</span>
            <span className="text-[#8892a4]">Dec</span>
            <span className="text-[#8892a4] font-bold">{latest.unchanged}</span>
            <span className="text-[#8892a4]">Unch</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Adv/Dec Ratio", val: adRatio, good: true },
              { label: "Net Advancing", val: `+${latest.advancing - latest.declining}`, good: true },
              { label: "Breadth Thrust", val: "Bullish", good: true },
            ].map(({ label, val, good }) => (
              <div key={label} className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
                <p className="text-[10px] text-[#8892a4]">{label}</p>
                <p className={`text-xl font-bold mt-1 ${good ? "text-[#00e676]" : "text-[#ff4444]"}`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1 border-b border-[#1e2433]">
            {[
              { key: "ad", label: "A/D Line" },
              { key: "mco", label: "McClellan Osc." },
              { key: "highs", label: "New Highs/Lows" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveChart(key as typeof activeChart)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeChart === key ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-[#8892a4] hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            {activeChart === "ad" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AD_LINE}>
                  <defs>
                    <linearGradient id="adg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8892a4" }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }} />
                  <Area type="monotone" dataKey="ad" stroke="#00e676" strokeWidth={2} fill="url(#adg)" name="A/D Line" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {activeChart === "mco" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MCO_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8892a4" }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }} />
                  <ReferenceLine y={0} stroke="#8892a4" />
                  <Bar dataKey="mco" name="McClellan Osc.">
                    {MCO_DATA.map((d, i) => (
                      <Cell key={i} fill={d.mco >= 0 ? "#00e676" : "#ff4444"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {activeChart === "highs" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={NEW_HIGHS_LOWS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#8892a4" }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }} />
                  <Bar dataKey="highs" name="New Highs" fill="#00e676" fillOpacity={0.8} />
                  <Bar dataKey="lows" name="New Lows" fill="#ff4444" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="w-56 border-l border-[#1e2433] p-4 overflow-y-auto">
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Breadth Dashboard</p>
          <div className="flex flex-col gap-2">
            {BREADTH_INDICATORS.map(({ label, value, status, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#1e2433]">
                <div>
                  <p className="text-[10px] text-[#8892a4]">{label}</p>
                  <p className="text-xs font-bold text-white">{value}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: color + "22", color }}>{status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#1e2433]">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Overall Signal</p>
            <div className="bg-[#00e67622] border border-[#00e67644] rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-[#00e676]">Bullish</p>
              <p className="text-[10px] text-[#8892a4] mt-0.5">8/10 indicators positive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
