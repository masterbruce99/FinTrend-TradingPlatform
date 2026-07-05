import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;
const TICK  = { fontSize: 9, fill: "#8892a4" };
const STYLE = { backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 };

const PAIRS = [
  { symbol:"BTCUSDT", name:"Bitcoin",  color:"#f7931a" },
  { symbol:"ETHUSDT", name:"Ethereum", color:"#627eea" },
  { symbol:"SOLUSDT", name:"Solana",   color:"#9945ff" },
  { symbol:"BNBUSDT", name:"BNB",      color:"#ffd600" },
  { symbol:"XRPUSDT", name:"XRP",      color:"#00aae4" },
  { symbol:"DOGEUSDT",name:"Dogecoin", color:"#c2a633" },
  { symbol:"ADAUSDT", name:"Cardano",  color:"#0033ad" },
  { symbol:"AVAXUSDT",name:"Avalanche",color:"#e84142" },
];

function fmt(n:number, d=2) { return n.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}); }
function fmtB(n:number) {
  if(n>=1e12) return `$${(n/1e12).toFixed(2)}T`;
  if(n>=1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if(n>=1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${fmt(n)}`;
}

export function CryptoDashboard() {
  const [tickers, setTickers]     = useState<Record<string,any>>({});
  const [selected, setSelected]   = useState("BTCUSDT");
  const [klines, setKlines]       = useState<any[]>([]);
  const [funding, setFunding]     = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [interval, setIntervalState] = useState("1h");

  const fetchTickers = useCallback(async () => {
    const res = await fetch(`${API_BASE}/crypto/tickers?symbols=${PAIRS.map(p=>p.symbol).join(",")}`);
    if (!res.ok) throw new Error(`Tickers ${res.status}`);
    const data = await res.json();
    const map: Record<string,any> = {};
    for (const t of data.tickers ?? []) map[t.symbol] = t;
    return map;
  }, []);

  const fetchKlines = useCallback(async (sym: string, iv: string) => {
    const res = await fetch(`${API_BASE}/crypto/klines/${sym}?interval=${iv}&limit=80`);
    if (!res.ok) throw new Error(`Klines ${res.status}`);
    const data = await res.json();
    return data.bars ?? [];
  }, []);

  const fetchFunding = useCallback(async (sym: string) => {
    const res = await fetch(`${API_BASE}/crypto/funding/${sym}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  const loadAll = useCallback(async (sym: string, iv: string) => {
    try {
      setError(null);
      const [tick, kl, fund] = await Promise.all([
        fetchTickers(), fetchKlines(sym, iv), fetchFunding(sym)
      ]);
      setTickers(tick);
      setKlines(kl);
      setFunding(fund);
      setLastUpdated(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll(selected, interval);
    const id = setInterval(() => loadAll(selected, interval), 30_000);
    return () => clearInterval(id);
  }, [selected, interval]);

  const pair    = PAIRS.find(p => p.symbol === selected)!;
  const ticker  = tickers[selected];
  const up      = (ticker?.changePct ?? 0) >= 0;
  const price   = ticker?.price ?? 0;
  const fr      = funding?.fundingRate ?? 0;
  const chartColor = pair?.color ?? "#00d4ff";

  const chartData = klines.map(k => ({
    time:  new Date(k.time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}),
    close: k.close, volume: k.volume,
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{fontFamily:"'Inter',sans-serif"}}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Crypto Market Dashboard</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Real-time · Binance</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["15m","1h","4h","1d"].map(iv => (
              <button key={iv} onClick={() => setIntervalState(iv)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${interval===iv?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>{iv}</button>
            ))}
          </div>
          <button onClick={() => loadAll(selected, interval)}
            className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">↺</button>
        </div>
      </div>

      {error && <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">⚠ {error} — API Server may still be starting.</div>}

      {/* Pair selector */}
      <div className="flex gap-1.5 px-5 py-2 border-b border-[#1e2433] overflow-x-auto">
        {PAIRS.map(p => {
          const t = tickers[p.symbol];
          const pUp = (t?.changePct ?? 0) >= 0;
          return (
            <button key={p.symbol} onClick={() => setSelected(p.symbol)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs transition-all ${selected===p.symbol?"border-[#00d4ff44] bg-[#00d4ff08]":"border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
              <span className="font-bold" style={{color: p.color}}>{p.name.slice(0,3).toUpperCase()}</span>
              {t && (
                <span className="ml-2 font-mono text-white">${price < 1 && p.symbol === selected ? price.toFixed(5) : t.price < 1 ? t.price.toFixed(5) : fmt(t.price, t.price < 10 ? 3 : 2)}</span>
              )}
              {t && <span className="ml-1.5 font-bold text-[10px]" style={{color:pUp?"#00e676":"#ff4444"}}>{pUp?"+":""}{t.changePct.toFixed(2)}%</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main area */}
        <div className="flex-1 flex flex-col p-4 gap-3">
          {/* Selected coin stats */}
          {ticker && (
            <div className="grid grid-cols-5 gap-2">
              {[
                ["Price",      `$${price<1?price.toFixed(5):fmt(price)}`,     "#ffffff"],
                ["24h Change", `${up?"+":""}${ticker.changePct.toFixed(2)}%`, up?"#00e676":"#ff4444"],
                ["24h High",   `$${fmt(ticker.high)}`,                        "#8892a4"],
                ["24h Low",    `$${fmt(ticker.low)}`,                         "#8892a4"],
                ["Funding",    `${fr>=0?"+":""}${(fr*100).toFixed(4)}%`,      fr>=0?"#00e676":"#ff4444"],
              ].map(([l,v,c])=>(
                <div key={l as string} className="bg-[#131722] border border-[#1e2433] rounded-lg px-3 py-2.5 text-center">
                  <p className="text-[9px] text-[#8892a4]">{l}</p>
                  <p className="text-sm font-bold font-mono mt-0.5" style={{color:c as string}}>{v}</p>
                </div>
              ))}
            </div>
          )}

          {/* Price chart */}
          {chartData.length > 0 && (
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex-1">
              <p className="text-[10px] text-[#8892a4] mb-2">{pair?.name} — {interval} Price</p>
              <ResponsiveContainer width="100%" height="70%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                  <XAxis dataKey="time" tick={{...TICK,fontSize:7}} interval={15}/>
                  <YAxis tick={TICK} domain={["auto","auto"]} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(1)}K`:`$${v.toFixed(price<10?2:0)}`}/>
                  <Tooltip contentStyle={STYLE} formatter={(v:number)=>[`$${fmt(v,price<10?4:2)}`,pair?.name]}/>
                  <Area type="monotone" dataKey="close" stroke={chartColor} fill="url(#cg)" strokeWidth={1.5} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-[#8892a4] mt-2 mb-1">Volume</p>
              <ResponsiveContainer width="100%" height="25%">
                <BarChart data={chartData}>
                  <XAxis dataKey="time" tick={false} axisLine={false}/>
                  <YAxis tick={false} axisLine={false}/>
                  <Tooltip contentStyle={STYLE} formatter={(v:number)=>[fmtB(v),"Volume"]}/>
                  <Bar dataKey="volume" fill={`${chartColor}44`} stroke={chartColor} strokeWidth={0.5}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {loading && chartData.length===0 && <div className="flex-1 flex items-center justify-center text-[#8892a4] text-sm animate-pulse">Loading from Binance…</div>}
        </div>

        {/* Sidebar — all pairs */}
        <div className="w-52 border-l border-[#1e2433] overflow-auto">
          <div className="px-3 py-2 border-b border-[#1e2433] text-[10px] font-bold text-[#8892a4]">ALL PAIRS</div>
          {PAIRS.map(p => {
            const t = tickers[p.symbol];
            const pUp = (t?.changePct ?? 0) >= 0;
            return (
              <button key={p.symbol} onClick={() => setSelected(p.symbol)}
                className={`w-full text-left px-3 py-2.5 border-b border-[#1e2433] transition-colors hover:bg-[#0f1320] ${selected===p.symbol?"bg-[#131722]":""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{color:p.color}}>{p.name}</span>
                  <span className="text-[9px] font-bold" style={{color:pUp?"#00e676":"#ff4444"}}>{pUp?"+":""}{t?.changePct?.toFixed(2)??"…"}%</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-[#8892a4]">{p.symbol.replace("USDT","")}/USDT</span>
                  <span className="text-[9px] font-mono text-white">{t ? `$${t.price<1?t.price.toFixed(5):fmt(t.price,t.price<10?3:2)}` : "…"}</span>
                </div>
              </button>
            );
          })}
          <div className="px-3 py-2 text-[8px] text-[#4a5568] text-center">Real-time · Binance Futures</div>
        </div>
      </div>
    </div>
  );
}
