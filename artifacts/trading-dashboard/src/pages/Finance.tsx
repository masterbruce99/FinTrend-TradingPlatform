import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useGetFinancialSummary } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PieChart, RefreshCw, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPercent, formatCompactNumber } from "@/lib/formatters";

export default function Finance() {
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [symbol, setSymbol] = useState("AAPL");

  const { data: fin, isLoading, error, refetch } = useGetFinancialSummary(
    symbol,
    { query: { enabled: !!symbol, queryKey: ["finance", symbol] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) setSymbol(symbolInput.trim().toUpperCase());
  };

  const fData = (fin?.financialData ?? {}) as Record<string, number | null>;
  const stats = (fin?.keyStatistics ?? {}) as Record<string, number | null>;
  const income = (fin?.income ?? []) as Array<Record<string, number | string | null>>;
  const balance = (fin?.balance ?? []) as Array<Record<string, number | string | null>>;
  const cashflow = (fin?.cashflow ?? []) as Array<Record<string, number | string | null>>;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-white tracking-tight">Financial Statements</h1>
            {fin?.source && (
              <span className="hidden md:inline text-[10px] font-mono text-muted-foreground px-2 py-1 bg-muted rounded border border-border">
                {fin.source}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full max-w-md">
            <form onSubmit={handleSearch} className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  placeholder="Symbol (e.g. AAPL)"
                  className="pl-9 font-mono uppercase bg-background border-border focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" variant="secondary">Load</Button>
            </form>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 max-w-7xl mx-auto w-full space-y-6">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground font-mono animate-pulse">Loading Financials from Yahoo Finance...</div>
          ) : error ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div className="text-sm font-mono">{error.message}</div>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : fin ? (
            <>
              {/* Top Snapshot */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SnapCard label="Total Cash" value={formatCompactNumber(fData?.totalCash)} />
                <SnapCard label="Total Debt" value={formatCompactNumber(fData?.totalDebt)} />
                <SnapCard label="Total Revenue" value={formatCompactNumber(fData?.totalRevenue)} />
                <SnapCard label="EBITDA" value={formatCompactNumber(fData?.ebitda)} />
                <SnapCard label="Gross Margin" value={formatPercent((fData.grossMargins ?? 0) * 100)} />
                <SnapCard label="Operating Margin" value={formatPercent((fData.operatingMargins ?? 0) * 100)} />
                <SnapCard label="Return on Equity" value={formatPercent((fData.returnOnEquity ?? 0) * 100)} />
                <SnapCard label="Forward PE" value={stats.forwardPE != null ? (stats.forwardPE as number).toFixed(2) : "\u2014"} />
                <SnapCard label="Revenue Growth" value={formatPercent((fData.revenueGrowth ?? 0) * 100)} />
                <SnapCard label="Earnings Growth" value={formatPercent((fData.earningsGrowth ?? 0) * 100)} />
                <SnapCard label="Free Cash Flow" value={formatCompactNumber(fData.freeCashflow)} />
                <SnapCard label="Beta" value={stats.beta != null ? (stats.beta as number).toFixed(2) : "\u2014"} />
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <StatementTable
                  title="Income Statement (Annual)"
                  data={income}
                  fields={[
                    { key: "totalRevenue", label: "Total Revenue" },
                    { key: "costOfRevenue", label: "Cost of Revenue" },
                    { key: "grossProfit", label: "Gross Profit" },
                    { key: "researchDevelopment", label: "R&D" },
                    { key: "sellingGeneralAdministrative", label: "SG&A" },
                    { key: "totalOperatingExpenses", label: "Total OpEx" },
                    { key: "operatingIncome", label: "Operating Income" },
                    { key: "interestExpense", label: "Interest Expense" },
                    { key: "incomeBeforeTax", label: "Pre-Tax Income" },
                    { key: "incomeTaxExpense", label: "Income Tax" },
                    { key: "netIncome", label: "Net Income" },
                    { key: "netIncomeApplicableToCommonShares", label: "Net Income (Common)" },
                  ]}
                />

                <StatementTable
                  title="Balance Sheet (Annual)"
                  data={balance}
                  fields={[
                    { key: "totalAssets", label: "Total Assets" },
                    { key: "totalLiab", label: "Total Liabilities" },
                    { key: "totalStockholderEquity", label: "Total Equity" },
                    { key: "cash", label: "Cash & Equiv" },
                    { key: "shortLongTermDebt", label: "Current Debt" },
                    { key: "longTermDebt", label: "Long-Term Debt" },
                    { key: "totalCurrentAssets", label: "Current Assets" },
                    { key: "totalCurrentLiabilities", label: "Current Liabilities" },
                    { key: "goodWill", label: "Goodwill" },
                    { key: "intangibleAssets", label: "Intangibles" },
                  ]}
                />

                <StatementTable
                  title="Cash Flow (Annual)"
                  data={cashflow}
                  fields={[
                    { key: "netIncome", label: "Net Income" },
                    { key: "depreciation", label: "Depreciation" },
                    { key: "changeToNetincome", label: "Adjustments to NI" },
                    { key: "changeToAccountReceivables", label: "Change in AR" },
                    { key: "changeToLiabilities", label: "Change in Liabilities" },
                    { key: "changeToInventory", label: "Change in Inventory" },
                    { key: "totalCashFromOperatingActivities", label: "Operating Cash Flow" },
                    { key: "capitalExpenditures", label: "CapEx" },
                    { key: "totalCashflowsFromInvestingActivities", label: "Investing Cash Flow" },
                    { key: "dividendsPaid", label: "Dividends Paid" },
                    { key: "repurchaseOfStock", label: "Buybacks" },
                    { key: "totalCashFromFinancingActivities", label: "Financing Cash Flow" },
                    { key: "changeInCash", label: "Net Change in Cash" },
                    { key: "freeCashflow", label: "Free Cash Flow" },
                  ]}
                />

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-sm font-bold text-white mb-4">Key Statistics</div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
                    <StatRow label="Trailing EPS" value={stats.trailingEps != null ? (stats.trailingEps as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Forward EPS" value={stats.forwardEps != null ? (stats.forwardEps as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Trailing P/E" value={stats.trailingPE != null ? (stats.trailingPE as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Forward P/E" value={stats.forwardPE != null ? (stats.forwardPE as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Price/Book" value={stats.priceToBook != null ? (stats.priceToBook as number).toFixed(2) : "\u2014"} />
                    <StatRow label="EV/EBITDA" value={stats.enterpriseToEbitda != null ? (stats.enterpriseToEbitda as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Short Ratio" value={stats.shortRatio != null ? (stats.shortRatio as number).toFixed(2) : "\u2014"} />
                    <StatRow label="Dividend Yield" value={stats.dividendYield != null ? `${((stats.dividendYield as number) * 100).toFixed(2)}%` : "\u2014"} />
                    <StatRow label="Payout Ratio" value={stats.payoutRatio != null ? `${((stats.payoutRatio as number) * 100).toFixed(1)}%` : "\u2014"} />
                    <StatRow label="Institutional %" value={stats.heldPercentInstitutions != null ? `${((stats.heldPercentInstitutions as number) * 100).toFixed(1)}%` : "\u2014"} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">Search a symbol to view financials.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function SnapCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{label}</div>
      <div className="text-xl font-mono font-bold text-white">{value}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/30 pb-1">
      <span className="text-muted-foreground font-sans text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function StatementTable({ title, data, fields }: { title: string; data: any[]; fields: { key: string; label: string }[] }) {
  if (!data || data.length === 0) return null;
  const columns = data.slice(0, 4);

  // Only render rows where at least one column has real data (> 0, non-null)
  const activeFields = fields.filter((f) =>
    columns.some((col) => col[f.key] != null && col[f.key] !== 0)
  );

  if (activeFields.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 font-bold text-white text-sm">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono text-right">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="p-3 text-left font-sans text-[10px] uppercase tracking-wider">Metric</th>
              {columns.map((col, i) => (
                <th key={i} className="p-3">{col.endDate || `Year ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {activeFields.map((f) => (
              <tr key={f.key} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 text-left font-sans text-muted-foreground font-medium">{f.label}</td>
                {columns.map((col, i) => (
                  <td key={i} className="p-3 text-white">
                    {col[f.key] != null ? formatCompactNumber(col[f.key]) : "\u2014"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
