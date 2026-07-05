import { useState } from "react";

const PRICES = [
  182,186,190,189,195,197,193,191,194,200,203,205,204,209,212,208,211,217,216,213,
  215,221,224,226,228,231,233,235,234,238,241,239,244,248,243,240,237,234,238,242,
  245,248,251,254,256,259,255,258,262,265,
];

function buildHeikinAshi() {
  const ha: { o: number; h: number; l: number; c: number }[] = [];
  let prevO = PRICES[0], prevC = PRICES[0];
  for (let i = 0; i < PRICES.length - 1; i++) {
    const raw = { o: PRICES[i], h: Math.max(PRICES[i], PRICES[i+1]) + Math.abs(Math.sin(i)) * 1.5, l: Math.min(PRICES[i], PRICES[i+1]) - Math.abs(Math.cos(i)) * 1.5, c: PRICES[i+1] };
    const haC = (raw.o + raw.h + raw.l + raw.c) / 4;
    const haO = (prevO + prevC) / 2;
    const haH = Math.max(raw.h, haO, haC);
    const haL = Math.min(raw.l, haO, haC);
    ha.push({ o: haO, h: haH, l: haL, c: haC });
    prevO = haO; prevC = haC;
  }
  return ha;
}

function buildRenko(brickSize: number) {
  const bricks: { price: number; bull: boolean }[] = [];
  let current = PRICES[0];
  for (const p of PRICES) {
    while (p >= current + brickSize) { current += brickSize; bricks.push({ price: current, bull: true }); }
    while (p <= current - brickSize) { current -= brickSize; bricks.push({ price: current, bull: false }); }
  }
  return bricks;
}

const W = 820, H = 380;
const PAD = { top: 20, right: 60, bottom: 30, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

export function AltCharts() {
  const [chartType, setChartType] = useState<"heikin" | "renko" | "compare">("heikin");
  const [brickSize, setBrickSize] = useState(3);

  const haCandles = buildHeikinAshi();
  const renkoData = buildRenko(brickSize);

  const toY = (p: number, min: number, max: number) => PAD.top + chartH - ((p - min) / (max - min + 0.001)) * chartH;

  const haMin = Math.min(...haCandles.map((c) => c.l)) - 2;
  const haMax = Math.max(...haCandles.map((c) => c.h)) + 2;
  const haCandleW = chartW / haCandles.length;

  const renkoMin = Math.min(...renkoData.map((b) => b.price)) - brickSize;
  const renkoMax = Math.max(...renkoData.map((b) => b.price)) + brickSize;
  const renkoBrickH = chartH / ((renkoMax - renkoMin) / brickSize);
  const renkoBrickW = Math.min(18, chartW / renkoData.length);

  const stdPrices = PRICES.slice(1);
  const stdMin = Math.min(...stdPrices) - 2;
  const stdMax = Math.max(...stdPrices) + 2;
  const stdW = chartW / stdPrices.length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL</span>
          <span className="text-xs text-[#8892a4]">Alternative Chart Types</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {([["heikin","Heikin Ashi"],["renko","Renko"],["compare","Side-by-Side"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setChartType(k as typeof chartType)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartType === k ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>
          {chartType === "renko" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8892a4]">Brick:</span>
              {[1,2,3,5].map((s) => (
                <button key={s} onClick={() => setBrickSize(s)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${brickSize === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
                  ${s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        {(chartType === "heikin" || chartType === "compare") && (
          <div className={chartType === "compare" ? "flex-1" : "flex-1"}>
            {chartType === "compare" && <p className="text-xs text-[#8892a4] mb-2">Heikin Ashi — smoothed trend-following</p>}
            <svg width="100%" height={chartType === "compare" ? 160 : H} viewBox={`0 0 ${W} ${chartType === "compare" ? 160 : H}`}>
              {haCandles.map((c, i) => {
                const bull = c.c >= c.o;
                const color = bull ? "#00e676" : "#ff4444";
                const cx = PAD.left + i * haCandleW + haCandleW / 2;
                const bw = haCandleW * 0.65;
                const bTop = toY(Math.max(c.o, c.c), haMin, haMax);
                const bBot = toY(Math.min(c.o, c.c), haMin, haMax);
                return (
                  <g key={i}>
                    <line x1={cx} y1={toY(c.h, haMin, haMax)} x2={cx} y2={toY(c.l, haMin, haMax)} stroke={color} strokeWidth={1} />
                    <rect x={cx - bw/2} y={bTop} width={bw} height={Math.max(bBot - bTop, 2)}
                      fill={bull ? color : "transparent"} stroke={color} strokeWidth={0.8} />
                  </g>
                );
              })}
              <text x={PAD.left + 4} y={PAD.top + 14} fontSize={10} fill="#8892a4">Heikin Ashi</text>
            </svg>
          </div>
        )}

        {(chartType === "renko" || chartType === "compare") && (
          <div className={chartType === "compare" ? "flex-1" : "flex-1"}>
            {chartType === "compare" && <p className="text-xs text-[#8892a4] mb-2">Renko — noise-filtered ${brickSize} bricks</p>}
            <svg width="100%" height={chartType === "compare" ? 160 : H} viewBox={`0 0 ${W} ${chartType === "compare" ? 160 : H}`}>
              {renkoData.slice(-Math.floor(chartW / renkoBrickW)).map((b, i) => {
                const x = PAD.left + i * (renkoBrickW + 1);
                const y = toY(b.price, renkoMin, renkoMax);
                const color = b.bull ? "#00e676" : "#ff4444";
                return (
                  <rect key={i} x={x} y={y - renkoBrickH} width={renkoBrickW - 1} height={renkoBrickH}
                    fill={b.bull ? color + "cc" : "transparent"} stroke={color} strokeWidth={1} />
                );
              })}
              <text x={PAD.left + 4} y={PAD.top + 14} fontSize={10} fill="#8892a4">Renko ${brickSize}</text>
            </svg>
          </div>
        )}

        {chartType === "compare" && (
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-2">Standard Candlestick — for comparison</p>
            <svg width="100%" height={160} viewBox={`0 0 ${W} 160`}>
              {stdPrices.map((p, i) => {
                const prevP = stdPrices[i - 1] ?? p;
                const bull = p >= prevP;
                const color = bull ? "#00e676" : "#ff4444";
                const cx = PAD.left + i * stdW + stdW / 2;
                const bw = stdW * 0.6;
                const top = toY(Math.max(p, prevP), stdMin, stdMax);
                const bot = toY(Math.min(p, prevP), stdMin, stdMax);
                return (
                  <g key={i}>
                    <rect x={cx - bw/2} y={top} width={bw} height={Math.max(bot - top, 2)}
                      fill={bull ? color + "99" : "transparent"} stroke={color} strokeWidth={0.8} />
                  </g>
                );
              })}
              <text x={PAD.left + 4} y={14} fontSize={10} fill="#8892a4">Standard Candles</text>
            </svg>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-[#1e2433] bg-[#0d1018] text-xs text-[#8892a4] flex items-center gap-6">
        <span>Heikin Ashi: <span className="text-white">Smooths noise, highlights trend direction</span></span>
        <span>Renko: <span className="text-white">Time-independent, filters micro-moves below ${brickSize}</span></span>
      </div>
    </div>
  );
}
