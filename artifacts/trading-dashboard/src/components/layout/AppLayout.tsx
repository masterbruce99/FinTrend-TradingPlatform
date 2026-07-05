import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart2, Bitcoin, Globe, LayoutDashboard, Layers,
  LineChart, Newspaper, PieChart, Star, Plus, X, Search, ChevronDown, ChevronRight,
  Cpu, Flame, DollarSign, Briefcase, Calendar, TrendingUp
} from "lucide-react";
import { SidekickHeaderButton } from "@/components/SidekickHeaderButton";
import { TickerTape } from "./TickerTape";
import { useWatchlist } from "@/context/WatchlistContext";
import { formatCurrency, formatPercent, getColorClass } from "@/lib/formatters";

const NAV_ITEMS = [
  { href: "/",             label: "Overview",         icon: LayoutDashboard },
  { href: "/market",       label: "Stock Detail",     icon: BarChart2 },
  { href: "/stock-screener", label: "Stock Screener",  icon: LineChart },
  { href: "/etf",          label: "ETF Screener",     icon: Layers },
  { href: "/crypto",       label: "Crypto",           icon: Bitcoin },
  { href: "/forex",        label: "Forex",            icon: DollarSign },
  { href: "/macro",        label: "Macro",            icon: Globe },
  { href: "/news",         label: "News Feed",        icon: Newspaper },
  { href: "/options",      label: "Options",          icon: Activity },
  { href: "/finance",      label: "Financials",       icon: PieChart },
  { href: "/watchlist",    label: "Watchlist",        icon: Star },
  { href: "/heatmap",      label: "Heatmap",          icon: Flame },
  { href: "/calendar",     label: "Econ Calendar",    icon: Calendar },
  { href: "/futures",      label: "Futures",          icon: TrendingUp },
];

interface SearchResult { symbol: string; name: string; exchange: string }

function MiniAddSymbol({ watchlistId, onClose }: { watchlistId: string; onClose: () => void }) {
  const { addSymbol } = useWatchlist();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery<{ results: SearchResult[] }>({
    queryKey: ["mini-search", q],
    queryFn: async () => {
      if (!q.trim()) return { results: [] };
      const res = await fetch(`/api/quotes/search?q=${encodeURIComponent(q)}`);
      return res.json();
    },
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const pick = (sym: string, name: string) => {
    addSymbol(watchlistId, sym, name);
    setQ("");
    onClose();
  };

  return (
    <div className="px-4 pb-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol..."
          className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50"
        />
      </div>
      {data?.results && data.results.length > 0 && (
        <div className="mt-1 bg-[#131722] border border-[#2a3142] rounded-md overflow-hidden">
          {data.results.slice(0, 8).map((s) => (
            <button
              key={s.symbol}
              onClick={() => pick(s.symbol, s.name)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#1e2433] text-left transition-colors"
            >
              <span className="font-medium">{s.symbol}</span>
              <span className="text-muted-foreground truncate max-w-[120px]">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistPanel() {
  const { watchlists, activeId, addSymbol: ctxAddSymbol, createWatchlist, deleteWatchlist, removeSymbol, setActiveId } = useWatchlist();
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const active = watchlists.find((w) => w.id === activeId);

  return (
    <div className="px-2 py-2 flex-shrink-0 border-t border-[#1e2433] overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3 h-3" />
          Watchlist
        </span>
        <button
          onClick={() => {
            const name = prompt("New watchlist name:", "My Watchlist");
            if (name) createWatchlist(name);
          }}
          className="w-5 h-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
          title="New watchlist"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {watchlists.map((wl) => {
        const isActive = wl.id === activeId;
        return (
          <div key={wl.id} className="mb-1">
            <button
              onClick={() => setActiveId(wl.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-white"
              }`}
            >
              {isActive ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span className="truncate flex-1 text-left font-medium">{wl.name}</span>
              <span className="text-[9px] opacity-60">{wl.symbols.length}</span>
            </button>
            {isActive && (
              <div className="mt-0.5 space-y-0.5">
                {wl.symbols.map((sym) => (
                  <div
                    key={sym.symbol}
                    className="flex items-center justify-between px-6 py-1 text-[11px] text-muted-foreground hover:text-white hover:bg-muted rounded transition-colors group"
                  >
                    <span className="font-medium">{sym.symbol}</span>
                    <button
                      onClick={() => removeSymbol(wl.id, sym.symbol)}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setAddingTo(addingTo === wl.id ? null : wl.id)}
                  className="w-full flex items-center gap-1 px-6 py-1 text-[10px] text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add symbol
                </button>
                {addingTo === wl.id && <MiniAddSymbol watchlistId={wl.id} onClose={() => setAddingTo(null)} />}
                {watchlists.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this watchlist?")) deleteWatchlist(wl.id);
                    }}
                    className="w-full text-[10px] text-red-400 hover:text-red-300 px-6 py-1 text-left"
                  >
                    Delete watchlist
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Sidebar() {
  const location = useLocation()[0];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex-shrink-0 flex flex-col border-r border-[#1e2433] bg-[#0b0e14] transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-[60px] md:w-[200px]"
      }`}
    >
      {/* Logo */}
      <div className="px-3 py-3 border-b border-[#1e2433] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <LineChart className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="hidden md:block font-bold text-sm tracking-tight">FinTrend</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block ml-auto text-muted-foreground hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center justify-center md:justify-start gap-3 px-2 py-2 md:px-3 rounded-md cursor-pointer transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-white"
              }`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden md:block text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <WatchlistPanel />

      <div className="px-4 py-2.5 border-t text-xs text-center md:text-left text-muted-foreground flex-shrink-0">
        <span className="hidden md:inline">v1.0.0-beta</span>
        <span className="md:hidden">v1</span>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground dark">
      <TickerTape />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Global header with Sidekick button */}
          <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
            <SidekickHeaderButton />
          </div>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
