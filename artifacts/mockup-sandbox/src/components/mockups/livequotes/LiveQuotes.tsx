import { useState, useEffect, useCallback, useRef } from "react";

type Quote = {
  symbol: string; name: string; price: number; change: number; changePct: number;
  volume: number; open: number; high: number; low: number; prevClose: number;
  week52High: number; week52Low: number; marketCap: number; pe: number;
  avgVolume: number; bid: number; ask: number;
};

type Bar = { time: string; open: number; high: number; low: number; close: number; volume: number };

const DEFAULT_SYMBOLS = ["AAPL","NVDA","MSFT","META","AMZN","GOOGL","TSLA","BRK-B","JPM","SPY"];

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

function fmt(n: number | null | undefined, decimals = 2, prefix = "") {
  if (n == null || isNaN(n)) return "—";
  return `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
function fmtCap(n: number) {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
function fmtVol(n: number) {
  if (!n) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
}

function MiniSparkline({ bars }: { bars: Bar[] }) {
  if (!bars.length) return <span className="text-[#8892a4] text-[10px]">—</span>;
  const closes = bars.map(b => b.close).filter(Boolean);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const W = 80; const H = 30;
  const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * W},${H - ((c - min) / range) * H}`).join(" ");
  const isUp = closes[closes.length - 1] >= closes[0];
  return (
    <svg width={W} height={H}>
      <polyline points={pts} fill="none" stroke={isUp ? "#00e676" : "#ff4444"} strokeWidth={1.5} />
    </svg>
  );
}

function PriceBar({ value, low, high }: { value: number; low: number; high: number }) {
  const pct = high > low ? ((value - low) / (high - low)) * 100 : 50;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-[#8892a4] w-10 text-right">${low?.toFixed(0)}</span>
      <div className="flex-1 h-1.5 bg-[#1e2433] rounded-full relative">
        <div className="absolute top-0 h-full w-1.5 rounded-full bg-[#00d4ff]" style={{ left: `calc(${pct}% - 3px)` }} />
      </div>
      <span className="text-[8px] text-[#8892a4] w-10">${high?.toFixed(0)}</span>
    </div>
  );
}

export function LiveQuotes() {
  const [symbols, setSymbols]         = useState(DEFAULT_SYMBOLS);
  const [quotes, setQuotes]           = useState<Quote[]>([]);
  const [sparklines, setSparklines]   = useState<Record<string, Bar[]>>({});
  const [selected, setSelected]       = useState<Quote | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown]     = useState(30);
  const [addInput, setAddInput]       = useState("");
  const [sortKey, setSortKey]         = useState<keyof Quote>("marketCap");
  const [sortDir, setSortDir]         = useState<1 | -1>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(async (syms = symbols) => {
    try {
      const res = await fetch(`${API_BASE}/quotes?symbols=${syms.join(",")}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setQuotes(data.quotes ?? []);
      setLastUpdated(new Date());
      setError(null);
      setCountdown(30);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  const fetchSparkline = useCallback(async (sym: string) => {
    try {
      const res = await fetch(`${API_BASE}/quotes/chart/${sym}?interval=5m&range=1d`);
      if (!res.ok) return;
      const data = await res.json();
      setSparklines(prev => ({ ...prev, [sym]: data.bars ?? [] }));
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchQuotes(symbols);
    symbols.forEach(s => fetchSparkline(s));

    intervalRef.current = setInterval(() => {
      fetchQuotes(symbols);
    }, 30000);

    countRef.current = setInterval(() => {
      setCountdown(c => c <= 1 ? 30 : c - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countRef.current)    clearInterval(countRef.current);
    };
  }, [symbols]);

  const addSymbol = () => {
    const sym = addInput.trim().toUpperCase();
    if (!sym || symbols.includes(sym) || symbols.length >= 20) return;
    const next = [...symbols, sym];
    setSymbols(next);
    fetchSparkline(sym);
    setAddInput("");
  };

  const removeSymbol = (sym: string) => {
    setSymbols(prev => prev.filter(s => s !== sym));
    if (selected?.symbol === sym) setSelected(null);
  };

  const sorted = [...quotes].sort((a, b) => {
    const av = a[sortKey] as number ?? 0;
    const bv = b[sortKey] as number ?? 0;
    return (av - bv) * sortDir;
  });

  const toggleSort = (key: keyof Quote) => {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  };

  const SortTh = ({ col, label }: { col: keyof Quote; label: string }) => (
    <th onClick={() => toggleSort(col)}
      className="text-left py-3 px-3 text-[#8892a4] font-medium cursor-pointer hover:text-white transition-colors select-none">
      <span className="flex items-center gap-1">
        {label}
        {sortKey === col ? <span className="text-[#00d4ff]">{sortDir === -1 ? "↓" : "↑"}</span> : <span className="text-[#1e2433]">↕</span>}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Live Quotes</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#ffd60044] bg-[#ffd60011]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd600]" />
            <span className="text-[10px] font-bold text-[#ffd600]">15-min delayed · Yahoo Finance</span>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-[#8892a4]">
              Updated {lastUpdated.toLocaleTimeString()} · refreshes in {countdown}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input value={addInput} onChange={e => setAddInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSymbol()}
            placeholder="Add symbol…"
            className="bg-[#131722] border border-[#1e2433] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[#00d4ff] w-32 font-mono uppercase placeholder:normal-case placeholder:text-[#8892a4]" />
          <button onClick={addSymbol}
            className="px-3 py-1.5 text-xs font-bold rounded border border-[#00d4ff44] bg-[#00d4ff11] text-[#00d4ff] hover:bg-[#00d4ff22] transition-colors">
            + Add
          </button>
          <button onClick={() => { setLoading(true); fetchQuotes(symbols); }}
            className="px-3 py-1.5 text-xs font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white hover:border-[#8892a4] transition-colors">
            ↺ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-4 py-3 rounded-lg border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">
          ⚠ Could not reach API server — make sure the API Server workflow is running. <span className="text-[#8892a4]">({error})</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Main table */}
        <div className={`flex-1 overflow-auto ${loading ? "opacity-50" : ""} transition-opacity`}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14] z-10 border-b border-[#1e2433]">
              <tr>
                <SortTh col="symbol"    label="Symbol" />
                <SortTh col="price"     label="Price" />
                <SortTh col="change"    label="Change" />
                <SortTh col="changePct" label="% Chg" />
                <th className="text-left py-3 px-3 text-[#8892a4] font-medium">Day Range</th>
                <th className="text-left py-3 px-3 text-[#8892a4] font-medium">Sparkline</th>
                <SortTh col="volume"    label="Volume" />
                <SortTh col="marketCap" label="Mkt Cap" />
                <SortTh col="pe"        label="P/E" />
                <th className="py-3 px-3 text-[#8892a4] font-medium">×</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(q => {
                const up = q.change >= 0;
                const isSelected = selected?.symbol === q.symbol;
                return (
                  <tr key={q.symbol} onClick={() => setSelected(isSelected ? null : q)}
                    className={`border-b border-[#1e2433] cursor-pointer transition-colors ${isSelected ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{q.symbol}</p>
                      <p className="text-[9px] text-[#8892a4] truncate max-w-[100px]">{q.name}</p>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white text-right">{fmt(q.price)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-right" style={{ color: up ? "#00e676" : "#ff4444" }}>
                      {up ? "+" : ""}{fmt(q.change)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${up ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>
                        {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 w-40">
                      <PriceBar value={q.price} low={q.low} high={q.high} />
                    </td>
                    <td className="py-3 px-3">
                      <MiniSparkline bars={sparklines[q.symbol] ?? []} />
                    </td>
                    <td className="py-3 px-3 font-mono text-right text-[#8892a4]">{fmtVol(q.volume)}</td>
                    <td className="py-3 px-3 font-mono text-right text-white">{fmtCap(q.marketCap)}</td>
                    <td className="py-3 px-3 font-mono text-right text-[#8892a4]">{fmt(q.pe, 1)}</td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={e => { e.stopPropagation(); removeSymbol(q.symbol); }}
                        className="text-[#1e2433] hover:text-[#ff4444] transition-colors text-base leading-none">×</button>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && sorted.length === 0 && (
                <tr><td colSpan={10} className="py-12 text-center text-[#8892a4] text-sm">No quotes loaded</td></tr>
              )}
              {loading && sorted.length === 0 && (
                <tr><td colSpan={10} className="py-12 text-center text-[#8892a4] text-sm animate-pulse">Fetching live data from Yahoo Finance…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail sidebar */}
        {selected && (
          <div className="w-64 border-l border-[#1e2433] flex flex-col overflow-auto">
            <div className="p-4 border-b border-[#1e2433]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xl font-bold">{selected.symbol}</p>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selected.change >= 0 ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>
                  {selected.change >= 0 ? "+" : ""}{selected.changePct.toFixed(2)}%
                </span>
              </div>
              <p className="text-2xl font-bold font-mono">${selected.price.toFixed(2)}</p>
              <p className="text-xs text-[#8892a4] mt-0.5">{selected.name}</p>
            </div>
            <div className="p-4 flex flex-col gap-1.5">
              {[
                ["Open",        `$${fmt(selected.open)}`],
                ["Day High",    `$${fmt(selected.high)}`],
                ["Day Low",     `$${fmt(selected.low)}`],
                ["Prev Close",  `$${fmt(selected.prevClose)}`],
                ["Bid / Ask",   `$${fmt(selected.bid)} / $${fmt(selected.ask)}`],
                ["Volume",      fmtVol(selected.volume)],
                ["Avg Volume",  fmtVol(selected.avgVolume)],
                ["Market Cap",  fmtCap(selected.marketCap)],
                ["P/E Ratio",   fmt(selected.pe, 1)],
                ["52W High",    `$${fmt(selected.week52High)}`],
                ["52W Low",     `$${fmt(selected.week52Low)}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs py-1.5 border-b border-[#1e2433]">
                  <span className="text-[#8892a4]">{l}</span>
                  <span className="font-mono font-bold text-white">{v}</span>
                </div>
              ))}
            </div>
            {sparklines[selected.symbol]?.length > 0 && (
              <div className="p-4 border-t border-[#1e2433]">
                <p className="text-[10px] text-[#8892a4] mb-2">Today (5m bars)</p>
                <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">
                  {(() => {
                    const bars = sparklines[selected.symbol];
                    const closes = bars.map(b => b.close).filter(Boolean);
                    const min = Math.min(...closes); const max = Math.max(...closes); const range = max - min || 1;
                    const pts = closes.map((c, i) => `${(i / (closes.length - 1)) * 200},${80 - ((c - min) / range) * 70}`).join(" ");
                    const isUp = closes[closes.length - 1] >= closes[0];
                    return (
                      <>
                        <defs>
                          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isUp ? "#00e676" : "#ff4444"} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={isUp ? "#00e676" : "#ff4444"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <polygon points={`0,80 ${pts} 200,80`} fill="url(#sg)" />
                        <polyline points={pts} fill="none" stroke={isUp ? "#00e676" : "#ff4444"} strokeWidth={1.5} />
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
            <div className="p-4 border-t border-[#1e2433]">
              <p className="text-[9px] text-[#8892a4] text-center leading-relaxed">
                Data provided by Yahoo Finance.<br />15-minute delay. Not for trading.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
