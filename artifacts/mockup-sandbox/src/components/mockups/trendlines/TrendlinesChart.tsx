import { useState } from "react";

const CANDLES = [
  { o: 182, h: 188, l: 179, c: 186, v: 1200 },
  { o: 186, h: 192, l: 184, c: 190, v: 980 },
  { o: 190, h: 194, l: 187, c: 189, v: 870 },
  { o: 189, h: 196, l: 188, c: 195, v: 1450 },
  { o: 195, h: 199, l: 193, c: 197, v: 1100 },
  { o: 197, h: 200, l: 191, c: 193, v: 1320 },
  { o: 193, h: 196, l: 188, c: 191, v: 760 },
  { o: 191, h: 195, l: 189, c: 194, v: 840 },
  { o: 194, h: 201, l: 193, c: 200, v: 1560 },
  { o: 200, h: 205, l: 198, c: 203, v: 1890 },
  { o: 203, h: 207, l: 200, c: 205, v: 1230 },
  { o: 205, h: 208, l: 202, c: 204, v: 990 },
  { o: 204, h: 210, l: 203, c: 209, v: 1780 },
  { o: 209, h: 214, l: 207, c: 212, v: 2100 },
  { o: 212, h: 215, l: 206, c: 208, v: 1670 },
  { o: 208, h: 213, l: 205, c: 211, v: 1040 },
  { o: 211, h: 218, l: 210, c: 217, v: 2340 },
  { o: 217, h: 221, l: 214, c: 216, v: 1560 },
  { o: 216, h: 219, l: 211, c: 213, v: 1200 },
  { o: 213, h: 217, l: 212, c: 215, v: 880 },
  { o: 215, h: 222, l: 214, c: 221, v: 2670 },
  { o: 221, h: 226, l: 219, c: 224, v: 3100 },
  { o: 224, h: 228, l: 221, c: 226, v: 2450 },
  { o: 226, h: 230, l: 222, c: 228, v: 1980 },
  { o: 228, h: 233, l: 226, c: 231, v: 2200 },
  { o: 231, h: 235, l: 229, c: 233, v: 1760 },
  { o: 233, h: 237, l: 230, c: 235, v: 1540 },
  { o: 235, h: 238, l: 231, c: 234, v: 1320 },
  { o: 234, h: 240, l: 233, c: 238, v: 2890 },
  { o: 238, h: 243, l: 236, c: 241, v: 3200 },
];

const PATTERNS = [
  { label: "Ascending Triangle", color: "#00d4ff", confidence: 87 },
  { label: "Bull Flag", color: "#00e676", confidence: 74 },
  { label: "Double Bottom", color: "#ffd600", confidence: 62 },
];

const W = 860;
const H = 380;
const PAD = { top: 20, right: 60, bottom: 30, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

function priceToY(p: number, min: number, max: number) {
  return PAD.top + chartH - ((p - min) / (max - min)) * chartH;
}

export function TrendlinesChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activePattern, setActivePattern] = useState(0);

  const allPrices = CANDLES.flatMap((c) => [c.h, c.l]);
  const minP = Math.min(...allPrices) - 2;
  const maxP = Math.max(...allPrices) + 4;

  const candleW = chartW / CANDLES.length;
  const bodyW = candleW * 0.55;

  const yLevels = Array.from({ length: 6 }, (_, i) => minP + ((maxP - minP) * i) / 5);

  const trendLine1 = {
    x1: PAD.left + candleW * 2,
    y1: priceToY(CANDLES[2].l, minP, maxP),
    x2: PAD.left + candleW * 28,
    y2: priceToY(CANDLES[28].l, minP, maxP),
  };

  const trendLine2 = {
    x1: PAD.left + candleW * 0,
    y1: priceToY(CANDLES[0].h, minP, maxP),
    x2: PAD.left + candleW * 22,
    y2: priceToY(CANDLES[22].h, minP, maxP),
  };

  const hoverCandle = hoveredIdx !== null ? CANDLES[hoveredIdx] : null;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-wide">AAPL</span>
          <span className="text-[#00e676] font-semibold text-sm">$241.32</span>
          <span className="text-[#00e676] text-xs">+3.24 (+1.36%)</span>
        </div>
        <div className="flex items-center gap-2">
          {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
            <button
              key={tf}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${tf === "1D" ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8892a4]">
          <span className="px-2 py-1 bg-[#131722] rounded border border-[#1e2433]">Auto Trendlines ON</span>
          <span className="px-2 py-1 bg-[#131722] rounded border border-[#1e2433]">Patterns ON</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <svg width={W} height={H} className="w-full">
            {yLevels.map((p, i) => {
              const y = priceToY(p, minP, maxP);
              return (
                <g key={i}>
                  <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e2433" strokeWidth={1} strokeDasharray="3 4" />
                  <text x={W - PAD.right + 6} y={y + 4} fontSize={10} fill="#8892a4">{p.toFixed(0)}</text>
                </g>
              );
            })}

            <line
              {...trendLine1}
              stroke="#00e676"
              strokeWidth={1.5}
              strokeDasharray="none"
              opacity={0.8}
            />
            <line
              {...trendLine2}
              stroke="#00d4ff"
              strokeWidth={1.5}
              opacity={0.7}
            />

            <path
              d={`M ${trendLine1.x1} ${trendLine1.y1} L ${trendLine1.x2} ${trendLine1.y2} L ${trendLine1.x2} ${priceToY(minP, minP, maxP)} L ${trendLine1.x1} ${priceToY(minP, minP, maxP)} Z`}
              fill="#00e676"
              opacity={0.04}
            />

            {CANDLES.map((c, i) => {
              const cx = PAD.left + i * candleW + candleW / 2;
              const bull = c.c >= c.o;
              const color = bull ? "#00e676" : "#ff4444";
              const bodyTop = priceToY(Math.max(c.o, c.c), minP, maxP);
              const bodyBot = priceToY(Math.min(c.o, c.c), minP, maxP);
              const bodyH = Math.max(bodyBot - bodyTop, 1.5);
              const isHovered = hoveredIdx === i;

              return (
                <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                  {isHovered && (
                    <rect x={cx - candleW / 2} y={PAD.top} width={candleW} height={chartH} fill="white" opacity={0.03} />
                  )}
                  <line x1={cx} y1={priceToY(c.h, minP, maxP)} x2={cx} y2={priceToY(c.l, minP, maxP)} stroke={color} strokeWidth={1} />
                  <rect
                    x={cx - bodyW / 2}
                    y={bodyTop}
                    width={bodyW}
                    height={bodyH}
                    fill={bull ? color : "transparent"}
                    stroke={color}
                    strokeWidth={bull ? 0 : 1}
                  />
                </g>
              );
            })}

            <text x={trendLine1.x1 + 4} y={trendLine1.y1 - 6} fontSize={10} fill="#00e676" fontWeight="600">Support Trendline</text>
            <text x={trendLine2.x1 + 4} y={trendLine2.y1 - 6} fontSize={10} fill="#00d4ff" fontWeight="600">Resistance Trendline</text>

            {hoveredIdx !== null && hoverCandle && (
              <g>
                <line
                  x1={PAD.left + hoveredIdx * candleW + candleW / 2}
                  y1={PAD.top}
                  x2={PAD.left + hoveredIdx * candleW + candleW / 2}
                  y2={H - PAD.bottom}
                  stroke="#8892a4"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </g>
            )}
          </svg>

          {hoverCandle && (
            <div className="absolute top-3 left-4 bg-[#131722] border border-[#1e2433] rounded px-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-[#8892a4]">O</span><span className="text-white">{hoverCandle.o}</span>
                <span className="text-[#8892a4]">H</span><span className="text-[#00e676]">{hoverCandle.h}</span>
                <span className="text-[#8892a4]">L</span><span className="text-[#ff4444]">{hoverCandle.l}</span>
                <span className="text-[#8892a4]">C</span><span className="text-white">{hoverCandle.c}</span>
                <span className="text-[#8892a4]">V</span><span className="text-[#8892a4]">{hoverCandle.v}K</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-64 border-l border-[#1e2433] p-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Detected Patterns</p>
            <div className="flex flex-col gap-2">
              {PATTERNS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePattern(i)}
                  className={`flex items-center justify-between px-3 py-2 rounded border text-left transition-all ${activePattern === i ? "border-[#1e3a5f] bg-[#131722]" : "border-transparent hover:bg-[#131722]"}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-white">{p.label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: p.color }}>{p.confidence}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Trendline Stats</p>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { label: "Support touches", val: "4", color: "#00e676" },
                { label: "Resistance touches", val: "3", color: "#00d4ff" },
                { label: "Channel width", val: "$18.40", color: "#8892a4" },
                { label: "Slope (support)", val: "+$1.92/day", color: "#00e676" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#8892a4]">{label}</span>
                  <span style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Alerts</p>
            <div className="flex flex-col gap-2">
              {["Alert on trendline touch", "Alert on pattern breakout", "Alert on new pattern"].map((a) => (
                <label key={a} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-4 bg-[#00d4ff] rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                  </div>
                  <span className="text-xs text-[#8892a4]">{a}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
