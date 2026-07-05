import { useState } from "react";

const ASSETS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "BTC", "GLD", "TLT", "XOM"];

const RAW_CORR: Record<string, Record<string, number>> = {
  AAPL: { AAPL:1.00, MSFT:0.82, NVDA:0.71, TSLA:0.44, SPY:0.78, QQQ:0.85, BTC:0.31, GLD:-0.12, TLT:-0.28, XOM:0.15 },
  MSFT: { AAPL:0.82, MSFT:1.00, NVDA:0.68, TSLA:0.39, SPY:0.76, QQQ:0.88, BTC:0.28, GLD:-0.10, TLT:-0.24, XOM:0.12 },
  NVDA: { AAPL:0.71, MSFT:0.68, NVDA:1.00, TSLA:0.52, SPY:0.64, QQQ:0.74, BTC:0.48, GLD:-0.08, TLT:-0.19, XOM:0.09 },
  TSLA: { AAPL:0.44, MSFT:0.39, NVDA:0.52, TSLA:1.00, SPY:0.41, QQQ:0.48, BTC:0.56, GLD:-0.15, TLT:-0.22, XOM:0.06 },
  SPY:  { AAPL:0.78, MSFT:0.76, NVDA:0.64, TSLA:0.41, SPY:1.00, QQQ:0.96, BTC:0.34, GLD:0.02,  TLT:-0.18, XOM:0.52 },
  QQQ:  { AAPL:0.85, MSFT:0.88, NVDA:0.74, TSLA:0.48, SPY:0.96, QQQ:1.00, BTC:0.38, GLD:-0.04, TLT:-0.22, XOM:0.44 },
  BTC:  { AAPL:0.31, MSFT:0.28, NVDA:0.48, TSLA:0.56, SPY:0.34, QQQ:0.38, BTC:1.00, GLD:0.18,  TLT:-0.14, XOM:0.12 },
  GLD:  { AAPL:-0.12,MSFT:-0.10,NVDA:-0.08,TSLA:-0.15,SPY:0.02, QQQ:-0.04,BTC:0.18, GLD:1.00,  TLT:0.42,  XOM:0.08 },
  TLT:  { AAPL:-0.28,MSFT:-0.24,NVDA:-0.19,TSLA:-0.22,SPY:-0.18,QQQ:-0.22,BTC:-0.14,GLD:0.42,  TLT:1.00,  XOM:-0.31},
  XOM:  { AAPL:0.15, MSFT:0.12, NVDA:0.09, TSLA:0.06, SPY:0.52, QQQ:0.44, BTC:0.12, GLD:0.08,  TLT:-0.31, XOM:1.00 },
};

function corrToColor(v: number): string {
  if (v === 1.0) return "#1a2a3a";
  if (v > 0.8) return "#00aa44";
  if (v > 0.6) return "#00cc66";
  if (v > 0.4) return "#33cc88";
  if (v > 0.2) return "#66ddaa";
  if (v > 0) return "#99eebb";
  if (v > -0.2) return "#ffaaaa";
  if (v > -0.4) return "#ff7777";
  if (v > -0.6) return "#ff4444";
  return "#cc2222";
}

function corrToText(v: number): string {
  if (v === 1.0) return "#4a6a8a";
  return Math.abs(v) > 0.3 ? "#ffffff" : "#ffffffcc";
}

export function CorrelationMatrix() {
  const [selected, setSelected] = useState<{ a: string; b: string } | null>(null);
  const [period, setPeriod] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [hovered, setHovered] = useState<{ a: string; b: string } | null>(null);

  const sel = selected;
  const corr = sel ? RAW_CORR[sel.a][sel.b] : null;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Correlation Matrix</span>
          <span className="text-xs text-[#8892a4]">10 assets</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["1M", "3M", "6M", "1Y"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-6 gap-6">
        <div className="flex flex-col">
          <div className="flex mb-1 ml-14">
            {ASSETS.map((a) => (
              <div key={a} className="w-12 text-center text-[10px] text-[#8892a4] font-medium">{a}</div>
            ))}
          </div>

          {ASSETS.map((rowA) => (
            <div key={rowA} className="flex items-center gap-0">
              <div className="w-14 text-[10px] text-[#8892a4] font-medium text-right pr-2">{rowA}</div>
              {ASSETS.map((colB) => {
                const v = RAW_CORR[rowA][colB];
                const isSelected = sel?.a === rowA && sel?.b === colB;
                const isHovered = hovered?.a === rowA && hovered?.b === colB;
                return (
                  <div
                    key={colB}
                    onClick={() => setSelected(isSelected ? null : { a: rowA, b: colB })}
                    onMouseEnter={() => setHovered({ a: rowA, b: colB })}
                    onMouseLeave={() => setHovered(null)}
                    className="w-12 h-10 flex items-center justify-center cursor-pointer transition-transform text-[10px] font-bold rounded-sm mx-px my-px"
                    style={{
                      backgroundColor: corrToColor(v),
                      color: corrToText(v),
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      outline: isSelected ? "2px solid #00d4ff" : "none",
                      outlineOffset: "1px",
                    }}
                  >
                    {v.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-[10px] text-[#8892a4]">-1.0</span>
            <div className="flex h-3 rounded-sm overflow-hidden w-48">
              {[-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8].map((v) => (
                <div key={v} className="flex-1" style={{ backgroundColor: corrToColor(v) }} />
              ))}
            </div>
            <span className="text-[10px] text-[#8892a4]">+1.0</span>
          </div>
        </div>

        <div className="w-56 border-l border-[#1e2433] pl-6 flex flex-col gap-4">
          {sel && corr !== null ? (
            <>
              <div>
                <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Pair Analysis</p>
                <div className="text-2xl font-bold" style={{ color: corrToColor(corr) }}>{corr.toFixed(2)}</div>
                <p className="text-sm text-white mt-1">{sel.a} / {sel.b}</p>
                <p className="text-xs text-[#8892a4] mt-0.5">
                  {Math.abs(corr) > 0.8 ? "Highly correlated" :
                    Math.abs(corr) > 0.5 ? "Moderately correlated" :
                    Math.abs(corr) > 0.2 ? "Weakly correlated" : "Uncorrelated"}
                  {corr < 0 ? " (inverse)" : ""}
                </p>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Period", val: period },
                  { label: "β (beta)", val: (corr * 1.12).toFixed(2) },
                  { label: "R²", val: (corr * corr).toFixed(3) },
                  { label: "Signal", val: Math.abs(corr) > 0.7 ? "High overlap" : "Diversifying" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between border-b border-[#1e2433] pb-1.5">
                    <span className="text-[#8892a4]">{label}</span>
                    <span className="text-white">{val}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest">Click a cell to inspect</p>
              <p className="text-xs text-[#8892a4]">Select any pair to see detailed correlation statistics and diversification signal.</p>
              <div className="mt-4">
                <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Highest Pairs</p>
                {[["SPY", "QQQ", 0.96], ["AAPL", "QQQ", 0.85], ["MSFT", "QQQ", 0.88]].map(([a, b, v]) => (
                  <div key={`${a}-${b}`} className="flex items-center justify-between py-1.5 border-b border-[#1e2433] text-xs">
                    <span className="text-[#8892a4]">{a}/{b}</span>
                    <span className="text-[#00e676] font-bold">{(v as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Lowest Pairs</p>
                {[["TLT", "XOM", -0.31], ["TLT", "QQQ", -0.22], ["GLD", "AAPL", -0.12]].map(([a, b, v]) => (
                  <div key={`${a}-${b}`} className="flex items-center justify-between py-1.5 border-b border-[#1e2433] text-xs">
                    <span className="text-[#8892a4]">{a}/{b}</span>
                    <span className="text-[#ff4444] font-bold">{(v as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
