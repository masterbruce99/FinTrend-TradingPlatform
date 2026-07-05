import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import { useGetCryptoTickers, useGetCryptoKlines, useGetFundingRate } from "@workspace/api-client-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercent, formatCompactNumber, getBgColorClass, getColorClass } from "@/lib/formatters";
import { Bitcoin } from "lucide-react";

const PAIRS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT"
];

export default function Crypto() {
  const [selected, setSelected] = useState(PAIRS[0]);
  const [interval, setIntervalState] = useState("1h");

  const { data: tickersData } = useGetCryptoTickers({ symbols: PAIRS.join(",") }, { query: { refetchInterval: 5000, queryKey: ["crypto-tickers"] } });
  const { data: klinesData, isLoading: klinesLoading } = useGetCryptoKlines(selected, { interval, limit: 100 }, { query: { enabled: !!selected, queryKey: ["crypto-klines", selected, interval] } });
  const { data: fundingData } = useGetFundingRate(selected, { query: { enabled: !!selected, queryKey: ["crypto-funding", selected] } });

  const tickersMap = useMemo(() => {
    const map: Record<string, any> = {};
    tickersData?.tickers?.forEach(t => { if (t.symbol) map[t.symbol] = t; });
    return map;
  }, [tickersData]);

  const selectedTicker = tickersMap[selected];
  const chartData = useMemo(() => {
    return klinesData?.bars?.map(b => ({
      ...b,
      timeStr: new Date(b.time || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })) || [];
  }, [klinesData]);

  const isUp = (selectedTicker?.changePct || 0) >= 0;
  const chartColor = isUp ? "#00e676" : "#ff4444";

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Crypto Derivatives</h1>
            <span className="ml-4 text-xs font-mono text-muted-foreground px-2 py-1 bg-muted rounded">Binance Real-Time</span>
          </div>
          <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-md">
            {["15m","1h","4h","1d"].map(iv => (
              <button 
                key={iv} 
                onClick={() => setIntervalState(iv)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${interval === iv ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {iv}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chart Area */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border p-4 gap-4 overflow-y-auto">
            
            {/* Top Stats */}
            {selectedTicker && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Mark Price" value={formatCurrency(selectedTicker.price, selectedTicker.price < 1 ? 4 : 2)} color="#fff" />
                <StatCard label="24h Change" value={formatPercent(selectedTicker.changePct)} color={isUp ? "#00e676" : "#ff4444"} />
                <StatCard label="24h High" value={formatCurrency(selectedTicker.high, selectedTicker.price < 1 ? 4 : 2)} />
                <StatCard label="24h Low" value={formatCurrency(selectedTicker.low, selectedTicker.price < 1 ? 4 : 2)} />
                <StatCard 
                  label="Funding Rate" 
                  value={fundingData?.fundingRate ? formatPercent(fundingData.fundingRate * 100, 4) : "—"} 
                  color={(fundingData?.fundingRate || 0) >= 0 ? "#00e676" : "#ff4444"} 
                />
              </div>
            )}

            {/* Chart */}
            <div className="flex-1 min-h-[400px] bg-card border border-border rounded-lg p-4 flex flex-col relative">
              <div className="text-xs font-mono text-muted-foreground mb-4">
                {selected} — {interval}
              </div>
              {klinesLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10 text-primary font-mono text-sm animate-pulse">Loading Candles...</div>
              )}
              {chartData.length > 0 && (
                <>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="cryptoColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" vertical={false} />
                        <XAxis dataKey="timeStr" tick={{ fill: "#8892a4", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: "#8892a4", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} orientation="right" tickFormatter={v => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#1e2433", color: "#fff", fontSize: "12px", fontFamily: "monospace" }} />
                        <Area type="monotone" dataKey="close" stroke={chartColor} fill="url(#cryptoColor)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-24 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="timeStr" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: "#131722", borderColor: "#1e2433", color: "#fff", fontSize: "12px", fontFamily: "monospace" }} cursor={{fill: '#1e2433'}} />
                        <Bar dataKey="volume" fill={`${chartColor}44`} stroke={chartColor} strokeWidth={1} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Pairs */}
          <div className="w-64 bg-card overflow-y-auto flex flex-col">
            <div className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
              Perpetual Contracts
            </div>
            {PAIRS.map(p => {
              const t = tickersMap[p];
              const pUp = (t?.changePct || 0) >= 0;
              const isSel = selected === p;
              return (
                <div 
                  key={p} 
                  onClick={() => setSelected(p)}
                  className={`p-3 border-b border-border/50 cursor-pointer transition-colors flex flex-col gap-1 hover:bg-muted/50 ${isSel ? 'bg-muted/30 border-l-2 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">{p.replace("USDT", "")}</span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${pUp ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
                      {formatPercent(t?.changePct)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">Vol {formatCompactNumber(t?.volume)}</span>
                    <span className="font-mono text-sm text-white">{t ? formatCurrency(t.price, t.price < 1 ? 4 : 2) : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-1 shadow-sm">
      <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{label}</span>
      <span className="font-mono text-lg font-bold" style={{ color: color || "#fff" }}>{value}</span>
    </div>
  );
}
