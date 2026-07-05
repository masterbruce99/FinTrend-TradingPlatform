import { useState } from "react";

type EconEvent = {
  id: number;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  forecast: string;
  previous: string;
  actual?: string;
  marketImpact: string[];
};

const EVENTS: EconEvent[] = [
  { id:1,  time:"08:30", country:"US", flag:"🇺🇸", event:"Non-Farm Payrolls",          impact:"High",   forecast:"185K",    previous:"175K",   actual:"212K",  marketImpact:["SPY","DXY","TLT"] },
  { id:2,  time:"08:30", country:"US", flag:"🇺🇸", event:"Unemployment Rate",           impact:"High",   forecast:"3.9%",    previous:"3.9%",   actual:"3.8%",  marketImpact:["SPY","DXY"] },
  { id:3,  time:"08:30", country:"US", flag:"🇺🇸", event:"Average Hourly Earnings",     impact:"High",   forecast:"0.3%",    previous:"0.4%",   actual:"0.4%",  marketImpact:["TLT","DXY"] },
  { id:4,  time:"10:00", country:"US", flag:"🇺🇸", event:"ISM Manufacturing PMI",       impact:"Medium", forecast:"49.8",    previous:"49.2",               marketImpact:["SPY","XOM"] },
  { id:5,  time:"10:00", country:"US", flag:"🇺🇸", event:"Michigan Consumer Sentiment",  impact:"Medium", forecast:"78.0",    previous:"77.2",               marketImpact:["SPY","XLY"] },
  { id:6,  time:"11:00", country:"EU", flag:"🇪🇺", event:"ECB Interest Rate Decision",   impact:"High",   forecast:"4.25%",   previous:"4.50%",              marketImpact:["EUR/USD","EWG"] },
  { id:7,  time:"12:30", country:"US", flag:"🇺🇸", event:"Fed Chair Powell Speech",      impact:"High",   forecast:"—",       previous:"—",                  marketImpact:["SPY","TLT","GLD"] },
  { id:8,  time:"14:00", country:"US", flag:"🇺🇸", event:"FOMC Meeting Minutes",         impact:"High",   forecast:"—",       previous:"—",                  marketImpact:["SPY","TLT","DXY"] },
  { id:9,  time:"14:30", country:"US", flag:"🇺🇸", event:"Crude Oil Inventories",        impact:"Medium", forecast:"-1.2M",   previous:"-2.4M",              marketImpact:["XOM","CVX","USO"] },
  { id:10, time:"15:00", country:"CA", flag:"🇨🇦", event:"Bank of Canada Rate Decision", impact:"Medium", forecast:"4.75%",   previous:"5.00%",              marketImpact:["USD/CAD"] },
  { id:11, time:"Tomorrow", country:"US", flag:"🇺🇸", event:"CPI (Core) YoY",           impact:"High",   forecast:"3.2%",    previous:"3.4%",               marketImpact:["SPY","TLT","GLD","DXY"] },
  { id:12, time:"Tomorrow", country:"US", flag:"🇺🇸", event:"Retail Sales MoM",          impact:"High",   forecast:"0.4%",    previous:"0.1%",               marketImpact:["SPY","XLY"] },
];

const IMPACT_COLOR = { High: "#ff4444", Medium: "#ffd600", Low: "#00e676" };
const IMPACT_BG = { High: "#ff444422", Medium: "#ffd60022", Low: "#00e67622" };

export function EconCalendar() {
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const [selected, setSelected] = useState<EconEvent | null>(EVENTS[0]);

  const filtered = EVENTS.filter((e) => filter === "all" || e.impact === filter);
  const released = filtered.filter((e) => e.actual);
  const upcoming = filtered.filter((e) => !e.actual);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Economic Calendar</span>
          <span className="text-xs text-[#8892a4]">Jun 6, 2025</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs text-[#00e676]">Live</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["all", "High", "Medium", "Low"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs transition-colors ${filter === f ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}
              style={filter === f && f !== "all" ? { color: IMPACT_COLOR[f] } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          {released.length > 0 && (
            <div>
              <div className="px-5 py-1.5 bg-[#0d1018] border-b border-[#1e2433] text-[10px] text-[#8892a4] uppercase tracking-widest">
                Released
              </div>
              {released.map((ev) => {
                const beats = ev.actual && ev.forecast && parseFloat(ev.actual) > parseFloat(ev.forecast);
                return (
                  <div key={ev.id} onClick={() => setSelected(ev)}
                    className={`flex items-center gap-4 px-5 py-3 border-b border-[#1e2433] cursor-pointer transition-colors opacity-70 ${selected?.id === ev.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                    <span className="text-xs text-[#8892a4] w-16 font-mono">{ev.time}</span>
                    <span className="text-base">{ev.flag}</span>
                    <div className="flex-1">
                      <p className="text-xs text-white">{ev.event}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ev.marketImpact.map((m) => <span key={m} className="text-[9px] bg-[#1e2433] text-[#8892a4] px-1 py-0.5 rounded">{m}</span>)}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: IMPACT_BG[ev.impact], color: IMPACT_COLOR[ev.impact] }}>{ev.impact}</span>
                    <div className="text-right text-xs">
                      <div className="text-[#8892a4]">Fcst: {ev.forecast}</div>
                      <div className="text-[#8892a4]">Prev: {ev.previous}</div>
                    </div>
                    <div className={`text-sm font-bold font-mono w-16 text-right ${beats ? "text-[#00e676]" : "text-[#ff4444]"}`}>{ev.actual}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <div className="px-5 py-1.5 bg-[#0d1018] border-b border-[#1e2433] text-[10px] text-[#8892a4] uppercase tracking-widest">
              Upcoming
            </div>
            {upcoming.map((ev) => (
              <div key={ev.id} onClick={() => setSelected(ev)}
                className={`flex items-center gap-4 px-5 py-3 border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.id === ev.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                <span className="text-xs text-white w-16 font-mono font-medium">{ev.time}</span>
                <span className="text-base">{ev.flag}</span>
                <div className="flex-1">
                  <p className="text-xs text-white font-medium">{ev.event}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ev.marketImpact.map((m) => <span key={m} className="text-[9px] bg-[#1e2433] text-[#8892a4] px-1 py-0.5 rounded">{m}</span>)}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: IMPACT_BG[ev.impact], color: IMPACT_COLOR[ev.impact] }}>{ev.impact}</span>
                <div className="text-right text-xs">
                  <div className="text-[#8892a4]">Fcst: {ev.forecast}</div>
                  <div className="text-[#8892a4]">Prev: {ev.previous}</div>
                </div>
                <div className="w-16 text-right text-[#8892a4] text-xs">—</div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="w-64 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selected.flag}</span>
                <span className="text-xs text-[#8892a4]">{selected.country}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold ml-auto" style={{ backgroundColor: IMPACT_BG[selected.impact], color: IMPACT_COLOR[selected.impact] }}>{selected.impact} Impact</span>
              </div>
              <p className="text-sm font-bold text-white">{selected.event}</p>
              <p className="text-xs text-[#8892a4] mt-0.5">{selected.time}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Forecast", val: selected.forecast, color: "#8892a4" },
                { label: "Previous", val: selected.previous, color: "#8892a4" },
                { label: "Actual", val: selected.actual ?? "Pending", color: selected.actual ? "#00e676" : "#ffd600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#131722] border border-[#1e2433] rounded p-2 text-center">
                  <p className="text-[9px] text-[#8892a4]">{label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Affected Markets</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.marketImpact.map((m) => (
                  <span key={m} className="px-2 py-1 bg-[#131722] border border-[#1e2433] rounded text-xs text-[#00d4ff] font-bold">{m}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1e2433] pt-3">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Historical Surprises</p>
              {[0.4, -0.2, 0.6, 0.1, -0.3, 0.8].map((delta, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-[#8892a4] w-8">Q-{i + 1}</span>
                  <div className="flex-1 h-3 bg-[#131722] rounded-sm overflow-hidden relative">
                    <div className="h-full rounded-sm absolute top-0"
                      style={{ width: `${Math.abs(delta) * 60}%`, backgroundColor: delta >= 0 ? "#00e676" : "#ff4444", [delta >= 0 ? "left" : "right"]: "50%" }} />
                  </div>
                  <span className="text-[10px] font-bold w-12 text-right" style={{ color: delta >= 0 ? "#00e676" : "#ff4444" }}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)}σ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
