import { useState } from "react";

const W = 700, H = 340;
const PAD = { top: 20, right: 60, bottom: 30, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

const CANDLES = Array.from({ length: 30 }, (_, i) => {
  const base = 220 + i * 0.8 + Math.sin(i * 0.7) * 6;
  return { o: base, h: base + 3 + Math.random() * 2, l: base - 2 - Math.random() * 2, c: base + (Math.random() - 0.4) * 4 };
});

export function RiskReward() {
  const [entry, setEntry] = useState(241.32);
  const [stop, setStop] = useState(234.50);
  const [target1, setTarget1] = useState(255.00);
  const [target2, setTarget2] = useState(268.00);
  const [size, setSize] = useState(10000);
  const [account, setAccount] = useState(50000);

  const risk = entry - stop;
  const reward1 = target1 - entry;
  const reward2 = target2 - entry;
  const rr1 = reward1 / risk;
  const rr2 = reward2 / risk;
  const shares = Math.floor(size / entry);
  const dollarRisk = shares * risk;
  const dollarReward1 = shares * reward1;
  const dollarReward2 = shares * reward2;
  const pctRisk = (dollarRisk / account) * 100;

  const allPrices = [stop - 2, target2 + 4];
  const minP = Math.min(stop - 4, ...CANDLES.map((c) => c.l));
  const maxP = Math.max(target2 + 4, ...CANDLES.map((c) => c.h));
  const toY = (p: number) => PAD.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

  const candleW = chartW / CANDLES.length;
  const bodyW = candleW * 0.55;

  const yLevels = [stop, entry, target1, target2];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Risk/Reward Calculator</span>
          <span className="text-xs text-[#8892a4]">AAPL — Position Sizing</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#8892a4]">Account:</span>
          <input type="number" className="w-24 bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-white outline-none focus:border-[#00d4ff]"
            value={account} onChange={(e) => setAccount(Number(e.target.value))} />
          <span className="text-[#8892a4]">Trade size $:</span>
          <input type="number" className="w-24 bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-white outline-none focus:border-[#00d4ff]"
            value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative p-4">
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            <rect x={PAD.left} y={toY(target2)} width={chartW} height={toY(entry) - toY(target2)} fill="#00e67608" />
            <rect x={PAD.left} y={toY(entry)} width={chartW} height={toY(stop) - toY(entry)} fill="#ff444408" />

            {[stop, entry, target1, target2].map((p, i) => {
              const colors = ["#ff4444","#ffffff","#00e676","#00e676"];
              const labels = [`Stop $${p.toFixed(2)}`, `Entry $${p.toFixed(2)}`, `T1 $${p.toFixed(2)}`, `T2 $${p.toFixed(2)}`];
              const dashes = [i === 0 ? "5 3" : "none", "none", "5 3", "5 3"];
              return (
                <g key={i}>
                  <line x1={PAD.left} y1={toY(p)} x2={W - PAD.right} y2={toY(p)}
                    stroke={colors[i]} strokeWidth={i === 1 ? 2 : 1} strokeDasharray={dashes[i]} opacity={0.85} />
                  <text x={W - PAD.right + 4} y={toY(p) + 4} fontSize={10} fill={colors[i]} fontWeight={i === 1 ? "700" : "400"}>{labels[i]}</text>
                </g>
              );
            })}

            {CANDLES.map((c, i) => {
              const bull = c.c >= c.o;
              const color = bull ? "#00e676" : "#ff4444";
              const cx = PAD.left + i * candleW + candleW / 2;
              const bTop = toY(Math.max(c.o, c.c));
              const bBot = toY(Math.min(c.o, c.c));
              return (
                <g key={i}>
                  <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={color} strokeWidth={0.8} />
                  <rect x={cx - bodyW / 2} y={bTop} width={bodyW} height={Math.max(bBot - bTop, 1.5)}
                    fill={bull ? color : "transparent"} stroke={color} strokeWidth={0.8} />
                </g>
              );
            })}

            <g>
              <rect x={W - PAD.right - 120} y={toY(target2) + 4} width={115} height={toY(entry) - toY(target2) - 8}
                fill="#00e67611" rx={3} />
              <text x={W - PAD.right - 62} y={(toY(target2) + toY(entry)) / 2 + 4} fontSize={11} fill="#00e676" textAnchor="middle" fontWeight="700">
                +{reward2.toFixed(2)}
              </text>
              <rect x={W - PAD.right - 120} y={toY(entry) + 2} width={115} height={toY(stop) - toY(entry) - 4}
                fill="#ff444411" rx={3} />
              <text x={W - PAD.right - 62} y={(toY(entry) + toY(stop)) / 2 + 4} fontSize={11} fill="#ff4444" textAnchor="middle" fontWeight="700">
                -{risk.toFixed(2)}
              </text>
            </g>
          </svg>
        </div>

        <div className="w-72 border-l border-[#1e2433] p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Entry", val: entry, set: setEntry, color: "#ffffff" },
              { label: "Stop Loss", val: stop, set: setStop, color: "#ff4444" },
              { label: "Target 1", val: target1, set: setTarget1, color: "#00e676" },
              { label: "Target 2", val: target2, set: setTarget2, color: "#00d4ff" },
            ].map(({ label, val, set, color }) => (
              <div key={label}>
                <p className="text-[10px] mb-1" style={{ color }}>{label}</p>
                <input type="number" step="0.01"
                  className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-sm text-white outline-none focus:border-[#00d4ff] font-mono"
                  value={val} onChange={(e) => set(Number(e.target.value))} />
              </div>
            ))}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Position Summary</p>
            <div className="space-y-2 text-xs">
              {[
                { label: "Shares", val: shares.toFixed(0), color: "white" },
                { label: "Dollar risk", val: `$${dollarRisk.toFixed(0)}`, color: "#ff4444" },
                { label: "% of account", val: `${pctRisk.toFixed(2)}%`, color: pctRisk > 3 ? "#ff4444" : "#00e676" },
                { label: "R/R Ratio (T1)", val: `1 : ${rr1.toFixed(2)}`, color: rr1 >= 2 ? "#00e676" : rr1 >= 1.5 ? "#ffd600" : "#ff4444" },
                { label: "R/R Ratio (T2)", val: `1 : ${rr2.toFixed(2)}`, color: rr2 >= 2 ? "#00e676" : "#ffd600" },
                { label: "Max profit T1", val: `+$${dollarReward1.toFixed(0)}`, color: "#00e676" },
                { label: "Max profit T2", val: `+$${dollarReward2.toFixed(0)}`, color: "#00e676" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between border-b border-[#1e2433] pb-2">
                  <span className="text-[#8892a4]">{label}</span>
                  <span className="font-bold font-mono" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Risk Assessment</p>
            <div className={`rounded-lg p-3 border text-xs ${pctRisk <= 1 ? "border-[#00e67644] bg-[#00e67611]" : pctRisk <= 2 ? "border-[#ffd60044] bg-[#ffd60011]" : "border-[#ff444444] bg-[#ff444411]"}`}>
              <p className="font-bold mb-1" style={{ color: pctRisk <= 1 ? "#00e676" : pctRisk <= 2 ? "#ffd600" : "#ff4444" }}>
                {pctRisk <= 1 ? "✓ Conservative" : pctRisk <= 2 ? "⚠ Moderate" : "✗ Aggressive"}
              </p>
              <p className="text-[#8892a4]">
                {pctRisk <= 1 ? "Risk within safe 1% rule." : pctRisk <= 2 ? "Slightly above 1% risk threshold." : `${pctRisk.toFixed(1)}% risk exceeds recommended max.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
