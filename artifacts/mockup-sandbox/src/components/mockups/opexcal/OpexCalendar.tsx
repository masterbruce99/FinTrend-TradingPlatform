import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

type ExpiryEvent = {
  date: string; day: number; month: number; label: string;
  type: "Monthly" | "Weekly" | "Quarterly" | "LEAPS";
  oi: number; putOI: number; callOI: number; gamma: number; isOpex: boolean;
};

const EXPIRY_EVENTS: ExpiryEvent[] = [
  { date:"Jun 7",  day:7,  month:6, label:"Weekly",    type:"Weekly",    oi:284000,  putOI:148000, callOI:136000, gamma:0.024, isOpex:false },
  { date:"Jun 14", day:14, month:6, label:"Weekly",    type:"Weekly",    oi:342000,  putOI:182000, callOI:160000, gamma:0.038, isOpex:false },
  { date:"Jun 20", day:20, month:6, label:"Monthly",   type:"Monthly",   oi:2840000, putOI:1480000,callOI:1360000,gamma:0.184, isOpex:true  },
  { date:"Jun 21", day:21, month:6, label:"Saturday",  type:"Weekly",    oi:124000,  putOI:68000,  callOI:56000,  gamma:0.012, isOpex:false },
  { date:"Jun 28", day:28, month:6, label:"Weekly",    type:"Weekly",    oi:484000,  putOI:248000, callOI:236000, gamma:0.042, isOpex:false },
  { date:"Jul 5",  day:5,  month:7, label:"Weekly",    type:"Weekly",    oi:312000,  putOI:164000, callOI:148000, gamma:0.028, isOpex:false },
  { date:"Jul 12", day:12, month:7, label:"Weekly",    type:"Weekly",    oi:268000,  putOI:142000, callOI:126000, gamma:0.022, isOpex:false },
  { date:"Jul 18", day:18, month:7, label:"Monthly",   type:"Monthly",   oi:3240000, putOI:1680000,callOI:1560000,gamma:0.212, isOpex:true  },
  { date:"Sep 19", day:19, month:9, label:"Quarterly", type:"Quarterly", oi:8480000, putOI:4280000,callOI:4200000,gamma:0.484, isOpex:true  },
  { date:"Dec 19", day:19, month:12,label:"Quarterly", type:"Quarterly", oi:12400000,putOI:6400000,callOI:6000000,gamma:0.824, isOpex:true  },
];

const GEX_DATA = [
  { strike:490, gex:-2.4 }, { strike:495, gex:-1.8 }, { strike:500, gex:-0.8 }, { strike:505, gex:1.2 },
  { strike:510, gex:3.4 }, { strike:515, gex:6.8 }, { strike:520, gex:8.4 }, { strike:523, gex:4.2 },
  { strike:525, gex:2.1 }, { strike:530, gex:-1.4 }, { strike:535, gex:-3.2 }, { strike:540, gex:-4.8 },
  { strike:545, gex:-2.2 }, { strike:550, gex:0.8 },
];

const TYPE_COLOR: Record<string, string> = { Monthly:"#00d4ff", Weekly:"#8892a4", Quarterly:"#ff8c00", LEAPS:"#a78bfa" };

export function OpexCalendar() {
  const [view, setView] = useState<"calendar" | "gex" | "oi">("calendar");
  const [selected, setSelected] = useState<ExpiryEvent | null>(EXPIRY_EVENTS[2]);

  const flipGex = GEX_DATA.find((d) => {
    const idx = GEX_DATA.findIndex((g) => g.gex > 0);
    return idx > 0 && GEX_DATA[idx - 1].gex < 0;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Options OPEX Calendar</span>
          <span className="text-xs text-[#8892a4]">SPY — Expiry & Gamma Exposure</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["calendar","gex","oi"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "gex" ? "Gamma Exposure" : v === "oi" ? "Open Interest" : "Expiry Calendar"}
            </button>
          ))}
        </div>
      </div>

      {view === "calendar" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 p-4 overflow-auto">
            <p className="text-xs text-[#8892a4] mb-4">Upcoming Expirations — SPY Options</p>
            <div className="space-y-2">
              {EXPIRY_EVENTS.map((ev) => (
                <button key={ev.date} onClick={() => setSelected(selected?.date === ev.date ? null : ev)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border transition-all text-left ${selected?.date === ev.date ? "border-[#00d4ff] bg-[#00d4ff0a]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                  <div className="w-20 text-center">
                    <p className="text-base font-bold text-white">{ev.date}</p>
                    {ev.isOpex && <p className="text-[9px] bg-[#ffd60022] text-[#ffd600] rounded px-1">OPEX</p>}
                  </div>
                  <div className="w-24">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: TYPE_COLOR[ev.type] + "22", color: TYPE_COLOR[ev.type] }}>{ev.type}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#8892a4]">OI:</span>
                      <span className="font-bold text-white">{(ev.oi / 1000000).toFixed(2)}M</span>
                      <span className="text-[#00e676] ml-2">C: {(ev.callOI / 1000).toFixed(0)}K</span>
                      <span className="text-[#ff4444]">P: {(ev.putOI / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1e2433] rounded-full overflow-hidden mt-1.5 flex">
                      <div className="h-full bg-[#00e676]" style={{ width: `${(ev.callOI / ev.oi) * 100}%` }} />
                      <div className="h-full bg-[#ff4444]" style={{ width: `${(ev.putOI / ev.oi) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8892a4]">Gamma Exposure</p>
                    <p className="text-sm font-bold" style={{ color: ev.gamma > 0.1 ? "#ff4444" : "#ffd600" }}>{ev.gamma.toFixed(3)}B$</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-4">
              <div>
                <p className="text-lg font-bold text-white">{selected.date}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: TYPE_COLOR[selected.type] + "22", color: TYPE_COLOR[selected.type] }}>{selected.type} Expiry</span>
                {selected.isOpex && <span className="ml-2 text-[9px] bg-[#ffd60022] text-[#ffd600] rounded px-1 py-0.5">OPEX</span>}
              </div>
              {[
                ["Total OI",  `${(selected.oi / 1e6).toFixed(2)}M`, "white"],
                ["Call OI",   `${(selected.callOI / 1000).toFixed(0)}K`, "#00e676"],
                ["Put OI",    `${(selected.putOI / 1000).toFixed(0)}K`, "#ff4444"],
                ["P/C Ratio", (selected.putOI / selected.callOI).toFixed(2), selected.putOI / selected.callOI > 1 ? "#ff4444" : "#00e676"],
                ["GEX",       `${selected.gamma.toFixed(3)}B$`, selected.gamma > 0.1 ? "#ff8c00" : "#ffd600"],
              ].map(([l,v,c]) => (
                <div key={l as string} className="flex justify-between text-xs border-b border-[#1e2433] pb-2">
                  <span className="text-[#8892a4]">{l}</span>
                  <span className="font-bold" style={{ color: c as string }}>{v}</span>
                </div>
              ))}
              <div className="bg-[#131722] border border-[#1e2433] rounded p-3 text-xs text-[#8892a4] leading-relaxed">
                {selected.isOpex ? "OPEX = high gamma exposure. Expect pinning near high-OI strikes and potential volatility spike." : "Weekly expiry — typically lower gamma. Watch for short-dated options plays."}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "gex" && (
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#8892a4]">SPY Gamma Exposure by Strike — Jun 20 Expiry</p>
            <div className="flex items-center gap-2 text-xs bg-[#ffd60022] border border-[#ffd60044] rounded px-3 py-1.5">
              <span className="text-[#ffd600]">Flip Point: ~$510 — market gravity zone</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={GEX_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis type="number" tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}B$`} />
              <YAxis type="category" dataKey="strike" tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `$${v}` } />
              <ReferenceLine x={0} stroke="#8892a4" strokeWidth={2} />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(2)}B$`, "GEX"]} />
              <Bar dataKey="gex" shape={(props: any) => {
                const { x, y, width, height, value } = props;
                const realX = value >= 0 ? x : x + width;
                return <rect x={realX} y={y} width={Math.abs(width)} height={Math.max(height - 1, 2)} fill={value >= 0 ? "#00e67688" : "#ff444488"} stroke={value >= 0 ? "#00e676" : "#ff4444"} strokeWidth={1} />;
              }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === "oi" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Call vs Put Open Interest by Expiry ($M)</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={EXPIRY_EVENTS.map((e) => ({ date: e.date, calls: (e.callOI/1000).toFixed(0), puts: (e.putOI/1000).toFixed(0), callsN: e.callOI/1000, putsN: -e.putOI/1000 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8892a4" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${Math.abs(v)}K`} />
              <ReferenceLine y={0} stroke="#8892a4" strokeWidth={2} />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }}
                formatter={(v:number) => [`${Math.abs(v).toFixed(0)}K contracts`]} />
              <Bar dataKey="callsN" name="Calls" fill="#00e67666" stroke="#00e676" strokeWidth={1} />
              <Bar dataKey="putsN"  name="Puts"  fill="#ff444466" stroke="#ff4444" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
