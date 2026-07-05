import { useState, useEffect } from "react";

type DynAlert = {
  id: number;
  symbol: string;
  type: "MA Cross" | "Bollinger" | "Price Level" | "Volume" | "RSI";
  description: string;
  status: "watching" | "triggered" | "near";
  current: number;
  target: number;
  unit: string;
  distance: number;
  color: string;
};

const INITIAL_ALERTS: DynAlert[] = [
  { id: 1, symbol: "AAPL",  type: "MA Cross",     description: "Price crosses above EMA(20)",     status: "near",      current: 241.32, target: 243.80, unit: "$",  distance: 1.02, color: "#00d4ff" },
  { id: 2, symbol: "TSLA",  type: "Bollinger",    description: "Price touches upper Bollinger Band", status: "watching", current: 245.10, target: 262.40, unit: "$",  distance: 7.06, color: "#a78bfa" },
  { id: 3, symbol: "NVDA",  type: "RSI",          description: "RSI(14) crosses above 70",        status: "near",      current: 68.4,   target: 70,     unit: "",   distance: 2.33, color: "#ffd600" },
  { id: 4, symbol: "SPY",   type: "Price Level",  description: "Price crosses above $530",         status: "watching", current: 518.20, target: 530,    unit: "$",  distance: 2.27, color: "#00e676" },
  { id: 5, symbol: "META",  type: "MA Cross",     description: "EMA(9) crosses above EMA(21)",    status: "triggered", current: 524.30, target: 521.10, unit: "$",  distance: 0,    color: "#00e676" },
  { id: 6, symbol: "AMZN",  type: "Volume",       description: "Volume > 2× 20-day average",      status: "watching", current: 0.8,    target: 2.0,    unit: "×",  distance: 150,  color: "#ff8c00" },
  { id: 7, symbol: "QQQ",   type: "Bollinger",    description: "Price touches lower Bollinger Band", status: "watching", current: 448.60, target: 432.20, unit: "$",  distance: 3.65, color: "#ff4444" },
];

const SIMULATED_PRICES: Record<string, number> = {
  AAPL: 241.32, TSLA: 245.10, NVDA: 875.40, SPY: 518.20, META: 524.30, AMZN: 198.80, QQQ: 448.60,
};

function DistanceBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${100 - pct}%`,
          backgroundColor: pct < 5 ? "#ffd600" : pct < 15 ? "#00e676" : "#8892a4",
        }}
      />
    </div>
  );
}

export function DynamicAlerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [creating, setCreating] = useState(false);
  const [newSymbol, setNewSymbol] = useState("AAPL");
  const [newType, setNewType] = useState<DynAlert["type"]>("MA Cross");
  const [newTarget, setNewTarget] = useState("");
  const [prices, setPrices] = useState(SIMULATED_PRICES);

  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) => Object.fromEntries(
        Object.entries(prev).map(([k, v]) => [k, v + (Math.random() - 0.49) * 0.5])
      ));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const dismiss = (id: number) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Dynamic Price Alerts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd60022] text-[#ffd600]">
            {alerts.filter((a) => a.status === "near").length} Near
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00e67622] text-[#00e676]">
            {alerts.filter((a) => a.status === "triggered").length} Triggered
          </span>
        </div>
        <button onClick={() => setCreating(!creating)}
          className="px-4 py-2 rounded text-xs font-bold bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff] transition-colors">
          + New Alert
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => {
              const livePrice = prices[alert.symbol] ?? alert.current;
              const pctToTarget = Math.abs((alert.target - livePrice) / alert.target) * 100;
              const statusColor = alert.status === "triggered" ? "#00e676" : alert.status === "near" ? "#ffd600" : "#8892a4";

              return (
                <div key={alert.id}
                  className={`bg-[#131722] border rounded-lg p-4 transition-all ${alert.status === "triggered" ? "border-[#00e676]" : alert.status === "near" ? "border-[#ffd600]" : "border-[#1e2433]"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: statusColor }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{alert.symbol}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: alert.color + "22", color: alert.color }}>{alert.type}</span>
                          <span className="text-xs capitalize" style={{ color: statusColor }}>{alert.status}</span>
                        </div>
                        <p className="text-xs text-[#8892a4] mt-0.5">{alert.description}</p>
                      </div>
                    </div>
                    <button onClick={() => dismiss(alert.id)} className="text-[#8892a4] hover:text-white text-xs">✕</button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-[10px] text-[#8892a4]">Current</p>
                      <p className="text-sm font-bold font-mono text-white">
                        {alert.unit === "$" ? "$" : ""}{livePrice.toFixed(alert.unit === "" ? 1 : 2)}{alert.unit !== "$" ? alert.unit : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8892a4]">Target</p>
                      <p className="text-sm font-bold font-mono" style={{ color: alert.color }}>
                        {alert.unit === "$" ? "$" : ""}{alert.target.toFixed(2)}{alert.unit !== "$" ? alert.unit : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8892a4]">Distance</p>
                      <p className="text-sm font-bold font-mono" style={{ color: pctToTarget < 3 ? "#ffd600" : "#8892a4" }}>
                        {alert.status === "triggered" ? "Triggered!" : `${pctToTarget.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>

                  {alert.status !== "triggered" && (
                    <DistanceBar pct={pctToTarget} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {creating && (
          <div className="w-68 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">New Dynamic Alert</span>
              <button onClick={() => setCreating(false)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1.5">Symbol</p>
              <input className="w-full bg-[#131722] border border-[#1e2433] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff] uppercase"
                value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} />
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1.5">Alert Type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["MA Cross", "Bollinger", "Price Level", "Volume", "RSI"] as const).map((t) => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`py-1.5 rounded text-xs border transition-colors ${newType === t ? "border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] text-[#8892a4]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1.5">Target Value</p>
              <input className="w-full bg-[#131722] border border-[#1e2433] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff]"
                placeholder={newType === "RSI" ? "e.g. 70" : "e.g. 250.00"}
                value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1.5">Notify When</p>
              {["Within 1%", "Within 2%", "Exactly at target"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#1e2433] flex items-center justify-center">
                    {opt === "Within 2%" && <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />}
                  </div>
                  <span className="text-xs text-[#8892a4]">{opt}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                setAlerts((prev) => [{
                  id: Date.now(), symbol: newSymbol, type: newType,
                  description: `${newType} alert for ${newSymbol}`,
                  status: "watching", current: 241, target: Number(newTarget) || 250,
                  unit: "$", distance: 3.7, color: "#00d4ff",
                }, ...prev]);
                setCreating(false);
                setNewTarget("");
              }}
              className="mt-auto py-2.5 rounded text-sm font-bold bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff] transition-colors">
              Create Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
