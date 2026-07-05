import { useState } from "react";

const RAW_PRICES = [
  220,222,225,223,228,231,229,234,238,236,241,245,243,248,252,250,255,259,257,262,
  265,263,268,272,270,275,279,277,282,286,284,289,293,291,296,300,298,303,307,305,
  310,314,312,308,304,300,296,292,288,284,280,276,272,268,264,260,256,252,248,244,
  240,244,248,252,256,260,264,268,272,276,
];

function buildPnF(boxSize: number, reversal: number) {
  const columns: { bull: boolean; top: number; bottom: number }[] = [];
  let col: typeof columns[0] | null = null;
  let lastPrice = RAW_PRICES[0];

  for (const price of RAW_PRICES) {
    if (!col) {
      const bull = price >= lastPrice;
      col = { bull, top: Math.floor(price / boxSize) * boxSize, bottom: Math.floor(price / boxSize) * boxSize };
      columns.push(col);
    } else if (col.bull) {
      if (price >= col.top + boxSize) {
        col.top = Math.floor(price / boxSize) * boxSize;
      } else if (price <= col.top - reversal * boxSize) {
        col = { bull: false, top: col.top - boxSize, bottom: Math.floor(price / boxSize) * boxSize };
        columns.push(col);
      }
    } else {
      if (price <= col.bottom - boxSize) {
        col.bottom = Math.floor(price / boxSize) * boxSize;
      } else if (price >= col.bottom + reversal * boxSize) {
        col = { bull: true, bottom: col.bottom + boxSize, top: Math.floor(price / boxSize) * boxSize };
        columns.push(col);
      }
    }
    lastPrice = price;
  }
  return columns;
}

function buildKagi(reversal: number) {
  const lines: { price: number; type: "yang" | "yin" }[] = [{ price: RAW_PRICES[0], type: "yang" }];
  let lastKagi = RAW_PRICES[0];
  let isYang = RAW_PRICES[1] > RAW_PRICES[0];

  for (let i = 1; i < RAW_PRICES.length; i++) {
    const p = RAW_PRICES[i];
    if (isYang) {
      if (p > lastKagi) { lastKagi = p; lines[lines.length - 1].price = p; }
      else if (p < lastKagi - reversal) { isYang = false; lines.push({ price: p, type: "yin" }); lastKagi = p; }
    } else {
      if (p < lastKagi) { lastKagi = p; lines[lines.length - 1].price = p; }
      else if (p > lastKagi + reversal) { isYang = true; lines.push({ price: p, type: "yang" }); lastKagi = p; }
    }
  }
  return lines;
}

const BOX = 4;
const SVG_W = 760, SVG_H = 400;
const PAD = { top: 20, right: 60, bottom: 30, left: 10 };
const chartW = SVG_W - PAD.left - PAD.right;
const chartH = SVG_H - PAD.top - PAD.bottom;

export function PnfKagi() {
  const [chart, setChart] = useState<"pnf" | "kagi" | "compare">("pnf");
  const [boxSize, setBoxSize] = useState(4);
  const [reversal, setReversal] = useState(3);

  const pnf = buildPnF(boxSize, reversal);
  const kagi = buildKagi(8);

  const allPrices = RAW_PRICES;
  const minP = Math.min(...allPrices) - boxSize;
  const maxP = Math.max(...allPrices) + boxSize;
  const toY = (p: number) => PAD.top + chartH - ((p - minP) / (maxP - minP)) * chartH;

  const colW = Math.min(24, (chartW - 20) / pnf.length);
  const boxH = chartH / ((maxP - minP) / boxSize);

  const kagiW = chartW / Math.max(kagi.length - 1, 1);

  const levels = Array.from({ length: 6 }, (_, i) => minP + ((maxP - minP) * i) / 5);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL</span>
          <span className="text-xs text-[#8892a4]">Point & Figure + Kagi Charts</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {([["pnf","P&F"],["kagi","Kagi"],["compare","Side by Side"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setChart(k)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chart === k ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8892a4]">Box $</span>
            {[2,4,6,8].map((b) => (
              <button key={b} onClick={() => setBoxSize(b)}
                className={`px-2 py-1 rounded transition-colors ${boxSize === b ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
        {(chart === "pnf" || chart === "compare") && (
          <div className={chart === "compare" ? "flex-1" : "flex-1 flex flex-col"}>
            {chart === "compare" && <p className="text-xs text-[#8892a4] mb-2">Point & Figure — Box ${boxSize}, {reversal}-box reversal</p>}
            <svg width="100%" height={chart === "compare" ? 200 : SVG_H} viewBox={`0 0 ${SVG_W} ${chart === "compare" ? 200 : SVG_H}`} className="flex-1">
              {levels.map((p, i) => (
                <g key={i}>
                  <line x1={PAD.left} y1={toY(p)} x2={SVG_W - PAD.right} y2={toY(p)} stroke="#1e2433" strokeWidth={0.5} />
                  <text x={SVG_W - PAD.right + 4} y={toY(p) + 4} fontSize={9} fill="#8892a4">{p.toFixed(0)}</text>
                </g>
              ))}
              {pnf.map((col, ci) => {
                const x = PAD.left + 10 + ci * (colW + 2);
                const boxes = Math.round((col.top - col.bottom) / boxSize) + 1;
                return Array.from({ length: boxes }, (_, bi) => {
                  const price = col.bottom + bi * boxSize;
                  const y = toY(price + boxSize);
                  const h = Math.max(toY(price) - toY(price + boxSize) - 1, 2);
                  return (
                    <text key={bi} x={x + colW / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={Math.min(colW - 2, 11)}
                      fill={col.bull ? "#00e676" : "#ff4444"} fontWeight="bold">
                      {col.bull ? "X" : "O"}
                    </text>
                  );
                });
              })}
              <text x={PAD.left + 4} y={PAD.top + 12} fontSize={10} fill="#8892a4">P&F Chart</text>
            </svg>
          </div>
        )}

        {(chart === "kagi" || chart === "compare") && (
          <div className={chart === "compare" ? "flex-1" : "flex-1 flex flex-col"}>
            {chart === "compare" && <p className="text-xs text-[#8892a4] mb-2">Kagi Chart — ${8} reversal</p>}
            <svg width="100%" height={chart === "compare" ? 200 : SVG_H} viewBox={`0 0 ${SVG_W} ${chart === "compare" ? 200 : SVG_H}`} className="flex-1">
              {levels.map((p, i) => (
                <line key={i} x1={PAD.left} y1={toY(p)} x2={SVG_W - PAD.right} y2={toY(p)} stroke="#1e2433" strokeWidth={0.5} />
              ))}
              {kagi.map((k, i) => {
                if (i === 0) return null;
                const prev = kagi[i - 1];
                const x1 = PAD.left + (i - 1) * kagiW;
                const x2 = PAD.left + i * kagiW;
                const y1 = toY(prev.price);
                const y2 = toY(k.price);
                const strokeW = k.type === "yang" ? 2.5 : 1;
                const color = k.type === "yang" ? "#00e676" : "#ff4444";
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x1} y2={y2} stroke={color} strokeWidth={strokeW} />
                    <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={color} strokeWidth={strokeW} />
                  </g>
                );
              })}
              <text x={PAD.left + 4} y={PAD.top + 12} fontSize={10} fill="#8892a4">Kagi Chart</text>
            </svg>
          </div>
        )}
      </div>

      <div className="px-5 py-2 border-t border-[#1e2433] bg-[#0d1018] text-xs text-[#8892a4] flex gap-6">
        <span>P&F: <span className="text-white">Time-independent, X=up ${boxSize}, O=down ${boxSize}, {reversal}-box reversal</span></span>
        <span>Kagi: <span className="text-white">Reversal on $8 move — thick = Yang (bull), thin = Yin (bear)</span></span>
      </div>
    </div>
  );
}
