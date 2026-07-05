import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

type ShortStock = {
  symbol: string;
  name: string;
  price: number;
  shortInterest: number;
  shortFloat: number;
  daysTocover: number;
  change1W: number;
  borrowRate: number;
  shares: number;
  sector: string;
  squeeze: "High" | "Medium" | "Low";
};

const STOCKS: ShortStock[] = [
  { symbol:"TSLA", name:"Tesla",          price:245.1, shortInterest:485.2, shortFloat:18.4, daysTocover:3.2, change1W:8.4,  borrowRate:2.1, shares:2640,  sector:"Consumer", squeeze:"High" },
  { symbol:"RIVN", name:"Rivian",         price:13.8,  shortInterest:278.4, shortFloat:22.8, daysTocover:4.8, change1W:12.6, borrowRate:4.8, shares:1220,  sector:"Consumer", squeeze:"High" },
  { symbol:"COIN", name:"Coinbase",       price:244.8, shortInterest:198.6, shortFloat:14.2, daysTocover:2.4, change1W:6.2,  borrowRate:3.2, shares:820,   sector:"Finance",  squeeze:"Medium" },
  { symbol:"GME",  name:"GameStop",       price:24.4,  shortInterest:142.8, shortFloat:24.8, daysTocover:5.6, change1W:-2.4, borrowRate:6.8, shares:576,   sector:"Consumer", squeeze:"High" },
  { symbol:"AMC",  name:"AMC Networks",   price:4.2,   shortInterest:118.4, shortFloat:28.4, daysTocover:6.2, change1W:-4.8, borrowRate:12.4,shares:416,   sector:"Comm",     squeeze:"High" },
  { symbol:"INTC", name:"Intel",          price:31.2,  shortInterest:284.6, shortFloat:6.8,  daysTocover:1.8, change1W:3.2,  borrowRate:0.8, shares:4180,  sector:"Tech",     squeeze:"Low" },
  { symbol:"MRNA", name:"Moderna",        price:138.6, shortInterest:124.2, shortFloat:12.4, daysTocover:2.8, change1W:5.6,  borrowRate:1.4, shares:1002,  sector:"Health",   squeeze:"Medium" },
  { symbol:"PARA", name:"Paramount",      price:11.8,  shortInterest:108.4, shortFloat:16.8, daysTocover:3.4, change1W:2.4,  borrowRate:2.2, shares:644,   sector:"Comm",     squeeze:"Medium" },
  { symbol:"WBD",  name:"Warner Bros",    price:7.6,   shortInterest:98.2,  shortFloat:18.2, daysTocover:4.2, change1W:-1.8, borrowRate:1.8, shares:540,   sector:"Comm",     squeeze:"Medium" },
  { symbol:"NKLA", name:"Nikola",         price:1.2,   shortInterest:68.4,  shortFloat:32.4, daysTocover:8.4, change1W:-8.4, borrowRate:18.6,shares:212,   sector:"Consumer", squeeze:"High" },
];

const SQUEEZE_COLOR = { High: "#ff4444", Medium: "#ffd600", Low: "#8892a4" };

const HISTORY = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  TSLA: 16.2 + i * 0.4 + Math.sin(i) * 0.8,
  RIVN: 19.4 + i * 0.6 + Math.sin(i * 0.8) * 1.2,
  GME:  22.1 + i * 0.5 + Math.cos(i) * 1.4,
}));

export function ShortInterest() {
  const [sortBy, setSortBy] = useState<"shortFloat" | "daysTocover" | "borrowRate" | "change1W">("shortFloat");
  const [selected, setSelected] = useState<ShortStock>(STOCKS[0]);
  const [view, setView] = useState<"table" | "chart" | "history">("table");
  const [squeezeFilter, setSqueezeFilter] = useState("All");

  const filtered = [...STOCKS]
    .filter((s) => squeezeFilter === "All" || s.squeeze === squeezeFilter)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Short Interest Tracker</span>
          <span className="text-xs text-[#8892a4]">Most Shorted Stocks</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["table","chart","history"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v === "table" ? "Rankings" : v === "chart" ? "Bar Chart" : "History"}
              </button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","High","Medium","Low"].map((s) => (
              <button key={s} onClick={() => setSqueezeFilter(s)}
                className={`px-2.5 py-1 text-xs transition-colors ${squeezeFilter === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}
                style={squeezeFilter === s && s !== "All" ? { color: SQUEEZE_COLOR[s as keyof typeof SQUEEZE_COLOR] } : {}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          {view === "table" && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0e14]">
                <tr className="border-b border-[#1e2433]">
                  {[["Symbol",""],["Short Float %","shortFloat"],["Days to Cover","daysTocover"],["1W Change","change1W"],["Borrow Rate %","borrowRate"],["Short Interest",""],["Squeeze Risk",""]].map(([h,k]) => (
                    <th key={h} onClick={() => k && setSortBy(k as typeof sortBy)}
                      className={`text-left py-3 px-3 text-[#8892a4] font-medium ${k ? "cursor-pointer hover:text-white" : ""}`}>
                      {h}{sortBy === k && k ? " ↓" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.symbol} onClick={() => setSelected(s)}
                    className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected.symbol === s.symbol ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8892a4] text-[10px] w-4">#{i+1}</span>
                        <div>
                          <div className="font-bold text-white">{s.symbol}</div>
                          <div className="text-[10px] text-[#8892a4]">{s.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-2 bg-[#1e2433] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#ff4444]" style={{ width: `${Math.min(s.shortFloat, 35) / 35 * 100}%` }} />
                        </div>
                        <span className="font-bold text-[#ff4444]">{s.shortFloat.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono" style={{ color: s.daysTocover > 4 ? "#ff4444" : s.daysTocover > 2 ? "#ffd600" : "#8892a4" }}>
                      {s.daysTocover.toFixed(1)}d
                    </td>
                    <td className="py-3 px-3 font-mono font-bold" style={{ color: s.change1W > 0 ? "#ff4444" : "#00e676" }}>
                      {s.change1W > 0 ? "+" : ""}{s.change1W.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-mono" style={{ color: s.borrowRate > 5 ? "#ff4444" : "#8892a4" }}>
                      {s.borrowRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-[#8892a4]">${s.shortInterest.toFixed(1)}M</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: SQUEEZE_COLOR[s.squeeze] + "22", color: SQUEEZE_COLOR[s.squeeze] }}>
                        {s.squeeze} Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === "chart" && (
            <div className="p-6 h-full">
              <p className="text-xs text-[#8892a4] mb-4">Short Float % — click a bar to select</p>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={filtered} onClick={(d) => d?.activePayload && setSelected(STOCKS.find((s) => s.symbol === d.activePayload![0].payload.symbol) ?? selected)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "#8892a4" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                  <ReferenceLine y={20} stroke="#ff444466" strokeDasharray="4 4" label={{ value: "Squeeze Zone", fill: "#ff4444", fontSize: 9 }} />
                  <Bar dataKey="shortFloat" name="Short Float %" fill="#ff444488" stroke="#ff4444" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {view === "history" && (
            <div className="p-6 h-full">
              <p className="text-xs text-[#8892a4] mb-4">Short Float % over 8 weeks — TSLA, RIVN, GME</p>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#8892a4" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `${v}%`} domain={[14, 36]} />
                  <Tooltip contentStyle={{ backgroundColor: "#131722", border: "1px solid #1e2433", fontSize: 11, borderRadius: 4 }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                  <ReferenceLine y={25} stroke="#ff444444" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="TSLA" stroke="#ff4444" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="RIVN" stroke="#ffd600" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="GME"  stroke="#a78bfa" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="w-56 border-l border-[#1e2433] p-4 flex flex-col gap-4">
          <div>
            <p className="text-lg font-bold">{selected.symbol}</p>
            <p className="text-xs text-[#8892a4]">{selected.name}</p>
            <p className="text-sm font-bold text-white mt-1">${selected.price.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:"Short Float", val:`${selected.shortFloat.toFixed(1)}%`, color:"#ff4444" },
              { label:"Days to Cover", val:`${selected.daysTocover.toFixed(1)}d`, color:selected.daysTocover>4?"#ff4444":selected.daysTocover>2?"#ffd600":"#8892a4" },
              { label:"Borrow Rate", val:`${selected.borrowRate.toFixed(1)}%`, color:selected.borrowRate>5?"#ff4444":"#8892a4" },
              { label:"1W Change", val:`${selected.change1W>0?"+":""}${selected.change1W.toFixed(1)}%`, color:selected.change1W>0?"#ff4444":"#00e676" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#131722] border border-[#1e2433] rounded p-2">
                <p className="text-[9px] text-[#8892a4]">{label}</p>
                <p className="text-sm font-bold" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#131722] border rounded-lg p-3" style={{ borderColor: SQUEEZE_COLOR[selected.squeeze] + "44" }}>
            <p className="text-[10px] mb-1" style={{ color: SQUEEZE_COLOR[selected.squeeze] }}>Squeeze Risk: {selected.squeeze}</p>
            <p className="text-xs text-[#8892a4]">
              {selected.squeeze === "High" ? `High short float + ${selected.daysTocover.toFixed(1)} days to cover = elevated short squeeze risk.` :
               selected.squeeze === "Medium" ? "Moderate short interest. Monitor for catalyst-driven squeeze." :
               "Low squeeze risk despite short interest. Plenty of liquidity to exit."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
