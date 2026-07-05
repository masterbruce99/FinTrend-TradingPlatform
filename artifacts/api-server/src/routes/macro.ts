import { Router } from "express";

const router = Router();

const FRED_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv";

// Parse FRED CSV response → [{date, value}]
async function fetchFred(seriesId: string, limit = 120): Promise<{ date: string; value: number | null }[]> {
  const res = await fetch(`${FRED_BASE}?id=${seriesId}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/csv" },
  });
  if (!res.ok) throw new Error(`FRED ${res.status} for ${seriesId}`);
  const csv = await res.text();
  const lines = csv.trim().split("\n").slice(1); // skip header
  return lines.slice(-limit).map(line => {
    const [date, val] = line.split(",");
    const value = val?.trim() === "." ? null : parseFloat(val?.trim() ?? "");
    return { date: date?.trim(), value: isNaN(value as number) ? null : value };
  });
}

// Yield curve — all maturities at once — /api/macro/yieldcurve
const YC_SERIES: Record<string, string> = {
  "1M":  "DGS1MO",
  "3M":  "DGS3MO",
  "6M":  "DGS6MO",
  "1Y":  "DGS1",
  "2Y":  "DGS2",
  "3Y":  "DGS3",
  "5Y":  "DGS5",
  "7Y":  "DGS7",
  "10Y": "DGS10",
  "20Y": "DGS20",
  "30Y": "DGS30",
};

const SPREAD_SERIES: Record<string, string> = {
  "10Y-2Y": "T10Y2Y",
  "10Y-3M": "T10Y3M",
};

router.get("/macro/yieldcurve", async (_req, res) => {
  try {
    const [curveEntries, spreadEntries] = await Promise.all([
      Promise.all(Object.entries(YC_SERIES).map(async ([label, id]) => {
        const data = await fetchFred(id, 365);
        const valid = data.filter(d => d.value !== null);
        return { label, seriesId: id, current: valid.slice(-1)[0], monthAgo: valid.slice(-22)[0], yearAgo: valid.slice(-252)[0], history: valid.slice(-90) };
      })),
      Promise.all(Object.entries(SPREAD_SERIES).map(async ([label, id]) => {
        const data = await fetchFred(id, 365);
        const valid = data.filter(d => d.value !== null);
        return { label, seriesId: id, current: valid.slice(-1)[0], history: valid.slice(-180) };
      })),
    ]);

    const curveMap = Object.fromEntries(curveEntries.map((e: any) => [e.label, e]));
    const snapshot = Object.entries(YC_SERIES).map(([label]) => ({
      maturity: label,
      current:   curveMap[label]?.current?.value ?? null,
      monthAgo:  curveMap[label]?.monthAgo?.value ?? null,
      yearAgo:   curveMap[label]?.yearAgo?.value ?? null,
    }));

    return res.json({
      snapshot,
      maturities: curveEntries,
      spreads: spreadEntries,
      source: "FRED / Federal Reserve Bank of St. Louis",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Yield curve fetch failed", detail: err.message });
  }
});

// Macro dashboard — key economic indicators — /api/macro/dashboard
const MACRO_SERIES: { id: string; label: string; unit: string }[] = [
  { id: "FEDFUNDS",         label: "Fed Funds Rate",      unit: "%" },
  { id: "CPIAUCSL",         label: "CPI",                 unit: "idx" },
  { id: "CPILFESL",         label: "Core CPI",            unit: "idx" },
  { id: "UNRATE",           label: "Unemployment Rate",   unit: "%" },
  { id: "A191RL1Q225SBEA",  label: "Real GDP Growth",     unit: "%" },
  { id: "VIXCLS",           label: "VIX",                 unit: "pts" },
  { id: "T10Y2Y",           label: "10Y-2Y Spread",       unit: "%" },
  { id: "T10Y3M",           label: "10Y-3M Spread",       unit: "%" },
  { id: "DGS10",            label: "10Y Treasury",        unit: "%" },
  { id: "DGS2",             label: "2Y Treasury",         unit: "%" },
  { id: "DTWEXBGS",         label: "USD Index",           unit: "idx" },
  { id: "MORTGAGE30US",     label: "30Y Mortgage Rate",   unit: "%" },
];

router.get("/macro/dashboard", async (_req, res) => {
  try {
    const results = await Promise.allSettled(
      MACRO_SERIES.map(async s => {
        const data = await fetchFred(s.id, 36);
        const valid = data.filter(d => d.value !== null);
        const current = valid.slice(-1)[0];
        const prev = valid.slice(-2)[0];
        const yearAgo = valid.slice(-13)[0];
        const yoyChange = yearAgo?.value && current?.value
          ? ((current.value - yearAgo.value) / Math.abs(yearAgo.value)) * 100
          : null;
        return {
          id: s.id,
          label: s.label,
          unit: s.unit,
          value: current?.value ?? null,
          date: current?.date ?? null,
          prevValue: prev?.value ?? null,
          change: current?.value != null && prev?.value != null ? current.value - prev.value : null,
          yoyChange,
          history: valid.slice(-24),
        };
      })
    );

    const indicators = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { ...MACRO_SERIES[i], value: null, date: null, prevValue: null, change: null, yoyChange: null, history: [], error: (r.reason as any)?.message };
    });

    return res.json({ indicators, source: "FRED / Federal Reserve Bank of St. Louis", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "Macro dashboard fetch failed", detail: err.message });
  }
});

// FAANG news — Yahoo v7 blocked. Return gracefully.
router.get("/macro/faang-news", async (_req, res) => {
  return res.json({
    news: [],
    count: 0,
    dataSource: "Yahoo Finance news API is unavailable from server IPs. News will load directly in the browser via client-side fetch.",
    asOf: new Date().toISOString(),
  });
});

router.get("/macro/series/:seriesId", async (req, res) => {
  const { seriesId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "2"), 20);
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(seriesId)}&sort_order=desc&limit=${limit}&api_key=demo&file_type=json`;
    const r = await fetch(url);
    const data: any = await r.json();
    res.json({
      series: seriesId,
      observations: data?.observations || [],
      source: "FRED",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(502).json({ error: "Macro series failed", detail: err.message });
  }
});

export default router;
