import { useState, useEffect, useCallback } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from "recharts";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

type FundingData = {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  nextFundingTime: string | null;
  openInterest: number;
  rateHistory: { time: string; fundingRate: number }[];
};

type OIPoint = { time: string; oi: number; oiValue: number };
type KlineBar = { time: string; open: number; high: number; low: number; close: number; volume: number };

const PAIRS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","DOGEUSDT","XRPUSDT"];
const PAIR_LABELS: Record<string,string> = {
  BTCUSDT:"BTC", ETHUSDT:"ETH", SOLUSDT:"SOL",
  BNBUSDT:"BNB", DOGEUSDT:"DOGE", XRPUSDT:"XRP",
};

function fmt(n: number, d = 2): string {
  if (!n && n !== 0) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtB(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
function shortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function FundingOI() {
  const [pair, setPair]             = useState("BTCUSDT");
  const [view, setView]             = useState<"combined"|"funding"|"oi">("combined");
  const [funding, setFunding]       = useState<FundingData | null>(null);
  const [oiHistory, setOIHistory]   = useState<OIPoint[]>([]);
  const [klines, setKlines]         = useState<KlineBar[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tickers, setTickers]       = useState<Record<string, { price: number; changePct: number }>>({});

  const fetchAll = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const [fundRes, oiRes, klRes, tickRes] = await Promise.all([
        fetch(`${API_BASE}/crypto/funding/${sym}`),
        fetch(`${API_BASE}/crypto/oi/${sym}?period=1h&limit=48`),
        fetch(`${API_BASE}/crypto/klines/${sym}?interval=1h&limit=48`),
        fetch(`${API_BASE}/crypto/tickers?symbols=${PAIRS.join(",")}`),
      ]);

      if (!fundRes.ok) throw new Error(`Funding API: ${fundRes.status}`);
      const [fundData, oiData, klData, tickData] = await Promise.all([
        fundRes.json(), oiRes.json(), klRes.json(), tickRes.json(),
      ]);

      setFunding(fundData);
      setOIHistory(oiData.history ?? []);
      setKlines(klData.bars ?? []);

      const tickMap: Record<string, { price: number; changePct: number }> = {};
      for (const t of tickData.tickers ?? []) tickMap[t.symbol] = { price: t.price, changePct: t.changePct };
      setTickers(tickMap);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(pair);
    const id = setInterval(() => fetchAll(pair), 30_000);
    return () => clearInterval(id);
  }, [pair]);

  // Merge klines + OI into one chart series
  const combined = klines.map((k, i) => ({
    time:    shortTime(k.time),
    price:   k.close,
    oi:      oiHistory[i]?.oiValue ?? null,
    funding: funding?.rateHistory.slice(-48)[i]?.fundingRate ?? null,
  }));

  const fr    = funding?.fundingRate ?? 0;
  const frPct = (fr * 100).toFixed(4);
  const annualized = (fr * 3 * 365 * 100).toFixed(1);
  const sentiment = fr > 0.02 ? "Extreme Long" : fr > 0.01 ? "Long-Biased" : fr > 0 ? "Slightly Long" : fr < -0.01 ? "Short-Biased" : "Neutral";
  const sentColor  = fr > 0.02 ? "#ff4444" : fr > 0 ? "#00e676" : fr < 0 ? "#ff8c00" : "#ffd600";

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Funding Rate & Open Interest</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Live · Binance Futures</span>
          {loading && <span className="text-[10px] text-[#8892a4] animate-pulse">Fetching…</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {PAIRS.map(p => (
              <button key={p} onClick={() => setPair(p)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${pair === p ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {PAIR_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["combined","funding","oi"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => fetchAll(pair)}
            className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">↺</button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">
          ⚠ {error} — make sure the API Server workflow is running.
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Mark Price",    funding ? `$${fmt(funding.markPrice)}` : "—", "#ffffff"],
          ["Funding Rate",  funding ? `${fr >= 0 ? "+" : ""}${frPct}%` : "—", fr >= 0 ? "#00e676" : "#ff4444"],
          ["Annualized",    funding ? `${fr >= 0 ? "+" : ""}${annualized}%/yr` : "—", fr >= 0 ? "#00e676" : "#ff4444"],
          ["Open Interest", funding ? fmtB(funding.openInterest * funding.markPrice) : "—", "#00d4ff"],
          ["Sentiment",     sentiment, sentColor],
        ].map(([l, v, c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold truncate" style={{ color: c as string }}>{v}</p></div>
        ))}
      </div>

      {/* Pair row */}
      <div className="flex gap-2 px-5 py-2 border-b border-[#1e2433] overflow-x-auto">
        {PAIRS.map(p => {
          const t = tickers[p];
          const up = (t?.changePct ?? 0) >= 0;
          return (
            <button key={p} onClick={() => setPair(p)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${pair === p ? "border-[#00d4ff44] bg-[#00d4ff08]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
              <span className="font-bold text-white">{PAIR_LABELS[p]}</span>
              {t && (
                <>
                  <span className="font-mono text-white">${t.price < 1 ? t.price.toFixed(5) : fmt(t.price)}</span>
                  <span className="font-bold" style={{ color: up ? "#00e676" : "#ff4444" }}>
                    {up ? "+" : ""}{t.changePct.toFixed(2)}%
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-3">
        {(view === "funding" || view === "combined") && combined.length > 0 && (
          <div style={{ flex: 1 }}>
            <p className="text-[10px] text-[#8892a4] mb-1">Funding Rate History (1H)</p>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{ fontSize: 7, fill: "#8892a4" }} interval={7} />
                <YAxis yAxisId="fr" tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `${(v * 100).toFixed(3)}%`} />
                <YAxis yAxisId="price" orientation="right" tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"K" : v.toFixed(0)}`} />
                <ReferenceLine yAxisId="fr" y={0} stroke="#8892a4" strokeWidth={1.5} />
                <ReferenceLine yAxisId="fr" y={0.0001} stroke="#ff444433" strokeDasharray="4 4" label={{ value: "0.01%", fill: "#ff4444", fontSize: 7 }} />
                <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                  formatter={(v: number, name: string) => name === "funding" ? [`${(v * 100).toFixed(4)}%`, "Funding Rate"] : [`$${fmt(v)}`, "Price"]} />
                <Bar yAxisId="fr" dataKey="funding" name="funding"
                  shape={(p: any) => { const { x, y, width, height, value } = p; return <rect x={x} y={value >= 0 ? y : y + height} width={Math.max(width - 1, 1)} height={Math.abs(height)} fill={value >= 0 ? "#00e67666" : "#ff444466"} stroke={value >= 0 ? "#00e676" : "#ff4444"} strokeWidth={1} rx={1} />; }} />
                <Line yAxisId="price" type="monotone" dataKey="price" stroke="#ffffff44" strokeWidth={1} dot={false} name="price" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {(view === "oi" || view === "combined") && combined.length > 0 && (
          <div style={{ flex: 1 }}>
            <p className="text-[10px] text-[#8892a4] mb-1">Open Interest (USD) + Price</p>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{ fontSize: 7, fill: "#8892a4" }} interval={7} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `$${(v / 1e9).toFixed(1)}B`} />
                <YAxis yAxisId="price" orientation="right" tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"K" : v.toFixed(0)}`} />
                <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                  formatter={(v: number, name: string) => name === "oi" ? [fmtB(v), "Open Interest"] : [`$${fmt(v)}`, "Price"]} />
                <defs><linearGradient id="oiG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="oi" fill="url(#oiG)" stroke="#a78bfa" strokeWidth={2} dot={false} name="oi" />
                <Line yAxisId="price" type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} dot={false} name="price" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && combined.length === 0 && !error && (
          <div className="flex-1 flex items-center justify-center text-[#8892a4]">No data returned from Binance API.</div>
        )}
      </div>
    </div>
  );
}
