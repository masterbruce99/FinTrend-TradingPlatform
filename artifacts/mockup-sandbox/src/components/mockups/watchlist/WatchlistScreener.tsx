import { useState, useMemo } from "react";

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  mktCap: number;
  pe: number;
  rsi: number;
  macd: "Bull" | "Bear";
  above200ma: boolean;
  sector: string;
};

const STOCKS: Stock[] = [
  { symbol: "NVDA", name: "Nvidia", price: 875.40, change: 4.21, volume: 45.2, mktCap: 2200, pe: 62, rsi: 68, macd: "Bull", above200ma: true, sector: "Tech" },
  { symbol: "META", name: "Meta Platforms", price: 524.30, change: 3.14, volume: 18.7, mktCap: 1300, pe: 28, rsi: 64, macd: "Bull", above200ma: true, sector: "Tech" },
  { symbol: "MSFT", name: "Microsoft", price: 418.90, change: 2.12, volume: 22.1, mktCap: 2800, pe: 35, rsi: 61, macd: "Bull", above200ma: true, sector: "Tech" },
  { symbol: "LLY", name: "Eli Lilly", price: 892.10, change: 2.34, volume: 4.8, mktCap: 700, pe: 88, rsi: 58, macd: "Bull", above200ma: true, sector: "Health" },
  { symbol: "JPM", name: "JP Morgan", price: 201.50, change: 2.01, volume: 11.3, mktCap: 580, pe: 12, rsi: 57, macd: "Bull", above200ma: true, sector: "Finance" },
  { symbol: "AAPL", name: "Apple", price: 241.32, change: 1.36, volume: 58.4, mktCap: 2900, pe: 31, rsi: 55, macd: "Bull", above200ma: true, sector: "Tech" },
  { symbol: "NEE", name: "NextEra Energy", price: 76.40, change: 1.23, volume: 9.2, mktCap: 155, pe: 22, rsi: 52, macd: "Bull", above200ma: true, sector: "Utility" },
  { symbol: "AMZN", name: "Amazon", price: 198.80, change: 0.94, volume: 34.5, mktCap: 1900, pe: 58, rsi: 51, macd: "Bear", above200ma: true, sector: "Consumer" },
  { symbol: "MRK", name: "Merck", price: 134.20, change: 0.78, volume: 6.4, mktCap: 290, pe: 14, rsi: 49, macd: "Bear", above200ma: true, sector: "Health" },
  { symbol: "JNJ", name: "Johnson & Johnson", price: 147.60, change: -0.56, volume: 7.8, mktCap: 380, pe: 16, rsi: 45, macd: "Bear", above200ma: false, sector: "Health" },
  { symbol: "UNH", name: "UnitedHealth", price: 512.40, change: -1.89, volume: 5.1, mktCap: 490, pe: 20, rsi: 38, macd: "Bear", above200ma: false, sector: "Health" },
  { symbol: "TSLA", name: "Tesla", price: 245.10, change: -4.32, volume: 88.4, mktCap: 590, pe: 72, rsi: 32, macd: "Bear", above200ma: false, sector: "Consumer" },
  { symbol: "INTC", name: "Intel", price: 31.20, change: -3.44, volume: 42.6, mktCap: 130, pe: 98, rsi: 28, macd: "Bear", above200ma: false, sector: "Tech" },
  { symbol: "XOM", name: "ExxonMobil", price: 112.30, change: -2.56, volume: 19.8, mktCap: 480, pe: 13, rsi: 33, macd: "Bear", above200ma: false, sector: "Energy" },
  { symbol: "CVX", name: "Chevron", price: 146.80, change: -1.89, volume: 12.4, mktCap: 270, pe: 14, rsi: 36, macd: "Bear", above200ma: false, sector: "Energy" },
];

type SortField = keyof Pick<Stock, "symbol" | "price" | "change" | "volume" | "mktCap" | "pe" | "rsi">;

const COLUMNS: { key: SortField; label: string }[] = [
  { key: "symbol", label: "Symbol" },
  { key: "price", label: "Price" },
  { key: "change", label: "Change" },
  { key: "volume", label: "Vol (M)" },
  { key: "mktCap", label: "Mkt Cap" },
  { key: "pe", label: "P/E" },
  { key: "rsi", label: "RSI" },
];

export function WatchlistScreener() {
  const [sortField, setSortField] = useState<SortField>("change");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [minChange, setMinChange] = useState("-10");
  const [minRsi, setMinRsi] = useState("0");
  const [maxRsi, setMaxRsi] = useState("100");
  const [macdFilter, setMacdFilter] = useState<"all" | "Bull" | "Bear">("all");
  const [above200, setAbove200] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);

  const allSectors = [...new Set(STOCKS.map((s) => s.sector))];

  const toggleSector = (s: string) => {
    setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const filtered = useMemo(() => {
    return STOCKS
      .filter((s) => {
        if (search && !s.symbol.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (s.change < Number(minChange)) return false;
        if (s.rsi < Number(minRsi) || s.rsi > Number(maxRsi)) return false;
        if (macdFilter !== "all" && s.macd !== macdFilter) return false;
        if (above200 && !s.above200ma) return false;
        if (sectors.length > 0 && !sectors.includes(s.sector)) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sortField] as number | string;
        const bv = b[sortField] as number | string;
        const dir = sortDir === "desc" ? -1 : 1;
        return av < bv ? -dir : av > bv ? dir : 0;
      });
  }, [search, minChange, minRsi, maxRsi, macdFilter, above200, sectors, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Watchlist & Screener</span>
          <span className="text-xs text-[#8892a4]">{filtered.length} / {STOCKS.length} stocks</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="bg-[#131722] border border-[#1e2433] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#00d4ff] w-40 transition-colors"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="px-3 py-1.5 rounded text-xs border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">
            Save Screener
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-56 border-r border-[#1e2433] p-4 overflow-y-auto flex flex-col gap-5">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Min Change %</p>
            <input
              type="number"
              className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#00d4ff]"
              value={minChange}
              onChange={(e) => setMinChange(e.target.value)}
            />
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">RSI Range</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-xs text-white outline-none"
                value={minRsi}
                onChange={(e) => setMinRsi(e.target.value)}
              />
              <span className="text-[#8892a4]">–</span>
              <input
                type="number"
                className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-xs text-white outline-none"
                value={maxRsi}
                onChange={(e) => setMaxRsi(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">MACD Signal</p>
            <div className="flex gap-1">
              {(["all", "Bull", "Bear"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMacdFilter(m)}
                  className={`flex-1 py-1.5 rounded text-[10px] capitalize border transition-colors ${macdFilter === m ? "border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] text-[#8892a4]"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${above200 ? "bg-[#00e676]" : "bg-[#1e2433]"}`}
                onClick={() => setAbove200(!above200)}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${above200 ? "right-0.5" : "left-0.5"}`} />
              </div>
              <span className="text-xs text-[#8892a4]">Above 200 MA</span>
            </label>
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Sector</p>
            <div className="flex flex-col gap-1">
              {allSectors.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border transition-colors flex items-center justify-center ${sectors.includes(s) ? "bg-[#00d4ff] border-[#00d4ff]" : "border-[#1e2433]"}`}
                    onClick={() => toggleSector(s)}
                  >
                    {sectors.includes(s) && <span className="text-[#0b0e14] text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="text-xs text-[#8892a4]">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setSearch(""); setMinChange("-10"); setMinRsi("0"); setMaxRsi("100"); setMacdFilter("all"); setAbove200(false); setSectors([]); }}
            className="text-xs text-[#8892a4] hover:text-white underline text-left"
          >
            Clear all filters
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14] z-10">
              <tr className="border-b border-[#1e2433]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left py-3 px-4 text-[#8892a4] font-medium cursor-pointer hover:text-white transition-colors select-none"
                  >
                    {col.label}
                    {sortField === col.key && (
                      <span className="ml-1 text-[#00d4ff]">{sortDir === "desc" ? "↓" : "↑"}</span>
                    )}
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-[#8892a4] font-medium">MACD</th>
                <th className="text-left py-3 px-4 text-[#8892a4] font-medium">200 MA</th>
                <th className="text-left py-3 px-4 text-[#8892a4] font-medium">Sector</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock) => (
                <tr key={stock.symbol} className="border-b border-[#1e2433] hover:bg-[#0f1320] cursor-pointer transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{stock.symbol}</div>
                    <div className="text-[10px] text-[#8892a4] truncate max-w-[100px]">{stock.name}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-white">${stock.price.toFixed(2)}</td>
                  <td className={`py-3 px-4 font-bold font-mono ${stock.change >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                    {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-[#8892a4] font-mono">{stock.volume.toFixed(1)}M</td>
                  <td className="py-3 px-4 text-[#8892a4] font-mono">${(stock.mktCap / 1000).toFixed(1)}T</td>
                  <td className="py-3 px-4 text-[#8892a4] font-mono">{stock.pe}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#1e2433] rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${stock.rsi}%`,
                            backgroundColor: stock.rsi > 70 ? "#ff4444" : stock.rsi < 30 ? "#00d4ff" : "#00e676",
                          }}
                        />
                      </div>
                      <span className={`font-mono ${stock.rsi > 70 ? "text-[#ff4444]" : stock.rsi < 30 ? "text-[#00d4ff]" : "text-[#8892a4]"}`}>
                        {stock.rsi}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        color: stock.macd === "Bull" ? "#00e676" : "#ff4444",
                        backgroundColor: stock.macd === "Bull" ? "#00e67622" : "#ff444422",
                      }}
                    >
                      {stock.macd}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold ${stock.above200ma ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                      {stock.above200ma ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#8892a4]">{stock.sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
