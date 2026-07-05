import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle, Globe } from "lucide-react";
// uses /api/ paths directly

interface EconEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  name: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  impact: "High" | "Medium" | "Low";
  type: "GDP" | "Inflation" | "Employment" | "Rates" | "Trade" | "Other";
}

// FRED series that act as economic calendar events
const FRED_EVENTS = [
  { series: "GDP", name: "GDP Growth Rate", country: "US", type: "GDP" as const, impact: "High" as const },
  { series: "CPIAUCSL", name: "CPI (Consumer Price Index)", country: "US", type: "Inflation" as const, impact: "High" as const },
  { series: "UNRATE", name: "Unemployment Rate", country: "US", type: "Employment" as const, impact: "High" as const },
  { series: "PAYEMS", name: "Nonfarm Payrolls", country: "US", type: "Employment" as const, impact: "High" as const },
  { series: "FEDFUNDS", name: "Fed Funds Rate", country: "US", type: "Rates" as const, impact: "High" as const },
  { series: "DGS10", name: "10-Year Treasury Yield", country: "US", type: "Rates" as const, impact: "Medium" as const },
  { series: "TB3MS", name: "3-Month T-Bill Rate", country: "US", type: "Rates" as const, impact: "Medium" as const },
  { series: "INDPRO", name: "Industrial Production", country: "US", type: "GDP" as const, impact: "Medium" as const },
  { series: "PCE", name: "Core PCE Price Index", country: "US", type: "Inflation" as const, impact: "High" as const },
  { series: "RSXFS", name: "Retail Sales", country: "US", type: "GDP" as const, impact: "Medium" as const },
  { series: "HOUST", name: "Housing Starts", country: "US", type: "GDP" as const, impact: "Medium" as const },
  { series: "BOPGSTB", name: "Trade Balance", country: "US", type: "Trade" as const, impact: "Low" as const },
];

async function fetchEconEvents(): Promise<EconEvent[]> {
  const events: EconEvent[] = [];
  for (const evt of FRED_EVENTS) {
    try {
      const r = await fetch(`/api/macro/series/${evt.series}`);
      const data = await r.json();
      const obs = data?.observations || [];
      const latest = obs[0];
      const prev = obs[1];
      if (latest) {
        events.push({
          id: `${evt.series}-${latest.date}`,
          date: latest.date,
          time: "08:30 ET",
          country: evt.country,
          name: evt.name,
          actual: latest.value !== "." ? latest.value : undefined,
          forecast: undefined,
          previous: prev?.value !== "." ? prev.value : undefined,
          impact: evt.impact,
          type: evt.type,
        });
      }
    } catch {
      // Skip on error
    }
  }
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const IMPACT_COLORS = {
  High: "text-red-400 bg-red-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Low: "text-green-400 bg-green-400/10",
};

const TYPE_ICONS: Record<string, typeof TrendingUp> = {
  GDP: TrendingUp,
  Inflation: AlertTriangle,
  Employment: Globe,
  Rates: TrendingDown,
  Trade: Globe,
  Other: Clock,
};

export default function EconomicCalendar() {
  const [filter, setFilter] = useState<"All" | EconEvent["type"]>("All");
  const [impactFilter, setImpactFilter] = useState<"All" | EconEvent["impact"]>("All");

  const { data: events, isLoading } = useQuery<EconEvent[]>({
    queryKey: ["economic-calendar"],
    queryFn: fetchEconEvents,
    refetchInterval: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (filter !== "All" && e.type !== filter) return false;
      if (impactFilter !== "All" && e.impact !== impactFilter) return false;
      return true;
    });
  }, [events, filter, impactFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const g: Record<string, EconEvent[]> = {};
    for (const e of filtered) {
      (g[e.date] ||= []).push(e);
    }
    return g;
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Economic Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Key macroeconomic releases from FRED</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["All", "GDP", "Inflation", "Employment", "Rates", "Trade"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === t ? "bg-primary text-white" : "bg-[#1e2433] text-muted-foreground hover:text-white"}`}
          >
            {t}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2a3142] mx-1" />
        {["All", "High", "Medium", "Low"].map((i) => (
          <button
            key={i}
            onClick={() => setImpactFilter(i as any)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${impactFilter === i ? "bg-primary text-white" : "bg-[#1e2433] text-muted-foreground hover:text-white"}`}
          >
            {i === "All" ? "All Impact" : i}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Clock className="w-5 h-5 animate-spin mr-2" /> Loading macro data...
        </div>
      )}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-20 text-muted-foreground">No events match your filters</div>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="sticky top-0 bg-[#0b0e14] z-10 py-2 px-1 border-b border-[#1e2433]">
              <span className="text-sm font-semibold">{new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="space-y-1 mt-1">
              {items.map((e) => {
                const Icon = TYPE_ICONS[e.type] || Clock;
                return (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded bg-[#0d1117] border border-[#1e2433] hover:border-[#2a3142] transition-colors">
                    <div className="w-8 h-8 rounded bg-[#1e2433] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{e.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${IMPACT_COLORS[e.impact]}`}>{e.impact}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {e.country}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                      <div>
                        <div className="text-[10px] text-muted-foreground">Actual</div>
                        <div className="text-sm font-mono font-semibold">{e.actual ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Previous</div>
                        <div className="text-sm font-mono">{e.previous ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">Forecast</div>
                        <div className="text-sm font-mono text-muted-foreground">—</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
