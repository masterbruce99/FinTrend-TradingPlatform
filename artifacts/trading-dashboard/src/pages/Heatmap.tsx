import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
// uses /api/ paths directly
import { Loader2, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface HeatData {
  symbol: string;
  name: string;
  changePct: number;
  sector: string;
  marketCap?: number;
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#3b82f6",
  Financials: "#10b981",
  Healthcare: "#f59e0b",
  Energy: "#ef4444",
  "Consumer Cyclical": "#8b5cf6",
  "Consumer Defensive": "#ec4899",
  Industrials: "#14b8a6",
  Communication: "#6366f1",
  Other: "#787B86",
};

const HEAT_SYMBOLS = [
  "AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","JPM","JNJ","V","WMT","UNH","PG","HD","MA",
  "BAC","ABBV","PFE","KO","PEP","AVGO","COST","TMO","MRK","DIS","ABT","ADBE","ACN","CRM","ORCL",
  "XOM","CVX","NKE","TXN","NEE","PM","VZ","RTX","HON","IBM","QCOM","UPS","LOW","LIN","SBUX","MMM",
  "GS","CAT","BA","DE","FDX","GM","F","INTC","AMD","NFLX","PYPL","UBER","LMT","BMY","GILD","C",
  "WFC","USB","PNC","TFC","COF","SCHW","BLK","SPGI","ICE","CME","MCO","AON","MMC","AJG",
  "PINS","SNAP","LYFT","DASH","ABNB","UBER","GRUB","BKNG","EXPE","MAR","HLT","H","RCL","CCL","NCLH",
  "DAL","UAL","AAL","LUV","JBLU","ALK",
];

const SECTOR_MAP: Record<string, string> = {
  AAPL:"Technology",MSFT:"Technology",GOOGL:"Technology",AMZN:"Technology",META:"Technology",NVDA:"Technology",AMD:"Technology",INTC:"Technology",CRM:"Technology",ORCL:"Technology",ADBE:"Technology",TXN:"Technology",QCOM:"Technology",IBM:"Technology",
  TSLA:"Consumer Cyclical",F:"Consumer Cyclical",GM:"Consumer Cyclical",NKE:"Consumer Cyclical",
  JPM:"Financials",BAC:"Financials",GS:"Financials",WFC:"Financials",C:"Financials",USB:"Financials",PNC:"Financials",TFC:"Financials",COF:"Financials",SCHW:"Financials",BLK:"Financials",SPGI:"Financials",ICE:"Financials",CME:"Financials",MCO:"Financials",AON:"Financials",MMC:"Financials",AJG:"Financials",
  JNJ:"Healthcare",PFE:"Healthcare",UNH:"Healthcare",ABBV:"Healthcare",MRK:"Healthcare",ABT:"Healthcare",TMO:"Healthcare",BMY:"Healthcare",GILD:"Healthcare",
  XOM:"Energy",CVX:"Energy",
  PG:"Consumer Defensive",KO:"Consumer Defensive",WMT:"Consumer Defensive",COST:"Consumer Defensive",PEP:"Consumer Defensive",PM:"Consumer Defensive",SBUX:"Consumer Defensive",
  BA:"Industrials",CAT:"Industrials",HON:"Industrials",UPS:"Industrials",DE:"Industrials",FDX:"Industrials",RTX:"Industrials",LMT:"Industrials",MMM:"Industrials",LIN:"Industrials",
  VZ:"Communication",DIS:"Communication",
  V:"Financials",MA:"Financials",AVGO:"Technology",PYPL:"Financials",
  NFLX:"Communication",PINS:"Communication",SNAP:"Communication",
  UBER:"Technology",LYFT:"Technology",DASH:"Technology",ABNB:"Technology",GRUB:"Technology",
  BKNG:"Consumer Cyclical",EXPE:"Consumer Cyclical",MAR:"Consumer Cyclical",HLT:"Consumer Cyclical",H:"Consumer Cyclical",RCL:"Consumer Cyclical",CCL:"Consumer Cyclical",NCLH:"Consumer Cyclical",
  DAL:"Industrials",UAL:"Industrials",AAL:"Industrials",LUV:"Industrials",JBLU:"Industrials",ALK:"Industrials",
};

function heatColor(pct: number): string {
  // Intensity based on absolute change %
  const intensity = Math.min(Math.abs(pct) / 5, 1);
  if (pct >= 0) {
    const r = Math.round(11 + (38 - 11) * intensity);
    const g = Math.round(14 + (166 - 14) * intensity);
    const b = Math.round(20 + (154 - 20) * intensity);
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round(11 + (239 - 11) * intensity);
    const g = Math.round(14 + (83 - 14) * intensity);
    const b = Math.round(20 + (80 - 20) * intensity);
    return `rgb(${r},${g},${b})`;
  }
}

export default function Heatmap() {
  const [groupBy, setGroupBy] = useState<"sector" | "change">("sector");

  const { data: stocks, isLoading } = useQuery<HeatData[]>({
    queryKey: ["heatmap-batch", HEAT_SYMBOLS.slice(0, 30).join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/batch?symbols=${HEAT_SYMBOLS.slice(0, 30).join(",")}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return (data.quotes || []).map((s: any) => ({
        symbol: s.symbol,
        name: s.name || s.symbol,
        changePct: s.changePct ?? 0,
        sector: SECTOR_MAP[s.symbol] || "Other",
        marketCap: s.marketCap,
      }));
    },
    refetchInterval: 30_000,
  });

  const grouped = useMemo(() => {
    if (!stocks) return {};
    if (groupBy === "sector") {
      const g: Record<string, HeatData[]> = {};
      for (const s of stocks) {
        (g[s.sector] ||= []).push(s);
      }
      return g;
    }
    const g: Record<string, HeatData[]> = {};
    for (const s of stocks) {
      const bucket = s.changePct >= 2 ? "Strong Up" : s.changePct >= 0 ? "Up" : s.changePct > -2 ? "Down" : "Strong Down";
      (g[bucket] ||= []).push(s);
    }
    return g;
  }, [stocks, groupBy]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Market Heatmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time S&P 500 sector performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupBy("sector")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${groupBy === "sector" ? "bg-primary text-white" : "bg-[#1e2433] text-muted-foreground"}`}
          >
            By Sector
          </button>
          <button
            onClick={() => setGroupBy("change")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${groupBy === "change" ? "bg-primary text-white" : "bg-[#1e2433] text-muted-foreground"}`}
          >
            By Performance
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading market data...
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SECTOR_COLORS[group] || "#787B86" }} />
                <span className="text-sm font-semibold">{group}</span>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
                {items.sort((a, b) => b.changePct - a.changePct).map((s) => (
                  <Link key={s.symbol} href={`/market?symbol=${s.symbol}`}>
                    <div
                      className="rounded p-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:ring-2 hover:ring-white/20 transition-all"
                      style={{ background: heatColor(s.changePct) }}
                    >
                      <span className="text-[11px] font-bold text-white drop-shadow">{s.symbol}</span>
                      <span className="text-[10px] text-white/90 font-mono">
                        {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <span>Strong Down</span>
        <div className="flex gap-0.5">
          {[-5,-4,-3,-2,-1,0,1,2,3,4,5].map(p => (
            <div key={p} className="w-5 h-3 rounded-sm" style={{ background: heatColor(p) }} />
          ))}
        </div>
        <span>Strong Up</span>
      </div>
    </div>
  );
}
