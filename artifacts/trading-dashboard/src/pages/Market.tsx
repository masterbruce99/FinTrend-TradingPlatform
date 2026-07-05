import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useGetQuotes, useGetChart, useGetFinancialSummary } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Search, Info, TrendingUp, DollarSign, BarChart3, Layers, GitCompare, X, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent, formatCompactNumber, formatNumber, getBgColorClass, getColorClass } from "@/lib/formatters";
import TradingChart, { IndicatorsPanel, ALL_INDICATORS, type IndicatorKey, type IndicatorToggles } from "@/components/TradingChart";
import { useChartContextMenu, ChartContextMenu } from "@/components/ChartContextMenu";
import TechnicalSummary from "@/components/TechnicalSummary";

const BASE = import.meta.env.VITE_API_URL || "";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

function useSymbolSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["symbol-search", query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const res = await fetch(`${BASE}api/quotes/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    },
    enabled: query.length >= 1,
    staleTime: 1000 * 60 * 5,
  });
}

export default function Market() {
  const [loc, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSymbol = searchParams.get("symbol") || "AAPL";

  const [symbolInput, setSymbolInput] = useState(initialSymbol);
  const [symbol, setSymbol] = useState(initialSymbol.toUpperCase());
  const [interval, setInterval] = useState("15m");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorToggles>({ volume: true });
  const [showIndPanel, setShowIndPanel] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareActive, setCompareActive] = useState(false);
  const { menu, onContextMenu, close, analyze } = useChartContextMenu(symbol);
  const { data: searchResults } = useSymbolSearch(searchQuery);
  const { data: quoteData } = useGetQuotes({ symbols: symbol }, { query: { refetchInterval: 15000, queryKey: ["market-quote", symbol] } });
  const { data: chartData, isLoading: chartLoading } = useGetChart(symbol, { interval, range: "5d" }, { query: { enabled: !!symbol, queryKey: ["market-chart", symbol, interval] } });
  const { data: compareChartData } = useGetChart(compareSymbol, { interval, range: "5d" }, { query: { enabled: compareActive && !!compareSymbol, queryKey: ["market-chart-compare", compareSymbol, interval] } });
  const { data: finData } = useGetFinancialSummary(symbol, { query: { enabled: !!symbol, queryKey: ["market-fin", symbol] } });
  const { data: analystData } = useQuery({
    queryKey: ["analyst", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/analyst/${symbol}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 1000 * 60 * 10,
  });

  const quote = quoteData?.quotes?.[0];
  const stats = (finData?.keyStatistics ?? {}) as Record<string, number | null>;
  const findata = (finData?.financialData ?? {}) as Record<string, number | null>;

  const chartBars = useMemo(() => (chartData?.bars ?? []) as any, [chartData]);

  const isUp = (quote?.changePct ?? 0) >= 0;

  const handleSelect = useCallback((sym: string) => {
    setSymbol(sym.toUpperCase());
    setSymbolInput(sym.toUpperCase());
    setSearchOpen(false);
    setSearchQuery("");
    setLocation(`/market?symbol=${sym.toUpperCase()}`);
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) handleSelect(symbolInput.trim());
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header Strip */}
        <div className="flex-none p-4 border-b bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex max-w-md w-full" ref={searchRef}>
            <form onSubmit={handleSubmit} className="relative flex w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                value={symbolInput}
                onChange={(e) => {
                  setSymbolInput(e.target.value);
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search symbol (e.g. TSLA)"
                className="pl-9 font-mono uppercase bg-background border-border focus-visible:ring-primary relative z-10"
              />
              <Button type="submit" variant="secondary" className="ml-2">Load</Button>
            </form>

            {/* Search Dropdown */}
            {searchOpen && searchQuery.length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      onClick={() => handleSelect(r.symbol)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between gap-3 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <div className="font-bold text-sm text-white font-mono">{r.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{r.name}</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider border border-border px-1.5 py-0.5 rounded">
                        {r.exchange}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-muted-foreground">No results found</div>
                )}
              </div>
            )}
          </div>

          {quote && (
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm font-bold text-muted-foreground">{quote.name || quote.symbol}</div>
                <div className="text-2xl font-mono font-bold text-white flex items-center gap-3">
                  {formatCurrency(quote.price)}
                  <span className={`text-lg px-2 py-0.5 rounded ${getBgColorClass(quote.changePct)}`}>
                    {formatPercent(quote.changePct)}
                  </span>
                </div>
                {/* Pre/Post Market */}
                <div className="flex items-center gap-3 mt-1">
                  {(quote as any).preMarketPrice != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Pre: <span className={getColorClass((quote as any).preMarketChangePct)}>{formatCurrency((quote as any).preMarketPrice)} ({(quote as any).preMarketChangePct >= 0 ? "+" : ""}{(quote as any).preMarketChangePct?.toFixed(2)}%)</span>
                    </span>
                  )}
                  {(quote as any).postMarketPrice != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Post: <span className={getColorClass((quote as any).postMarketChangePct)}>{formatCurrency((quote as any).postMarketPrice)} ({(quote as any).postMarketChangePct >= 0 ? "+" : ""}{(quote as any).postMarketChangePct?.toFixed(2)}%)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            {/* Interval + Indicators bar */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                {["1m", "5m", "15m", "30m", "60m", "1d"].map((iv) => (
                  <button
                    key={iv}
                    onClick={() => setInterval(iv)}
                    className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-colors ${interval === iv ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {iv}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {/* Compare toggle */}
                <div className="flex items-center gap-1">
                  {compareActive ? (
                    <>
                      <input
                        value={compareSymbol}
                        onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
                        placeholder="Compare symbol"
                        className="w-28 text-xs bg-background border border-border rounded px-2 py-1 font-mono uppercase focus:outline-none focus:border-primary/50"
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                      />
                      <button onClick={() => { setCompareActive(false); setCompareSymbol(""); }} className="text-muted-foreground hover:text-white p-0.5"><X className="w-3 h-3" /></button>
                    </>
                  ) : (
                    <button onClick={() => { setCompareActive(true); setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder="Compare symbol"]')?.focus(), 100); }} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-white hover:bg-muted transition-colors flex items-center gap-1">
                      <GitCompare className="w-3 h-3" /> Compare
                    </button>
                  )}
                </div>
                <button onClick={() => setShowIndPanel(s => !s)} className={`text-xs px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${showIndPanel ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-muted border border-transparent"}`}>
                  <TrendingUp size={13} /> Indicators
                  {Object.values(activeIndicators).filter(Boolean).length > 1 && (
                    <span className="ml-1 text-[10px] bg-primary/30 px-1.5 rounded-full">{Object.values(activeIndicators).filter(Boolean).length}</span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Chart */}
              <div className="flex-1 overflow-auto">
                {chartLoading && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-muted-foreground text-sm font-mono animate-pulse">Loading Chart Data...</div>
                  </div>
                )}
                {!chartLoading && chartBars.length === 0 && (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No chart data available for {symbol} at {interval}</div>
                )}
                {chartBars.length > 0 && (
                  <div onContextMenu={onContextMenu}>
                    <TradingChart bars={chartBars} active={activeIndicators} height={420} compareBars={compareActive ? ((compareChartData?.bars || []) as import("@/components/TradingChart").ChartBar[]) : undefined} />
                  </div>
                )}
              </div>

              {/* Indicators Panel */}
              {showIndPanel && (
                <div className="w-64 border-l border-border bg-card overflow-y-auto flex-shrink-0">
                  <IndicatorsPanel
                    active={activeIndicators}
                    onToggle={(key) => setActiveIndicators(prev => ({ ...prev, [key]: !prev[key] }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="w-full lg:w-80 bg-card overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-white">
                <Info className="w-4 h-4 text-primary" /> Key Statistics
              </h3>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 border-b">
              <StatBox label="Previous Close" value={formatCurrency(quote?.prevClose)} />
              <StatBox label="Open" value={formatCurrency(quote?.open)} />
              <StatBox label="Day High" value={formatCurrency(quote?.high)} />
              <StatBox label="Day Low" value={formatCurrency(quote?.low)} />
              <StatBox label="52W High" value={formatCurrency(quote?.week52High)} />
              <StatBox label="52W Low" value={formatCurrency(quote?.week52Low)} />
              <StatBox label="Volume" value={formatCompactNumber(quote?.volume)} />
              <StatBox label="Avg Vol" value={formatCompactNumber(quote?.avgVolume)} />
              <StatBox label="Market Cap" value={formatCompactNumber(quote?.marketCap)} />
              <StatBox label="P/E Ratio" value={formatNumber(quote?.pe)} />
            </div>

            {/* Analyst Recommendations */}
            {analystData && (
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-white mb-3">
                  <ThumbsUp className="w-4 h-4 text-primary" /> Analyst Rating
                </h3>
                <div className="flex items-center gap-1 h-5 mb-2">
                  {analystData.strongBuy > 0 && (
                    <div className="h-full bg-emerald-500/80 rounded-sm" style={{ width: `${(analystData.strongBuy / analystData.total) * 100}%` }} title={`Strong Buy ${analystData.strongBuy}`} />
                  )}
                  {analystData.buy > 0 && (
                    <div className="h-full bg-emerald-400/60 rounded-sm" style={{ width: `${(analystData.buy / analystData.total) * 100}%` }} title={`Buy ${analystData.buy}`} />
                  )}
                  {analystData.hold > 0 && (
                    <div className="h-full bg-yellow-500/60 rounded-sm" style={{ width: `${(analystData.hold / analystData.total) * 100}%` }} title={`Hold ${analystData.hold}`} />
                  )}
                  {analystData.sell > 0 && (
                    <div className="h-full bg-red-400/60 rounded-sm" style={{ width: `${(analystData.sell / analystData.total) * 100}%` }} title={`Sell ${analystData.sell}`} />
                  )}
                  {analystData.strongSell > 0 && (
                    <div className="h-full bg-red-600/80 rounded-sm" style={{ width: `${(analystData.strongSell / analystData.total) * 100}%` }} title={`Strong Sell ${analystData.strongSell}`} />
                  )}
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground flex-wrap">
                  {analystData.strongBuy > 0 && <span className="text-emerald-400">Strong Buy {analystData.strongBuy}</span>}
                  {analystData.buy > 0 && <span className="text-emerald-300">Buy {analystData.buy}</span>}
                  {analystData.hold > 0 && <span className="text-yellow-400">Hold {analystData.hold}</span>}
                  {analystData.sell > 0 && <span className="text-red-400">Sell {analystData.sell}</span>}
                  {analystData.strongSell > 0 && <span className="text-red-500">Strong Sell {analystData.strongSell}</span>}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground text-right">{analystData.total} analysts</div>
              </div>
            )}

            {/* Technical Analysis Summary */}
            <TechnicalSummary bars={chartBars} />

            <div className="p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-white mb-4">
                <DollarSign className="w-4 h-4 text-primary" /> Financials Summary
              </h3>
              {finData ? (
                <div className="space-y-3">
                  <FinRow label="Profit Margin" value={formatPercent((findata.profitMargins ?? 0) * 100)} />
                  <FinRow label="Operating Margin" value={formatPercent((findata.operatingMargins ?? 0) * 100)} />
                  <FinRow label="Return on Equity" value={formatPercent((findata.returnOnEquity ?? 0) * 100)} />
                  <FinRow label="Revenue Growth" value={formatPercent((findata.revenueGrowth ?? 0) * 100)} />
                  <FinRow label="Forward P/E" value={stats.forwardPE != null ? stats.forwardPE.toFixed(2) : "\u2014"} />
                  <FinRow label="Beta" value={stats.beta != null ? stats.beta.toFixed(2) : "\u2014"} />
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center p-4">Financial data not available</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChartContextMenu state={menu} onClose={close} onAnalyze={analyze} />
    </AppLayout>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-medium text-white">{value}</span>
    </div>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-white">{value}</span>
    </div>
  );
}
