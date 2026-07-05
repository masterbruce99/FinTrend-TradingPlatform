import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from "recharts";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8081/api`;

type Summary = {
  symbol: string;
  financialData: Record<string, number | string | null>;
  keyStatistics: Record<string, number | null>;
  recommendations: { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }[];
  upgradeDowngrades: { date: string | null; firm: string; toGrade: string; fromGrade: string; action: string }[];
  earnings: { quarterly: { date: string; epsActual: number; epsEstimate: number; surprisePercent: number }[]; nextEarningsDate: string | null };
  income:   { date: string; revenue: number; grossProfit: number; ebit: number; netIncome: number }[];
  balance:  { date: string; cash: number; totalAssets: number; totalDebt: number; equity: number }[];
  cashflow: { date: string; operatingCF: number; capex: number; fcf: number; dividends: number }[];
};

const TICKERS = ["AAPL","NVDA","META","AMZN","MSFT","GOOGL","TSLA","JPM"];

function fmtB(n: number | null | undefined, prefix = "$"): string {
  if (!n && n !== 0) return "—";
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`;
  return `${prefix}${n.toFixed(0)}`;
}
function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}
function fmtN(n: number | null | undefined, d = 2): string {
  if (n == null || isNaN(n as number)) return "—";
  return (n as number).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const CHART_TICK = { fontSize: 9, fill: "#8892a4" };
const CHART_STYLE = { backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 };

export function FinancialStatements() {
  const [ticker, setTicker]   = useState("AAPL");
  const [data, setData]       = useState<Summary | null>(null);
  const [view, setView]       = useState<"income"|"balance"|"cashflow"|"ratios"|"earnings">("income");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummary = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/finance/summary/${sym}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d: Summary = await res.json();
      setData(d);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(ticker); }, [ticker]);

  const fd = data?.financialData ?? {};
  const ks = data?.keyStatistics ?? {};

  const tabs: { key: typeof view; label: string }[] = [
    { key: "income",   label: "Income" },
    { key: "balance",  label: "Balance Sheet" },
    { key: "cashflow", label: "Cash Flow" },
    { key: "ratios",   label: "Key Ratios" },
    { key: "earnings", label: "Earnings" },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Financial Statements</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs font-medium text-[#00e676]">Live · Yahoo Finance</span>
          {lastUpdated && <span className="text-[10px] text-[#8892a4]">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {TICKERS.map(t => (
              <button key={t} onClick={() => setTicker(t)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${ticker === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{t}</button>
            ))}
          </div>
          <button onClick={() => fetchSummary(ticker)}
            className="px-3 py-1.5 text-[10px] font-bold rounded border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">↺</button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 px-4 py-2 rounded border border-[#ff444444] bg-[#ff444411] text-xs text-[#ff4444]">
          ⚠ {error} — make sure the API Server workflow is running.
        </div>
      )}

      {/* Key stats bar */}
      {data && (
        <div className="grid grid-cols-6 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-2 text-center">
          {[
            ["Revenue",     fmtB(fd.totalRevenue as number)],
            ["Net Margin",  fmtPct(fd.profitMargins as number)],
            ["FCF",         fmtB(fd.freeCashflow as number)],
            ["P/E",         fmtN(ks.trailingPE as number, 1)],
            ["EPS (TTM)",   `$${fmtN(ks.trailingEps as number)}`],
            ["ROE",         fmtPct(fd.returnOnEquity as number)],
          ].map(([l, v]) => (
            <div key={l}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold text-white font-mono">{v}</p></div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1e2433] px-5">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors mr-2 ${view === tab.key ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-[#8892a4] hover:text-white"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#8892a4] text-sm animate-pulse">Loading financial data from Yahoo Finance…</div>
      )}

      {!loading && !error && data && (
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-5">

          {/* Income Statement */}
          {view === "income" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-xs text-[#8892a4] mb-3">Annual Revenue & Net Income</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={data.income}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                      <XAxis dataKey="date" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} tickFormatter={v => fmtB(v)} />
                      <Tooltip contentStyle={CHART_STYLE} formatter={(v: number, n) => [fmtB(v), n === "revenue" ? "Revenue" : n === "grossProfit" ? "Gross Profit" : "Net Income"]} />
                      <Bar dataKey="revenue" fill="#00d4ff44" stroke="#00d4ff" name="revenue" />
                      <Bar dataKey="grossProfit" fill="#ffd60044" stroke="#ffd600" name="grossProfit" />
                      <Bar dataKey="netIncome" fill="#00e67644" stroke="#00e676" name="netIncome" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-xs text-[#8892a4] mb-3">Margins</p>
                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      ["Gross Margin",     fd.grossMargins,     "#00d4ff"],
                      ["Operating Margin", fd.operatingMargins, "#ffd600"],
                      ["Net Margin",       fd.profitMargins,    "#00e676"],
                      ["ROE",              fd.returnOnEquity,   "#a78bfa"],
                      ["ROA",              fd.returnOnAssets,   "#f472b6"],
                    ].map(([l, v, c]) => (
                      <div key={l as string}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#8892a4]">{l}</span>
                          <span className="font-mono font-bold" style={{ color: c as string }}>{fmtPct(v as number)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#0b0e14] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(Math.abs((v as number ?? 0) * 100), 100)}%`, backgroundColor: c as string }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-[#1e2433]">
                    <tr>
                      <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Metric</th>
                      {data.income.map(r => <th key={r.date} className="text-right py-2 px-4 text-[#8892a4] font-medium">{r.date}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Revenue",      data.income.map(r => r.revenue),     "#00d4ff"],
                      ["Gross Profit", data.income.map(r => r.grossProfit), "#ffd600"],
                      ["EBIT",         data.income.map(r => r.ebit),        "#a78bfa"],
                      ["Net Income",   data.income.map(r => r.netIncome),   "#00e676"],
                    ].map(([label, vals, color]) => (
                      <tr key={label as string} className="border-b border-[#1e2433]">
                        <td className="py-2 px-4 text-[#8892a4]">{label}</td>
                        {(vals as number[]).map((v, i) => (
                          <td key={i} className="py-2 px-4 text-right font-mono font-bold" style={{ color: color as string }}>{fmtB(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Balance Sheet */}
          {view === "balance" && (
            <>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                <p className="text-xs text-[#8892a4] mb-3">Assets, Debt & Equity</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.balance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="date" tick={CHART_TICK} />
                    <YAxis tick={CHART_TICK} tickFormatter={v => fmtB(v)} />
                    <Tooltip contentStyle={CHART_STYLE} formatter={(v: number, n) => [fmtB(v), n]} />
                    <Bar dataKey="totalAssets" fill="#00d4ff44" stroke="#00d4ff" name="Total Assets" />
                    <Bar dataKey="totalDebt"   fill="#ff444444" stroke="#ff4444" name="Total Debt" />
                    <Bar dataKey="equity"      fill="#00e67644" stroke="#00e676" name="Equity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-[#1e2433]">
                    <tr>
                      <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Metric</th>
                      {data.balance.map(r => <th key={r.date} className="text-right py-2 px-4 text-[#8892a4] font-medium">{r.date}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Cash & Equivalents", data.balance.map(r => r.cash),        "#00d4ff"],
                      ["Total Assets",       data.balance.map(r => r.totalAssets), "#a78bfa"],
                      ["Total Debt",         data.balance.map(r => r.totalDebt),   "#ff4444"],
                      ["Equity",             data.balance.map(r => r.equity),      "#00e676"],
                    ].map(([label, vals, color]) => (
                      <tr key={label as string} className="border-b border-[#1e2433]">
                        <td className="py-2 px-4 text-[#8892a4]">{label}</td>
                        {(vals as number[]).map((v, i) => (
                          <td key={i} className="py-2 px-4 text-right font-mono font-bold" style={{ color: color as string }}>{fmtB(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Cash Flow */}
          {view === "cashflow" && (
            <>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                <p className="text-xs text-[#8892a4] mb-3">Operating CF & Free Cash Flow</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.cashflow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="date" tick={CHART_TICK} />
                    <YAxis tick={CHART_TICK} tickFormatter={v => fmtB(v)} />
                    <Tooltip contentStyle={CHART_STYLE} formatter={(v: number, n) => [fmtB(v), n]} />
                    <Bar dataKey="operatingCF" fill="#00d4ff55" stroke="#00d4ff" name="Operating CF" />
                    <Bar dataKey="fcf"         fill="#00e67655" stroke="#00e676" name="Free CF" />
                    <Bar dataKey="capex"       fill="#ff444455" stroke="#ff4444" name="Capex" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-[#1e2433]">
                    <tr>
                      <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Metric</th>
                      {data.cashflow.map(r => <th key={r.date} className="text-right py-2 px-4 text-[#8892a4] font-medium">{r.date}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Operating CF", data.cashflow.map(r => r.operatingCF), "#00d4ff"],
                      ["Capex",        data.cashflow.map(r => r.capex),       "#ff4444"],
                      ["Free CF",      data.cashflow.map(r => r.fcf),         "#00e676"],
                      ["Dividends",    data.cashflow.map(r => r.dividends),   "#ffd600"],
                    ].map(([label, vals, color]) => (
                      <tr key={label as string} className="border-b border-[#1e2433]">
                        <td className="py-2 px-4 text-[#8892a4]">{label}</td>
                        {(vals as number[]).map((v, i) => (
                          <td key={i} className="py-2 px-4 text-right font-mono font-bold" style={{ color: color as string }}>{fmtB(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Key Ratios */}
          {view === "ratios" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "Valuation",
                  rows: [
                    ["Trailing P/E",  fmtN(ks.trailingPE, 1)],
                    ["Forward P/E",   fmtN(ks.forwardPE, 1)],
                    ["Price / Book",  fmtN(ks.priceToBook, 2)],
                    ["EV / EBITDA",   fmtN(ks.enterpriseToEbitda, 1)],
                    ["Beta",          fmtN(ks.beta, 2)],
                  ],
                },
                {
                  title: "Profitability",
                  rows: [
                    ["Gross Margin",  fmtPct(fd.grossMargins as number)],
                    ["Op Margin",     fmtPct(fd.operatingMargins as number)],
                    ["Net Margin",    fmtPct(fd.profitMargins as number)],
                    ["ROE",           fmtPct(fd.returnOnEquity as number)],
                    ["ROA",           fmtPct(fd.returnOnAssets as number)],
                  ],
                },
                {
                  title: "Per Share",
                  rows: [
                    ["EPS (TTM)",     `$${fmtN(ks.trailingEps)}`],
                    ["EPS (Fwd)",     `$${fmtN(ks.forwardEps)}`],
                    ["Book Value",    `$${fmtN(ks.bookValue)}`],
                    ["Revenue/Share", `$${fmtN(fd.revenuePerShare as number)}`],
                    ["Div Yield",     fmtPct(ks.dividendYield)],
                  ],
                },
                {
                  title: "Growth & Debt",
                  rows: [
                    ["Revenue Growth",   fmtPct(fd.revenueGrowth as number)],
                    ["Earnings Growth",  fmtPct(fd.earningsGrowth as number)],
                    ["52W Change",       fmtPct(ks.fiftyTwoWeekChange)],
                    ["Short Ratio",      fmtN(ks.shortRatio, 1)],
                    ["Institutions",     fmtPct(ks.heldPercentInstitutions)],
                  ],
                },
              ].map(section => (
                <div key={section.title} className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#1e2433] bg-[#0f1320]">
                    <p className="text-xs font-bold text-[#00d4ff]">{section.title}</p>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {section.rows.map(([l, v]) => (
                        <tr key={l} className="border-b border-[#1e2433]">
                          <td className="py-2 px-4 text-[#8892a4]">{l}</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-white">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Earnings */}
          {view === "earnings" && (
            <>
              {data.earnings.nextEarningsDate && (
                <div className="px-4 py-3 rounded-lg border border-[#ffd60044] bg-[#ffd60011] flex items-center gap-3 text-sm">
                  <span className="text-[#ffd600] font-bold">📅 Next Earnings:</span>
                  <span className="text-white font-mono">{data.earnings.nextEarningsDate}</span>
                </div>
              )}

              {data.earnings.quarterly.length > 0 && (
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-xs text-[#8892a4] mb-3">EPS: Actual vs Estimate</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.earnings.quarterly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                      <XAxis dataKey="date" tick={CHART_TICK} />
                      <YAxis tick={CHART_TICK} tickFormatter={v => `$${v.toFixed(2)}`} />
                      <Tooltip contentStyle={CHART_STYLE} formatter={(v: number, n) => [`$${v.toFixed(2)}`, n === "epsActual" ? "EPS Actual" : "EPS Estimate"]} />
                      <Bar dataKey="epsEstimate" fill="#ffd60044" stroke="#ffd600" name="epsEstimate" />
                      <Bar dataKey="epsActual"   fill="#00e67644" stroke="#00e676" name="epsActual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="border-b border-[#1e2433]">
                    <tr>
                      <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Quarter</th>
                      <th className="text-right py-2 px-4 text-[#8892a4] font-medium">EPS Actual</th>
                      <th className="text-right py-2 px-4 text-[#8892a4] font-medium">EPS Est.</th>
                      <th className="text-right py-2 px-4 text-[#8892a4] font-medium">Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.earnings.quarterly.map(q => {
                      const beat = (q.surprisePercent ?? 0) >= 0;
                      return (
                        <tr key={q.date} className="border-b border-[#1e2433]">
                          <td className="py-2 px-4 text-[#8892a4]">{q.date}</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-white">${fmtN(q.epsActual)}</td>
                          <td className="py-2 px-4 text-right font-mono text-[#8892a4]">${fmtN(q.epsEstimate)}</td>
                          <td className="py-2 px-4 text-right font-bold" style={{ color: beat ? "#00e676" : "#ff4444" }}>
                            {beat ? "+" : ""}{fmtN(q.surprisePercent, 1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {data.upgradeDowngrades.length > 0 && (
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#1e2433] bg-[#0f1320]">
                    <p className="text-xs font-bold text-[#00d4ff]">Recent Analyst Actions</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="border-b border-[#1e2433]">
                      <tr>
                        <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Date</th>
                        <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Firm</th>
                        <th className="text-left py-2 px-4 text-[#8892a4] font-medium">Action</th>
                        <th className="text-left py-2 px-4 text-[#8892a4] font-medium">To Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.upgradeDowngrades.slice(0, 8).map((u, i) => {
                        const isUp = u.action === "up";
                        return (
                          <tr key={i} className="border-b border-[#1e2433]">
                            <td className="py-2 px-4 text-[#8892a4]">{u.date}</td>
                            <td className="py-2 px-4 text-white">{u.firm}</td>
                            <td className="py-2 px-4 font-bold" style={{ color: isUp ? "#00e676" : u.action === "down" ? "#ff4444" : "#8892a4" }}>
                              {isUp ? "▲ Upgrade" : u.action === "down" ? "▼ Downgrade" : "— Maintain"}
                            </td>
                            <td className="py-2 px-4 text-white">{u.toGrade}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
