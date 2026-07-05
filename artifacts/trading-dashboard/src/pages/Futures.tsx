import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Clock, Activity } from "lucide-react";
import { formatCurrency, formatPercent, getColorClass, getBgColorClass } from "@/lib/formatters";

interface FutureQuote {
  symbol: string;
  fullSymbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
}

function useFutures() {
  return useQuery<{ quotes: FutureQuote[] }>({
    queryKey: ["futures"],
    queryFn: async () => {
      const res = await fetch("/api/quotes/futures");
      if (!res.ok) throw new Error("Failed to fetch futures");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

function useFutureChart(symbol: string) {
  return useQuery<{ bars: { time: string; close: number }[] }>({
    queryKey: ["future-chart", symbol],
    queryFn: async () => {
      if (!symbol) return { bars: [] };
      const res = await fetch(`/api/quotes/chart/${symbol}?interval=1d&range=5d`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return {
        bars: (data.bars || []).map((b: any) => ({
          time: b.time,
          close: b.close,
        })),
      };
    },
    enabled: !!symbol,
    staleTime: 60_000,
  });
}

const SECTOR_GROUPS: Record<string, string[]> = {
  "Indices": ["ES", "NQ", "YM"],
  "Metals": ["GC", "SI"],
  "Energy": ["CL", "NG"],
  "Rates": ["ZB", "ZN"],
  "Agriculture": ["ZC", "ZW", "ZS"],
  "Softs": ["KC", "CC"],
  "FX": ["DX"],
};

export default function FuturesPage() {
  const { data, isLoading } = useFutures();
  const [selectedGroup, setSelectedGroup] = useState("All");

  const groups = useMemo(() => {
    const all = data?.quotes || [];
    if (selectedGroup === "All") return { All: all };
    const symbols = SECTOR_GROUPS[selectedGroup] || [];
    return { [selectedGroup]: all.filter(q => symbols.includes(q.symbol)) };
  }, [data, selectedGroup]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Futures & Commodities</h1>
            <span className="ml-3 text-xs font-mono text-muted-foreground px-2 py-1 bg-muted rounded">Yahoo Finance Real-Time</span>
          </div>
          <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-md">
            {["All", "Indices", "Metals", "Energy", "Rates", "Agriculture", "Softs", "FX"].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-colors ${
                  selectedGroup === g ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            <Activity className="w-4 h-4 mr-2 animate-spin" /> Loading futures data...
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {Object.entries(groups).flatMap(([, quotes]) =>
                quotes.map(q => <FutureCard key={q.symbol} quote={q} />)
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function FutureCard({ quote }: { quote: FutureQuote }) {
  const { data: chart } = useFutureChart(quote.fullSymbol);
  const isUp = quote.changePct >= 0;
  const chartData = chart?.bars || [];

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold text-sm text-white">{quote.symbol}</div>
          <div className="text-[10px] text-muted-foreground">{quote.name}</div>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getBgColorClass(quote.changePct)}`}>
          {formatPercent(quote.changePct)}
        </span>
      </div>
      <div className="text-2xl font-mono font-bold text-white mb-1">
        {formatCurrency(quote.price)}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
        <span>H: {formatCurrency(quote.high)}</span>
        <span>L: {formatCurrency(quote.low)}</span>
        <span>Vol: {(quote.volume / 1000).toFixed(0)}K</span>
      </div>

      {/* Sparkline */}
      <div className="h-16 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${quote.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? "#26A69A" : "#EF5350"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isUp ? "#26A69A" : "#EF5350"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="close"
                stroke={isUp ? "#26A69A" : "#EF5350"}
                fill={`url(#grad-${quote.symbol})`}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground/30 text-[10px]">Loading chart...</div>
        )}
      </div>
    </div>
  );
}
