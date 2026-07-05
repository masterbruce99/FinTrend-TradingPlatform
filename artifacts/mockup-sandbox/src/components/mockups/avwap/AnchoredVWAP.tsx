import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const BASE_PRICES = [
  218,221,224,222,226,230,228,233,237,235,240,244,242,247,251,249,254,258,256,261,
  265,263,268,272,270,268,264,260,256,252,248,252,256,260,264,268,272,276,274,278,
  282,280,285,289,287,292,296,294,299,241,
];

function computeVWAP(prices: number[], startIdx: number) {
  let cumPV = 0, cumVol = 0;
  return prices.map((p, i) => {
    if (i < startIdx) return null;
    const vol = 1000000 + Math.sin(i * 0.8) * 400000 + 200000;
    cumPV += p * vol;
    cumVol += vol;
    return Math.round((cumPV / cumVol) * 100) / 100;
  });
}

const ANCHOR_EVENTS = [
  { id: "earnings", label: "Earnings (Apr 30)", idx: 5,  color: "#ffd600",  note: "Q1 beat — anchoring VWAP from breakout" },
  { id: "ath",      label: "All-Time High",      idx: 22, color: "#00d4ff",  note: "ATH on Jun 3 — monitoring distribution" },
  { id: "swing",    label: "Swing Low (May 12)", idx: 30, color: "#a78bfa",  note: "Key reversal — institutional accumulation" },
  { id: "ipo",      label: "IPO Date (Jan 2)",   idx: 0,  color: "#ff8c00",  note: "Full-history VWAP from IPO" },
];

const DAYS = ["May 1","May 2","May 5","May 6","May 7","May 8","May 9","May 12","May 13","May 14",
  "May 15","May 16","May 19","May 20","May 21","May 22","May 23","May 26","May 27","May 28",
  "May 29","May 30","Jun 2","Jun 3","Jun 4","Jun 5","Jun 6","Jun 9","Jun 10","Jun 11",
  "Jun 12","Jun 13","Jun 16","Jun 17","Jun 18","Jun 19","Jun 20","Jun 23","Jun 24","Jun 25",
  "Jun 26","Jun 27","Jun 30","Jul 1","Jul 2","Jul 3","Jul 7","Jul 8","Jul 9","Jul 10"];

export function AnchoredVWAP() {
  const [activeAnchors, setActiveAnchors] = useState<string[]>(["earnings", "swing"]);
  const [showBands, setShowBands] = useState(true);
  const [bandStd, setBandStd] = useState(1);

  const toggleAnchor = (id: string) =>
    setActiveAnchors((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const chartData = BASE_PRICES.map((price, i) => {
    const row: Record<string, number | string | null> = { day: DAYS[i], price };
    const vol = 1000000 + Math.sin(i * 0.8) * 400000;
    const std = bandStd * 3.5;
    ANCHOR_EVENTS.forEach((ev) => {
      if (activeAnchors.includes(ev.id)) {
        const vwap = computeVWAP(BASE_PRICES, ev.idx)[i];
        row[`vwap_${ev.id}`] = vwap;
        if (showBands && vwap) {
          row[`upper_${ev.id}`] = vwap + std;
          row[`lower_${ev.id}`] = vwap - std;
        }
      }
    });
    return row;
  });

  const currentPrice = BASE_PRICES[BASE_PRICES.length - 1];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL</span>
          <span className="text-xs text-[#8892a4]">Anchored VWAP (AVWAP)</span>
          <span className="text-sm font-bold text-white">${currentPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showBands ? "bg-[#00d4ff]" : "bg-[#1e2433]"}`} onClick={() => setShowBands(!showBands)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showBands ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[#8892a4]">VWAP Bands</span>
          </label>
          {showBands && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8892a4]">±σ:</span>
              {[0.5, 1, 1.5, 2].map((v) => (
                <button key={v} onClick={() => setBandStd(v)}
                  className={`px-2 py-1 rounded transition-colors ${bandStd === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {ANCHOR_EVENTS.map((ev) => (
              <button key={ev.id} onClick={() => toggleAnchor(ev.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-all ${activeAnchors.includes(ev.id) ? "border-transparent" : "border-[#1e2433] opacity-40"}`}
                style={activeAnchors.includes(ev.id) ? { backgroundColor: ev.color + "22", borderColor: ev.color, color: ev.color } : {}}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                {ev.label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#8892a4" }} interval={7} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4, fontSize: 11 }}
                  labelStyle={{ color: "#8892a4" }}
                  formatter={(v: number, name: string) => [`$${Number(v).toFixed(2)}`, name.replace(/_/g, " ")]}
                />
                <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} dot={false} name="AAPL Price" />
                {ANCHOR_EVENTS.filter((ev) => activeAnchors.includes(ev.id)).map((ev) => (
                  <>
                    <Line key={`vwap_${ev.id}`} type="monotone" dataKey={`vwap_${ev.id}`} stroke={ev.color} strokeWidth={2} dot={false} strokeDasharray="none" name={`AVWAP ${ev.label}`} connectNulls />
                    {showBands && <>
                      <Line key={`upper_${ev.id}`} type="monotone" dataKey={`upper_${ev.id}`} stroke={ev.color} strokeWidth={1} dot={false} strokeDasharray="4 4" name={`Upper Band`} connectNulls opacity={0.5} />
                      <Line key={`lower_${ev.id}`} type="monotone" dataKey={`lower_${ev.id}`} stroke={ev.color} strokeWidth={1} dot={false} strokeDasharray="4 4" name={`Lower Band`} connectNulls opacity={0.5} />
                    </>}
                  </>
                ))}
                {ANCHOR_EVENTS.filter((ev) => activeAnchors.includes(ev.id)).map((ev) => (
                  <ReferenceLine key={ev.id} x={DAYS[ev.idx]} stroke={ev.color} strokeDasharray="3 5" strokeWidth={1.5} opacity={0.6} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-56 border-l border-[#1e2433] pl-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">AVWAP Status</p>
            {ANCHOR_EVENTS.filter((ev) => activeAnchors.includes(ev.id)).map((ev) => {
              const vwapVal = computeVWAP(BASE_PRICES, ev.idx)[BASE_PRICES.length - 1] ?? 0;
              const above = currentPrice > vwapVal;
              return (
                <div key={ev.id} className="mb-4 p-3 bg-[#131722] border border-[#1e2433] rounded-lg">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                    <span className="text-[10px] font-medium text-white truncate">{ev.label}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8892a4]">AVWAP</span>
                    <span className="font-mono font-bold" style={{ color: ev.color }}>${vwapVal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8892a4]">Position</span>
                    <span className={`font-bold ${above ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                      {above ? "▲ Above" : "▼ Below"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8892a4] mt-2 leading-relaxed">{ev.note}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">What is AVWAP?</p>
            <p className="text-[10px] text-[#8892a4] leading-relaxed">
              Anchored VWAP starts the volume-weighted average from a specific event (earnings, swing high/low, IPO). Institutional traders use it to track whether large buyers are in profit or loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
