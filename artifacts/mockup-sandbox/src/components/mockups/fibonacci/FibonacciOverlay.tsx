import { useState } from "react";

const CANDLES = [
  { o: 198, h: 202, l: 196, c: 200 },
  { o: 200, h: 206, l: 199, c: 205 },
  { o: 205, h: 210, l: 203, c: 208 },
  { o: 208, h: 215, l: 207, c: 214 },
  { o: 214, h: 220, l: 212, c: 218 },
  { o: 218, h: 225, l: 216, c: 222 },
  { o: 222, h: 230, l: 220, c: 228 },
  { o: 228, h: 235, l: 225, c: 232 },
  { o: 232, h: 238, l: 229, c: 235 },
  { o: 235, h: 241, l: 232, c: 239 },
  { o: 239, h: 245, l: 234, c: 241 },
  { o: 241, h: 248, l: 239, c: 246 },
  { o: 246, h: 252, l: 241, c: 243 },
  { o: 243, h: 247, l: 238, c: 240 },
  { o: 240, h: 244, l: 235, c: 237 },
  { o: 237, h: 240, l: 232, c: 234 },
  { o: 234, h: 238, l: 230, c: 236 },
  { o: 236, h: 241, l: 233, c: 239 },
  { o: 239, h: 244, l: 237, c: 242 },
  { o: 242, h: 247, l: 240, c: 245 },
  { o: 245, h: 250, l: 243, c: 248 },
  { o: 248, h: 253, l: 246, c: 251 },
  { o: 251, h: 256, l: 249, c: 254 },
  { o: 254, h: 258, l: 251, c: 256 },
  { o: 256, h: 261, l: 254, c: 259 },
];

const FIB_LEVELS = [
  { ratio: 0, label: "0%", color: "#ff4444" },
  { ratio: 0.236, label: "23.6%", color: "#ff8c00" },
  { ratio: 0.382, label: "38.2%", color: "#ffd600" },
  { ratio: 0.5, label: "50%", color: "#00e676" },
  { ratio: 0.618, label: "61.8%", color: "#00d4ff" },
  { ratio: 0.786, label: "78.6%", color: "#9c27b0" },
  { ratio: 1, label: "100%", color: "#ff4444" },
  { ratio: 1.272, label: "127.2%", color: "#ff6b6b" },
  { ratio: 1.618, label: "161.8%", color: "#ff4444" },
];

const EXT_LEVELS = [
  { ratio: 1.272, label: "127.2%", color: "#ff6b6b" },
  { ratio: 1.618, label: "161.8%", color: "#ff4444" },
  { ratio: 2.0, label: "200%", color: "#e91e63" },
  { ratio: 2.618, label: "261.8%", color: "#9c27b0" },
];

const W = 820;
const H = 400;
const PAD = { top: 20, right: 110, bottom: 30, left: 10 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

export function FibonacciOverlay() {
  const [showExtensions, setShowExtensions] = useState(false);
  const [highlightedLevel, setHighlightedLevel] = useState<number | null>(null);
  const [mode, setMode] = useState<"retracement" | "extension">("retracement");

  const allPrices = CANDLES.flatMap((c) => [c.h, c.l]);
  const low = Math.min(...allPrices);
  const high = Math.max(...allPrices);
  const range = high - low;

  const displayMin = low - range * 0.1;
  const displayMax = high + range * 0.45;
  const displayRange = displayMax - displayMin;

  const toY = (p: number) => PAD.top + chartH - ((p - displayMin) / displayRange) * chartH;
  const candleW = chartW / CANDLES.length;
  const bodyW = candleW * 0.55;

  const fibLevels = FIB_LEVELS.map((f) => ({
    ...f,
    price: low + range * (1 - f.ratio),
    y: toY(low + range * (1 - f.ratio)),
  }));

  const extLevels = EXT_LEVELS.map((f) => ({
    ...f,
    price: high + range * (f.ratio - 1),
    y: toY(high + range * (f.ratio - 1)),
  }));

  const levelsToShow = mode === "retracement" ? fibLevels : [...fibLevels, ...extLevels];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">TSLA</span>
          <span className="text-[#00e676] font-semibold">$259.18</span>
          <span className="text-[#00e676] text-xs">+2.41%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8892a4]">Mode:</span>
          {(["retracement", "extension"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${mode === m ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
            >
              {m}
            </button>
          ))}
          <label className="flex items-center gap-2 cursor-pointer ml-2">
            <div
              className={`w-8 h-4 rounded-full relative transition-colors ${showExtensions ? "bg-[#00d4ff]" : "bg-[#1e2433]"}`}
              onClick={() => setShowExtensions(!showExtensions)}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showExtensions ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-xs text-[#8892a4]">Extensions</span>
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {levelsToShow
              .filter((f) => f.y >= PAD.top && f.y <= H - PAD.bottom)
              .map((f, i) => {
                const isHighlighted = highlightedLevel === i;
                return (
                  <g key={`${f.label}-${i}`}>
                    <line
                      x1={PAD.left}
                      y1={f.y}
                      x2={W - PAD.right}
                      y2={f.y}
                      stroke={f.color}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={f.ratio === 0 || f.ratio === 1 ? "none" : "4 3"}
                      opacity={isHighlighted ? 1 : 0.65}
                    />
                    <rect
                      x={PAD.left}
                      y={f.y - 0.5}
                      width={W - PAD.left - PAD.right}
                      height={1}
                      fill={f.color}
                      opacity={0.0}
                    />
                    <text x={W - PAD.right + 6} y={f.y + 4} fontSize={10} fill={f.color} fontWeight={isHighlighted ? "700" : "400"}>
                      {f.label} — ${(f as any).price?.toFixed(2)}
                    </text>
                  </g>
                );
              })}

            {CANDLES.map((c, i) => {
              const bull = c.c >= c.o;
              const color = bull ? "#00e676" : "#ff4444";
              const cx = PAD.left + i * candleW + candleW / 2;
              const bodyTop = toY(Math.max(c.o, c.c));
              const bodyBot = toY(Math.min(c.o, c.c));
              return (
                <g key={i}>
                  <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={color} strokeWidth={1} />
                  <rect
                    x={cx - bodyW / 2}
                    y={bodyTop}
                    width={bodyW}
                    height={Math.max(bodyBot - bodyTop, 1.5)}
                    fill={bull ? color : "transparent"}
                    stroke={color}
                    strokeWidth={0.8}
                  />
                </g>
              );
            })}

            <line
              x1={PAD.left + 1 * candleW}
              y1={toY(low)}
              x2={PAD.left + CANDLES.length * candleW - 5}
              y2={toY(high)}
              stroke="#ffffff"
              strokeWidth={1}
              strokeDasharray="6 3"
              opacity={0.15}
            />

            <circle cx={PAD.left + 1 * candleW} cy={toY(low)} r={4} fill="#ff4444" />
            <circle cx={PAD.left + (CANDLES.length - 1) * candleW} cy={toY(high)} r={4} fill="#00e676" />
          </svg>
        </div>

        <div className="w-56 border-l border-[#1e2433] p-4 overflow-y-auto">
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Fib Levels</p>
          <div className="flex flex-col gap-1">
            {fibLevels.map((f, i) => (
              <div
                key={f.label}
                onMouseEnter={() => setHighlightedLevel(i)}
                onMouseLeave={() => setHighlightedLevel(null)}
                className="flex items-center justify-between px-2 py-1.5 rounded cursor-pointer hover:bg-[#131722] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: f.color }} />
                  <span className="text-xs text-[#8892a4]">{f.label}</span>
                </div>
                <span className="text-xs text-white font-mono">${f.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {showExtensions && (
            <>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mt-4 mb-3">Extensions</p>
              <div className="flex flex-col gap-1">
                {extLevels.map((f) => (
                  <div key={f.label} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#131722]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: f.color }} />
                      <span className="text-xs text-[#8892a4]">{f.label}</span>
                    </div>
                    <span className="text-xs text-white font-mono">${f.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-[#1e2433]">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Range</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Swing Low</span>
                <span className="text-[#ff4444]">${low.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Swing High</span>
                <span className="text-[#00e676]">${high.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Range</span>
                <span className="text-white">${range.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
