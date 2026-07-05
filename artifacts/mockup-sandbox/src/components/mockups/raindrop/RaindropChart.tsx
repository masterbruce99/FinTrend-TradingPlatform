import { useState } from "react";

type Raindrop = {
  open: number;
  close: number;
  high: number;
  low: number;
  vwap: number;
  buyVol: number;
  sellVol: number;
  totalVol: number;
};

function makeRaindrops(): Raindrop[] {
  const drops: Raindrop[] = [];
  let price = 241;
  for (let i = 0; i < 28; i++) {
    const change = (Math.sin(i * 0.8) * 2.5 + Math.cos(i * 0.4) * 1.8);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(Math.sin(i)) * 1.5;
    const low = Math.min(open, close) - Math.abs(Math.cos(i)) * 1.5;
    const vwap = (open + close + high + low) / 4 + (Math.random() - 0.5) * 0.5;
    const totalVol = 800 + Math.abs(change) * 400 + Math.random() * 600;
    const buyFrac = close >= open ? 0.55 + Math.random() * 0.15 : 0.35 + Math.random() * 0.15;
    drops.push({
      open, close, high, low, vwap,
      buyVol: totalVol * buyFrac,
      sellVol: totalVol * (1 - buyFrac),
      totalVol,
    });
    price = close;
  }
  return drops;
}

const DROPS = makeRaindrops();

const W = 820;
const H = 380;
const PAD = { top: 20, right: 60, bottom: 60, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

export function RaindropChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showVwap, setShowVwap] = useState(true);

  const allPrices = DROPS.flatMap((d) => [d.high, d.low]);
  const minP = Math.min(...allPrices) - 2;
  const maxP = Math.max(...allPrices) + 2;
  const toY = (p: number) => PAD.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

  const maxVol = Math.max(...DROPS.map((d) => d.totalVol));
  const dropW = chartW / DROPS.length;
  const dropMaxH = PAD.bottom - 8;

  const vwapPoints = DROPS.map((d, i) => `${PAD.left + i * dropW + dropW / 2},${toY(d.vwap)}`).join(" ");

  const yLevels = Array.from({ length: 5 }, (_, i) => minP + ((maxP - minP) * i) / 4);

  const hov = hoveredIdx !== null ? DROPS[hoveredIdx] : null;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">NVDA</span>
          <span className="text-xs bg-[#1a2a1a] text-[#00e676] px-2 py-0.5 rounded font-medium">Raindrop Charts™</span>
          <span className="text-[#00e676] font-semibold">$875.40</span>
          <span className="text-[#00e676] text-xs">+4.12%</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-8 h-4 rounded-full relative transition-colors ${showVwap ? "bg-[#ffd600]" : "bg-[#1e2433]"}`}
              onClick={() => setShowVwap(!showVwap)}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showVwap ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[#ffd600]">VWAP Line</span>
          </label>
          <div className="flex items-center gap-3 text-[#8892a4]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00e676] inline-block" /> Buy Vol</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff4444] inline-block" /> Sell Vol</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          {yLevels.map((p, i) => {
            const y = toY(p);
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e2433" strokeWidth={1} strokeDasharray="3 4" />
                <text x={W - PAD.right + 6} y={y + 4} fontSize={10} fill="#8892a4">{p.toFixed(0)}</text>
              </g>
            );
          })}

          {DROPS.map((d, i) => {
            const cx = PAD.left + i * dropW + dropW / 2;
            const bull = d.close >= d.open;
            const bodyTop = toY(Math.max(d.open, d.close));
            const bodyBot = toY(Math.min(d.open, d.close));
            const bodyH = Math.max(bodyBot - bodyTop, 2);

            const volBarH = (d.totalVol / maxVol) * dropMaxH;
            const buyH = (d.buyVol / d.totalVol) * volBarH;
            const sellH = volBarH - buyH;
            const volX = cx - (dropW * 0.5) / 2;
            const volW = dropW * 0.5;

            const isHov = hoveredIdx === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {isHov && (
                  <rect x={PAD.left + i * dropW} y={PAD.top} width={dropW} height={H - PAD.top} fill="white" opacity={0.03} />
                )}

                <ellipse
                  cx={cx}
                  cy={toY(d.vwap)}
                  rx={dropW * 0.38}
                  ry={(bodyH / 2) + 4}
                  fill={bull ? "#00e67622" : "#ff444422"}
                  stroke={bull ? "#00e676" : "#ff4444"}
                  strokeWidth={isHov ? 1.5 : 1}
                  opacity={0.9}
                />

                <line x1={cx} y1={toY(d.high)} x2={cx} y2={bodyTop} stroke={bull ? "#00e676" : "#ff4444"} strokeWidth={1} opacity={0.6} />
                <line x1={cx} y1={bodyBot} x2={cx} y2={toY(d.low)} stroke={bull ? "#00e676" : "#ff4444"} strokeWidth={1} opacity={0.6} />

                <rect x={volX} y={H - PAD.bottom + 4 + sellH} width={volW} height={Math.max(buyH, 1)} fill="#00e67688" />
                <rect x={volX} y={H - PAD.bottom + 4} width={volW} height={Math.max(sellH, 1)} fill="#ff444488" />
              </g>
            );
          })}

          {showVwap && (
            <>
              <polyline
                points={vwapPoints}
                fill="none"
                stroke="#ffd600"
                strokeWidth={1.5}
                opacity={0.8}
              />
              <text x={W - PAD.right + 6} y={toY(DROPS[DROPS.length - 1].vwap) + 4} fontSize={9} fill="#ffd600">VWAP</text>
            </>
          )}

          {hoveredIdx !== null && (
            <line
              x1={PAD.left + hoveredIdx * dropW + dropW / 2}
              y1={PAD.top}
              x2={PAD.left + hoveredIdx * dropW + dropW / 2}
              y2={H - PAD.bottom}
              stroke="#8892a4"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {hov && (
          <div className="absolute top-3 left-4 bg-[#131722] border border-[#1e2433] rounded px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-[#8892a4]">VWAP</span>
              <span className="text-[#ffd600] font-mono">{hov.vwap.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#8892a4]">Buy Vol</span>
              <span className="text-[#00e676] font-mono">{hov.buyVol.toFixed(0)}K</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#8892a4]">Sell Vol</span>
              <span className="text-[#ff4444] font-mono">{hov.sellVol.toFixed(0)}K</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#8892a4]">Delta</span>
              <span className={hov.buyVol > hov.sellVol ? "text-[#00e676]" : "text-[#ff4444]"} >
                {hov.buyVol > hov.sellVol ? "+" : ""}{(hov.buyVol - hov.sellVol).toFixed(0)}K
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
