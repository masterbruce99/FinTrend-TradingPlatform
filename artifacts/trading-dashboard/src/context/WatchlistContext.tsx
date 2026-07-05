import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface WatchlistSymbol {
  symbol: string;
  name: string;
  addedAt: number;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: WatchlistSymbol[];
  createdAt: number;
}

interface WatchlistContextValue {
  watchlists: Watchlist[];
  activeId: string;
  activeWatchlist: Watchlist | null;
  setActiveId: (id: string) => void;
  createWatchlist: (name: string) => string;
  renameWatchlist: (id: string, name: string) => void;
  deleteWatchlist: (id: string) => void;
  addSymbol: (watchlistId: string, symbol: string, name: string) => void;
  removeSymbol: (watchlistId: string, symbol: string) => void;
  moveSymbol: (watchlistId: string, from: number, to: number) => void;
  isInWatchlist: (symbol: string) => boolean;
  addToActive: (symbol: string, name: string) => void;
  removeFromActive: (symbol: string) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const STORAGE_KEY = "ts-watchlists-v2";
const ACTIVE_KEY = "ts-active-watchlist-v2";

const DEFAULT_LIST: Watchlist = {
  id: "default",
  name: "My Watchlist",
  symbols: [
    { symbol: "SPY",  name: "SPDR S&P 500 ETF",  addedAt: 0 },
    { symbol: "AAPL", name: "Apple Inc.",          addedAt: 0 },
    { symbol: "NVDA", name: "NVIDIA Corp.",         addedAt: 0 },
    { symbol: "MSFT", name: "Microsoft Corp.",      addedAt: 0 },
    { symbol: "TSLA", name: "Tesla Inc.",           addedAt: 0 },
    { symbol: "META", name: "Meta Platforms Inc.",  addedAt: 0 },
    { symbol: "AMZN", name: "Amazon.com Inc.",      addedAt: 0 },
    { symbol: "GOOGL",name: "Alphabet Inc.",        addedAt: 0 },
    { symbol: "QQQ",  name: "Invesco QQQ Trust",    addedAt: 0 },
    { symbol: "BTC-USD", name: "Bitcoin USD",       addedAt: 0 },
  ],
  createdAt: 0,
};

function loadWatchlists(): Watchlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [DEFAULT_LIST];
}

function loadActiveId(): string {
  return localStorage.getItem(ACTIVE_KEY) ?? "default";
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(loadWatchlists);
  const [activeId, setActiveIdState] = useState<string>(loadActiveId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
  }, [watchlists]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const activeWatchlist = watchlists.find(w => w.id === activeId) ?? watchlists[0] ?? null;

  const createWatchlist = useCallback((name: string) => {
    const id = `wl-${Date.now()}`;
    setWatchlists(p => [...p, { id, name, symbols: [], createdAt: Date.now() }]);
    return id;
  }, []);

  const renameWatchlist = useCallback((id: string, name: string) => {
    setWatchlists(p => p.map(w => w.id === id ? { ...w, name } : w));
  }, []);

  const deleteWatchlist = useCallback((id: string) => {
    setWatchlists(p => {
      const next = p.filter(w => w.id !== id);
      return next.length > 0 ? next : [DEFAULT_LIST];
    });
    setActiveIdState(prev => {
      if (prev !== id) return prev;
      const remaining = watchlists.filter(w => w.id !== id);
      return remaining[0]?.id ?? "default";
    });
  }, [watchlists]);

  const addSymbol = useCallback((watchlistId: string, symbol: string, name: string) => {
    setWatchlists(p => p.map(w => {
      if (w.id !== watchlistId) return w;
      if (w.symbols.some(s => s.symbol === symbol)) return w;
      return { ...w, symbols: [...w.symbols, { symbol, name, addedAt: Date.now() }] };
    }));
  }, []);

  const removeSymbol = useCallback((watchlistId: string, symbol: string) => {
    setWatchlists(p => p.map(w =>
      w.id !== watchlistId ? w : { ...w, symbols: w.symbols.filter(s => s.symbol !== symbol) }
    ));
  }, []);

  const moveSymbol = useCallback((watchlistId: string, from: number, to: number) => {
    setWatchlists(p => p.map(w => {
      if (w.id !== watchlistId) return w;
      const syms = [...w.symbols];
      const [item] = syms.splice(from, 1);
      syms.splice(to, 0, item);
      return { ...w, symbols: syms };
    }));
  }, []);

  const isInWatchlist = useCallback((symbol: string) =>
    activeWatchlist?.symbols.some(s => s.symbol === symbol) ?? false,
  [activeWatchlist]);

  const addToActive = useCallback((symbol: string, name: string) => {
    if (activeWatchlist) addSymbol(activeWatchlist.id, symbol, name);
  }, [activeWatchlist, addSymbol]);

  const removeFromActive = useCallback((symbol: string) => {
    if (activeWatchlist) removeSymbol(activeWatchlist.id, symbol);
  }, [activeWatchlist, removeSymbol]);

  return (
    <WatchlistContext.Provider value={{
      watchlists, activeId, activeWatchlist,
      setActiveId, createWatchlist, renameWatchlist, deleteWatchlist,
      addSymbol, removeSymbol, moveSymbol, isInWatchlist,
      addToActive, removeFromActive,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be inside WatchlistProvider");
  return ctx;
}
