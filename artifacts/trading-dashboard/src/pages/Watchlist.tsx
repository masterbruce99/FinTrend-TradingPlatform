import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { useWatchlist } from "@/context/WatchlistContext";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/formatters";
import {
  Plus, Trash2, Edit2, Check, X, Search, Star, RefreshCw,
  ChevronUp, ChevronDown, ArrowUpRight, Bookmark, MoreVertical
} from "lucide-react";
import { WatchlistSidekickButton } from "@/components/WatchlistSidekickButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  week52High: number | null;
  week52Low: number | null;
}

function useWatchlistQuotes(symbols: string[]) {
  return useQuery<{ quotes: Quote[] }>({
    queryKey: ["watchlist-quotes", symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return { quotes: [] };
      const res = await fetch(`/api/quotes?symbols=${symbols.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
    enabled: symbols.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

interface SearchResult { symbol: string; name: string; exchange: string; type: string }

function useSymbolSearch(q: string) {
  return useQuery<{ results: SearchResult[] }>({
    queryKey: ["symbol-search", q],
    queryFn: async () => {
      if (!q.trim()) return { results: [] };
      const res = await fetch(`/api/quotes/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });
}

function AddSymbolBar({ watchlistId }: { watchlistId: string }) {
  const { addSymbol } = useWatchlist();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data } = useSymbolSearch(q);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (sym: string, name: string) => {
    addSymbol(watchlistId, sym, name);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Add symbol… (e.g. AAPL, BTC-USD)"
          className="pl-9 pr-8 bg-card border-border h-9 text-sm"
        />
        {q && (
          <button onClick={() => { setQ(""); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-white" />
          </button>
        )}
      </div>
      {open && data && data.results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {data.results.slice(0, 8).map(r => (
            <button
              key={r.symbol}
              onClick={() => pick(r.symbol, r.name)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
            >
              <div>
                <span className="font-mono font-bold text-white text-sm">{r.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground">{r.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 uppercase">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistSelector() {
  const { watchlists, activeId, setActiveId, createWatchlist, renameWatchlist, deleteWatchlist } = useWatchlist();
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const startEdit = (id: string, name: string) => { setEditing(id); setEditVal(name); };
  const commitEdit = () => {
    if (editing && editVal.trim()) renameWatchlist(editing, editVal.trim());
    setEditing(null);
  };

  const startCreate = () => { setCreating(true); setNewName(""); };
  const commitCreate = () => {
    if (newName.trim()) {
      const id = createWatchlist(newName.trim());
      setActiveId(id);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-1">
      {watchlists.map(w => (
        <div
          key={w.id}
          className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            activeId === w.id ? "bg-primary/15 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
          }`}
          onClick={() => setActiveId(w.id)}
        >
          <Bookmark className={`w-4 h-4 flex-shrink-0 ${activeId === w.id ? "text-primary" : "text-muted-foreground"}`} />
          {editing === w.id ? (
            <input
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-transparent text-white text-sm outline-none border-b border-primary"
            />
          ) : (
            <span className={`flex-1 text-sm truncate ${activeId === w.id ? "text-white font-medium" : "text-muted-foreground"}`}>
              {w.name}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/50">{w.symbols.length}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => startEdit(w.id, w.name)} className="p-0.5 rounded hover:text-white text-muted-foreground">
              <Edit2 className="w-3 h-3" />
            </button>
            {watchlists.length > 1 && (
              <button onClick={() => deleteWatchlist(w.id)} className="p-0.5 rounded hover:text-red-400 text-muted-foreground">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}

      {creating ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={commitCreate}
            onKeyDown={e => { if (e.key === "Enter") commitCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="List name…"
            className="flex-1 bg-transparent text-white text-sm outline-none border-b border-primary"
          />
          <button onClick={commitCreate}><Check className="w-3.5 h-3.5 text-primary" /></button>
          <button onClick={() => setCreating(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      ) : (
        <button
          onClick={startCreate}
          className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-white hover:bg-muted/40 rounded-md transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New list
        </button>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const [, setLocation] = useLocation();
  const { activeWatchlist, removeSymbol, moveSymbol } = useWatchlist();
  const symbols = activeWatchlist?.symbols.map(s => s.symbol) ?? [];
  const { data, isFetching, refetch } = useWatchlistQuotes(symbols);

  const quoteMap = new Map(data?.quotes.map(q => [q.symbol, q]) ?? []);

  const rows = (activeWatchlist?.symbols ?? []).map(ws => ({
    ...ws,
    quote: quoteMap.get(ws.symbol) ?? null,
  }));

  return (
    <AppLayout>
      <div className="p-4 h-full flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Watchlist</h1>
              {isFetching && <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your favorite symbols — prices refresh every 30 seconds
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left — list selector */}
          <div className="w-52 flex-shrink-0 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Lists</p>
            <WatchlistSelector />
          </div>

          {/* Right — active watchlist */}
          <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden">
            {activeWatchlist ? (
              <>
                {/* List header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-white">{activeWatchlist.name}</h2>
                    <p className="text-xs text-muted-foreground">{activeWatchlist.symbols.length} symbols</p>
                  </div>
                  <div className="w-72">
                    <AddSymbolBar watchlistId={activeWatchlist.id} />
                  </div>
                </div>

                {/* Symbol list */}
                <div className="flex-1 overflow-auto">
                  {rows.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Star className="w-8 h-8 opacity-30" />
                      <p className="text-sm">No symbols yet</p>
                      <p className="text-xs opacity-60">Use the search above to add symbols</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-border/50">
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Symbol</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Price</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Change</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Chg %</th>
                          <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">52W Range</th>
                          <th className="px-4 py-2.5 w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const q = row.quote;
                          const rangePos = q?.week52High && q?.week52Low
                            ? Math.round(((q.price - q.week52Low) / (q.week52High - q.week52Low)) * 100)
                            : null;
                          return (
                            <tr
                              key={row.symbol}
                              className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
                              onClick={() => setLocation(`/market?symbol=${row.symbol}`)}
                            >
                              <td className="px-4 py-3">
                                <span className="font-bold font-mono text-white">{row.symbol}</span>
                              </td>
                              <td className="px-4 py-3 max-w-[180px]">
                                <span className="text-xs text-muted-foreground truncate block">{row.name}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-white font-medium">
                                {q ? formatCurrency(q.price) : <span className="text-muted-foreground/40">—</span>}
                              </td>
                              <td className={`px-4 py-3 text-right font-mono text-xs ${q ? getColorClass(q.change) : "text-muted-foreground"}`}>
                                {q ? `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {q ? (
                                  <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${q.changePct >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                    {q.changePct >= 0 ? "+" : ""}{formatPercent(q.changePct)}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {rangePos != null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary/70 rounded-full"
                                        style={{ width: `${Math.max(2, Math.min(100, rangePos))}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground w-7 text-right">{rangePos}%</span>
                                  </div>
                                ) : <span className="text-muted-foreground/30 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                  <WatchlistSidekickButton symbol={row.symbol} />
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => moveSymbol(activeWatchlist.id, idx, idx - 1)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-white disabled:opacity-20"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    disabled={idx === rows.length - 1}
                                    onClick={() => moveSymbol(activeWatchlist.id, idx, idx + 1)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-white disabled:opacity-20"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => removeSymbol(activeWatchlist.id, row.symbol)}
                                    className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setLocation(`/market?symbol=${row.symbol}`)}
                                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select or create a watchlist
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
