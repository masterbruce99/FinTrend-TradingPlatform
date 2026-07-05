import { useState, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from "recharts";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;
const TICK  = { fontSize: 9, fill: "#8892a4" };
const STYLE = { backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 };

type Indicator = {
  id: string; label: string; unit: string;
  value: number | null; date: string | null;
  prevValue: number | null; change: number | null; yoyChange: number | null;
  history: { date: string; value: number }[];
  error?: string;
};

const COLORS: Record<string,string> = {
  FEDFUNDS:        "#00d4ff",
  CPIAUCSL:        "#ff4444",
  CPILFESL:        "#ff8c00",
  UNRATE:          "#ffd600",
  A191RL1Q225SBEA: "#00e676",
  VIXCLS:          "#a78bfa",
  T10Y2Y:          "#f472b6",
  T10Y3M:          "#fb923c",
  DGS10:           "#34d399",
  DGS2:            "#60a5fa",
  DTWEXBGS:        "#e879f9",
  MORTGAGE30US:    "#f87171",
};

function fmtVal(v: number|null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(2)}%`;
  if (unit === "idx") return v.toFixed(1);
  return v.toFixed(2);
}

export function MacroDashboard() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<Indicator | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/macro/dashboard`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const inds: Indicator[] = data.indicators ?? [];
        if (active) {
          setIndicators(inds);
          setSelected(inds[0] ?? null);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (e: any) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    }
    load();
    const id = setInterval(load, 3_600_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{fontFamily:"'Inter',sans-serif"}}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Macro Economic Dashboard</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Live · FRED / Federal Reserve</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <span className="text-[9px] text-[#4a5568]">Federal Reserve Bank of St. Louis · FRED data</span>
      </div>

      {error && <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">⚠ {error} — make sure API Server workflow is running.</div>}
      {loading && <div className="flex-1 flex items-center justify-center text-[#8892a4] animate-pulse text-sm">Fetching macro data from FRED…</div>}

      {!loading && indicators.length > 0 && (
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-[#1e2433] overflow-auto flex-shrink-0">
            {indicators.map(ind => {
              const up = (ind.change ?? 0) >= 0;
              const color = COLORS[ind.id] ?? "#00d4ff";
              const isSelected = selected?.id === ind.id;
              return (
                <button key={ind.id} onClick={() => setSelected(ind)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1e2433] transition-colors ${isSelected?"bg-[#131722]":"hover:bg-[#0f1320]"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8892a4]">{ind.label}</span>
                    {ind.change != null && (
                      <span className="text-[9px] font-bold" style={{color:up?"#00e676":"#ff4444"}}>
                        {up?"+":""}{ind.change.toFixed(2)}{ind.unit === "%" ? "pp" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-base font-bold font-mono" style={{color}}>{ind.error ? "Error" : fmtVal(ind.value, ind.unit)}</span>
                    {ind.date && <span className="text-[8px] text-[#8892a4]">{ind.date}</span>}
                  </div>
                  {ind.yoyChange != null && (
                    <div className="mt-0.5 text-[8px] text-[#8892a4]">
                      YoY: <span style={{color:(ind.yoyChange??0)>=0?"#00e676":"#ff4444"}}>{ind.yoyChange>=0?"+":""}{ind.yoyChange.toFixed(1)}%</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 p-5 overflow-auto flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.label}</h2>
                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-4xl font-bold font-mono" style={{color:COLORS[selected.id]??"#00d4ff"}}>
                    {fmtVal(selected.value, selected.unit)}
                  </span>
                  <div className="text-sm text-[#8892a4]">
                    <p>as of {selected.date}</p>
                    {selected.change != null && (
                      <p className="font-bold" style={{color:(selected.change??0)>=0?"#00e676":"#ff4444"}}>
                        {(selected.change??0)>=0?"+":""}{selected.change.toFixed(3)} MoM
                      </p>
                    )}
                    {selected.yoyChange != null && (
                      <p className="font-bold" style={{color:(selected.yoyChange??0)>=0?"#00e676":"#ff4444"}}>
                        {(selected.yoyChange??0)>=0?"+":""}{selected.yoyChange.toFixed(1)}% YoY
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selected.history.length > 0 && (
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex-1">
                  <p className="text-[10px] text-[#8892a4] mb-3">{selected.label} — Historical (FRED)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selected.history}>
                      <defs>
                        <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={COLORS[selected.id]??"#00d4ff"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS[selected.id]??"#00d4ff"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                      <XAxis dataKey="date" tick={{...TICK,fontSize:8}} interval={3}/>
                      <YAxis tick={TICK} tickFormatter={v=>selected.unit==="%"?`${v.toFixed(1)}%`:v.toFixed(1)} domain={["auto","auto"]}/>
                      <ReferenceLine y={0} stroke="#8892a444" strokeWidth={1}/>
                      <Tooltip contentStyle={STYLE} formatter={(v:number)=>[fmtVal(v,selected.unit),selected.label]}/>
                      <Area type="monotone" dataKey="value" stroke={COLORS[selected.id]??"#00d4ff"} fill="url(#mg)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Grid of other indicators */}
              <div className="grid grid-cols-3 gap-2">
                {indicators.filter(i => i.id !== selected.id).slice(0,6).map(ind => (
                  <button key={ind.id} onClick={() => setSelected(ind)}
                    className="bg-[#131722] border border-[#1e2433] rounded-lg px-3 py-2.5 text-left hover:border-[#8892a4] transition-colors">
                    <p className="text-[9px] text-[#8892a4]">{ind.label}</p>
                    <p className="font-mono font-bold text-sm mt-0.5" style={{color:COLORS[ind.id]??"#00d4ff"}}>{fmtVal(ind.value,ind.unit)}</p>
                    {ind.date && <p className="text-[8px] text-[#4a5568] mt-0.5">{ind.date}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
