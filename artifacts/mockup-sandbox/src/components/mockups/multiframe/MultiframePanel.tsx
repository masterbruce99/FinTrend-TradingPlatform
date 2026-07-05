import { useState } from "react";

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];

type Candle = { o: number; h: number; l: number; c: number };

function generateCandles(seed: number, count: number, start: number): Candle[] {
  const candles: Candle[] = [];
  let price = start;
  for (let i = 0; i < count; i++) {
    const change = (Math.sin(i * 0.7 + seed) * 3 + Math.cos(i * 0.3 + seed) * 2);
    const o = price;
    const c = price + change;
    const h = Math.max(o, c) + Math.abs(Math.sin(i + seed)) * 2;
    const l = Math.min(o, c) - Math.abs(Math.cos(i + seed)) * 2;
    candles.push({ o, h, l, c });
    price = c;
  }
  return candles;
}

const TF_DATA: Record<string, { candles: Candle[]; trend: "up" | "down" | "neutral"; signal: string }> = {
  "1m":  { candles: generateCandles(1.2, 30, 241), trend: "up",      signal: "BUY" },
  "5m":  { candles: generateCandles(2.1, 30, 239), trend: "up",      signal: "BUY" },
  "15m": { candles: generateCandles(3.4, 30, 235), trend: "neutral",  signal: "HOLD" },
  "1H":  { candles: generateCandles(0.8, 30, 228), trend: "down",     signal: "SELL" },
  "4H":  { candles: generateCandles(1.9, 30, 220), trend: "up",      signal: "BUY" },
  "1D":  { candles: generateCandles(2.7, 30, 210), trend: "up",      signal: "BUY" },
};

const SIGNAL_COLOR: Record<string, string> = {
  BUY: "#00e676",
  SELL: "#ff4444",
  HOLD: "#ffd600",
};

const TREND_COLOR: Record<string, string> = {
  up: "#00e676",
  down: "#ff4444",
  neutral: "#ffd600",
};

function MiniChart({ candles, trend }: { candles: Candle[]; trend: string }) {
  const W = 200, H = 80;
  const allP = candles.flatMap((c) => [c.h, c.l]);
  const minP = Math.min(...allP);
  const maxP = Math.max(...allP);
  const cw = W / candles.length;
  const bw = cw * 0.6;
  const toY = (p: number) => H - ((p - minP) / (maxP - minP + 0.001)) * H;
  const color = TREND_COLOR[trend] ?? "#8892a4";

  const linePoints = candles
    .map((c, i) => `${i * cw + cw / 2},${toY(c.c)}`)
    .join(" ");

  return (
    <svg width={W} height={H} className="w-full">
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
      {candles.map((c, i) => {
        const bull = c.c >= c.o;
        const cl = bull ? color : "#ff4444";
        const cx = i * cw + cw / 2;
        const bodyTop = toY(Math.max(c.o, c.c));
        const bodyBot = toY(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={cl} strokeWidth={0.8} />
            <rect
              x={cx - bw / 2}
              y={bodyTop}
              width={bw}
              height={Math.max(bodyBot - bodyTop, 1)}
              fill={bull ? cl : "transparent"}
              stroke={cl}
              strokeWidth={0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MultiframePanel() {
  const [symbol, setSymbol] = useState("AAPL");
  const [layout, setLayout] = useState<"2x3" | "3x2">("2x3");
  const [selected, setSelected] = useState<string | null>(null);

  const cols = layout === "2x3" ? 3 : 2;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#131722] border border-[#1e2433] rounded px-3 py-1.5">
            <span className="text-xs text-[#8892a4]">Symbol</span>
            <select
              className="bg-transparent text-white text-sm font-bold outline-none"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {["AAPL", "TSLA", "NVDA", "SPY", "QQQ"].map((s) => (
                <option key={s} value={s} className="bg-[#131722]">{s}</option>
              ))}
            </select>
          </div>
          <div className="text-sm">
            <span className="text-[#00e676] font-bold">$241.32</span>
            <span className="text-[#00e676] text-xs ml-2">+1.36%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#8892a4]">
          <span>Alignment Score:</span>
          <span className="text-[#00e676] font-bold text-sm">4/6</span>
          <span className="text-[#00e676]">Bullish</span>
          <div className="h-4 w-px bg-[#1e2433]" />
          <button
            onClick={() => setLayout(layout === "2x3" ? "3x2" : "2x3")}
            className="px-2 py-1 bg-[#131722] border border-[#1e2433] rounded hover:border-[#00d4ff] transition-colors"
          >
            {layout === "2x3" ? "3×2" : "2×3"}
          </button>
        </div>
      </div>

      <div className={`flex-1 grid gap-px bg-[#1e2433]`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {TIMEFRAMES.map((tf) => {
          const data = TF_DATA[tf];
          const isSelected = selected === tf;
          const signal = data.signal;
          const lastCandle = data.candles[data.candles.length - 1];
          const change = ((lastCandle.c - data.candles[0].o) / data.candles[0].o * 100).toFixed(2);

          return (
            <div
              key={tf}
              onClick={() => setSelected(isSelected ? null : tf)}
              className={`bg-[#0b0e14] p-3 flex flex-col gap-2 cursor-pointer transition-all ${isSelected ? "ring-1 ring-inset ring-[#00d4ff]" : "hover:bg-[#0f1320]"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{tf}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: SIGNAL_COLOR[signal],
                      backgroundColor: SIGNAL_COLOR[signal] + "22",
                    }}
                  >
                    {signal}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: Number(change) >= 0 ? "#00e676" : "#ff4444" }}
                  >
                    {Number(change) >= 0 ? "+" : ""}{change}%
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <MiniChart candles={data.candles} trend={data.trend} />
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {[
                  { label: "RSI", value: tf === "1H" ? "38" : "62", alert: tf === "1H" },
                  { label: "MACD", value: data.trend === "up" ? "Bull" : "Bear" },
                  { label: "Vol", value: "High" },
                ].map(({ label, value, alert }) => (
                  <div key={label} className="bg-[#131722] rounded px-1.5 py-1 text-center">
                    <div className="text-[#8892a4]">{label}</div>
                    <div className={alert ? "text-[#ff4444]" : "text-[#8892a4]"}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-2 border-t border-[#1e2433] flex items-center gap-6 text-[10px] text-[#8892a4]">
        <span>MTF Alignment:</span>
        {TIMEFRAMES.map((tf) => (
          <div key={tf} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SIGNAL_COLOR[TF_DATA[tf].signal] }}
            />
            <span>{tf}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
