import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, ReferenceLine, Cell } from "recharts";

const SECTORS = [
  { name:"Technology",     symbol:"XLK",  rs:2.84,  momentum:1.84,  perf1W:3.24,  perf1M:8.42,  perf3M:18.4,  ytd:24.8,  phase:"Leading",   color:"#00d4ff" },
  { name:"Communications", symbol:"XLC",  rs:1.84,  momentum:1.24,  perf1W:2.84,  perf1M:6.24,  perf3M:14.2,  ytd:18.4,  phase:"Leading",   color:"#a78bfa" },
  { name:"Consumer Disc.", symbol:"XLY",  rs:0.84,  momentum:0.42,  perf1W:1.24,  perf1M:3.84,  perf3M:8.4,   ytd:12.4,  phase:"Improving", color:"#00e676" },
  { name:"Industrials",    symbol:"XLI",  rs:0.24,  momentum:0.84,  perf1W:0.84,  perf1M:2.84,  perf3M:6.4,   ytd:8.2,   phase:"Improving", color:"#ffd600" },
  { name:"Financials",     symbol:"XLF",  rs:0.42,  momentum:-0.24, perf1W:0.42,  perf1M:1.84,  perf3M:4.8,   ytd:6.4,   phase:"Improving", color:"#ff8c00" },
  { name:"Health Care",    symbol:"XLV",  rs:-0.24, momentum:0.42,  perf1W:-0.24, perf1M:0.84,  perf3M:2.4,   ytd:4.2,   phase:"Weakening", color:"#ff6b6b" },
  { name:"Real Estate",    symbol:"XLRE", rs:-0.84, momentum:-0.42, perf1W:-0.84, perf1M:-1.24, perf3M:-2.4,  ytd:-4.2,  phase:"Lagging",   color:"#ff4444" },
  { name:"Utilities",      symbol:"XLU",  rs:-1.24, momentum:-0.84, perf1W:-1.24, perf1M:-2.84, perf3M:-4.8,  ytd:-6.4,  phase:"Lagging",   color:"#8892a4" },
  { name:"Materials",      symbol:"XLB",  rs:-0.42, momentum:0.24,  perf1W:-0.42, perf1M:0.42,  perf3M:1.2,   ytd:2.4,   phase:"Weakening", color:"#8b5cf6" },
  { name:"Energy",         symbol:"XLE",  rs:-0.64, momentum:-1.24, perf1W:-0.64, perf1M:-2.24, perf3M:-5.4,  ytd:-8.4,  phase:"Lagging",   color:"#f97316" },
  { name:"Consumer Stap.", symbol:"XLP",  rs:-0.18, momentum:-0.08, perf1W:-0.18, perf1M:0.24,  perf3M:0.8,   ytd:1.8,   phase:"Weakening", color:"#94a3b8" },
];

const PHASE_COLOR: Record<string, string> = { Leading:"#00e676", Improving:"#ffd600", Weakening:"#ff8c00", Lagging:"#ff4444" };

const FLOW_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  week: `W${i+1}`,
  Technology: 2.4 + Math.sin(i * 0.5) * 1.2,
  Financials: 0.8 + Math.cos(i * 0.4) * 0.6,
  Energy: -1.2 + Math.sin(i * 0.3) * 0.8,
  Health: 0.4 + Math.sin(i * 0.6) * 0.4,
}));

export function SectorRotation() {
  const [view, setView] = useState<"rrg"|"table"|"flow">("rrg");
  const [period, setPeriod] = useState<"perf1W"|"perf1M"|"perf3M"|"ytd">("perf1M");

  const PERIOD_LABELS: Record<string, string> = { perf1W:"1 Week", perf1M:"1 Month", perf3M:"3 Months", ytd:"YTD" };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Sector Rotation</span>
          <span className="text-xs text-[#8892a4]">GICS Relative Rotation Graph</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["rrg","table","flow"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v === "rrg" ? "RRG Chart" : v === "table" ? "Performance" : "Flow History"}
              </button>
            ))}
          </div>
          {view === "table" && (
            <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
              {(["perf1W","perf1M","perf3M","ytd"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs transition-colors ${period === p ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === "rrg" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-[#8892a4] mb-2 text-center">RS-Momentum (Y) vs RS-Ratio (X) relative to SPY</p>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart margin={{ top:20,right:20,bottom:20,left:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis type="number" dataKey="rs" name="RS-Ratio" domain={[-1.8,3.5]} tick={{fontSize:9,fill:"#8892a4"}} label={{value:"RS-Ratio →",position:"bottom",fontSize:10,fill:"#8892a4"}} />
                <YAxis type="number" dataKey="momentum" name="RS-Momentum" domain={[-1.8,2.5]} tick={{fontSize:9,fill:"#8892a4"}} label={{value:"RS-Momentum →",angle:-90,position:"insideLeft",fontSize:10,fill:"#8892a4"}} />
                <ReferenceLine x={0} stroke="#8892a433" strokeWidth={2} />
                <ReferenceLine y={0} stroke="#8892a433" strokeWidth={2} />
                {/* Quadrant labels */}
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                  content={({payload}) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as typeof SECTORS[0];
                    return <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs"><p className="font-bold" style={{color:d.color}}>{d.name}</p><p className="text-[#8892a4]">RS: {d.rs.toFixed(2)} | Mom: {d.momentum.toFixed(2)}</p><p style={{color:PHASE_COLOR[d.phase]}}>{d.phase}</p></div>;
                  }} />
                <Scatter data={SECTORS} shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={22} fill={payload.color+"22"} stroke={payload.color} strokeWidth={2} />
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="700" fill={payload.color}>{payload.symbol}</text>
                    </g>
                  );
                }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="w-52 flex flex-col gap-2">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1">Quadrant Guide</p>
            {[["Leading","Top-Right: Strong RS + rising momentum","#00e676"],["Improving","Bottom-Right: Strong RS + weak momentum","#ffd600"],["Weakening","Top-Left: Weak RS + rising momentum","#ff8c00"],["Lagging","Bottom-Left: Weak RS + falling momentum","#ff4444"]].map(([phase,desc,c]) => (
              <div key={phase as string} className="bg-[#131722] border rounded p-2" style={{borderColor:(c as string)+"33"}}>
                <p className="text-[10px] font-bold mb-0.5" style={{color:c as string}}>{phase as string}</p>
                <p className="text-[9px] text-[#8892a4]">{desc as string}</p>
              </div>
            ))}
            <div className="mt-3 space-y-1.5">
              {SECTORS.sort((a,b) => b.rs - a.rs).slice(0,4).map(s => (
                <div key={s.symbol} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor:s.color}} />
                  <span className="font-bold" style={{color:s.color}}>{s.symbol}</span>
                  <span className="text-[#8892a4] flex-1">{s.name}</span>
                  <span className="font-bold" style={{color:PHASE_COLOR[s.phase]}}>{s.phase}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "table" && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Sector","Symbol","1W","1M","3M","YTD","Phase"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SECTORS].sort((a,b) => b[period] - a[period]).map(s => (
                <tr key={s.symbol} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                  <td className="py-3 px-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:s.color}} /><span className="font-medium text-white">{s.name}</span></div></td>
                  <td className="py-3 px-3 font-bold" style={{color:s.color}}>{s.symbol}</td>
                  {["perf1W","perf1M","perf3M","ytd"].map(p => (
                    <td key={p} className="py-3 px-3 font-mono font-bold" style={{color:s[p as keyof typeof s] as number>=0?"#00e676":"#ff4444"}}>
                      {(s[p as keyof typeof s] as number)>=0?"+":""}{(s[p as keyof typeof s] as number).toFixed(2)}%
                    </td>
                  ))}
                  <td className="py-3 px-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:PHASE_COLOR[s.phase]+"22",color:PHASE_COLOR[s.phase]}}>{s.phase}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "flow" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Weekly Relative Flow — Key Sectors vs SPY</p>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={FLOW_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="week" tick={{fontSize:9,fill:"#8892a4"}} interval={3} />
              <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`${v > 0 ? "+" : ""}${v.toFixed(1)}`} />
              <ReferenceLine y={0} stroke="#8892a4" strokeWidth={2} />
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${v>=0?"+":""}${v.toFixed(2)}%`]} />
              <Line type="monotone" dataKey="Technology" stroke="#00d4ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Financials" stroke="#ffd600" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Energy" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Health" stroke="#ff6b6b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
