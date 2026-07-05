import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from "recharts";

const EQUITY_CURVE = Array.from({ length: 60 }, (_, i) => {
  const base = 10000 * (1 + i * 0.012);
  const noise = Math.sin(i * 0.8) * 300 + Math.cos(i * 0.5) * 200;
  const drawdown = i > 22 && i < 32 ? -800 * Math.sin((i - 22) * 0.35) : 0;
  return {
    bar: i + 1,
    equity: Math.max(9000, base + noise + drawdown),
    benchmark: 10000 * (1 + i * 0.008 + Math.sin(i * 0.4) * 0.02),
  };
});

const TRADES = [
  { id: 1, symbol: "AAPL", entry: 198.50, exit: 214.20, pnl: 470, pct: 7.91, bars: 12, type: "Long" },
  { id: 2, symbol: "AAPL", entry: 221.30, exit: 218.60, pnl: -81, pct: -1.22, bars: 4, type: "Long" },
  { id: 3, symbol: "AAPL", entry: 224.10, exit: 238.90, pnl: 444, pct: 6.60, bars: 18, type: "Long" },
  { id: 4, symbol: "AAPL", entry: 235.60, exit: 231.20, pnl: -132, pct: -1.87, bars: 6, type: "Long" },
  { id: 5, symbol: "AAPL", entry: 237.80, exit: 254.30, pnl: 495, pct: 6.93, bars: 14, type: "Long" },
  { id: 6, symbol: "AAPL", entry: 248.90, exit: 244.10, pnl: -144, pct: -1.93, bars: 5, type: "Long" },
];

const STATS = [
  { label: "Net P&L", value: "+$2,452", color: "#00e676" },
  { label: "Win Rate", value: "66.7%", color: "#00e676" },
  { label: "Profit Factor", value: "2.84", color: "#00e676" },
  { label: "Max Drawdown", value: "-8.4%", color: "#ff4444" },
  { label: "Sharpe Ratio", value: "1.82", color: "#00d4ff" },
  { label: "Total Trades", value: "6", color: "#8892a4" },
  { label: "Avg Win", value: "+$469.67", color: "#00e676" },
  { label: "Avg Loss", value: "-$119.00", color: "#ff4444" },
];

export function StrategyBuilder() {
  const [activeTab, setActiveTab] = useState<"overview" | "trades" | "settings">("overview");
  const [entryCondition, setEntryCondition] = useState("RSI(14) crosses above 30");
  const [exitCondition, setExitCondition] = useState("RSI(14) crosses below 70");
  const [stopLoss, setStopLoss] = useState("2");
  const [takeProfit, setTakeProfit] = useState("6");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Strategy Builder</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">AAPL • 1D • 2023–2024</span>
        </div>
        <button
          onClick={handleRun}
          className={`px-5 py-2 rounded text-sm font-bold transition-all ${isRunning ? "bg-[#1e3a5f] text-[#00d4ff]" : "bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff]"}`}
        >
          {isRunning ? "Running..." : "Run Backtest"}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-64 border-r border-[#1e2433] p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Entry Condition</p>
            <textarea
              className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-2 text-xs text-white outline-none focus:border-[#00d4ff] transition-colors resize-none font-mono"
              rows={2}
              value={entryCondition}
              onChange={(e) => setEntryCondition(e.target.value)}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Exit Condition</p>
            <textarea
              className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-2 text-xs text-white outline-none focus:border-[#00d4ff] transition-colors resize-none font-mono"
              rows={2}
              value={exitCondition}
              onChange={(e) => setExitCondition(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1">Stop Loss %</p>
              <input
                type="number"
                className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#ff4444] transition-colors"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1">Take Profit %</p>
              <input
                type="number"
                className="w-full bg-[#131722] border border-[#1e2433] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#00e676] transition-colors"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Stats</p>
            <div className="grid grid-cols-1 gap-2">
              {STATS.map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8892a4]">{label}</span>
                  <span className="text-xs font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex border-b border-[#1e2433]">
            {(["overview", "trades", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-medium capitalize transition-colors border-b-2 ${activeTab === tab ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-[#8892a4] hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="flex-1 p-4 flex flex-col gap-4">
              <div>
                <p className="text-xs text-[#8892a4] mb-2">Equity Curve vs Benchmark</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={EQUITY_CURVE} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                    <XAxis dataKey="bar" tick={{ fontSize: 10, fill: "#8892a4" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#8892a4" }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", borderRadius: 4 }}
                      labelStyle={{ color: "#8892a4", fontSize: 10 }}
                      itemStyle={{ fontSize: 10 }}
                      formatter={(v: number) => [`$${v.toFixed(0)}`, ""]}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#00e676" strokeWidth={2} fill="url(#eq)" name="Strategy" />
                    <Line type="monotone" dataKey="benchmark" stroke="#8892a4" strokeWidth={1} dot={false} name="Benchmark" strokeDasharray="3 3" />
                    <ReferenceLine y={10000} stroke="#1e2433" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "trades" && (
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#8892a4] border-b border-[#1e2433]">
                    {["#", "Symbol", "Type", "Entry", "Exit", "P&L", "%", "Bars"].map((h) => (
                      <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRADES.map((t) => (
                    <tr key={t.id} className="border-b border-[#1e2433] hover:bg-[#131722] transition-colors">
                      <td className="py-2 pr-4 text-[#8892a4]">{t.id}</td>
                      <td className="py-2 pr-4 font-bold">{t.symbol}</td>
                      <td className="py-2 pr-4">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1a2a1a] text-[#00e676]">{t.type}</span>
                      </td>
                      <td className="py-2 pr-4 font-mono">${t.entry.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono">${t.exit.toFixed(2)}</td>
                      <td className={`py-2 pr-4 font-bold font-mono ${t.pnl >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl}
                      </td>
                      <td className={`py-2 pr-4 font-mono ${t.pct >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                        {t.pct >= 0 ? "+" : ""}{t.pct.toFixed(2)}%
                      </td>
                      <td className="py-2 text-[#8892a4]">{t.bars}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex-1 p-4 flex flex-col gap-4 max-w-md">
              {[
                { label: "Initial Capital", value: "$10,000" },
                { label: "Commission", value: "0.05%" },
                { label: "Slippage", value: "0.01%" },
                { label: "Position Sizing", value: "100% of equity" },
                { label: "Max Open Trades", value: "1" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-[#1e2433] pb-3">
                  <span className="text-sm text-[#8892a4]">{label}</span>
                  <input
                    defaultValue={value}
                    className="bg-[#131722] border border-[#1e2433] rounded px-3 py-1 text-xs text-white outline-none focus:border-[#00d4ff] w-36 text-right"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
