import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, ArrowUpDown, ArrowUpRight, ArrowDownRight, Globe, Loader2 } from "lucide-react";

interface ForexPair {
  symbol: string;
  base: string;
  quote: string;
  rate: number;
  change: number;
  changePct: number;
  high24: number;
  low24: number;
}

const FOREX_PAIRS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","USDCAD","NZDUSD","EURGBP",
  "EURJPY","GBPJPY","EURCHF","GBPCHF","AUDJPY","CADJPY","CHFJPY","EURAUD",
  "EURCAD","GBPAUD","GBPCAD","AUDCAD","AUDNZD","NZDJPY","EURNZD","GBPNZD",
];

// Use Yahoo Finance for forex data
async function fetchForexQuotes(symbols: string[]): Promise<ForexPair[]> {
  const pairs: ForexPair[] = [];
  // Batch in groups of 5 to avoid rate limits
  const chunks = [];
  for (let i = 0; i < symbols.length; i += 5) chunks.push(symbols.slice(i, i + 5));

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (sym) => {
      try {
        const yfSym = sym.includes("=") ? sym : `${sym}=X`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=2d`;
        const r = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        });
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        if (!result) return;
        const meta = result.meta;
        const q = result.indicators?.quote?.[0];
        const closes = q?.close?.filter((c: any) => c != null) || [];
        const prev = closes[closes.length - 2] ?? closes[closes.length - 1] ?? meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
        const curr = meta.regularMarketPrice ?? closes[closes.length - 1] ?? prev;
        const change = curr - prev;
        pairs.push({
          symbol: sym,
          base: sym.slice(0, 3),
          quote: sym.slice(3),
          rate: parseFloat(curr.toFixed(5)),
          change: parseFloat(change.toFixed(5)),
          changePct: parseFloat(((change / prev) * 100).toFixed(2)),
          high24: meta.regularMarketDayHigh ?? meta.fiftyTwoWeekHigh ?? curr,
          low24: meta.regularMarketDayLow ?? meta.fiftyTwoWeekLow ?? curr,
        });
      } catch {
        // Skip on error
      }
    }));
  }
  return pairs;
}

export default function Forex() {
  const [q, setQ] = useState("");
  const [sortField, setSortField] = useState<keyof ForexPair>("changePct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: pairs, isLoading } = useQuery<ForexPair[]>({
    queryKey: ["forex-quotes", FOREX_PAIRS.join(",")],
    queryFn: () => fetchForexQuotes(FOREX_PAIRS),
    refetchInterval: 60_000,
  });

  const filtered = useMemo(() => {
    if (!pairs) return [];
    let list = [...pairs];
    if (q.trim()) {
      const term = q.toUpperCase();
      list = list.filter((p) => p.symbol.includes(term) || p.base.includes(term) || p.quote.includes(term));
    }
    list.sort((a, b) => {
      const va = a[sortField] ?? 0;
      const vb = b[sortField] ?? 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [pairs, q, sortField, sortDir]);

  const exportCSV = () => {
    const header = "Symbol,Base,Quote,Rate,Change,Change%,High24h,Low24h\n";
    const rows = filtered.map((p) => `${p.symbol},${p.base},${p.quote},${p.rate},${p.change},${p.changePct}%,${p.high24},${p.low24}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forex-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: keyof ForexPair) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Forex Rates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live currency pairs from global FX markets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1e2433] hover:bg-[#2a3142] text-xs transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search pair (e.g. EURUSD)..."
            className="w-full bg-[#1e2433] border border-[#2a3142] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} pairs</span>
      </div>

      <div className="border border-[#1e2433] rounded-lg overflow-hidden bg-[#0d1117]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#131722] text-muted-foreground sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Pair</th>
                <th className="px-3 py-2 text-left">Base</th>
                <th className="px-3 py-2 text-left">Quote</th>
                <th className="px-3 py-2 text-right cursor-pointer" onClick={() => toggleSort("rate")}>
                  <div className="flex items-center gap-1 justify-end">Rate {sortField === "rate" && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-3 py-2 text-right cursor-pointer" onClick={() => toggleSort("change")}>
                  <div className="flex items-center gap-1 justify-end">Change {sortField === "change" && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-3 py-2 text-right cursor-pointer" onClick={() => toggleSort("changePct")}>
                  <div className="flex items-center gap-1 justify-end">% {sortField === "changePct" && <ArrowUpDown className="w-3 h-3" />}</div>
                </th>
                <th className="px-3 py-2 text-right">24h High</th>
                <th className="px-3 py-2 text-right">24h Low</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading forex data...</td></tr>
              )}
              {!isLoading && filtered.map((p) => (
                <tr key={p.symbol} className="border-t border-[#1e2433] hover:bg-[#131722]">
                  <td className="px-3 py-2.5 font-semibold">{p.symbol}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.base}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.quote}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{p.rate.toFixed(5)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono ${p.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    <div className="flex items-center justify-end gap-1">
                      {p.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {p.change >= 0 ? "+" : ""}{p.change.toFixed(5)}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${p.changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{p.high24.toFixed(5)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{p.low24.toFixed(5)}</td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No pairs match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
