import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetQuotes, useGetNews, useGetMacroDashboard, useGetCryptoTickers } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, getColorClass, getBgColorClass, formatCompactNumber } from "@/lib/formatters";
import { ArrowRight, Clock, Activity, Bitcoin, Globe, Newspaper, CalendarDays } from "lucide-react";
import { Link } from "wouter";

function useEarningsCalendar() {
  return useQuery({
    queryKey: ["earnings-calendar"],
    queryFn: async () => {
      const res = await fetch("/api/finance/earnings-calendar");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export default function Overview() {
  const [showEarnings, setShowEarnings] = useState<boolean>(() => {
    try { return localStorage.getItem("earnings-calendar-visible") !== "false"; } catch { return true; }
  });

  const toggleEarnings = () => {
    setShowEarnings(prev => {
      const next = !prev;
      try { localStorage.setItem("earnings-calendar-visible", String(next)); } catch {}
      return next;
    });
  };

  const { data: quotes } = useGetQuotes({ symbols: "SPY,QQQ,DIA,IWM,^VIX" }, { query: { refetchInterval: 10000, queryKey: ["overview-quotes"] } });
  const { data: crypto } = useGetCryptoTickers({ symbols: "BTCUSDT,ETHUSDT" }, { query: { refetchInterval: 10000, queryKey: ["overview-crypto"] } });
  const { data: news } = useGetNews({ count: 5 }, { query: { queryKey: ["overview-news"] } });
  const { data: macro } = useGetMacroDashboard({ query: { queryKey: ["overview-macro"] } });
  const { data: earnings } = useEarningsCalendar();

  return (
    <AppLayout>
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Market Overview</h1>
            <p className="text-sm text-muted-foreground">Real-time market intelligence dashboard</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-up animate-pulse" />
            <span className="text-up font-medium">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Top Market Indexes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quotes?.quotes?.map(q => (
            <Card key={q.symbol} className="bg-card/50 hover:bg-card transition-colors">
              <CardContent className="p-4 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{q.symbol}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getBgColorClass(q.changePct)}`}>
                    {formatPercent(q.changePct)}
                  </span>
                </div>
                <div className="text-xl font-mono tracking-tighter">
                  {q.symbol === "^VIX" && q.price != null ? q.price.toFixed(2) : formatCurrency(q.price)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Earnings Calendar */}
            <Card>
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Earnings Calendar
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">Consensus estimates via Yahoo</span>
                  <button
                    onClick={toggleEarnings}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${showEarnings ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={showEarnings}
                    title={showEarnings ? "Hide earnings calendar" : "Show earnings calendar"}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${showEarnings ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </CardHeader>
              {showEarnings && (
                <CardContent className="p-0">
                  <EarningsList data={earnings} />
                </CardContent>
              )}
            </Card>

            {/* Active Equities */}
            <Card className="h-fit">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Active Equities
                </CardTitle>
                <Link href="/market">
                  <div className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
                    View Market <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <MoversList />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bitcoin className="w-4 h-4 text-primary" />
                    Crypto Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {crypto?.tickers?.map(c => (
                    <div key={c.symbol || Math.random()} className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm">{(c.symbol || "").replace("USDT", "")}</div>
                        <div className="text-xs text-muted-foreground text-mono">Vol: {formatCompactNumber(c.volume)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(c.price)}</div>
                        <div className={`text-xs ${getColorClass(c.changePct)}`}>{formatPercent(c.changePct)}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/crypto">
                    <div className="text-xs text-center text-primary mt-2 cursor-pointer hover:underline">View Crypto Dashboard</div>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Macro Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {macro?.indicators?.slice(0, 3).map(ind => (
                    <div key={ind.id} className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">{ind.label}</div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{ind.value?.toFixed(2)}{ind.unit === '%' ? '%' : ''}</div>
                      </div>
                    </div>
                  ))}
                  <Link href="/macro">
                    <div className="text-xs text-center text-primary mt-2 cursor-pointer hover:underline">View Macro Dashboard</div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary" />
                  Latest News
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y divide-border">
                  {news?.news?.map(item => (
                    <a key={item.id} href={item.url || "#"} target="_blank" rel="noreferrer" className="block p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {item.publisher}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.publishedAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-white line-clamp-2 leading-snug">{item.headline}</h4>
                      {item.symbols && item.symbols.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.symbols.slice(0, 3).map(sym => (
                            <span key={sym} className="text-[9px] px-1 py-0.5 border rounded text-muted-foreground">{sym}</span>
                          ))}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function EarningsList({ data }: { data: any }) {
  if (!data?.earnings) return <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">Loading earnings...</div>;
  const list = data.earnings.slice(0, 8);
  if (list.length === 0) return <div className="p-6 text-center text-sm text-muted-foreground">No upcoming earnings found</div>;

  return (
    <div className="divide-y divide-border">
      <div className="grid grid-cols-12 gap-2 p-3 text-[10px] font-semibold text-muted-foreground bg-muted/20 uppercase tracking-wider">
        <div className="col-span-2">Symbol</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-3">EPS Est</div>
        <div className="col-span-3">Revenue Est</div>
        <div className="col-span-2 text-right">Action</div>
      </div>
      {list.map((e: any) => (
        <Link key={e.symbol} href={`/market?symbol=${e.symbol}`}>
          <div className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm border-t border-border/50">
            <div className="col-span-2 font-bold font-mono text-white">{e.symbol}</div>
            <div className="col-span-2 text-xs text-muted-foreground">
              {e.date}
              {e.isEstimate && <span className="ml-1 text-[9px] text-muted-foreground/60">(est)</span>}
            </div>
            <div className="col-span-3 font-mono text-xs text-white">
              {e.epsEstimate != null ? (
                <span>${e.epsEstimate.toFixed(2)} <span className="text-muted-foreground text-[10px]">({e.epsLow?.toFixed(2)}-{e.epsHigh?.toFixed(2)})</span></span>
              ) : <span className="text-muted-foreground">\u2014</span>}
            </div>
            <div className="col-span-3 font-mono text-xs text-white">
              {e.revenueEstimate != null ? (
                <span>{formatCompactNumber(e.revenueEstimate)} <span className="text-muted-foreground text-[10px]">({formatCompactNumber(e.revenueLow)}-{formatCompactNumber(e.revenueHigh)})</span></span>
              ) : <span className="text-muted-foreground">\u2014</span>}
            </div>
            <div className="col-span-2 text-right">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">View</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MoversList() {
  const { data } = useGetQuotes({ symbols: "TSLA,NVDA,AMD,COIN,MARA,PLTR,SMCI" }, { query: { refetchInterval: 10000, queryKey: ["overview-movers"] } });
  
  if (!data?.quotes) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Scanning market...</div>;

  const sorted = [...data.quotes].sort((a, b) => Math.abs(b.changePct || 0) - Math.abs(a.changePct || 0));

  return (
    <>
      <div className="grid grid-cols-5 gap-4 p-3 text-xs font-semibold text-muted-foreground bg-muted/20 uppercase tracking-wider">
        <div className="col-span-1">Symbol</div>
        <div className="col-span-1 text-right">Price</div>
        <div className="col-span-1 text-right">Change</div>
        <div className="col-span-1 text-right">Volume</div>
        <div className="col-span-1 text-right">Mkt Cap</div>
      </div>
      {sorted.map(q => (
        <Link key={q.symbol} href={`/market?symbol=${q.symbol}`}>
          <div className="grid grid-cols-5 gap-4 p-3 items-center hover:bg-muted/50 transition-colors cursor-pointer text-sm border-t border-border/50">
            <div className="col-span-1 font-bold text-white flex items-center gap-2">
              {q.symbol}
            </div>
            <div className="col-span-1 text-right font-mono">{formatCurrency(q.price)}</div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${getBgColorClass(q.changePct)}`}>
                {formatPercent(q.changePct)}
              </span>
            </div>
            <div className="col-span-1 text-right font-mono text-muted-foreground">{formatCompactNumber(q.volume)}</div>
            <div className="col-span-1 text-right font-mono text-muted-foreground">{formatCompactNumber(q.marketCap)}</div>
          </div>
        </Link>
      ))}
    </>
  );
}
