import { useState, useEffect, useCallback } from "react";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

type NewsItem = {
  id: string; headline: string; summary: string | null; publisher: string;
  url: string | null; publishedAt: string | null; symbols: string[];
  thumbnail: string | null; source: string;
};

const FAANG = [
  { ticker:"AAPL",  name:"Apple",     color:"#a8b3c8" },
  { ticker:"AMZN",  name:"Amazon",    color:"#ff9900" },
  { ticker:"META",  name:"Meta",      color:"#1877f2" },
  { ticker:"GOOGL", name:"Alphabet",  color:"#4285f4" },
  { ticker:"NFLX",  name:"Netflix",   color:"#e50914" },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.round(diff)}s ago`;
  if (diff < 3600)  return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

export function FAANGNews() {
  const [items, setItems]         = useState<NewsItem[]>([]);
  const [selected, setSelected]   = useState<NewsItem | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  const [filter, setFilter]       = useState<string>("ALL");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/macro/faang-news`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const news: NewsItem[] = data.news ?? [];
      setItems(news);
      setDataSource(data.dataSource ?? "");
      if (news.length > 0) setSelected(news[0]);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 120_000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === "ALL"
    ? items
    : items.filter(n => n.symbols.some(s => s.toUpperCase() === filter) || n.headline.toUpperCase().includes(filter));

  const isSeekingAlpha = dataSource.toLowerCase().includes("seeking alpha");

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{fontFamily:"'Inter',sans-serif"}}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">FAANG News</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium" style={{color: isSeekingAlpha?"#ff8c00":"#00e676"}}>
            {isSeekingAlpha ? "Seeking Alpha" : "Yahoo Finance"}
          </span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <button onClick={fetchNews}
          className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">↺ Refresh</button>
      </div>

      {/* Source badge */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018]">
        <span className="text-[9px] text-[#8892a4]">Data source:</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isSeekingAlpha ? "text-[#ff8c00] border-[#ff8c0044] bg-[#ff8c0011]" : "text-[#00d4ff] border-[#00d4ff44] bg-[#00d4ff11]"}`}>
          {dataSource || "…"}
        </span>
        {!isSeekingAlpha && (
          <span className="text-[9px] text-[#8892a4] italic">Seeking Alpha requires auth — using Yahoo Finance for FAANG articles</span>
        )}
      </div>

      {error && <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">⚠ {error} — make sure API Server workflow is running.</div>}

      {/* Filter row */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-[#1e2433]">
        <button onClick={() => setFilter("ALL")}
          className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${filter==="ALL"?"border-[#00d4ff44] bg-[#00d4ff22] text-[#00d4ff]":"border-[#1e2433] text-[#8892a4]"}`}>
          All
        </button>
        {FAANG.map(f => (
          <button key={f.ticker} onClick={() => setFilter(filter===f.ticker?"ALL":f.ticker)}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${filter===f.ticker?"text-white border-transparent":"text-[#8892a4] border-[#1e2433]"}`}
            style={filter===f.ticker?{backgroundColor:`${f.color}33`,borderColor:`${f.color}66`,color:f.color}:{}}>
            {f.ticker}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[#8892a4]">{filtered.length} articles</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* List */}
        <div className="w-96 border-r border-[#1e2433] overflow-auto flex-shrink-0">
          {loading && items.length === 0 && (
            <div className="py-12 text-center text-[#8892a4] text-sm animate-pulse">Loading FAANG news…</div>
          )}
          {!loading && filtered.length === 0 && !error && (
            <div className="py-12 text-center text-[#8892a4] text-sm">No articles for selected filter.</div>
          )}
          {filtered.map(item => {
            const matchedFAANG = FAANG.filter(f => item.symbols.some(s => s.toUpperCase()===f.ticker));
            return (
              <button key={item.id} onClick={() => setSelected(item)}
                className={`w-full text-left px-4 py-3 border-b border-[#1e2433] transition-colors ${selected?.id===item.id?"bg-[#131722]":"hover:bg-[#0f1320]"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.source.includes("Seeking")?"bg-[#ff8c0022] text-[#ff8c00]":"bg-[#00d4ff22] text-[#00d4ff]"}`}>
                      {item.publisher}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#8892a4] flex-shrink-0">{timeAgo(item.publishedAt)}</span>
                </div>
                <p className="text-xs font-medium text-white leading-snug line-clamp-3">{item.headline}</p>
                {matchedFAANG.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {matchedFAANG.map(f => (
                      <span key={f.ticker} className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                        style={{backgroundColor:`${f.color}22`,color:f.color,border:`1px solid ${f.color}44`}}>
                        {f.ticker}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex-1 p-6 overflow-auto flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selected.source.includes("Seeking")?"bg-[#ff8c0022] text-[#ff8c00] border-[#ff8c0044]":"bg-[#00d4ff22] text-[#00d4ff] border-[#00d4ff44]"}`}>
                  {selected.publisher}
                </span>
                <span className="text-xs text-[#8892a4]">{timeAgo(selected.publishedAt)}</span>
                {selected.publishedAt && (
                  <span className="text-xs text-[#8892a4]">
                    · {new Date(selected.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-snug mb-3">{selected.headline}</h2>
              <div className="flex gap-1.5 flex-wrap">
                {FAANG.filter(f => selected.symbols.some(s => s.toUpperCase()===f.ticker)).map(f => (
                  <span key={f.ticker} className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{backgroundColor:`${f.color}22`,color:f.color,border:`1px solid ${f.color}44`}}>
                    {f.ticker} · {f.name}
                  </span>
                ))}
              </div>
            </div>

            {selected.thumbnail && (
              <img src={selected.thumbnail} alt="" className="w-full max-h-52 object-cover rounded-lg"
                onError={e => (e.currentTarget.style.display="none")} />
            )}

            {selected.summary ? (
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-5">
                <p className="text-sm text-[#c8d3e0] leading-relaxed">{selected.summary}</p>
              </div>
            ) : (
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-5 text-sm text-[#8892a4] italic">
                Full article available on {selected.publisher}'s website.
              </div>
            )}

            {selected.url && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00d4ff44] bg-[#00d4ff11] text-[#00d4ff] text-xs font-bold hover:bg-[#00d4ff22] transition-colors w-fit">
                Read full article ↗
              </a>
            )}

            {/* FAANG quick links */}
            <div className="border-t border-[#1e2433] pt-4">
              <p className="text-[10px] text-[#8892a4] mb-3">Browse by stock</p>
              <div className="flex gap-2 flex-wrap">
                {FAANG.map(f => {
                  const count = items.filter(n => n.symbols.some(s=>s.toUpperCase()===f.ticker)).length;
                  return (
                    <button key={f.ticker} onClick={() => setFilter(f.ticker)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors hover:opacity-80"
                      style={{backgroundColor:`${f.color}11`,borderColor:`${f.color}44`,color:f.color}}>
                      {f.ticker} <span className="text-[#8892a4] font-normal">{count} articles</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[9px] text-[#4a5568] mt-auto">Source: {selected.publisher} · {dataSource} · For informational purposes only.</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8892a4] text-sm">Select an article to read</div>
        )}
      </div>
    </div>
  );
}
