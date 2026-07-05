import { useState, useEffect, useCallback } from "react";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

type Option = {
  strike: number; expiration: string | null; lastPrice: number; bid: number; ask: number;
  change: number; changePct: number; volume: number; openInterest: number;
  impliedVol: number; inTheMoney: boolean;
};

type Chain = {
  symbol: string;
  underlyingPrice: number;
  expirationDates: string[];
  calls: Option[];
  puts: Option[];
};

const TICKERS = ["AAPL","NVDA","TSLA","SPY","QQQ","META","MSFT","AMZN"];

function fmtIV(v: number) { return v ? `${(v * 100).toFixed(1)}%` : "—"; }
function fmtN(v: number, d = 2) {
  if (!v && v !== 0) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtVol(v: number) {
  if (!v) return "—";
  if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v/1e3).toFixed(0)}K`;
  return v.toString();
}

export function OptionsChain() {
  const [ticker, setTicker]           = useState("AAPL");
  const [chain, setChain]             = useState<Chain | null>(null);
  const [expiry, setExpiry]           = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [view, setView]               = useState<"both"|"calls"|"puts">("both");
  const [strikeFilter, setStrikeFilter] = useState<"all"|"itm"|"otm">("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChain = useCallback(async (sym: string, exp?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/finance/options/${sym}${exp ? `?date=${exp}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: Chain = await res.json();
      setChain(data);
      if (!exp && data.expirationDates.length > 0) setExpiry(data.expirationDates[0]);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChain(ticker, null); }, [ticker]);

  const filterOptions = (opts: Option[]) => {
    if (!chain) return opts;
    if (strikeFilter === "itm") return opts.filter(o => o.inTheMoney);
    if (strikeFilter === "otm") return opts.filter(o => !o.inTheMoney);
    return opts;
  };

  const calls = filterOptions(chain?.calls ?? []);
  const puts  = filterOptions(chain?.puts  ?? []);
  const price = chain?.underlyingPrice ?? 0;
  const maxOI = Math.max(...[...calls, ...puts].map(o => o.openInterest ?? 0), 1);

  const colH = (label: string) => (
    <th className="text-right py-2 px-2 text-[10px] text-[#8892a4] font-medium">{label}</th>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Options Chain</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Live · Yahoo Finance</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {TICKERS.map(t => (
              <button key={t} onClick={() => { setTicker(t); setExpiry(null); }}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${ticker === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">
          ⚠ {error} — make sure the API Server workflow is running.
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-[#1e2433] flex-wrap">
        {chain && price > 0 && (
          <span className="text-sm font-bold text-white font-mono">
            ${price.toFixed(2)} <span className="text-[#8892a4] text-xs font-normal">{ticker}</span>
          </span>
        )}
        {chain?.expirationDates && chain.expirationDates.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#8892a4]">Expiry:</span>
            <select value={expiry ?? ""} onChange={e => { setExpiry(e.target.value); fetchChain(ticker, e.target.value); }}
              className="bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#00d4ff]">
              {chain.expirationDates.slice(0, 12).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["both","calls","puts"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{v}</button>
          ))}
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["all","itm","otm"] as const).map(f => (
            <button key={f} onClick={() => setStrikeFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-medium uppercase transition-colors ${strikeFilter === f ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => fetchChain(ticker, expiry)}
          className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors ml-auto">↺ Refresh</button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#8892a4] text-sm animate-pulse">Loading options data…</div>
      )}

      {!loading && !error && chain && (
        <div className="flex-1 overflow-auto">
          <div className={`grid ${view === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
            {/* Calls */}
            {(view === "both" || view === "calls") && (
              <div className={view === "both" ? "border-r border-[#1e2433]" : ""}>
                <div className="sticky top-0 bg-[#0b0e14] z-10 border-b border-[#1e2433] px-3 py-2 bg-[#00e67604]">
                  <span className="text-xs font-bold text-[#00e676]">CALLS — {calls.length} strikes</span>
                </div>
                <table className="w-full text-xs">
                  <thead className="sticky top-8 bg-[#0b0e14] z-10"><tr className="border-b border-[#1e2433]">
                    {colH("Bid")} {colH("Ask")} {colH("Chg")} {colH("IV")} {colH("Vol")}
                    <th className="text-left py-2 px-2 text-[10px] text-[#8892a4] font-medium">OI</th>
                    {colH("Strike")}
                  </tr></thead>
                  <tbody>
                    {calls.slice(0, 40).map(o => (
                      <tr key={o.strike} className={`border-b border-[#1e2433] hover:bg-[#0f1320] ${o.inTheMoney ? "bg-[#00e67604]" : ""}`}>
                        <td className="py-1.5 px-2 text-right font-mono text-[#00e676]">{fmtN(o.bid)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-white">{fmtN(o.ask)}</td>
                        <td className="py-1.5 px-2 text-right font-mono" style={{ color: o.change >= 0 ? "#00e676" : "#ff4444" }}>
                          {o.change >= 0 ? "+" : ""}{fmtN(o.change)}
                        </td>
                        <td className="py-1.5 px-2 text-right text-[#8892a4]">{fmtIV(o.impliedVol)}</td>
                        <td className="py-1.5 px-2 text-right text-[#8892a4]">{fmtVol(o.volume)}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1 bg-[#1e2433] rounded-full overflow-hidden">
                              <div className="h-full bg-[#00e676]" style={{ width: `${Math.min((o.openInterest / maxOI * 100), 100).toFixed(0)}%` }} />
                            </div>
                            <span className="text-[8px] text-[#8892a4]">{fmtVol(o.openInterest)}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold" style={{ color: o.inTheMoney ? "#00e676" : "#8892a4" }}>
                          ${fmtN(o.strike, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Puts */}
            {(view === "both" || view === "puts") && (
              <div>
                <div className="sticky top-0 bg-[#0b0e14] z-10 border-b border-[#1e2433] px-3 py-2 bg-[#ff444404]">
                  <span className="text-xs font-bold text-[#ff4444]">PUTS — {puts.length} strikes</span>
                </div>
                <table className="w-full text-xs">
                  <thead className="sticky top-8 bg-[#0b0e14] z-10"><tr className="border-b border-[#1e2433]">
                    {colH("Strike")} {colH("Bid")} {colH("Ask")} {colH("Chg")} {colH("IV")} {colH("Vol")}
                    <th className="text-left py-2 px-2 text-[10px] text-[#8892a4] font-medium">OI</th>
                    <th className="py-2 px-2 text-[10px] text-[#8892a4] font-medium">ITM?</th>
                  </tr></thead>
                  <tbody>
                    {puts.slice(0, 40).map(o => (
                      <tr key={o.strike} className={`border-b border-[#1e2433] hover:bg-[#0f1320] ${o.inTheMoney ? "bg-[#ff444404]" : ""}`}>
                        <td className="py-1.5 px-2 text-right font-mono font-bold" style={{ color: o.inTheMoney ? "#ff4444" : "#8892a4" }}>
                          ${fmtN(o.strike, 0)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-[#ff4444]">{fmtN(o.bid)}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-white">{fmtN(o.ask)}</td>
                        <td className="py-1.5 px-2 text-right font-mono" style={{ color: o.change >= 0 ? "#00e676" : "#ff4444" }}>
                          {o.change >= 0 ? "+" : ""}{fmtN(o.change)}
                        </td>
                        <td className="py-1.5 px-2 text-right text-[#8892a4]">{fmtIV(o.impliedVol)}</td>
                        <td className="py-1.5 px-2 text-right text-[#8892a4]">{fmtVol(o.volume)}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1 bg-[#1e2433] rounded-full overflow-hidden">
                              <div className="h-full bg-[#ff4444]" style={{ width: `${Math.min((o.openInterest / maxOI * 100), 100).toFixed(0)}%` }} />
                            </div>
                            <span className="text-[8px] text-[#8892a4]">{fmtVol(o.openInterest)}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`font-bold text-[9px] px-1 py-0.5 rounded ${o.inTheMoney ? "bg-[#ff444422] text-[#ff4444]" : "text-[#8892a4]"}`}>
                            {o.inTheMoney ? "ITM" : "OTM"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
