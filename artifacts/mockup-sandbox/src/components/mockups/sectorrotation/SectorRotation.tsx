import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

const SECTORS = [
  { name:"Technology",    abbr:"XLK",  x:2.4,  y:3.8,  size:18, momentum:82, color:"#00d4ff",  phase:"Leading" },
  { name:"Health Care",   abbr:"XLV",  x:1.2,  y:1.4,  size:14, momentum:58, color:"#00e676",  phase:"Leading" },
  { name:"Financials",    abbr:"XLF",  x:1.8,  y:0.8,  size:12, momentum:54, color:"#a78bfa",  phase:"Improving" },
  { name:"Energy",        abbr:"XLE",  x:-0.4, y:1.2,  size:10, momentum:48, color:"#ff8c00",  phase:"Improving" },
  { name:"Industrials",   abbr:"XLI",  x:0.8,  y:-0.4, size:11, momentum:44, color:"#ffd600",  phase:"Weakening" },
  { name:"Consumer Disc", abbr:"XLY",  x:-0.8, y:-0.6, size:13, momentum:38, color:"#ff4444",  phase:"Lagging" },
  { name:"Materials",     abbr:"XLB",  x:-1.2, y:0.2,  size:9,  momentum:42, color:"#4ade80",  phase:"Weakening" },
  { name:"Utilities",     abbr:"XLU",  x:-1.8, y:-1.4, size:8,  momentum:28, color:"#94a3b8",  phase:"Lagging" },
  { name:"Real Estate",   abbr:"XLRE", x:-2.0, y:-0.8, size:7,  momentum:32, color:"#f472b6",  phase:"Lagging" },
  { name:"Comm Services", abbr:"XLC",  x:1.4,  y:2.2,  size:15, momentum:74, color:"#38bdf8",  phase:"Leading" },
  { name:"Consumer Sta.", abbr:"XLP",  x:-0.6, y:-1.2, size:10, momentum:35, color:"#fb923c",  phase:"Lagging" },
];

const ROTATION_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  XLK: 3 + Math.sin(i * 0.6) * 4,
  XLV: 1 + Math.sin(i * 0.5 + 1) * 2,
  XLF: 2 + Math.cos(i * 0.7) * 3,
  XLE: -1 + Math.sin(i * 0.8 + 2) * 3,
  XLY: -0.5 + Math.cos(i * 0.6 + 1) * 2.5,
}));

const PHASE_COLOR: Record<string, string> = { Leading: "#00e676", Improving: "#00d4ff", Weakening: "#ffd600", Lagging: "#ff4444" };

export function SectorRotation() {
  const [selected, setSelected] = useState<typeof SECTORS[0] | null>(null);
  const [view, setView] = useState<"rrg" | "bar" | "history">("rrg");

  const sorted = [...SECTORS].sort((a, b) => b.momentum - a.momentum);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Sector Rotation</span>
          <span className="text-xs text-[#8892a4]">Relative Rotation Graph (RRG)</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {([["rrg","RRG Chart"],["bar","Momentum Bar"],["history","Rotation History"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setView(k)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === k ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 flex flex-col">
          {view === "rrg" && (
            <>
              <p className="text-xs text-[#8892a4] mb-3">RRG — Relative Strength vs Momentum (vs SPY benchmark)</p>
              <div className="flex-1 relative bg-[#0d1018] rounded-lg border border-[#1e2433] overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                  {[["Leading","#00e67611"],["Weakening","#ffd60011"],["Improving","#00d4ff11"],["Lagging","#ff444411"]].map(([label, bg]) => (
                    <div key={label} className="flex items-center justify-center border border-[#1e2433]" style={{ backgroundColor: bg }}>
                      <span className="text-[10px] font-bold opacity-40" style={{ color: PHASE_COLOR[label] }}>{label}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis type="number" dataKey="x" domain={[-3, 3]} tick={{ fontSize: 9, fill: "#8892a4" }} label={{ value: "Relative Strength →", position: "bottom", fontSize: 10, fill: "#8892a4" }} />
                    <YAxis type="number" dataKey="y" domain={[-2.5, 5]} tick={{ fontSize: 9, fill: "#8892a4" }} label={{ value: "← Momentum →", angle: -90, position: "insideLeft", fontSize: 10, fill: "#8892a4" }} />
                    <ReferenceLine x={0} stroke="#8892a4" strokeWidth={1} />
                    <ReferenceLine y={0} stroke="#8892a4" strokeWidth={1} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4, fontSize: 11 }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0]?.payload as typeof SECTORS[0];
                        return (
                          <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs">
                            <p className="font-bold text-white">{d.name}</p>
                            <p style={{ color: PHASE_COLOR[d.phase] }}>{d.phase}</p>
                            <p className="text-[#8892a4]">Momentum: {d.momentum}</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter
                      data={SECTORS}
                      onClick={(d) => setSelected(d as typeof SECTORS[0])}
                      shape={(props: any) => {
                        const { cx, cy, payload } = props;
                        const r = payload.size / 2 + 4;
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={r} fill={payload.color + "44"} stroke={payload.color} strokeWidth={2} style={{ cursor: "pointer" }} />
                            <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize={9} fill={payload.color} fontWeight="700">{payload.abbr}</text>
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {view === "bar" && (
            <div className="flex-1 overflow-auto">
              <p className="text-xs text-[#8892a4] mb-4">Sector Momentum Score (0–100)</p>
              {sorted.map((s) => (
                <div key={s.abbr} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{s.abbr}</span>
                      <span className="text-[#8892a4]">{s.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: PHASE_COLOR[s.phase] + "22", color: PHASE_COLOR[s.phase] }}>{s.phase}</span>
                    </div>
                    <span className="font-bold font-mono" style={{ color: s.color }}>{s.momentum}</span>
                  </div>
                  <div className="w-full h-4 bg-[#1e2433] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all" style={{ width: `${s.momentum}%`, backgroundColor: s.color, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "history" && (
            <div className="flex-1">
              <p className="text-xs text-[#8892a4] mb-3">Monthly returns by sector — YTD 2025</p>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={ROTATION_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8892a4" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`]} />
                  <ReferenceLine y={0} stroke="#8892a4" />
                  <Area type="monotone" dataKey="XLK" stroke="#00d4ff" fill="#00d4ff11" strokeWidth={2} />
                  <Area type="monotone" dataKey="XLV" stroke="#00e676" fill="#00e67611" strokeWidth={2} />
                  <Area type="monotone" dataKey="XLF" stroke="#a78bfa" fill="#a78bfa11" strokeWidth={2} />
                  <Area type="monotone" dataKey="XLE" stroke="#ff8c00" fill="#ff8c0011" strokeWidth={2} />
                  <Area type="monotone" dataKey="XLY" stroke="#ff4444" fill="#ff444411" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="w-56 border-l border-[#1e2433] pl-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Phase Summary</p>
            {["Leading","Improving","Weakening","Lagging"].map((phase) => {
              const secs = SECTORS.filter((s) => s.phase === phase);
              return (
                <div key={phase} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PHASE_COLOR[phase] }} />
                    <span className="text-xs font-bold" style={{ color: PHASE_COLOR[phase] }}>{phase}</span>
                  </div>
                  {secs.map((s) => (
                    <div key={s.abbr} className="flex justify-between text-[10px] pl-3.5 py-0.5">
                      <span className="text-[#8892a4]">{s.abbr}</span>
                      <span className="text-white">{s.momentum}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="border-t border-[#1e2433] pt-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Selected Sector</p>
              <p className="text-sm font-bold" style={{ color: selected.color }}>{selected.abbr}</p>
              <p className="text-xs text-[#8892a4]">{selected.name}</p>
              <div className="mt-3 space-y-1.5 text-xs">
                {[
                  ["Phase", selected.phase, PHASE_COLOR[selected.phase]],
                  ["Momentum", selected.momentum.toString(), selected.color],
                  ["RS vs SPY", `${selected.x > 0 ? "+" : ""}${selected.x.toFixed(2)}`, selected.x > 0 ? "#00e676" : "#ff4444"],
                  ["Trend", `${selected.y > 0 ? "+" : ""}${selected.y.toFixed(2)}`, selected.y > 0 ? "#00e676" : "#ff4444"],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex justify-between border-b border-[#1e2433] pb-1.5">
                    <span className="text-[#8892a4]">{l}</span>
                    <span className="font-bold" style={{ color: c as string }}>{v}</span>
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
