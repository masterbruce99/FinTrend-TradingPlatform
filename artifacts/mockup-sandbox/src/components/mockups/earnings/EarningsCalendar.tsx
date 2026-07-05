import { useState } from "react";

type EarningsEvent = {
  symbol: string;
  name: string;
  date: string;
  time: "BMO" | "AMC";
  epsEst: number;
  revEst: number;
  reactions: number[];
  mktCap: number;
  sector: string;
};

const EVENTS: EarningsEvent[] = [
  { symbol: "AAPL",  name: "Apple",           date: "Jun 2",  time: "AMC", epsEst: 1.58, revEst: 89.2, reactions: [3.2, -1.8, 5.4, -0.9, 2.1, 4.7, -2.3, 6.1], mktCap: 2900, sector: "Tech" },
  { symbol: "MSFT",  name: "Microsoft",       date: "Jun 2",  time: "AMC", epsEst: 2.94, revEst: 64.5, reactions: [4.1, 2.8, -1.2, 5.9, 3.4, -0.6, 7.2, 2.1],  mktCap: 2800, sector: "Tech" },
  { symbol: "TSLA",  name: "Tesla",           date: "Jun 3",  time: "AMC", epsEst: 0.42, revEst: 23.1, reactions: [-8.2, 12.4, -5.1, 15.3, -3.8, 8.9, -11.2, 6.7], mktCap: 590, sector: "Consumer" },
  { symbol: "META",  name: "Meta Platforms",  date: "Jun 3",  time: "AMC", epsEst: 5.12, revEst: 40.8, reactions: [6.8, -2.4, 9.1, 4.2, 12.3, -1.8, 5.6, 8.4],  mktCap: 1300, sector: "Tech" },
  { symbol: "AMZN",  name: "Amazon",          date: "Jun 4",  time: "AMC", epsEst: 1.24, revEst: 148.6,reactions: [5.2, -3.1, 8.4, 2.7, 6.9, -1.4, 4.8, 7.3],  mktCap: 1900, sector: "Consumer" },
  { symbol: "NVDA",  name: "Nvidia",          date: "Jun 4",  time: "AMC", epsEst: 5.22, revEst: 26.0, reactions: [14.2, 8.6, -4.3, 18.9, 5.7, 12.4, -2.1, 16.8], mktCap: 2200, sector: "Tech" },
  { symbol: "JPM",   name: "JP Morgan",       date: "Jun 5",  time: "BMO", epsEst: 4.12, revEst: 41.9, reactions: [2.1, -0.8, 3.4, 1.7, -1.2, 4.8, 0.6, 2.9],  mktCap: 580, sector: "Finance" },
  { symbol: "UNH",   name: "UnitedHealth",    date: "Jun 5",  time: "BMO", epsEst: 7.34, revEst: 102.4,reactions: [-3.2, 1.8, -5.6, 2.4, -1.9, 0.7, -4.1, 3.2], mktCap: 490, sector: "Health" },
  { symbol: "LLY",   name: "Eli Lilly",       date: "Jun 6",  time: "BMO", epsEst: 3.84, revEst: 11.9, reactions: [8.4, 5.2, -1.8, 12.6, 4.3, 9.1, -0.7, 7.8],  mktCap: 700, sector: "Health" },
  { symbol: "XOM",   name: "ExxonMobil",      date: "Jun 6",  time: "BMO", epsEst: 2.14, revEst: 84.2, reactions: [-2.4, 1.6, -4.1, 0.8, 2.3, -1.7, 3.4, -0.9], mktCap: 480, sector: "Energy" },
];

const DAYS = ["Jun 2", "Jun 3", "Jun 4", "Jun 5", "Jun 6"];

export function EarningsCalendar() {
  const [selected, setSelected] = useState<EarningsEvent | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [filterSector, setFilterSector] = useState("All");

  const sectors = ["All", ...Array.from(new Set(EVENTS.map((e) => e.sector)))];
  const filtered = EVENTS.filter((e) => filterSector === "All" || e.sector === filterSector);

  const avgReaction = (e: EarningsEvent) => e.reactions.reduce((s, r) => s + r, 0) / e.reactions.length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Earnings Calendar</span>
          <span className="text-xs text-[#8892a4]">Jun 2 – Jun 6, 2025</span>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-xs text-white outline-none"
            value={filterSector} onChange={(e) => setFilterSector(e.target.value)}>
            {sectors.map((s) => <option key={s} className="bg-[#131722]">{s}</option>)}
          </select>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["calendar", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 text-xs capitalize transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-4">
          {view === "calendar" ? (
            <div className="grid grid-cols-5 gap-3 h-full">
              {DAYS.map((day) => {
                const dayEvents = filtered.filter((e) => e.date === day);
                return (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="text-center py-2 bg-[#131722] border border-[#1e2433] rounded">
                      <p className="text-xs font-bold text-white">{day}</p>
                      <p className="text-[10px] text-[#8892a4]">{dayEvents.length} reports</p>
                    </div>
                    {dayEvents.map((ev) => {
                      const avg = avgReaction(ev);
                      return (
                        <button key={ev.symbol} onClick={() => setSelected(selected?.symbol === ev.symbol ? null : ev)}
                          className={`text-left p-3 rounded border transition-all ${selected?.symbol === ev.symbol ? "border-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{ev.symbol}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ev.time === "BMO" ? "bg-[#ffd60022] text-[#ffd600]" : "bg-[#00d4ff22] text-[#00d4ff]"}`}>{ev.time}</span>
                          </div>
                          <p className="text-[10px] text-[#8892a4] truncate">{ev.name}</p>
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[10px] text-[#8892a4]">Avg:</span>
                            <span className={`text-[10px] font-bold ${avg >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>
                              {avg >= 0 ? "+" : ""}{avg.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8892a4] border-b border-[#1e2433]">
                  {["Symbol", "Company", "Date", "Time", "EPS Est", "Rev Est", "Avg Reaction", "Sector"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => {
                  const avg = avgReaction(ev);
                  return (
                    <tr key={ev.symbol} onClick={() => setSelected(selected?.symbol === ev.symbol ? null : ev)}
                      className="border-b border-[#1e2433] hover:bg-[#131722] cursor-pointer">
                      <td className="py-3 pr-4 font-bold">{ev.symbol}</td>
                      <td className="py-3 pr-4 text-[#8892a4]">{ev.name}</td>
                      <td className="py-3 pr-4 text-[#8892a4]">{ev.date}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ev.time === "BMO" ? "bg-[#ffd60022] text-[#ffd600]" : "bg-[#00d4ff22] text-[#00d4ff]"}`}>{ev.time}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono">${ev.epsEst}</td>
                      <td className="py-3 pr-4 font-mono">${ev.revEst}B</td>
                      <td className={`py-3 pr-4 font-bold font-mono ${avg >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>{avg >= 0 ? "+" : ""}{avg.toFixed(1)}%</td>
                      <td className="py-3 pr-4 text-[#8892a4]">{ev.sector}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="w-72 border-l border-[#1e2433] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold">{selected.symbol}</p>
                <p className="text-xs text-[#8892a4]">{selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#131722] rounded p-2">
                <p className="text-[10px] text-[#8892a4]">EPS Est</p>
                <p className="text-sm font-bold">${selected.epsEst}</p>
              </div>
              <div className="bg-[#131722] rounded p-2">
                <p className="text-[10px] text-[#8892a4]">Rev Est</p>
                <p className="text-sm font-bold">${selected.revEst}B</p>
              </div>
            </div>

            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Historical Price Reactions</p>
            <div className="flex flex-col gap-1">
              {selected.reactions.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8892a4] w-12">Q-{selected.reactions.length - i}</span>
                  <div className="flex-1 h-5 bg-[#131722] rounded-sm overflow-hidden relative">
                    <div
                      className="h-full rounded-sm absolute top-0"
                      style={{
                        width: `${Math.abs(r) * 3}%`,
                        backgroundColor: r >= 0 ? "#00e676" : "#ff4444",
                        left: r >= 0 ? "50%" : undefined,
                        right: r < 0 ? "50%" : undefined,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold" style={{ color: r >= 0 ? "#00e676" : "#ff4444" }}>
                        {r >= 0 ? "+" : ""}{r.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1e2433] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Beat rate</span>
                <span className="text-[#00e676]">{selected.reactions.filter((r) => r > 0).length}/{selected.reactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Avg reaction</span>
                <span className={avgReaction(selected) >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}>
                  {avgReaction(selected) >= 0 ? "+" : ""}{avgReaction(selected).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Max up</span>
                <span className="text-[#00e676]">+{Math.max(...selected.reactions).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8892a4]">Max down</span>
                <span className="text-[#ff4444]">{Math.min(...selected.reactions).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
