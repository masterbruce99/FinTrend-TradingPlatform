import { useState } from "react";

type Stock = {
  symbol: string;
  name: string;
  change: number;
  marketCap: number;
};

type Sector = {
  name: string;
  change: number;
  stocks: Stock[];
};

const SECTORS: Sector[] = [
  {
    name: "Technology",
    change: 1.84,
    stocks: [
      { symbol: "AAPL", name: "Apple", change: 1.36, marketCap: 2900 },
      { symbol: "MSFT", name: "Microsoft", change: 2.12, marketCap: 2800 },
      { symbol: "NVDA", name: "Nvidia", change: 4.21, marketCap: 2200 },
      { symbol: "GOOGL", name: "Alphabet", change: 0.87, marketCap: 1900 },
      { symbol: "META", name: "Meta", change: 3.14, marketCap: 1300 },
      { symbol: "AVGO", name: "Broadcom", change: 2.56, marketCap: 820 },
      { symbol: "AMD", name: "AMD", change: -1.23, marketCap: 250 },
      { symbol: "INTC", name: "Intel", change: -3.44, marketCap: 130 },
    ],
  },
  {
    name: "Healthcare",
    change: -0.42,
    stocks: [
      { symbol: "LLY", name: "Eli Lilly", change: 2.34, marketCap: 700 },
      { symbol: "UNH", name: "UnitedHealth", change: -1.89, marketCap: 490 },
      { symbol: "JNJ", name: "J&J", change: -0.56, marketCap: 380 },
      { symbol: "MRK", name: "Merck", change: 0.78, marketCap: 290 },
      { symbol: "ABBV", name: "AbbVie", change: -1.12, marketCap: 310 },
    ],
  },
  {
    name: "Financials",
    change: 0.98,
    stocks: [
      { symbol: "BRK.B", name: "Berkshire", change: 1.24, marketCap: 860 },
      { symbol: "JPM", name: "JP Morgan", change: 2.01, marketCap: 580 },
      { symbol: "V", name: "Visa", change: 1.45, marketCap: 540 },
      { symbol: "MA", name: "Mastercard", change: 1.78, marketCap: 440 },
      { symbol: "BAC", name: "Bank of America", change: 0.67, marketCap: 280 },
    ],
  },
  {
    name: "Consumer Disc.",
    change: -1.23,
    stocks: [
      { symbol: "AMZN", name: "Amazon", change: 0.94, marketCap: 1900 },
      { symbol: "TSLA", name: "Tesla", change: -4.32, marketCap: 590 },
      { symbol: "HD", name: "Home Depot", change: -0.34, marketCap: 340 },
      { symbol: "MCD", name: "McDonald's", change: -0.89, marketCap: 230 },
    ],
  },
  {
    name: "Energy",
    change: -2.14,
    stocks: [
      { symbol: "XOM", name: "ExxonMobil", change: -2.56, marketCap: 480 },
      { symbol: "CVX", name: "Chevron", change: -1.89, marketCap: 270 },
      { symbol: "COP", name: "ConocoPhillips", change: -3.12, marketCap: 120 },
      { symbol: "SLB", name: "Schlumberger", change: -2.78, marketCap: 90 },
    ],
  },
  {
    name: "Utilities",
    change: 0.34,
    stocks: [
      { symbol: "NEE", name: "NextEra", change: 1.23, marketCap: 155 },
      { symbol: "DUK", name: "Duke Energy", change: 0.45, marketCap: 80 },
      { symbol: "SO", name: "Southern Co", change: -0.12, marketCap: 78 },
    ],
  },
];

function changeToColor(change: number): string {
  if (change > 4) return "#00aa55";
  if (change > 2) return "#00cc66";
  if (change > 1) return "#00e676";
  if (change > 0) return "#339955";
  if (change > -1) return "#993333";
  if (change > -2) return "#cc3333";
  if (change > -4) return "#ff4444";
  return "#ff2222";
}

function changeToText(change: number): string {
  if (Math.abs(change) > 1.5) return "#ffffff";
  return "#ffffffcc";
}

export function MarketHeatmap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"sectors" | "sp500">("sectors");
  const [metric, setMetric] = useState<"1D" | "1W" | "1M">("1D");

  const allStocks = SECTORS.flatMap((s) => s.stocks);
  const gainers = [...allStocks].sort((a, b) => b.change - a.change).slice(0, 3);
  const losers = [...allStocks].sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white">Market Heatmap</span>
          <span className="text-xs text-[#8892a4]">S&P 500</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] rounded border border-[#1e2433] overflow-hidden">
            {(["1D", "1W", "1M"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${metric === m ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex bg-[#131722] rounded border border-[#1e2433] overflow-hidden">
            {(["sectors", "sp500"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${viewMode === m ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
              >
                {m === "sp500" ? "S&P 500" : "Sectors"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-0">
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex flex-col gap-3">
            {SECTORS.map((sector) => {
              const sectorColor = changeToColor(sector.change);
              const totalCap = sector.stocks.reduce((s, st) => s + st.marketCap, 0);

              return (
                <div key={sector.name}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#8892a4]">{sector.name}</span>
                    <span className="text-xs" style={{ color: sectorColor }}>
                      {sector.change >= 0 ? "+" : ""}{sector.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sector.stocks.map((stock) => {
                      const size = Math.max(60, (stock.marketCap / 2900) * 200);
                      const bg = changeToColor(stock.change);
                      const textCol = changeToText(stock.change);
                      const isHov = hovered === stock.symbol;

                      return (
                        <div
                          key={stock.symbol}
                          onMouseEnter={() => setHovered(stock.symbol)}
                          onMouseLeave={() => setHovered(null)}
                          className="flex flex-col items-center justify-center rounded cursor-pointer transition-transform"
                          style={{
                            width: size,
                            height: size * 0.65,
                            backgroundColor: bg,
                            border: isHov ? "2px solid white" : "2px solid transparent",
                            transform: isHov ? "scale(1.04)" : "scale(1)",
                          }}
                        >
                          <span className="font-bold text-center leading-tight" style={{ color: textCol, fontSize: Math.max(9, size * 0.11) }}>
                            {stock.symbol}
                          </span>
                          <span className="font-semibold" style={{ color: textCol, fontSize: Math.max(8, size * 0.09) }}>
                            {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Top Gainers</p>
            {gainers.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between py-1.5 border-b border-[#1e2433]">
                <div>
                  <div className="text-xs font-bold text-white">{s.symbol}</div>
                  <div className="text-[10px] text-[#8892a4]">{s.name}</div>
                </div>
                <span className="text-xs font-bold text-[#00e676]">+{s.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Top Losers</p>
            {losers.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between py-1.5 border-b border-[#1e2433]">
                <div>
                  <div className="text-xs font-bold text-white">{s.symbol}</div>
                  <div className="text-[10px] text-[#8892a4]">{s.name}</div>
                </div>
                <span className="text-xs font-bold text-[#ff4444]">{s.change.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Legend</p>
            <div className="flex items-center gap-1">
              {[-4, -2, -1, 0, 1, 2, 4].map((v) => (
                <div key={v} className="flex-1 h-4 rounded-sm" style={{ backgroundColor: changeToColor(v) }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[#8892a4] mt-1">
              <span>-4%</span>
              <span>0</span>
              <span>+4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
