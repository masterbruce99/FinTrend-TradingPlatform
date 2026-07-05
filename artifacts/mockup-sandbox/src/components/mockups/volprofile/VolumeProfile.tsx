import { useState } from "react";

const PRICE_LEVELS = Array.from({ length: 50 }, (_, i) => {
  const price = 215 + i * 0.6;
  const nearPOC = Math.abs(i - 28) < 4;
  const nearVAH = Math.abs(i - 38) < 3;
  const nearVAL = Math.abs(i - 16) < 3;
  const base = nearPOC ? 800 : nearVAH || nearVAL ? 400 : 80;
  const vol = Math.round(base + (i * 17 % 100) * base * 0.006);
  const buyPct = nearPOC ? 0.54 : 0.35 + (i % 5) * 0.06;
  return {
    price: parseFloat(price.toFixed(2)),
    volume: vol,
    buyVol: Math.round(vol * buyPct),
    sellVol: Math.round(vol * (1 - buyPct)),
    poc: i === 28,
    vah: i === 38,
    val: i === 16,
  };
});

const FAKE_CANDLES = Array.from({ length: 40 }, (_, i) => {
  const base = 220 + i * 0.6 + Math.sin(i * 0.7) * 8;
  const range = 3 + Math.abs(Math.cos(i * 0.5)) * 4;
  const bull = Math.sin(i * 0.9 + 1) > 0;
  return {
    o: base,
    h: base + range * 0.7,
    l: base - range * 0.3,
    c: bull ? base + range * 0.5 : base - range * 0.4,
    v: 500 + Math.abs(Math.sin(i * 1.2)) * 2000,
  };
});

const W = 680, H = 420;
const PAD = { top: 20, right: 20, bottom: 30, left: 10 };
const PROFILE_W = 140;
const chartW = W - PAD.left - PAD.right - PROFILE_W;
const chartH = H - PAD.top - PAD.bottom;

const BINS = 24;

function buildVolumeProfile() {
  const allP = CANDLES.flatMap((c) => [c.h, c.l]);
  const min = Math.min(...allP);
  const max = Math.max(...allP);
  const step = (max - min) / BINS;
  const bins: { price: number; vol: number; buyVol: number }[] = Array.from({ length: BINS }, (_, i) => ({
    price: min + (i + 0.5) * step,
    vol: 0,
    buyVol: 0,
  }));
  CANDLES.forEach((c) => {
    const binIdx = Math.floor(((c.c + c.o) / 2 - min) / step);
    const idx = Math.max(0, Math.min(BINS - 1, binIdx));
    bins[idx].vol += c.v;
    bins[idx].buyVol += c.c >= c.o ? c.v * 0.6 : c.v * 0.4;
  });
  return { bins, min, max, step };
}

export function VolumeProfile() {
  const [mode, setMode] = useState<"visible" | "fixed">("visible");
  const [showPoc, setShowPoc] = useState(true);
  const [showVah, setShowVah] = useState(true);

  const { bins, min, max } = buildVolumeProfile();
  const toY = (p: number) => PAD.top + chartH - ((p - min) / (max - min + 0.001)) * chartH;
  const candleW = chartW / CANDLES.length;
  const bodyW = candleW * 0.55;
  const maxVol = Math.max(...bins.map((b) => b.vol));

  const poc = bins.reduce((best, b) => (b.vol > best.vol ? b : best), bins[0]);
  const sortedByPrice = [...bins].sort((a, b) => a.price - b.price);
  const totalVol = bins.reduce((s, b) => s + b.vol, 0);
  let cumVol = 0;
  const valueArea: typeof bins = [];
  const sorted = [...bins].sort((a, b) => b.vol - a.vol);
  for (const b of sorted) {
    if (cumVol / totalVol >= 0.7) break;
    valueArea.push(b);
    cumVol += b.vol;
  }
  const vah = Math.max(...valueArea.map((b) => b.price));
  const val = Math.min(...valueArea.map((b) => b.price));

  const yLevels = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">Volume Profile</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["visible", "fixed"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs capitalize transition-colors ${mode === m ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {m} Range
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showPoc ? "bg-[#ffd600]" : "bg-[#1e2433]"}`} onClick={() => setShowPoc(!showPoc)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showPoc ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[10px] text-[#ffd600]">POC</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showVah ? "bg-[#a78bfa]" : "bg-[#1e2433]"}`} onClick={() => setShowVah(!showVah)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showVah ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[10px] text-[#a78bfa]">VA</span>
          </label>
        </div>
      </div>

      <div className="flex-1 p-4 flex gap-0">
        <svg width={W} height={H} className="flex-1">
          {yLevels.map((p, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={toY(p)} x2={PAD.left + chartW} y2={toY(p)} stroke="#1e2433" strokeWidth={1} strokeDasharray="3 4" />
              <text x={PAD.left + chartW + PROFILE_W + 4} y={toY(p) + 4} fontSize={10} fill="#8892a4">{p.toFixed(0)}</text>
            </g>
          ))}

          {showVah && (
            <>
              <line x1={PAD.left} y1={toY(vah)} x2={PAD.left + chartW} y2={toY(vah)} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
              <line x1={PAD.left} y1={toY(val)} x2={PAD.left + chartW} y2={toY(val)} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />
              <rect x={PAD.left} y={toY(vah)} width={chartW} height={toY(val) - toY(vah)} fill="#a78bfa" opacity={0.05} />
              <text x={PAD.left + 4} y={toY(vah) - 4} fontSize={9} fill="#a78bfa">VAH {vah.toFixed(2)}</text>
              <text x={PAD.left + 4} y={toY(val) + 12} fontSize={9} fill="#a78bfa">VAL {val.toFixed(2)}</text>
            </>
          )}

          {showPoc && (
            <>
              <line x1={PAD.left} y1={toY(poc.price)} x2={PAD.left + chartW} y2={toY(poc.price)} stroke="#ffd600" strokeWidth={1.5} opacity={0.9} />
              <text x={PAD.left + 4} y={toY(poc.price) - 4} fontSize={9} fill="#ffd600" fontWeight="bold">POC {poc.price.toFixed(2)}</text>
            </>
          )}

          {CANDLES.map((c, i) => {
            const bull = c.c >= c.o;
            const color = bull ? "#00e676" : "#ff4444";
            const cx = PAD.left + i * candleW + candleW / 2;
            const bodyTop = toY(Math.max(c.o, c.c));
            const bodyBot = toY(Math.min(c.o, c.c));
            return (
              <g key={i}>
                <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={color} strokeWidth={0.8} />
                <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={Math.max(bodyBot - bodyTop, 1.5)}
                  fill={bull ? color : "transparent"} stroke={color} strokeWidth={0.8} />
              </g>
            );
          })}

          {bins.map((bin, i) => {
            const barW = (bin.vol / maxVol) * PROFILE_W;
            const buyW = (bin.buyVol / bin.vol) * barW;
            const y = toY(bin.price + buildVolumeProfile().step / 2);
            const h = Math.max(2, (chartH / BINS) - 1);
            const isPoc = bin === poc;
            return (
              <g key={i}>
                <rect x={PAD.left + chartW} y={y - h / 2} width={barW} height={h} fill="#ff4444" opacity={isPoc ? 0.9 : 0.5} />
                <rect x={PAD.left + chartW} y={y - h / 2} width={buyW} height={h} fill="#00e676" opacity={isPoc ? 0.9 : 0.5} />
              </g>
            );
          })}
        </svg>

        <div className="w-52 border-l border-[#1e2433] pl-4 flex flex-col gap-4 justify-center">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Key Levels</p>
            {[
              { label: "POC", val: poc.price.toFixed(2), color: "#ffd600" },
              { label: "VAH", val: vah.toFixed(2), color: "#a78bfa" },
              { label: "VAL", val: val.toFixed(2), color: "#a78bfa" },
              { label: "Range High", val: max.toFixed(2), color: "#00e676" },
              { label: "Range Low", val: min.toFixed(2), color: "#ff4444" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#1e2433]">
                <span className="text-xs text-[#8892a4]">{label}</span>
                <span className="text-xs font-bold font-mono" style={{ color }}>${val}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Vol Distribution</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Value Area</span>
                <span className="text-white">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Buy vol</span>
                <span className="text-[#00e676]">54%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Sell vol</span>
                <span className="text-[#ff4444]">46%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
