import { useState, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Settings2, Download, RefreshCw, ChevronDown, X, Plus, Star } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { formatCompactNumber } from "@/lib/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ETF {
  symbol: string; name: string; category: string;
  price: number | null; change: number | null; changePct: number | null;
  volume: number | null; week52High: number | null; week52Low: number | null;
  ytdReturn: number | null; return3M: number | null;
  expenseRatio: number | null; aum: number | null;
  dividendYield: number | null; week52Change: number | null;
}
type ColKey = "symbol"|"name"|"category"|"price"|"changePct"|"ytdReturn"|"return3M"|"week52Change"|"aum"|"expenseRatio"|"dividendYield"|"volume"|"week52Range";
type SortField = Exclude<ColKey, "name"|"week52Range">;
type SortDir = "asc"|"desc";

interface ColDef { key: ColKey; label: string; right?: boolean; w: number; heat?: boolean; heatRange?: number; }
interface Filters {
  categories: string[];
  aumMin: number | null; erMax: number | null; yieldMin: number | null; volumeMin: number | null;
  dayMin: string; dayMax: string; ytdMin: string; ytdMax: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TV = {
  bg: "#0f1116", surface: "#131722", border: "#2A2E39",
  text: "#D9D9D9", muted: "#787B86", accent: "#2962FF",
  green: "#26A69A", red: "#EF5350", hover: "#1e2230",
};

const COL_DEFS: ColDef[] = [
  { key: "symbol",        label: "Symbol",      w: 80 },
  { key: "name",          label: "Name",        w: 210 },
  { key: "category",      label: "Type",        w: 130 },
  { key: "price",         label: "Price",       w: 85,  right: true },
  { key: "changePct",     label: "Day %",       w: 80,  right: true, heat: true, heatRange: 3 },
  { key: "ytdReturn",     label: "YTD %",       w: 82,  right: true, heat: true, heatRange: 25 },
  { key: "return3M",      label: "3M %",        w: 82,  right: true, heat: true, heatRange: 15 },
  { key: "week52Change",  label: "1Y %",        w: 82,  right: true, heat: true, heatRange: 50 },
  { key: "aum",           label: "AUM",         w: 95,  right: true },
  { key: "expenseRatio",  label: "Exp. Ratio",  w: 90,  right: true },
  { key: "dividendYield", label: "Yield",       w: 72,  right: true },
  { key: "volume",        label: "Volume",      w: 95,  right: true },
  { key: "week52Range",   label: "52W Range",   w: 185 },
];
const COL_MAP = Object.fromEntries(COL_DEFS.map(c => [c.key, c])) as Record<ColKey, ColDef>;

const PRESETS: Record<string, { label: string; cols: ColKey[] }> = {
  overview:    { label: "Overview",    cols: ["symbol","name","category","price","changePct","aum","expenseRatio","volume"] },
  performance: { label: "Performance", cols: ["symbol","name","price","changePct","return3M","ytdReturn","week52Change","week52Range"] },
  fundamental: { label: "Fundamental", cols: ["symbol","name","category","price","aum","expenseRatio","dividendYield","volume"] },
};

interface QuickScreen { id: string; label: string; preset?: string; sort?: { f: SortField; d: SortDir }; filters?: Partial<Filters>; }
const QUICK_SCREENS: QuickScreen[] = [
  { id: "top_gainers",  label: "🚀 Top Gainers",     sort: { f: "changePct", d: "desc" } },
  { id: "top_losers",   label: "📉 Top Losers",      sort: { f: "changePct", d: "asc"  } },
  { id: "top_ytd",      label: "🏆 Best YTD",        sort: { f: "ytdReturn",  d: "desc" }, preset: "performance" },
  { id: "mega_cap",     label: "🏦 Mega-Cap",        filters: { aumMin: 50 }, sort: { f: "aum", d: "desc" } },
  { id: "ultra_low",    label: "💎 Ultra-Low Cost",  filters: { erMax: 0.05 }, sort: { f: "expenseRatio", d: "asc" } },
  { id: "high_yield",   label: "💰 High Yield",      filters: { yieldMin: 2 }, sort: { f: "dividendYield", d: "desc" }, preset: "fundamental" },
  { id: "leveraged",    label: "⚡ Leveraged",        filters: { categories: ["Leveraged"] } },
  { id: "inverse",      label: "🔻 Inverse",         filters: { categories: ["Inverse"] } },
  { id: "crypto_etf",   label: "₿ Crypto ETFs",     filters: { categories: ["Crypto"] } },
  { id: "bonds",        label: "📊 Fixed Income",    filters: { categories: ["Fixed Income"] }, preset: "fundamental" },
  { id: "international",label: "🌍 International",   filters: { categories: ["International"] }, preset: "performance" },
];

const DEFAULT_FILTERS: Filters = {
  categories: [], aumMin: null, erMax: null, yieldMin: null, volumeMin: null,
  dayMin: "", dayMax: "", ytdMin: "", ytdMax: "",
};

const AUM_PRESETS = [
  { label: "$1B+", val: 1 }, { label: "$5B+", val: 5 }, { label: "$10B+", val: 10 },
  { label: "$50B+", val: 50 }, { label: "$100B+", val: 100 },
];
const ER_PRESETS = [
  { label: "0.05%", val: 0.05 }, { label: "0.10%", val: 0.10 }, { label: "0.25%", val: 0.25 },
  { label: "0.50%", val: 0.50 }, { label: "1.00%", val: 1.00 },
];
const YIELD_PRESETS = [
  { label: "1%+", val: 1 }, { label: "2%+", val: 2 }, { label: "3%+", val: 3 }, { label: "5%+", val: 5 },
];
const VOL_PRESETS = [
  { label: "$1M+", val: 1e6 }, { label: "$10M+", val: 1e7 }, { label: "$100M+", val: 1e8 },
];

const PAGE = 100;

// ─── Utils ────────────────────────────────────────────────────────────────────
function heatBg(val: number | null, range = 20): string {
  if (val == null) return "transparent";
  const t = Math.max(-1, Math.min(1, val / range));
  if (t > 0) return `rgba(38,166,154,${(t * 0.45).toFixed(3)})`;
  return `rgba(239,83,80,${(-t * 0.45).toFixed(3)})`;
}
function fmtPct(v: number | null): string {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}
function fmtAUM(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}
function fmtER(v: number | null): string { return v == null ? "—" : `${v.toFixed(2)}%`; }
function fmtPrice(v: number | null): string { return v == null ? "—" : `$${v < 1 ? v.toFixed(4) : v < 100 ? v.toFixed(2) : v.toFixed(2)}`; }
function pctColor(v: number | null): string { return v == null ? TV.muted : v > 0 ? TV.green : v < 0 ? TV.red : TV.muted; }
function pf(s: string): number | null { const n = parseFloat(s); return isNaN(n) ? null : n; }

// ─── Sub-components ───────────────────────────────────────────────────────────
function WeekRangeBar({ price, low, high }: { price: number; low: number; high: number }) {
  const pct = high > low ? Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100)) : 50;
  const fmt = (n: number) => n < 10 ? n.toFixed(2) : n < 1000 ? n.toFixed(1) : formatCompactNumber(n);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: TV.muted, width: 40, textAlign: "right", flexShrink: 0 }}>{fmt(low)}</span>
      <div style={{ position: "relative", flex: 1, height: 3, borderRadius: 2, background: "linear-gradient(to right, #EF5350, #26A69A)", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "50%", transform: `translate(calc(${pct}% - 5px), -50%)`, width: 10, height: 10, borderRadius: "50%", background: TV.text, border: `2px solid ${TV.bg}`, zIndex: 1 }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: TV.muted, width: 40, flexShrink: 0 }}>{fmt(high)}</span>
    </div>
  );
}

function PresetBtn({ active, label, val, cur, onClick }: { active: boolean; label: string; val: any; cur: any; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "2px 8px", fontSize: 11, borderRadius: 3, border: `1px solid ${active ? TV.accent : TV.border}`,
      background: active ? `${TV.accent}22` : "transparent", color: active ? TV.accent : TV.muted,
      cursor: "pointer", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function SortIndicator({ field, cur, dir }: { field: string; cur: string; dir: SortDir }) {
  if (field !== cur) return <span style={{ color: TV.muted, fontSize: 9, marginLeft: 2, opacity: 0.3 }}>⇅</span>;
  return <span style={{ color: TV.accent, fontSize: 10, marginLeft: 2 }}>{dir === "desc" ? "↓" : "↑"}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ETFScreener() {
  const [, setLocation] = useLocation();
  const { addToActive } = useWatchlist();

  const [preset, setPreset] = useState("overview");
  const [cols, setCols] = useState<ColKey[]>(PRESETS.overview.cols);
  const [sortF, setSortF] = useState<SortField>("aum");
  const [sortD, setSortD] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  const [showScreens, setShowScreens] = useState(false);
  const [page, setPage] = useState(1);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<{ etfs: ETF[]; count: number; categories: string[]; source: string; asOf: string }>({
    queryKey: ["etf-screener-v3"],
    queryFn: async () => { const r = await fetch("/api/quotes/etf-screener"); if (!r.ok) throw new Error("failed"); return r.json(); },
    staleTime: 1000 * 60 * 10,
  });

  const setSort = useCallback((f: SortField) => {
    setSortF(prev => { if (prev === f) setSortD(d => d === "asc" ? "desc" : "asc"); else setSortD("desc"); return f; });
    setPage(1);
  }, []);

  const applyPreset = useCallback((pid: string) => {
    setPreset(pid);
    setCols(PRESETS[pid].cols);
    setPage(1);
  }, []);

  const applyScreen = useCallback((sc: QuickScreen) => {
    setActiveScreen(sc.id);
    setShowScreens(false);
    setFilters({ ...DEFAULT_FILTERS, ...(sc.filters ?? {}) });
    if (sc.sort) { setSortF(sc.sort.f); setSortD(sc.sort.d); }
    if (sc.preset) applyPreset(sc.preset);
    setPage(1);
  }, [applyPreset]);

  const clearFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setActiveScreen(null); setPage(1); }, []);

  const patchFilter = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters(f => ({ ...f, [k]: v }));
    setActiveScreen(null);
    setPage(1);
  }, []);

  const toggleCat = useCallback((cat: string) => {
    setFilters(f => {
      const has = f.categories.includes(cat);
      return { ...f, categories: has ? f.categories.filter(c => c !== cat) : [...f.categories, cat] };
    });
    setActiveScreen(null);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let rows = data?.etfs ?? [];
    const q = search.trim().toUpperCase();
    if (q) rows = rows.filter(e => e.symbol.includes(q) || e.name.toUpperCase().includes(q));
    if (filters.categories.length) rows = rows.filter(e => filters.categories.includes(e.category));
    if (filters.aumMin != null) rows = rows.filter(e => e.aum != null && e.aum >= filters.aumMin! * 1e9);
    if (filters.erMax != null) rows = rows.filter(e => e.expenseRatio != null && e.expenseRatio <= filters.erMax!);
    if (filters.yieldMin != null) rows = rows.filter(e => e.dividendYield != null && e.dividendYield >= filters.yieldMin!);
    if (filters.volumeMin != null) rows = rows.filter(e => e.volume != null && e.volume >= filters.volumeMin!);
    const dayMin = pf(filters.dayMin), dayMax = pf(filters.dayMax);
    const ytdMin = pf(filters.ytdMin), ytdMax = pf(filters.ytdMax);
    if (dayMin != null) rows = rows.filter(e => e.changePct != null && e.changePct >= dayMin);
    if (dayMax != null) rows = rows.filter(e => e.changePct != null && e.changePct <= dayMax);
    if (ytdMin != null) rows = rows.filter(e => e.ytdReturn != null && e.ytdReturn >= ytdMin);
    if (ytdMax != null) rows = rows.filter(e => e.ytdReturn != null && e.ytdReturn <= ytdMax);
    return [...rows].sort((a, b) => {
      const dir = sortD === "asc" ? 1 : -1;
      const av = (a as any)[sortF] ?? (sortD === "asc" ? Infinity : -Infinity);
      const bv = (b as any)[sortF] ?? (sortD === "asc" ? Infinity : -Infinity);
      return (av - bv) * dir;
    });
  }, [data, search, filters, sortF, sortD]);

  const visible = filtered.slice(0, page * PAGE);
  const hasMore = visible.length < filtered.length;

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.aumMin != null, filters.erMax != null, filters.yieldMin != null, filters.volumeMin != null,
    filters.dayMin || filters.dayMax, filters.ytdMin || filters.ytdMax,
  ].filter(Boolean).length;

  const categories = data?.categories ?? [];

  function renderCell(etf: ETF, col: ColKey) {
    switch (col) {
      case "symbol": return <span style={{ fontFamily: "monospace", fontWeight: 700, color: TV.text, fontSize: 13 }}>{etf.symbol}</span>;
      case "name":   return <span style={{ fontSize: 11, color: TV.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{etf.name}</span>;
      case "category": return <span style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.04em", border: `1px solid ${TV.border}`, padding: "1px 5px", borderRadius: 3 }}>{etf.category}</span>;
      case "price":  return <span style={{ fontFamily: "monospace", color: TV.text, fontSize: 12 }}>{fmtPrice(etf.price)}</span>;
      case "changePct":    return <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: pctColor(etf.changePct) }}>{fmtPct(etf.changePct)}</span>;
      case "ytdReturn":    return <span style={{ fontFamily: "monospace", fontSize: 12, color: pctColor(etf.ytdReturn) }}>{fmtPct(etf.ytdReturn)}</span>;
      case "return3M":     return <span style={{ fontFamily: "monospace", fontSize: 12, color: pctColor(etf.return3M) }}>{fmtPct(etf.return3M)}</span>;
      case "week52Change": return <span style={{ fontFamily: "monospace", fontSize: 12, color: pctColor(etf.week52Change) }}>{fmtPct(etf.week52Change)}</span>;
      case "aum":          return <span style={{ fontFamily: "monospace", fontSize: 12, color: TV.muted }}>{fmtAUM(etf.aum)}</span>;
      case "expenseRatio": return <span style={{ fontFamily: "monospace", fontSize: 12, color: TV.muted }}>{fmtER(etf.expenseRatio)}</span>;
      case "dividendYield":return <span style={{ fontFamily: "monospace", fontSize: 12, color: TV.muted }}>{etf.dividendYield != null ? `${etf.dividendYield.toFixed(2)}%` : "—"}</span>;
      case "volume":       return <span style={{ fontFamily: "monospace", fontSize: 12, color: TV.muted }}>{etf.volume != null ? formatCompactNumber(etf.volume) : "—"}</span>;
      case "week52Range":  return (etf.week52High && etf.week52Low && etf.price) ? <WeekRangeBar price={etf.price} low={etf.week52Low} high={etf.week52High} /> : <span style={{ color: TV.muted, opacity: 0.3 }}>—</span>;
      default: return null;
    }
  }

  function Th({ col }: { col: ColKey }) {
    const def = COL_MAP[col];
    const sortable = col !== "name" && col !== "week52Range" && col !== "category";
    return (
      <th onClick={sortable ? () => setSort(col as SortField) : undefined}
        style={{ width: def.w, minWidth: def.w, padding: "0 8px", height: 36, textAlign: def.right ? "right" : "left",
          fontSize: 11, fontWeight: 500, color: sortF === col ? TV.accent : TV.muted,
          borderBottom: `1px solid ${TV.border}`, background: TV.surface, position: "sticky", top: 0, zIndex: 1,
          whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none" }}>
        {def.right
          ? <><SortIndicator field={col} cur={sortF} dir={sortD} />{def.label}</>
          : <>{def.label}{sortable && <SortIndicator field={col} cur={sortF} dir={sortD} />}</>}
      </th>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: TV.bg, overflow: "hidden" }}>

        {/* ── Top toolbar ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 44, borderBottom: `1px solid ${TV.border}`, background: TV.surface, padding: "0 12px", flexShrink: 0 }}>
          {/* Column preset tabs */}
          {Object.entries(PRESETS).map(([id, p]) => (
            <button key={id} onClick={() => applyPreset(id)} style={{
              height: "100%", padding: "0 14px", fontSize: 12, fontWeight: 500,
              color: preset === id ? TV.text : TV.muted,
              borderBottom: preset === id ? `2px solid ${TV.accent}` : "2px solid transparent",
              background: "transparent", cursor: "pointer", transition: "color 0.15s",
            }}>{p.label}</button>
          ))}

          <div style={{ width: 1, height: 20, background: TV.border, margin: "0 8px" }} />

          {/* Quick Screeners */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowScreens(s => !s)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 12,
              color: activeScreen ? TV.accent : TV.muted, background: "transparent",
              border: `1px solid ${activeScreen ? TV.accent : "transparent"}`, borderRadius: 4, cursor: "pointer",
            }}>
              Screeners <ChevronDown size={12} />
            </button>
            {showScreens && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#1E222D", border: `1px solid ${TV.border}`, borderRadius: 6, padding: 6, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                {QUICK_SCREENS.map(sc => (
                  <button key={sc.id} onClick={() => applyScreen(sc)} style={{
                    display: "block", width: "100%", textAlign: "left", padding: "6px 10px", fontSize: 12,
                    color: activeScreen === sc.id ? TV.accent : TV.text, background: activeScreen === sc.id ? `${TV.accent}18` : "transparent",
                    border: "none", borderRadius: 4, cursor: "pointer",
                  }}>{sc.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Filters toggle */}
          <button onClick={() => setShowFilters(s => !s)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12,
            color: showFilters || activeFilterCount > 0 ? TV.accent : TV.muted,
            background: showFilters ? `${TV.accent}15` : "transparent",
            border: `1px solid ${showFilters || activeFilterCount > 0 ? TV.accent : "transparent"}`, borderRadius: 4, cursor: "pointer",
          }}>
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && <span style={{ background: TV.accent, color: "#fff", fontSize: 10, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeFilterCount}</span>}
          </button>

          <div style={{ flex: 1 }} />

          {/* Stats */}
          <span style={{ fontSize: 11, color: TV.muted, marginRight: 10 }}>
            {isLoading ? "Loading…" : `${filtered.length.toLocaleString()} / ${(data?.count ?? 0).toLocaleString()} ETFs`}
            {isFetching && <RefreshCw size={10} style={{ display: "inline", marginLeft: 4, animation: "spin 1s linear infinite" }} />}
          </span>

          {/* Search */}
          <div style={{ position: "relative", marginRight: 8 }}>
            <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: TV.muted }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search symbol or name…"
              style={{ background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 4, padding: "4px 8px 4px 26px", fontSize: 12, color: TV.text, width: 200, outline: "none" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: TV.muted }}><X size={12} /></button>}
          </div>

          {/* Column picker */}
          <div style={{ position: "relative", marginRight: 4 }}>
            <button onClick={() => setShowColPicker(s => !s)} title="Columns" style={{ padding: "5px 8px", background: "transparent", border: `1px solid ${showColPicker ? TV.accent : "transparent"}`, borderRadius: 4, cursor: "pointer", color: TV.muted }}>
              <Settings2 size={14} />
            </button>
            {showColPicker && (
              <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: "#1E222D", border: `1px solid ${TV.border}`, borderRadius: 6, padding: 10, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 11, color: TV.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Columns</div>
                {COL_DEFS.map(c => (
                  <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px", cursor: "pointer", fontSize: 12, color: TV.text }}>
                    <input type="checkbox" checked={cols.includes(c.key)} onChange={() => setCols(prev => prev.includes(c.key) ? prev.filter(k => k !== c.key) : [...prev, c.key])} style={{ accentColor: TV.accent }} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export */}
          <button onClick={() => {
            if (!data) return;
            const hdr = cols.map(k => COL_MAP[k].label).join(",");
            const rows = filtered.map(e => cols.map(k => {
              switch(k) {
                case "symbol": return e.symbol;
                case "name": return `"${e.name}"`;
                case "category": return e.category;
                case "price": return e.price ?? "";
                case "changePct": return e.changePct ?? "";
                case "ytdReturn": return e.ytdReturn ?? "";
                case "return3M": return e.return3M ?? "";
                case "week52Change": return e.week52Change ?? "";
                case "aum": return e.aum ?? "";
                case "expenseRatio": return e.expenseRatio ?? "";
                case "dividendYield": return e.dividendYield ?? "";
                case "volume": return e.volume ?? "";
                default: return "";
              }
            }).join(",")).join("\n");
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([hdr + "\n" + rows], { type: "text/csv" }));
            a.download = "etf-screener.csv"; a.click();
          }} title="Export CSV" style={{ padding: "5px 8px", background: "transparent", border: `1px solid transparent`, borderRadius: 4, cursor: "pointer", color: TV.muted }}>
            <Download size={14} />
          </button>

          <button onClick={() => refetch()} title="Refresh" style={{ padding: "5px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 4, cursor: "pointer", color: TV.muted }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Filter panel ──────────────────────────────────────────────── */}
        {showFilters && (
          <div style={{ background: "#161B27", borderBottom: `1px solid ${TV.border}`, padding: "12px 16px", flexShrink: 0 }}>
            {/* Category */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {categories.map(cat => {
                  const active = filters.categories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCat(cat)} style={{
                      padding: "2px 9px", fontSize: 11, borderRadius: 3, cursor: "pointer",
                      border: `1px solid ${active ? TV.accent : TV.border}`,
                      background: active ? `${TV.accent}22` : "transparent",
                      color: active ? TV.accent : TV.muted,
                    }}>{cat}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {/* AUM */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>AUM Min</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {AUM_PRESETS.map(p => <PresetBtn key={p.val} active={filters.aumMin === p.val} label={p.label} val={p.val} cur={filters.aumMin} onClick={() => patchFilter("aumMin", filters.aumMin === p.val ? null : p.val)} />)}
                </div>
              </div>

              {/* Expense Ratio */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>Exp. Ratio Max</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {ER_PRESETS.map(p => <PresetBtn key={p.val} active={filters.erMax === p.val} label={p.label} val={p.val} cur={filters.erMax} onClick={() => patchFilter("erMax", filters.erMax === p.val ? null : p.val)} />)}
                </div>
              </div>

              {/* Dividend Yield */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>Yield Min</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {YIELD_PRESETS.map(p => <PresetBtn key={p.val} active={filters.yieldMin === p.val} label={p.label} val={p.val} cur={filters.yieldMin} onClick={() => patchFilter("yieldMin", filters.yieldMin === p.val ? null : p.val)} />)}
                </div>
              </div>

              {/* Volume */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>Volume Min</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {VOL_PRESETS.map(p => <PresetBtn key={p.val} active={filters.volumeMin === p.val} label={p.label} val={p.val} cur={filters.volumeMin} onClick={() => patchFilter("volumeMin", filters.volumeMin === p.val ? null : p.val)} />)}
                </div>
              </div>

              {/* Day % range */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>Day % Range</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" value={filters.dayMin} onChange={e => patchFilter("dayMin", e.target.value)} placeholder="Min" style={{ width: 64, padding: "3px 6px", background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 3, color: TV.text, fontSize: 11 }} />
                  <span style={{ color: TV.muted, fontSize: 11 }}>to</span>
                  <input type="number" value={filters.dayMax} onChange={e => patchFilter("dayMax", e.target.value)} placeholder="Max" style={{ width: 64, padding: "3px 6px", background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 3, color: TV.text, fontSize: 11 }} />
                </div>
              </div>

              {/* YTD % range */}
              <div>
                <div style={{ fontSize: 10, color: TV.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 600 }}>YTD % Range</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" value={filters.ytdMin} onChange={e => patchFilter("ytdMin", e.target.value)} placeholder="Min" style={{ width: 64, padding: "3px 6px", background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 3, color: TV.text, fontSize: 11 }} />
                  <span style={{ color: TV.muted, fontSize: 11 }}>to</span>
                  <input type="number" value={filters.ytdMax} onChange={e => patchFilter("ytdMax", e.target.value)} placeholder="Max" style={{ width: 64, padding: "3px 6px", background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 3, color: TV.text, fontSize: 11 }} />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ marginTop: 10, fontSize: 11, color: TV.red, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                ✕ Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Active filter chips ────────────────────────────────────────── */}
        {activeFilterCount > 0 && !showFilters && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", borderBottom: `1px solid ${TV.border}`, background: TV.surface, flexShrink: 0, flexWrap: "wrap" }}>
            {filters.categories.map(cat => (
              <span key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TV.accent, background: `${TV.accent}18`, border: `1px solid ${TV.accent}44`, borderRadius: 20, padding: "2px 8px" }}>
                {cat} <button onClick={() => toggleCat(cat)} style={{ background: "none", border: "none", cursor: "pointer", color: TV.accent, lineHeight: 1 }}>×</button>
              </span>
            ))}
            {filters.aumMin != null && <Chip label={`AUM ≥ $${filters.aumMin}B`} onRemove={() => patchFilter("aumMin", null)} />}
            {filters.erMax != null && <Chip label={`ER ≤ ${filters.erMax}%`} onRemove={() => patchFilter("erMax", null)} />}
            {filters.yieldMin != null && <Chip label={`Yield ≥ ${filters.yieldMin}%`} onRemove={() => patchFilter("yieldMin", null)} />}
            {filters.volumeMin != null && <Chip label={`Vol ≥ ${formatCompactNumber(filters.volumeMin)}`} onRemove={() => patchFilter("volumeMin", null)} />}
            {(filters.dayMin || filters.dayMax) && <Chip label={`Day ${filters.dayMin || ""}…${filters.dayMax || ""}%`} onRemove={() => { patchFilter("dayMin", "" as any); patchFilter("dayMax", "" as any); }} />}
            {(filters.ytdMin || filters.ytdMax) && <Chip label={`YTD ${filters.ytdMin || ""}…${filters.ytdMax || ""}%`} onRemove={() => { patchFilter("ytdMin", ""); patchFilter("ytdMax", ""); }} />}
            <button onClick={clearFilters} style={{ fontSize: 11, color: TV.muted, background: "none", border: "none", cursor: "pointer", marginLeft: 4 }}>Clear all</button>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto" }} onClick={() => { setShowScreens(false); setShowColPicker(false); }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: TV.muted, gap: 16 }}>
              <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", color: TV.accent, opacity: 0.6 }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: TV.text, fontSize: 14, fontWeight: 600 }}>Fetching 5,649 ETFs from Yahoo Finance…</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Running parallel batches of 250 · typically 3–5 seconds</div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.5 }}>Cached for 10 minutes after first load</div>
              </div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>{cols.map(k => <col key={k} style={{ width: COL_MAP[k].w }} />)}<col style={{ width: 36 }} /></colgroup>
              <thead>
                <tr>{cols.map(k => <Th key={k} col={k} />)}<th style={{ width: 36, background: TV.surface, borderBottom: `1px solid ${TV.border}`, position: "sticky", top: 0, zIndex: 1 }} /></tr>
              </thead>
              <tbody>
                {visible.map((etf, i) => (
                  <tr key={etf.symbol}
                    onClick={() => setLocation(`/market?symbol=${etf.symbol}`)}
                    style={{ background: i % 2 === 0 ? TV.bg : "#0d111a", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = TV.hover)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? TV.bg : "#0d111a")}>
                    {cols.map(k => {
                      const def = COL_MAP[k];
                      const heatVal = def.heat ? (etf as any)[k] as number | null : null;
                      return (
                        <td key={k} style={{
                          padding: "0 8px", height: 34, textAlign: def.right ? "right" : "left",
                          borderBottom: `1px solid #1a1e2c`, overflow: "hidden", maxWidth: def.w,
                          background: heatVal != null ? heatBg(heatVal, def.heatRange) : undefined,
                        }}>
                          {renderCell(etf, k)}
                        </td>
                      );
                    })}
                    <td style={{ padding: "0 4px", borderBottom: `1px solid #1a1e2c`, textAlign: "center" }}>
                      <button onClick={e => { e.stopPropagation(); addToActive(etf.symbol, etf.name); }}
                        title="Add to watchlist"
                        style={{ background: "none", border: "none", cursor: "pointer", color: TV.muted, opacity: 0.3, padding: "2px 3px", borderRadius: 3 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")}>
                        <Star size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {!isLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 36, padding: "0 16px", borderTop: `1px solid ${TV.border}`, background: TV.surface, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: TV.muted }}>
              Showing <span style={{ color: TV.text }}>{visible.length.toLocaleString()}</span> of{" "}
              <span style={{ color: TV.text }}>{filtered.length.toLocaleString()}</span> ETFs
              {data?.asOf && <span style={{ opacity: 0.4, marginLeft: 8 }}>· Updated {new Date(data.asOf).toLocaleTimeString()}</span>}
            </span>
            {hasMore && (
              <button onClick={() => setPage(p => p + 1)} style={{
                fontSize: 11, padding: "3px 12px", background: `${TV.accent}18`, border: `1px solid ${TV.accent}44`,
                borderRadius: 4, color: TV.accent, cursor: "pointer",
              }}>
                Load {Math.min(PAGE, filtered.length - visible.length).toLocaleString()} more ↓
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ba8c0", background: "#1e2433", border: "1px solid #2A2E39", borderRadius: 20, padding: "2px 8px" }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ba8c0", lineHeight: 1 }}>×</button>
    </span>
  );
}
