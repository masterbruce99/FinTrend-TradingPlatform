import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import { useGetMacroDashboard, useGetYieldCurve } from "@workspace/api-client-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Globe, LineChart as LineChartIcon } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/formatters";

export default function Macro() {
  const { data: macroData, isLoading: macroLoading } = useGetMacroDashboard({ query: { queryKey: ["macro-dash"] } });
  const { data: ycData, isLoading: ycLoading } = useGetYieldCurve({ query: { queryKey: ["macro-yc"] } });

  const [selectedInd, setSelectedInd] = useState<string | null>(null);

  // default to FEDFUNDS or first available
  const indicators = macroData?.indicators || [];
  const selected = useMemo(() => indicators.find(i => i.id === selectedInd) || indicators[0], [indicators, selectedInd]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Macro Economics</h1>
            <span className="ml-4 text-[10px] font-mono text-muted-foreground px-2 py-1 bg-muted rounded border border-border">FRED / Federal Reserve</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          
          {/* Yield Curve Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <LineChartIcon className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-white">US Treasury Yield Curve</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 min-h-[300px]">
                {ycLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">Loading Yield Curve...</div>
                ) : (
                  <>
                    <div className="flex gap-4 text-xs font-mono text-muted-foreground mb-4">
                      <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary"></div> Current</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#ffd600]"></div> 1 Month Ago</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#8892a4] border-dashed border-t border-[#8892a4]"></div> 1 Year Ago</div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={ycData?.snapshot || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false}/>
                        <XAxis dataKey="maturity" tick={{ fill: "#8892a4", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#1e2433", color: "#fff", fontSize: "12px", fontFamily: "monospace" }} />
                        <Line type="monotone" dataKey="yearAgo" stroke="#8892a4" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="1Y Ago" />
                        <Line type="monotone" dataKey="monthAgo" stroke="#ffd600" strokeWidth={1.5} dot={false} name="1M Ago" />
                        <Line type="monotone" dataKey="current" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 3, fill: "#00d4ff" }} name="Current" />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
              
              <div className="space-y-4">
                {ycData?.spreads?.map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground font-bold mb-1">{s.label} Spread</div>
                    <div className={`text-2xl font-mono font-bold ${(s.current?.value || 0) < 0 ? 'text-down' : 'text-up'}`}>
                      {formatNumber(s.current?.value)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {(s.current?.value || 0) < 0 ? (
                         <span className="bg-down/20 text-down px-2 py-0.5 rounded font-bold">INVERTED</span>
                      ) : (
                         <span className="bg-up/20 text-up px-2 py-0.5 rounded font-bold">NORMAL</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Key Indicators Grid */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Key Economic Indicators</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {macroLoading && <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse font-mono">Loading Indicators...</div>}
              {indicators.map(ind => (
                <div 
                  key={ind.id} 
                  onClick={() => setSelectedInd(ind.id || null)}
                  className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/50 ${selected?.id === ind.id ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
                >
                  <div className="text-xs text-muted-foreground font-bold mb-2">{ind.label}</div>
                  <div className="text-xl font-mono font-bold text-white mb-1">
                    {formatNumber(ind.value)}{ind.unit === '%' ? '%' : ''}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">{ind.date}</span>
                    <span className={(ind.change || 0) >= 0 ? "text-up" : "text-down"}>
                      {ind.change && ind.change > 0 ? '+' : ''}{formatNumber(ind.change)} {ind.unit === '%' ? 'pp' : 'MoM'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Selected Indicator Chart */}
          {selected && selected.history && selected.history.length > 0 && (
            <section className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">{selected.label} — Historical</h3>
                <div className="text-xs text-muted-foreground font-mono">YoY: <span className={(selected.yoyChange || 0) >= 0 ? "text-up" : "text-down"}>{formatPercent(selected.yoyChange)}</span></div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selected.history} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="macroColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false}/>
                    <XAxis dataKey="date" tick={{ fill: "#8892a4", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={50} />
                    <YAxis tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}${selected.unit === '%' ? '%' : ''}`} />
                    <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#1e2433", color: "#fff", fontSize: "12px", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey="value" stroke="#00d4ff" fill="url(#macroColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
