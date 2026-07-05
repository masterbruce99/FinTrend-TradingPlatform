import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;
const TICK = { fontSize: 9, fill: "#8892a4" };
const STYLE = { backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 };

type Maturity = { maturity: string; current: number | null; monthAgo: number | null; yearAgo: number | null };
type Spread   = { label: string; current: { date: string; value: number } | null; history: { date: string; value: number }[] };
type YCData   = { snapshot: Maturity[]; spreads: Spread[]; maturities: any[]; source: string; asOf: string };

export function YieldCurve() {
  const [data, setData]       = useState<YCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [view, setView]       = useState<"curve"|"spreads"|"history">("curve");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/macro/yieldcurve`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const d: YCData = await res.json();
        if (active) { setData(d); setLastUpdated(new Date()); setError(null); }
      } catch (e: any) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const spread10_2  = data?.spreads?.find(s => s.label === "10Y-2Y");
  const spread10_3m = data?.spreads?.find(s => s.label === "10Y-3M");
  const isInverted  = (spread10_2?.current?.value ?? 0) < 0;
  const snapshots   = data?.snapshot ?? [];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Yield Curve Monitor</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Live · FRED / Federal Reserve</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["curve","spreads","history"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view===v?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">⚠ {error} — make sure API Server workflow is running.</div>}

      {data && (
        <div className="flex items-center gap-6 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isInverted?"bg-[#ff4444]":"bg-[#00e676]"}`} />
            <span className={`font-bold ${isInverted?"text-[#ff4444]":"text-[#00e676]"}`}>{isInverted?"INVERTED":"NORMAL"} CURVE</span>
          </div>
          {spread10_2 && <span className="text-[#8892a4]">10Y–2Y: <span className="font-mono font-bold" style={{color:(spread10_2.current?.value??0)<0?"#ff4444":"#00e676"}}>{(spread10_2.current?.value??0).toFixed(2)}%</span></span>}
          {spread10_3m && <span className="text-[#8892a4]">10Y–3M: <span className="font-mono font-bold" style={{color:(spread10_3m.current?.value??0)<0?"#ff4444":"#00e676"}}>{(spread10_3m.current?.value??0).toFixed(2)}%</span></span>}
          <span className="ml-auto text-[9px] text-[#4a5568]">FRED (Federal Reserve Bank of St. Louis) · 1-day lag</span>
        </div>
      )}

      {loading && <div className="flex-1 flex items-center justify-center text-[#8892a4] animate-pulse text-sm">Loading Treasury data from FRED…</div>}

      {!loading && data && (
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">

          {view === "curve" && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {snapshots.map(m => (
                  <div key={m.maturity} className="bg-[#131722] border border-[#1e2433] rounded-lg px-3 py-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-[#8892a4] font-bold">{m.maturity}</span>
                      <span className="font-mono font-bold text-white text-sm">{m.current!=null?`${m.current.toFixed(2)}%`:"—"}</span>
                    </div>
                    <div className="flex gap-2 mt-1 text-[8px] text-[#8892a4]">
                      <span>1M: <span className="text-[#c8d3e0]">{m.monthAgo!=null?`${m.monthAgo.toFixed(2)}%`:"—"}</span></span>
                      <span>1Y: <span className="text-[#c8d3e0]">{m.yearAgo!=null?`${m.yearAgo.toFixed(2)}%`:"—"}</span></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex-1">
                <p className="text-[10px] text-[#8892a4] mb-3">Yield Curve Shape — Current (blue) vs 1 Month Ago (yellow) vs 1 Year Ago (gray)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={snapshots} margin={{top:10,right:20,bottom:10,left:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="maturity" tick={TICK} />
                    <YAxis tick={TICK} tickFormatter={v=>`${v.toFixed(1)}%`} domain={["auto","auto"]} />
                    <Tooltip contentStyle={STYLE} formatter={(v:number,n)=>[`${v.toFixed(3)}%`,n==="current"?"Current":n==="monthAgo"?"1M Ago":"1Y Ago"]} />
                    <ReferenceLine y={0} stroke="#ff444466" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="yearAgo"  stroke="#8892a4" strokeWidth={1} strokeDasharray="3 3" dot={false} name="yearAgo" />
                    <Line type="monotone" dataKey="monthAgo" stroke="#ffd600" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="monthAgo" />
                    <Line type="monotone" dataKey="current"  stroke="#00d4ff" strokeWidth={2.5} dot={{fill:"#00d4ff",r:3}} name="current" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {view === "spreads" && (
            <div className="flex flex-col gap-4">
              {data.spreads.map(s => (
                <div key={s.label} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold">{s.label} Spread</span>
                    <span className="font-mono font-bold text-lg" style={{color:(s.current?.value??0)<0?"#ff4444":"#00e676"}}>
                      {s.current?.value?.toFixed(2)??"—"}%
                    </span>
                    {(s.current?.value??0)<0 && <span className="text-xs text-[#ff4444] font-bold px-2 py-0.5 rounded bg-[#ff444422]">INVERTED</span>}
                    <span className="text-[9px] text-[#8892a4] ml-auto">as of {s.current?.date}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={s.history}>
                      <defs>
                        <linearGradient id={`g${s.label.replace(/\W/g,"")}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00e676" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                      <XAxis dataKey="date" tick={{...TICK,fontSize:7}} interval={29}/>
                      <YAxis tick={TICK} tickFormatter={v=>`${v.toFixed(1)}%`} />
                      <ReferenceLine y={0} stroke="#ff4444" strokeWidth={1.5} strokeDasharray="4 4" label={{value:"Inversion",fill:"#ff4444",fontSize:7}}/>
                      <Tooltip contentStyle={STYLE} formatter={(v:number)=>[`${v.toFixed(3)}%`,"Spread"]} />
                      <Area type="monotone" dataKey="value" stroke="#00e676" fill={`url(#g${s.label.replace(/\W/g,"")})`} strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {view === "history" && (
            <div className="grid grid-cols-2 gap-3">
              {["2Y","5Y","10Y","30Y"].map(mat => {
                const entry = data.maturities?.find((m:any) => m.label===mat);
                if (!entry?.history?.length) return null;
                return (
                  <div key={mat} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                    <p className="text-xs font-bold text-[#8892a4] mb-2">{mat} Treasury (90 days)</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={entry.history}>
                        <defs>
                          <linearGradient id={`hg${mat}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                        <XAxis dataKey="date" tick={{...TICK,fontSize:7}} interval={29}/>
                        <YAxis tick={TICK} tickFormatter={v=>`${v.toFixed(1)}%`} />
                        <Tooltip contentStyle={STYLE} formatter={(v:number)=>[`${v.toFixed(3)}%`,`${mat} Yield`]} />
                        <Area type="monotone" dataKey="value" stroke="#00d4ff" fill={`url(#hg${mat})`} strokeWidth={1.5} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
