import { useState } from "react";

type UOActivity = {
  id: number; time: string; symbol: string; expiry: string; strike: number;
  type: "Call" | "Put"; side: "Buy" | "Sell"; premium: number; contracts: number;
  openInterest: number; iv: number; delta: number; volumeOIRatio: number;
  condition: "Sweep" | "Block" | "Split"; sentiment: "Bullish" | "Bearish"; unusual: number;
};

const ACTIVITIES: UOActivity[] = [
  { id:1,  time:"14:38", symbol:"NVDA", expiry:"Jun 21", strike:900,  type:"Call", side:"Buy",  premium:8.42,  contracts:4200, openInterest:18400, iv:68.4, delta:0.38, volumeOIRatio:22.8, condition:"Sweep",  sentiment:"Bullish", unusual:94 },
  { id:2,  time:"14:32", symbol:"AAPL", expiry:"Jul 19", strike:260,  type:"Call", side:"Buy",  premium:2.84,  contracts:8400, openInterest:24200, iv:32.4, delta:0.28, volumeOIRatio:34.7, condition:"Block",  sentiment:"Bullish", unusual:91 },
  { id:3,  time:"14:21", symbol:"TSLA", expiry:"Jun 28", strike:220,  type:"Put",  side:"Buy",  premium:4.28,  contracts:6200, openInterest:32400, iv:82.4, delta:-0.44,volumeOIRatio:19.1, condition:"Sweep",  sentiment:"Bearish", unusual:89 },
  { id:4,  time:"14:15", symbol:"SPY",  expiry:"Jun 21", strike:510,  type:"Put",  side:"Buy",  premium:3.12,  contracts:18400,openInterest:84200, iv:18.4, delta:-0.32,volumeOIRatio:21.9, condition:"Block",  sentiment:"Bearish", unusual:87 },
  { id:5,  time:"14:08", symbol:"META", expiry:"Jul 19", strike:560,  type:"Call", side:"Buy",  premium:6.84,  contracts:3200, openInterest:12400, iv:42.4, delta:0.34, volumeOIRatio:25.8, condition:"Sweep",  sentiment:"Bullish", unusual:86 },
  { id:6,  time:"13:54", symbol:"LLY",  expiry:"Aug 16", strike:950,  type:"Call", side:"Buy",  premium:12.40, contracts:1800, openInterest:4200,  iv:28.4, delta:0.32, volumeOIRatio:42.9, condition:"Block",  sentiment:"Bullish", unusual:88 },
  { id:7,  time:"13:42", symbol:"INTC", expiry:"Jun 21", strike:28,   type:"Put",  side:"Buy",  premium:1.24,  contracts:14200,openInterest:28400, iv:48.4, delta:-0.52,volumeOIRatio:50.0, condition:"Sweep",  sentiment:"Bearish", unusual:92 },
  { id:8,  time:"13:28", symbol:"AMD",  expiry:"Jul 19", strike:180,  type:"Call", side:"Buy",  premium:4.82,  contracts:4800, openInterest:18200, iv:48.4, delta:0.36, volumeOIRatio:26.4, condition:"Split",  sentiment:"Bullish", unusual:84 },
  { id:9,  time:"13:14", symbol:"QQQ",  expiry:"Jun 28", strike:450,  type:"Call", side:"Buy",  premium:2.24,  contracts:9200, openInterest:42400, iv:20.4, delta:0.42, volumeOIRatio:21.7, condition:"Sweep",  sentiment:"Bullish", unusual:82 },
  { id:10, time:"12:58", symbol:"COIN", expiry:"Jun 21", strike:280,  type:"Call", side:"Buy",  premium:8.40,  contracts:2800, openInterest:6400,  iv:94.4, delta:0.34, volumeOIRatio:43.8, condition:"Block",  sentiment:"Bullish", unusual:90 },
  { id:11, time:"12:42", symbol:"NVDA", expiry:"Jul 19", strike:800,  type:"Put",  side:"Buy",  premium:18.40, contracts:2200, openInterest:8400,  iv:72.4, delta:-0.38,volumeOIRatio:26.2, condition:"Block",  sentiment:"Bearish", unusual:85 },
  { id:12, time:"12:28", symbol:"XOM",  expiry:"Aug 16", strike:108,  type:"Put",  side:"Buy",  premium:2.84,  contracts:5400, openInterest:12400, iv:24.4, delta:-0.42,volumeOIRatio:43.5, condition:"Sweep",  sentiment:"Bearish", unusual:83 },
];

const COND_COLOR: Record<string,string> = { Sweep:"#ffd600", Block:"#00d4ff", Split:"#a78bfa" };

export function UnusualOptions() {
  const [typeFilter, setTypeFilter] = useState<"All"|"Call"|"Put">("All");
  const [condFilter, setCondFilter] = useState("All");
  const [sentFilter, setSentFilter] = useState("All");
  const [minUnusual, setMinUnusual] = useState(80);
  const [selected, setSelected] = useState<UOActivity | null>(ACTIVITIES[0]);

  const filtered = ACTIVITIES.filter((a) => {
    if (typeFilter !== "All" && a.type !== typeFilter) return false;
    if (condFilter !== "All" && a.condition !== condFilter) return false;
    if (sentFilter !== "All" && a.sentiment !== sentFilter) return false;
    if (a.unusual < minUnusual) return false;
    return true;
  });

  const totalPrem = filtered.reduce((s, a) => s + a.premium * a.contracts * 100, 0);
  const bullPrem  = filtered.filter(a => a.sentiment === "Bullish").reduce((s,a) => s + a.premium * a.contracts * 100, 0);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Unusual Options Activity</span>
          <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
          <span className="text-xs text-[#a78bfa]">Smart Money Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#8892a4]">Min Score:</span>
            <input type="range" min={70} max={95} value={minUnusual} onChange={(e) => setMinUnusual(Number(e.target.value))} className="w-20 accent-[#a78bfa]" />
            <span className="text-[#a78bfa] font-bold w-6">{minUnusual}</span>
          </div>
          {[
            [["All","Call","Put"], typeFilter, setTypeFilter],
            [["All","Sweep","Block","Split"], condFilter, setCondFilter],
            [["All","Bullish","Bearish"], sentFilter, setSentFilter],
          ].map(([opts, val, setter], gi) => (
            <div key={gi} className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
              {(opts as string[]).map((o) => (
                <button key={o} onClick={() => (setter as (v:string) => void)(o)}
                  className={`px-2.5 py-1 text-[10px] transition-colors ${val === o ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{o}</button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4">
        {[
          ["Total Premium", `$${(totalPrem/1000000).toFixed(1)}M`, "#ffd600"],
          ["Bull Premium",  `$${(bullPrem/1000000).toFixed(1)}M`,  "#00e676"],
          ["Bear Premium",  `$${((totalPrem-bullPrem)/1000000).toFixed(1)}M`, "#ff4444"],
          ["Signals Found", filtered.length.toString(), "#a78bfa"],
        ].map(([l,v,c]) => (
          <div key={l as string} className="text-center">
            <p className="text-[10px] text-[#8892a4]">{l}</p>
            <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Time","Symbol","Contract","Type","Side","Premium","Contracts","Vol/OI","IV","Delta","Cond.","Score"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => setSelected(selected?.id === a.id ? null : a)}
                  className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.id === a.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{a.time}</td>
                  <td className="py-3 px-3 font-bold text-white">{a.symbol}</td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{a.expiry} ${a.strike}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: a.type === "Call" ? "#00e676" : "#ff4444" }}>{a.type}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: a.side === "Buy" ? "#00e676" : "#ff4444" }}>{a.side}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#ffd600]">${(a.premium * a.contracts * 100 / 1000).toFixed(1)}K</td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{a.contracts.toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: a.volumeOIRatio > 30 ? "#ff4444" : "#ffd600" }}>{a.volumeOIRatio.toFixed(1)}×</td>
                  <td className="py-3 px-3 font-mono text-[#8892a4]">{a.iv.toFixed(1)}%</td>
                  <td className="py-3 px-3 font-mono" style={{ color: a.delta > 0 ? "#00e676" : "#ff4444" }}>{a.delta.toFixed(2)}</td>
                  <td className="py-3 px-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: COND_COLOR[a.condition] + "22", color: COND_COLOR[a.condition] }}>{a.condition}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <div className="w-10 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                        <div className="h-full bg-[#a78bfa]" style={{ width: `${(a.unusual - 70) / 30 * 100}%` }} />
                      </div>
                      <span className="font-bold text-[#a78bfa]">{a.unusual}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-56 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold">{selected.symbol}</p>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: (selected.type === "Call" ? "#00e676" : "#ff4444") + "22", color: selected.type === "Call" ? "#00e676" : "#ff4444" }}>{selected.type}</span>
              </div>
              <p className="text-xs text-[#8892a4]">{selected.expiry} ${selected.strike} — {selected.condition}</p>
            </div>
            {[
              ["Total Premium", `$${(selected.premium * selected.contracts * 100 / 1000).toFixed(1)}K`, "#ffd600"],
              ["Contracts", selected.contracts.toLocaleString(), "white"],
              ["Vol/OI", `${selected.volumeOIRatio.toFixed(1)}×`, selected.volumeOIRatio > 30 ? "#ff4444" : "#ffd600"],
              ["IV", `${selected.iv.toFixed(1)}%`, "#8892a4"],
              ["Delta", selected.delta.toFixed(2), selected.delta > 0 ? "#00e676" : "#ff4444"],
              ["Unusual Score", selected.unusual.toString(), "#a78bfa"],
              ["Sentiment", selected.sentiment, selected.sentiment === "Bullish" ? "#00e676" : "#ff4444"],
            ].map(([l,v,c]) => (
              <div key={l as string} className="flex justify-between text-xs border-b border-[#1e2433] pb-2">
                <span className="text-[#8892a4]">{l}</span>
                <span className="font-bold" style={{ color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
