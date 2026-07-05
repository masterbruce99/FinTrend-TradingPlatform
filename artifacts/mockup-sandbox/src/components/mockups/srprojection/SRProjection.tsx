import { useState } from "react";

const RAW = [
  212,215,218,214,220,224,221,226,230,228,233,237,235,240,244,242,247,251,249,254,
  258,255,260,264,262,267,271,269,265,261,257,253,249,245,241,237,241,245,249,253,
  257,261,265,269,273,271,268,264,260,256,
];

const W = 840, H = 440;
const PAD = { top: 20, right: 80, bottom: 30, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

type Level = { price: number; type: "Support" | "Resistance"; strength: number; touches: number; label: string; color: string };

const SR_LEVELS: Level[] = [
  { price: 270, type: "Resistance", strength: 92, touches: 4, label: "Major Resistance", color: "#ff4444" },
  { price: 260, type: "Resistance", strength: 74, touches: 3, label: "Previous High", color: "#ff4444" },
  { price: 253, type: "Resistance", strength: 65, touches: 2, label: "Minor Resistance", color: "#ff8c00" },
  { price: 241, type: "Resistance", strength: 58, touches: 2, label: "Current Price Zone", color: "#8892a4" },
  { price: 230, type: "Support",    strength: 86, touches: 5, label: "Major Support", color: "#00e676" },
  { price: 220, type: "Support",    strength: 71, touches: 3, label: "Key Support", color: "#00e676" },
  { price: 213, type: "Support",    strength: 62, touches: 2, label: "Minor Support", color: "#ffd600" },
];

const PROJECTIONS = [
  { label: "Extension 1 (127%)", price: 288, color: "#00d4ff", dashed: true },
  { label: "Extension 2 (162%)", price: 310, color: "#a78bfa", dashed: true },
  { label: "Extension 3 (200%)", price: 335, color: "#ff8c00", dashed: true },
];

export function SRProjection() {
  const [showSR, setShowSR] = useState(true);
  const [showProj, setShowProj] = useState(true);
  const [showFib, setShowFib] = useState(true);
  const [selected, setSelected] = useState<Level | null>(null);

  const allPrices = [...RAW, ...PROJECTIONS.map((p) => p.price)];
  const minP = Math.min(...RAW) - 5;
  const maxP = Math.max(...allPrices) + 10;
  const toY = (p: number) => PAD.top + chartH - ((p - minP) / (maxP - minP)) * chartH;
  const toX = (i: number) => PAD.left + (i / (RAW.length - 1)) * chartW;

  const fibHigh = Math.max(...RAW), fibLow = Math.min(...RAW);
  const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((r) => ({
    ratio: r,
    price: fibHigh - r * (fibHigh - fibLow),
  }));

  const pathD = RAW.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p)}`).join(" ");

  const priceAtEnd = RAW[RAW.length - 1];
  const nearestR = SR_LEVELS.filter((l) => l.type === "Resistance" && l.price > priceAtEnd)[0];
  const nearestS = SR_LEVELS.filter((l) => l.type === "Support" && l.price < priceAtEnd).slice(-1)[0];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL</span>
          <span className="text-xs text-[#8892a4]">Price Projection & S/R Detection</span>
        </div>
        <div className="flex items-center gap-4">
          {[
            ["S/R Levels", showSR, setShowSR, "#00e676"],
            ["Projections", showProj, setShowProj, "#00d4ff"],
            ["Fibonacci", showFib, setShowFib, "#ffd600"],
          ].map(([label, val, setter, color]) => (
            <label key={label as string} className="flex items-center gap-1.5 cursor-pointer">
              <div className={`w-7 h-3.5 rounded-full relative transition-colors`}
                style={{ backgroundColor: val ? color as string : "#1e2433" }}
                onClick={() => (setter as (v: boolean) => void)(!val as boolean)}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${val ? "right-0.5" : "left-0.5"}`} />
              </div>
              <span className="text-[10px]" style={{ color: color as string }}>{label as string}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-4">
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
            {[...Array(6)].map((_, i) => {
              const p = minP + ((maxP - minP) * i) / 5;
              return (
                <g key={i}>
                  <line x1={PAD.left} y1={toY(p)} x2={W - PAD.right} y2={toY(p)} stroke="#1e2433" strokeWidth={0.5} />
                  <text x={W - PAD.right + 4} y={toY(p) + 4} fontSize={9} fill="#8892a4">${p.toFixed(0)}</text>
                </g>
              );
            })}

            {showFib && fibLevels.map(({ ratio, price }, i) => (
              <g key={i}>
                <line x1={PAD.left} y1={toY(price)} x2={W - PAD.right} y2={toY(price)} stroke="#ffd600" strokeWidth={0.8} strokeDasharray="4 6" opacity={0.4} />
                <text x={W - PAD.right + 4} y={toY(price) + 4} fontSize={8} fill="#ffd60088">{(ratio * 100).toFixed(1)}%</text>
              </g>
            ))}

            {showSR && SR_LEVELS.map((level, i) => (
              <g key={i} onClick={() => setSelected(level)} style={{ cursor: "pointer" }}>
                <rect x={PAD.left} y={toY(level.price) - 1} width={chartW} height={2}
                  fill={level.color} opacity={selected?.price === level.price ? 1 : 0.6} />
                <rect x={PAD.left} y={toY(level.price) - 4} width={chartW} height={8} fill="transparent" />
                <text x={W - PAD.right + 4} y={toY(level.price) + 4} fontSize={8} fill={level.color} fontWeight="600">${level.price}</text>
              </g>
            ))}

            <path d={pathD} stroke="#00d4ff" strokeWidth={2} fill="none" />

            {showProj && (
              <>
                <line x1={toX(RAW.length - 1)} y1={toY(priceAtEnd)} x2={W - PAD.right} y2={toY(priceAtEnd)} stroke="#8892a4" strokeWidth={1} strokeDasharray="3 4" />
                {PROJECTIONS.map((proj, i) => (
                  <g key={i}>
                    <line x1={toX(RAW.length - 1)} y1={toY(priceAtEnd)} x2={W - PAD.right} y2={toY(proj.price)}
                      stroke={proj.color} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7} />
                    <circle cx={W - PAD.right} cy={toY(proj.price)} r={3} fill={proj.color} opacity={0.8} />
                    <text x={W - PAD.right + 4} y={toY(proj.price) + 4} fontSize={8} fill={proj.color}>${proj.price}</text>
                  </g>
                ))}
              </>
            )}

            <circle cx={toX(RAW.length - 1)} cy={toY(priceAtEnd)} r={4} fill="#ffffff" stroke="#00d4ff" strokeWidth={2} />
          </svg>
        </div>

        <div className="w-60 border-l border-[#1e2433] p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Current Status</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#1e2433] pb-2">
                <span className="text-[#8892a4]">Price</span>
                <span className="font-bold font-mono text-white">${priceAtEnd}</span>
              </div>
              {nearestR && <div className="flex justify-between border-b border-[#1e2433] pb-2">
                <span className="text-[#8892a4]">Next Resistance</span>
                <span className="text-[#ff4444] font-mono font-bold">${nearestR.price}</span>
              </div>}
              {nearestS && <div className="flex justify-between border-b border-[#1e2433] pb-2">
                <span className="text-[#8892a4]">Next Support</span>
                <span className="text-[#00e676] font-mono font-bold">${nearestS.price}</span>
              </div>}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">S/R Levels</p>
            {SR_LEVELS.map((l) => (
              <button key={l.price} onClick={() => setSelected(selected?.price === l.price ? null : l)}
                className={`w-full flex items-center justify-between py-2 border-b border-[#1e2433] text-xs transition-colors ${selected?.price === l.price ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[#8892a4]">${l.price}</span>
                </div>
                <div className="text-right">
                  <div style={{ color: l.color }} className="font-bold">{l.strength}%</div>
                  <div className="text-[9px] text-[#8892a4]">{l.touches} touches</div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="border-t border-[#1e2433] pt-4 bg-[#131722] rounded-lg p-3">
              <p className="text-[10px] text-[#8892a4] mb-2">{selected.label}</p>
              <p className="text-lg font-bold font-mono" style={{ color: selected.color }}>${selected.price}</p>
              <p className="text-xs text-[#8892a4] mt-1">{selected.type} • {selected.strength}% strength</p>
              <p className="text-xs text-[#8892a4]">{selected.touches} historical touches</p>
            </div>
          )}

          {showProj && (
            <div className="border-t border-[#1e2433] pt-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Price Projections</p>
              {PROJECTIONS.map((p) => (
                <div key={p.price} className="flex justify-between py-1.5 border-b border-[#1e2433] text-xs">
                  <span className="text-[#8892a4]">{p.label.split("(")[1]?.replace(")", "") ?? ""}</span>
                  <span className="font-bold font-mono" style={{ color: p.color }}>${p.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
