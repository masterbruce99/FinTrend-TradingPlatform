import { useState } from "react";

type AlertCondition = {
  id: number;
  symbol: string;
  condition: string;
  status: "active" | "triggered" | "paused";
  type: "price" | "indicator" | "pattern" | "trendline";
  lastTriggered?: string;
  repeat: boolean;
  channel: "email" | "sms" | "push";
};

const INITIAL_ALERTS: AlertCondition[] = [
  { id: 1, symbol: "AAPL", condition: "Price crosses above $250.00", status: "active", type: "price", repeat: true, channel: "push" },
  { id: 2, symbol: "TSLA", condition: "RSI(14) drops below 30", status: "triggered", type: "indicator", lastTriggered: "2m ago", repeat: false, channel: "email" },
  { id: 3, symbol: "NVDA", condition: "Ascending triangle breakout detected", status: "active", type: "pattern", repeat: false, channel: "push" },
  { id: 4, symbol: "SPY", condition: "Price touches support trendline", status: "paused", type: "trendline", repeat: true, channel: "sms" },
  { id: 5, symbol: "AAPL", condition: "MACD crosses above signal line", status: "active", type: "indicator", repeat: true, channel: "push" },
  { id: 6, symbol: "META", condition: "Volume > 3× 20-day average", status: "active", type: "indicator", repeat: false, channel: "email" },
  { id: 7, symbol: "QQQ", condition: "Price drops below 200-day MA", status: "triggered", type: "indicator", lastTriggered: "1h ago", repeat: true, channel: "push" },
];

const STATUS_COLOR = {
  active: "#00e676",
  triggered: "#ffd600",
  paused: "#8892a4",
};

const TYPE_COLOR = {
  price: "#00d4ff",
  indicator: "#a78bfa",
  pattern: "#fbbf24",
  trendline: "#34d399",
};

const CHANNEL_ICON = {
  email: "✉",
  sms: "📱",
  push: "🔔",
};

type Condition = { field: string; operator: string; value: string };

export function SmartAlerts() {
  const [alerts, setAlerts] = useState<AlertCondition[]>(INITIAL_ALERTS);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | AlertCondition["status"]>("all");
  const [newAlert, setNewAlert] = useState({ symbol: "AAPL", condition: "", channel: "push" as const });
  const [builderConditions, setBuilderConditions] = useState<Condition[]>([
    { field: "RSI(14)", operator: "crosses above", value: "50" }
  ]);

  const filtered = alerts.filter((a) => filterStatus === "all" || a.status === filterStatus);

  const toggleStatus = (id: number) => {
    setAlerts((prev) => prev.map((a) =>
      a.id === id
        ? { ...a, status: a.status === "active" ? "paused" : "active" }
        : a
    ));
  };

  const deleteAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const addCondition = () => {
    setBuilderConditions((prev) => [...prev, { field: "Price", operator: "crosses above", value: "" }]);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Smart Alerts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd60022] text-[#ffd600] border border-[#ffd60044]">
            {alerts.filter((a) => a.status === "triggered").length} Triggered
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00e67622] text-[#00e676] border border-[#00e67644]">
            {alerts.filter((a) => a.status === "active").length} Active
          </span>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="px-4 py-2 rounded text-xs font-bold bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff] transition-colors"
        >
          + New Alert
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-5 py-2 border-b border-[#1e2433]">
            {(["all", "active", "triggered", "paused"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-xs capitalize transition-colors ${filterStatus === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {filtered.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-4 px-5 py-4 border-b border-[#1e2433] hover:bg-[#0f1320] transition-colors group"
              >
                <div className="mt-0.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[alert.status] }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{alert.symbol}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                      style={{ backgroundColor: TYPE_COLOR[alert.type] + "22", color: TYPE_COLOR[alert.type] }}
                    >
                      {alert.type}
                    </span>
                    {alert.lastTriggered && (
                      <span className="text-[10px] text-[#ffd600]">Triggered {alert.lastTriggered}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#c8d3e0]">{alert.condition}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[#8892a4]">{CHANNEL_ICON[alert.channel]} {alert.channel}</span>
                    {alert.repeat && <span className="text-[10px] text-[#8892a4]">↻ Repeat</span>}
                    <span
                      className="text-[10px] capitalize"
                      style={{ color: STATUS_COLOR[alert.status] }}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleStatus(alert.id)}
                    className="px-2 py-1 rounded text-[10px] border border-[#1e2433] text-[#8892a4] hover:text-white hover:border-white transition-colors"
                  >
                    {alert.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-2 py-1 rounded text-[10px] border border-[#1e2433] text-[#ff4444] hover:bg-[#ff444422] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`w-72 border-l border-[#1e2433] flex flex-col transition-all ${creating ? "translate-x-0" : "hidden"}`}>
          <div className="px-4 py-3 border-b border-[#1e2433] flex items-center justify-between">
            <span className="text-sm font-bold">New Alert</span>
            <button onClick={() => setCreating(false)} className="text-[#8892a4] hover:text-white">✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-1.5">Symbol</p>
              <input
                className="w-full bg-[#131722] border border-[#1e2433] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff] uppercase"
                value={newAlert.symbol}
                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Conditions</p>
              {builderConditions.map((c, i) => (
                <div key={i} className="flex flex-col gap-1.5 mb-3 p-2 bg-[#131722] rounded border border-[#1e2433]">
                  <select className="bg-[#0b0e14] text-xs text-white rounded px-2 py-1 outline-none border border-[#1e2433]">
                    {["RSI(14)", "Price", "MACD", "Volume", "EMA(20)", "Bollinger"].map((f) => (
                      <option key={f} value={f} className="bg-[#131722]">{f}</option>
                    ))}
                  </select>
                  <select className="bg-[#0b0e14] text-xs text-white rounded px-2 py-1 outline-none border border-[#1e2433]">
                    {["crosses above", "crosses below", "is above", "is below", "> value"].map((o) => (
                      <option key={o} value={o} className="bg-[#131722]">{o}</option>
                    ))}
                  </select>
                  <input
                    className="bg-[#0b0e14] text-xs text-white rounded px-2 py-1.5 outline-none border border-[#1e2433]"
                    placeholder="Value"
                    defaultValue={c.value}
                  />
                </div>
              ))}
              <button onClick={addCondition} className="text-xs text-[#00d4ff] hover:underline">+ Add condition</button>
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Notify via</p>
              <div className="flex gap-2">
                {(["push", "email", "sms"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setNewAlert({ ...newAlert, channel: ch })}
                    className={`flex-1 py-2 rounded text-xs capitalize border transition-colors ${newAlert.channel === ch ? "border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] text-[#8892a4]"}`}
                  >
                    {CHANNEL_ICON[ch]} {ch}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setAlerts((prev) => [
                  {
                    id: Date.now(),
                    symbol: newAlert.symbol,
                    condition: "RSI(14) crosses above 50",
                    status: "active",
                    type: "indicator",
                    repeat: false,
                    channel: newAlert.channel,
                  },
                  ...prev,
                ]);
                setCreating(false);
              }}
              className="mt-auto px-4 py-2.5 rounded text-sm font-bold bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff] transition-colors"
            >
              Create Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
