import { useState, useEffect, useCallback } from "react";

type NewsItem = {
  id: string;
  headline: string;
  summary: string | null;
  publisher: string;
  url: string | null;
  publishedAt: string | null;
  symbols: string[];
  thumbnail: string | null;
};

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

const WATCHLISTS = {
  "Market":  "SPY,QQQ,DIA,IWM",
  "Tech":    "AAPL,NVDA,MSFT,META,GOOGL,AMZN,TSLA",
  "Finance": "JPM,GS,MS,BAC,WFC",
  "Crypto":  "BTC-USD,ETH-USD,COIN",
  "Energy":  "XOM,CVX,COP,SLB",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function NewsFeed() {
  const [items, setItems]           = useState<NewsItem[]>([]);
  const [selected, setSelected]     = useState<NewsItem | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [watchlist, setWatchlist]   = useState<keyof typeof WATCHLISTS>("Market");
  const [symFilter, setSymFilter]   = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async (syms: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/news?symbols=${encodeURIComponent(syms)}&count=30`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const news: NewsItem[] = data.news ?? [];
      setItems(news);
      if (news.length > 0 && !selected) setSelected(news[0]);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(WATCHLISTS[watchlist]);
    const id = setInterval(() => fetchNews(WATCHLISTS[watchlist]), 120_000);
    return () => clearInterval(id);
  }, [watchlist]);

  const filtered = items.filter(n => {
    if (!symFilter) return true;
    return n.symbols.some(s => s.toUpperCase().includes(symFilter.toUpperCase())) ||
           n.headline.toUpperCase().includes(symFilter.toUpperCase());
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">News Feed</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs text-[#00e676] font-medium">Live · Yahoo Finance</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input value={symFilter} onChange={e => setSymFilter(e.target.value)} placeholder="Filter…"
            className="bg-[#131722] border border-[#1e2433] rounded px-3 py-1 text-xs text-white outline-none focus:border-[#00d4ff] w-24" />
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(Object.keys(WATCHLISTS) as (keyof typeof WATCHLISTS)[]).map(w => (
              <button key={w} onClick={() => setWatchlist(w)}
                className={`px-2.5 py-1.5 text-[10px] font-medium transition-colors ${watchlist === w ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {w}
              </button>
            ))}
          </div>
          <button onClick={() => fetchNews(WATCHLISTS[watchlist])}
            className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">
            ↺
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">
          ⚠ {error} — make sure the API Server workflow is running.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* List */}
        <div className="w-96 border-r border-[#1e2433] overflow-auto">
          {loading && items.length === 0 && (
            <div className="py-12 text-center text-[#8892a4] text-sm animate-pulse">Loading live news…</div>
          )}
          {!loading && filtered.length === 0 && !error && (
            <div className="py-12 text-center text-[#8892a4] text-sm">No stories found.</div>
          )}
          {filtered.map(item => (
            <button key={item.id} onClick={() => setSelected(item)}
              className={`w-full text-left px-4 py-3 border-b border-[#1e2433] transition-colors ${selected?.id === item.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-[9px] font-bold text-[#00d4ff] uppercase tracking-wide">{item.publisher}</span>
                <span className="text-[9px] text-[#8892a4] flex-shrink-0">{timeAgo(item.publishedAt)}</span>
              </div>
              <p className="text-xs font-medium text-white leading-snug line-clamp-3">{item.headline}</p>
              {item.symbols.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {item.symbols.slice(0, 4).map(s => (
                    <span key={s} className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#1e2433] text-[#00d4ff]">{s}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff44]">
                  {selected.publisher}
                </span>
                <span className="text-xs text-[#8892a4]">{timeAgo(selected.publishedAt)}</span>
                {selected.publishedAt && (
                  <span className="text-xs text-[#8892a4]">
                    · {new Date(selected.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-snug mb-3">{selected.headline}</h2>
              {selected.symbols.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {selected.symbols.map(s => (
                    <span key={s} className="text-xs font-bold px-2 py-0.5 rounded bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff44]">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {selected.thumbnail && (
              <img src={selected.thumbnail} alt="" className="w-full max-h-52 object-cover rounded-lg" onError={e => (e.currentTarget.style.display = "none")} />
            )}

            {selected.summary ? (
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-5">
                <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.summary}</p>
              </div>
            ) : (
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-5">
                <p className="text-sm text-[#8892a4] italic">Full article available at publisher's website.</p>
              </div>
            )}

            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00d4ff44] bg-[#00d4ff11] text-[#00d4ff] text-xs font-bold hover:bg-[#00d4ff22] transition-colors w-fit">
                Read full article ↗
              </a>
            )}

            <p className="text-[9px] text-[#4a5568] mt-auto">Source: {selected.publisher} via Yahoo Finance. For informational purposes only.</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8892a4] text-sm">
            Select a story to read
          </div>
        )}
      </div>
    </div>
  );
}
