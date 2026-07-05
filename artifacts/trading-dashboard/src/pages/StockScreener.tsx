import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Download, ArrowUpDown, Filter, ChevronDown, Loader2,
  ArrowUpRight, ArrowDownRight, Star, X, SlidersHorizontal
} from "lucide-react";
import { Link } from "wouter";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercent, formatCompactNumber, getColorClass } from "@/lib/formatters";
import { useWatchlist } from "@/context/WatchlistContext";
import { AppLayout } from "@/components/layout";

interface Stock {
  symbol: string; name: string; exchange: string;
  price: number; change: number; changePct: number;
  volume: number; avgVolume?: number; marketCap?: number; pe?: number;
  beta?: number; dividendYield?: number; sector?: string;
  week52High?: number; week52Low?: number; rsi14?: number;
  high?: number; low?: number; open?: number; prevClose?: number;
}

interface ChartCache { [symbol: string]: { time: string; close: number }[] }

const ALL_SYMBOLS = [
  "AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","JPM","JNJ","V","WMT","UNH","PG","HD","MA",
  "BAC","ABBV","PFE","KO","PEP","AVGO","COST","TMO","MRK","DIS","ABT","ADBE","ACN","CRM","ORCL",
  "XOM","CVX","NKE","TXN","NEE","PM","VZ","RTX","HON","IBM","QCOM","UPS","LOW","LIN","SBUX","MMM",
  "GS","CAT","BA","DE","FDX","GM","F","INTC","AMD","NFLX","PYPL","UBER","LMT","BMY","GILD","C",
  "WFC","USB","PNC","TFC","COF","SCHW","BLK","SPGI","ICE","CME","MCO","AON","MMC","AJG","WLTW",
  "MSCI","NDAQ","FIS","FISV","GPN","EPAY","SQ","PAYX","ADP","TTWO","EA","ATVI","TTD","ROKU","ZM",
  "SNOW","PLTR","CRWD","OKTA","DDOG","NET","FSLY","TWLO","DOCU","SHOP","ETSY","PINS","SNAP",
  "LYFT","DASH","ABNB","GRUB","BKNG","EXPE","MAR","HLT","H","RCL","CCL","NCLH","DAL","UAL",
  "AAL","LUV","JBLU","ALK","TSM","ASML","SONY","TM","BABA","JD","PDD","NIO","LI","XPEV",
];

const PRESETS = [
  { label: "All Stocks", key: "all", filter: () => true },
  { label: "Top Gainers", key: "gainers", filter: (s: Stock) => s.changePct > 2 && s.price > 5 },
  { label: "Top Losers", key: "losers", filter: (s: Stock) => s.changePct < -2 && s.price > 5 },
  { label: "High Volume", key: "volume", filter: (s: Stock) => s.volume > (s.avgVolume ?? 0) * 1.5 },
  { label: "Large Cap", key: "largecap", filter: (s: Stock) => (s.marketCap ?? 0) > 200_000 },
  { label: "Mid Cap", key: "midcap", filter: (s: Stock) => { const mc = s.marketCap ?? 0; return mc > 10_000 && mc <= 200_000; } },
  { label: "Small Cap", key: "smallcap", filter: (s: Stock) => { const mc = s.marketCap ?? 0; return mc > 0 && mc <= 10_000; } },
  { label: "Low P/E", key: "lowpe", filter: (s: Stock) => (s.pe ?? 999) > 0 && (s.pe ?? 999) < 15 },
  { label: "High Dividend", key: "dividend", filter: (s: Stock) => (s.dividendYield ?? 0) > 2 },
  { label: "Oversold (RSI<30)", key: "oversold", filter: (s: Stock) => (s.rsi14 ?? 50) < 30 },
  { label: "Overbought (RSI>70)", key: "overbought", filter: (s: Stock) => (s.rsi14 ?? 50) > 70 },
  { label: "Growth", key: "growth", filter: (s: Stock) => (s.changePct ?? 0) > 5 || (s.pe ?? 0) > 30 },
  { label: "Volatile", key: "volatile", filter: (s: Stock) => Math.abs(s.changePct) > 5 },
  { label: "Tech", key: "tech", filter: (s: Stock) => s.sector === "Technology" },
  { label: "Financials", key: "financials", filter: (s: Stock) => s.sector === "Financials" },
  { label: "Healthcare", key: "healthcare", filter: (s: Stock) => s.sector === "Healthcare" },
  { label: "Energy", key: "energy", filter: (s: Stock) => s.sector === "Energy" },
];

function getSector(symbol: string): string {
  const map: Record<string, string> = {
    AAPL:"Technology", MSFT:"Technology", GOOGL:"Technology", AMZN:"Technology", META:"Technology",
    NVDA:"Technology", AMD:"Technology", INTC:"Technology", CRM:"Technology", ORCL:"Technology",
    ADBE:"Technology", ACN:"Technology", TSM:"Technology", ASML:"Technology", AVGO:"Technology",
    TXN:"Technology", QCOM:"Technology", NFLX:"Technology", ZM:"Technology", SNOW:"Technology",
    PLTR:"Technology", CRWD:"Technology", OKTA:"Technology", DDOG:"Technology", NET:"Technology",
    FSLY:"Technology", TWLO:"Technology", DOCU:"Technology", TTD:"Technology", ROKU:"Technology",
    TSLA:"Consumer Cyclical", F:"Consumer Cyclical", GM:"Consumer Cyclical", NKE:"Consumer Cyclical",
    UBER:"Consumer Cyclical", LYFT:"Consumer Cyclical", DASH:"Consumer Cyclical", ABNB:"Consumer Cyclical",
    BKNG:"Consumer Cyclical", EXPE:"Consumer Cyclical", MAR:"Consumer Cyclical", HLT:"Consumer Cyclical",
    RCL:"Consumer Cyclical", CCL:"Consumer Cyclical", NCLH:"Consumer Cyclical", GRUB:"Consumer Cyclical",
    JPM:"Financials", BAC:"Financials", GS:"Financials", WFC:"Financials", C:"Financials",
    USB:"Financials", PNC:"Financials", TFC:"Financials", COF:"Financials", SCHW:"Financials",
    BLK:"Financials", SPGI:"Financials", ICE:"Financials", CME:"Financials", MCO:"Financials",
    AON:"Financials", MMC:"Financials", AJG:"Financials", MSCI:"Financials", NDAQ:"Financials",
    FIS:"Financials", FISV:"Financials", GPN:"Financials", EPAY:"Financials", SQ:"Financials",
    PAYX:"Financials", ADP:"Financials", V:"Financials", MA:"Financials",
    JNJ:"Healthcare", PFE:"Healthcare", UNH:"Healthcare", ABBV:"Healthcare", MRK:"Healthcare",
    ABT:"Healthcare", BMY:"Healthcare", GILD:"Healthcare", TMO:"Healthcare",
    XOM:"Energy", CVX:"Energy", NEE:"Energy",
    PG:"Consumer Defensive", KO:"Consumer Defensive", WMT:"Consumer Defensive", COST:"Consumer Defensive",
    PEP:"Consumer Defensive", PM:"Consumer Defensive",
    BA:"Industrials", CAT:"Industrials", GE:"Industrials", UPS:"Industrials", HON:"Industrials",
    RTX:"Industrials", IBM:"Industrials", DE:"Industrials", FDX:"Industrials", LMT:"Industrials",
    LOW:"Industrials", LIN:"Industrials", MMM:"Industrials",
    VZ:"Communication", DIS:"Communication",
    BABA:"Consumer Cyclical", JD:"Consumer Cyclical", PDD:"Consumer Cyclical", SONY:"Consumer Cyclical",
    TM:"Consumer Cyclical", NIO:"Consumer Cyclical", LI:"Consumer Cyclical", XPEV:"Consumer Cyclical",
    SBUX:"Consumer Cyclical",
  };
  return map[symbol] || "Other";
}

function MiniSparkline({ data, positive }: { data: { close: number }[]; positive: boolean }) {
  if (!data || data.length < 2) return <div className="w-20 h-8 bg-muted/30 rounded" />;
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="close" stroke={positive ? "#22c55e" : "#ef4444"} fill={positive ? "#22c55e22" : "#ef444422"} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function StockScreener() {
  const { addToActive } = useWatchlist();
  const [q, setQ] = useState("");
  const [preset, setPreset] = useState("all");
  const [sortField, setSortField] = useState<keyof Stock>("changePct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sector, setSector] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPE, setMinPE] = useState("");
  const [maxPE, setMaxPE] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [chartCache, setChartCache] = useState<ChartCache>({});

  const batchSize = 30;
  const [batchPage, setBatchPage] = useState(0);

  const symbolsBatch = useMemo(() => {
    const start = batchPage * batchSize;
    return ALL_SYMBOLS.slice(start, start + batchSize);
  }, [batchPage]);

  const { data: stocks, isLoading } = useQuery<Stock[]>({
    queryKey: ["stock-screener-batch", symbolsBatch.join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/quotes?symbols=${symbolsBatch.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const data = await res.json();
      return (data.quotes || []).map((s: any) => ({
        symbol: s.symbol, name: s.name || s.symbol, exchange: s.exchange || "US",
        price: s.price ?? 0, change: s.change ?? 0, changePct: s.changePct ?? 0,
        volume: s.volume ?? 0, avgVolume: s.avgVolume, marketCap: s.marketCap,
        pe: s.pe, beta: s.beta, dividendYield: s.dividendYield,
        sector: getSector(s.symbol), week52High: s.week52High, week52Low: s.week52Low,
        high: s.high, low: s.low, open: s.open, prevClose: s.prevClose,
      }));
    },
    refetchInterval: 30_000,
    enabled: symbolsBatch.length > 0,
  });

  // Fetch mini chart data for sparklines
  useQuery({
    queryKey: ["stock-screener-charts", symbolsBatch.join(",")],
    queryFn: async () => {
      const newCache: ChartCache = {};
      await Promise.all(symbolsBatch.map(async (sym) => {
        try {
          const res = await fetch(`/api/quotes/chart/${sym}?interval=1d&range=10d`);
          if (!res.ok) return;
          const d = await res.json();
          newCache[sym] = (d.bars || []).map((b: any) => ({ time: b.time, close: b.close }));
        } catch {}
      }));
      setChartCache(prev => ({ ...prev, ...newCache }));
      return newCache;
    },
    enabled: symbolsBatch.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (!stocks) return [];
    let list = [...stocks];

    // Preset filter
    const p = PRESETS.find((pr) => pr.key === preset);
    if (p) list = list.filter(p.filter);

    // Text search
    if (q.trim()) {
      const term = q.toUpperCase();
      list = list.filter((s) => s.symbol.includes(term) || (s.name || "").toUpperCase().includes(term));
    }

    // Sector
    if (sector !== "All") list = list.filter((s) => s.sector === sector);

    // Price range
    if (minPrice) list = list.filter((s) => s.price >= parseFloat(minPrice));
    if (maxPrice) list = list.filter((s) => s.price <= parseFloat(maxPrice));

    // P/E range
    if (minPE) list = list.filter((s) => (s.pe ?? 0) >= parseFloat(minPE));
    if (maxPE) list = list.filter((s) => (s.pe ?? 0) <= parseFloat(maxPE));

    // Sort
    list.sort((a, b) => {
      const va = a[sortField] ?? 0;
      const vb = b[sortField] ?? 0;
      if (typeof va === "string" && typeof vb === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    return list;
  }, [stocks, preset, q, sector, minPrice, maxPrice, minPE, maxPE, sortField, sortDir]);

  const toggleSort = useCallback((field: keyof Stock) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }, [sortField]);

  const exportCSV = useCallback(() => {
    const header = "Symbol,Name,Sector,Exchange,Price,Change,Change%,Volume,MarketCap,PE,Beta,52WHigh,52WLow\n";
    const rows = filtered.map((s) => `${s.symbol},${s.name},${s.sector},${s.exchange},${s.price},${s.change},${s.changePct}%,${s.volume},${s.marketCap ?? ""},${s.pe ?? ""},${s.beta ?? ""},${s.week52High ?? ""},${s.week52Low ?? ""}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-screener-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const sectors = useMemo(() => ["All", ...Array.from(new Set((stocks || []).map((s) => s.sector).filter(Boolean))).sort()], [stocks]);

  return (
    <AppLayout>
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Stock Screener
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time equities screening with {ALL_SYMBOLS.length}+ symbols, technical filters, and live data</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1e2433] hover:bg-[#2a3142] text-xs transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              preset === p.key ? "bg-primary text-white" : "bg-[#1e2433] text-muted-foreground hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search symbol or name..."
            className="w-52 bg-[#1e2433] border border-[#2a3142] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="bg-[#1e2433] border border-[#2a3142] rounded-md px-3 py-2 text-sm focus:outline-none">
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min $" type="number" className="w-20 bg-[#1e2433] border border-[#2a3142] rounded-md px-3 py-2 text-sm focus:outline-none" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max $" type="number" className="w-20 bg-[#1e2433] border border-[#2a3142] rounded-md px-3 py-2 text-sm focus:outline-none" />
        <button onClick={() => setShowFilters(s => !s)} className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-colors ${showFilters ? "bg-primary/20 text-primary" : "bg-[#1e2433] text-muted-foreground hover:text-white"}`}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
        </button>
        <div className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
          <Filter className="w-3 h-3" />
          {filtered.length} of {stocks?.length ?? 0} stocks
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-[#131722] border border-[#2a3142] rounded-lg p-3">
          <span className="text-xs text-muted-foreground">P/E:</span>
          <input value={minPE} onChange={(e) => setMinPE(e.target.value)} placeholder="Min" type="number" className="w-16 bg-[#1e2433] border border-[#2a3142] rounded px-2 py-1 text-xs focus:outline-none" />
          <input value={maxPE} onChange={(e) => setMaxPE(e.target.value)} placeholder="Max" type="number" className="w-16 bg-[#1e2433] border border-[#2a3142] rounded px-2 py-1 text-xs focus:outline-none" />
          <button onClick={() => { setMinPE(""); setMaxPE(""); setMinPrice(""); setMaxPrice(""); setSector("All"); setPreset("all"); setQ(""); }} className="text-xs text-muted-foreground hover:text-white ml-auto flex items-center gap-1">
            <X className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Batch Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={() => setBatchPage(p => Math.max(0, p - 1))} disabled={batchPage === 0} className="px-2 py-1 rounded text-xs bg-[#1e2433] disabled:opacity-30 hover:bg-[#2a3142]">
          Previous Batch
        </button>
        <span className="text-xs text-muted-foreground">
          Batch {batchPage + 1} / {Math.ceil(ALL_SYMBOLS.length / batchSize)} ({symbolsBatch[0]} ... {symbolsBatch[symbolsBatch.length - 1]})
        </span>
        <button onClick={() => setBatchPage(p => Math.min(Math.ceil(ALL_SYMBOLS.length / batchSize) - 1, p + 1))} disabled={batchPage >= Math.ceil(ALL_SYMBOLS.length / batchSize) - 1} className="px-2 py-1 rounded text-xs bg-[#1e2433] disabled:opacity-30 hover:bg-[#2a3142]">
          Next Batch
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e2433] rounded-lg overflow-hidden bg-[#0d1117]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#131722] text-muted-foreground sticky top-0">
              <tr>
                {[
                  { key: "symbol" as const, label: "Symbol", w: "w-20" },
                  { key: "name" as const, label: "Name", w: "w-40" },
                  { key: "sector" as const, label: "Sector", w: "w-28" },
                  { key: "price" as const, label: "Price", w: "w-20", right: true },
                  { key: "changePct" as const, label: "Change", w: "w-24", right: true },
                  { key: "volume" as const, label: "Volume", w: "w-20", right: true },
                  { key: "marketCap" as const, label: "Mkt Cap", w: "w-24", right: true },
                  { key: "pe" as const, label: "P/E", w: "w-16", right: true },
                  { key: "spark" as const, label: "10D Trend", w: "w-24" },
                ].map((col) => (
                  <th key={col.key} onClick={() => col.key !== "name" && col.key !== "spark" && toggleSort(col.key as keyof Stock)}
                    className={`px-3 py-2 text-left font-medium cursor-pointer hover:text-white ${col.right ? "text-right" : ""} ${col.w}`}>
                    <div className={`flex items-center gap-1 ${col.right ? "justify-end" : "justify-start"}`}>
                      {col.label}
                      {sortField === col.key && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading stocks...</td></tr>
              )}
              {!isLoading && filtered.map((s) => (
                <tr key={s.symbol} className="border-t border-[#1e2433] hover:bg-[#131722] transition-colors">
                  <td className="px-3 py-2.5">
                    <Link href={`/market?symbol=${s.symbol}`}>
                      <span className="font-semibold text-primary hover:underline cursor-pointer font-mono">{s.symbol}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[160px]">{s.name}</td>
                  <td className="px-3 py-2.5 text-[10px] text-muted-foreground">{s.sector}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(s.price)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <div className={`flex items-center justify-end gap-1 ${s.changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.changePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{formatCompactNumber(s.volume)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{s.marketCap ? formatCompactNumber(s.marketCap * 1e6) : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{s.pe ? s.pe.toFixed(1) : "—"}</td>
                  <td className="px-3 py-2.5">
                    <MiniSparkline data={chartCache[s.symbol] || []} positive={s.changePct >= 0} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => addToActive(s.symbol, s.name)} className="text-muted-foreground hover:text-primary transition-colors" title="Add to watchlist">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <Link href={`/market?symbol=${s.symbol}`}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground hover:text-white rotate-[-90deg] cursor-pointer" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">No stocks match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
