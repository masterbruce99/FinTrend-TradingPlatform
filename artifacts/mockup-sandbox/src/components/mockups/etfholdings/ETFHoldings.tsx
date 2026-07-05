import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type Holding = { symbol: string; name: string; weight: number; shares: number; value: number; change1D: number; change1W: number; sector: string; };

const ETF_DATA: Record<string, { name: string; aum: number; expense: number; holdings: Holding[] }> = {
  QQQ: {
    name: "Invesco QQQ (Nasdaq-100)", aum: 248.4, expense: 0.20,
    holdings: [
      { symbol:"MSFT", name:"Microsoft",      weight:8.82, shares:2840000, value:21880, change1D:0.84,  change1W:2.42, sector:"Tech" },
      { symbol:"AAPL", name:"Apple",          weight:8.64, shares:8420000, value:21440, change1D:1.24,  change1W:3.84, sector:"Tech" },
      { symbol:"NVDA", name:"Nvidia",         weight:8.12, shares:2240000, value:20180, change1D:4.19,  change1W:11.2, sector:"Tech" },
      { symbol:"AMZN", name:"Amazon",         weight:5.24, shares:6440000, value:13010, change1D:0.62,  change1W:1.82, sector:"Consumer" },
      { symbol:"META", name:"Meta",           weight:4.84, shares:2340000, value:12020, change1D:3.12,  change1W:7.24, sector:"Tech" },
      { symbol:"GOOGL",name:"Alphabet A",     weight:4.42, shares:3220000, value:10980, change1D:0.42,  change1W:1.24, sector:"Comm" },
      { symbol:"GOOG", name:"Alphabet C",     weight:4.12, shares:2980000, value:10230, change1D:0.44,  change1W:1.28, sector:"Comm" },
      { symbol:"TSLA", name:"Tesla",          weight:3.24, shares:3240000, value:8050,  change1D:-4.18, change1W:-8.4, sector:"Consumer" },
      { symbol:"AVGO", name:"Broadcom",       weight:2.84, shares:284000,  value:7060,  change1D:1.84,  change1W:4.82, sector:"Tech" },
      { symbol:"COST", name:"Costco",         weight:2.42, shares:440000,  value:6010,  change1D:0.24,  change1W:0.84, sector:"Consumer" },
    ]
  },
  SPY: {
    name: "SPDR S&P 500 ETF", aum: 542.8, expense: 0.0945,
    holdings: [
      { symbol:"MSFT", name:"Microsoft",      weight:6.84, shares:6840000, value:37100, change1D:0.84,  change1W:2.42, sector:"Tech" },
      { symbol:"NVDA", name:"Nvidia",         weight:6.42, shares:4840000, value:34820, change1D:4.19,  change1W:11.2, sector:"Tech" },
      { symbol:"AAPL", name:"Apple",          weight:5.82, shares:14200000,value:31550, change1D:1.24,  change1W:3.84, sector:"Tech" },
      { symbol:"AMZN", name:"Amazon",         weight:4.12, shares:12400000,value:22340, change1D:0.62,  change1W:1.82, sector:"Consumer" },
      { symbol:"META", name:"Meta",           weight:2.84, shares:4840000, value:15400, change1D:3.12,  change1W:7.24, sector:"Tech" },
      { symbol:"GOOGL",name:"Alphabet A",     weight:2.24, shares:6820000, value:12140, change1D:0.42,  change1W:1.24, sector:"Comm" },
      { symbol:"GOOG", name:"Alphabet C",     weight:2.12, shares:6240000, value:11490, change1D:0.44,  change1W:1.28, sector:"Comm" },
      { symbol:"BRK.B",name:"Berkshire B",    weight:1.84, shares:3240000, value:9980,  change1D:0.12,  change1W:0.42, sector:"Finance" },
      { symbol:"LLY",  name:"Eli Lilly",      weight:1.74, shares:1140000, value:9440,  change1D:2.27,  change1W:5.84, sector:"Health" },
      { symbol:"JPM",  name:"JP Morgan",      weight:1.62, shares:4240000, value:8790,  change1D:0.84,  change1W:1.84, sector:"Finance" },
    ]
  },
};

const SECTOR_COLORS: Record<string, string> = {
  Tech:"#00d4ff", Consumer:"#ff8c00", Comm:"#a78bfa", Finance:"#00e676", Health:"#ffd600", Energy:"#ff4444", Other:"#8892a4"
};

export function ETFHoldings() {
  const [etf, setEtf] = useState<"QQQ" | "SPY">("QQQ");
  const [view, setView] = useState<"table" | "pie" | "flow">("table");
  const [selected, setSelected] = useState<Holding | null>(null);

  const data = ETF_DATA[etf];
  const top10Weight = data.holdings.reduce((s, h) => s + h.weight, 0);

  const sectorMap: Record<string, number> = {};
  data.holdings.forEach((h) => { sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + h.weight; });
  const sectorData = Object.entries(sectorMap).map(([sector, weight]) => ({ sector, weight: parseFloat(weight.toFixed(2)) })).sort((a,b) => b.weight - a.weight);

  const flowData = data.holdings.map((h) => ({
    symbol: h.symbol,
    "1D Flow": parseFloat((h.value * h.change1D / 100).toFixed(1)),
    "1W Flow": parseFloat((h.value * h.change1W / 100).toFixed(1)),
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["QQQ","SPY"] as const).map((e) => (
              <button key={e} onClick={() => setEtf(e)}
                className={`px-4 py-1.5 text-sm font-bold transition-colors ${etf === e ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{e}</button>
            ))}
          </div>
          <span className="text-sm text-[#8892a4]">{data.name}</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["table","pie","flow"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "pie" ? "Sector Pie" : v === "flow" ? "Flow Impact" : "Holdings"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["AUM", `$${data.aum}B`, "#00d4ff"],
          ["Expense Ratio", `${data.expense}%`, "#8892a4"],
          ["Top 10 Weight", `${top10Weight.toFixed(1)}%`, "#ffd600"],
          ["Holdings Shown", data.holdings.length.toString(), "white"],
        ].map(([l,v,c]) => (
          <div key={l as string}>
            <p className="text-[10px] text-[#8892a4]">{l}</p>
            <p className="text-lg font-bold" style={{ color: c as string }}>{v}</p>
          </div>
        ))}
      </div>

      {view === "table" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0e14]">
                <tr className="border-b border-[#1e2433]">
                  {["#","Symbol","Name","Weight","Shares","Value ($M)","1D","1W","Sector"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((h, i) => (
                  <tr key={h.symbol} onClick={() => setSelected(selected?.symbol === h.symbol ? null : h)}
                    className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.symbol === h.symbol ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                    <td className="py-3 px-3 text-[#8892a4]">{i + 1}</td>
                    <td className="py-3 px-3 font-bold text-white">{h.symbol}</td>
                    <td className="py-3 px-3 text-[#8892a4]">{h.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00d4ff]" style={{ width: `${(h.weight / data.holdings[0].weight) * 100}%` }} />
                        </div>
                        <span className="font-bold text-[#00d4ff]">{h.weight.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#8892a4]">{(h.shares/1000000).toFixed(1)}M</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">${h.value.toFixed(0)}M</td>
                    <td className="py-3 px-3 font-mono font-bold" style={{ color: h.change1D >= 0 ? "#00e676" : "#ff4444" }}>{h.change1D >= 0 ? "+" : ""}{h.change1D.toFixed(2)}%</td>
                    <td className="py-3 px-3 font-mono" style={{ color: h.change1W >= 0 ? "#00e676" : "#ff4444" }}>{h.change1W >= 0 ? "+" : ""}{h.change1W.toFixed(2)}%</td>
                    <td className="py-3 px-3"><span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: SECTOR_COLORS[h.sector] + "22", color: SECTOR_COLORS[h.sector] }}>{h.sector}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-3">
              <div>
                <p className="text-lg font-bold">{selected.symbol}</p>
                <p className="text-xs text-[#8892a4]">{selected.name}</p>
              </div>
              {[["Weight", `${selected.weight.toFixed(2)}%`, "#00d4ff"], ["Shares", `${(selected.shares/1e6).toFixed(2)}M`, "white"], ["Value", `$${selected.value}M`, "white"], ["1D", `${selected.change1D >= 0 ? "+" : ""}${selected.change1D.toFixed(2)}%`, selected.change1D >= 0 ? "#00e676" : "#ff4444"], ["1W", `${selected.change1W >= 0 ? "+" : ""}${selected.change1W.toFixed(2)}%`, selected.change1W >= 0 ? "#00e676" : "#ff4444"], ["Sector", selected.sector, SECTOR_COLORS[selected.sector]]].map(([l,v,c]) => (
                <div key={l as string} className="flex justify-between text-xs border-b border-[#1e2433] pb-2">
                  <span className="text-[#8892a4]">{l}</span>
                  <span className="font-bold" style={{ color: c as string }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "pie" && (
        <div className="flex-1 flex p-6 gap-6">
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-4">Sector Allocation — {etf}</p>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={sectorData} dataKey="weight" nameKey="sector" cx="50%" cy="50%" outerRadius={160} label={({ sector, weight }) => `${sector} ${weight.toFixed(1)}%`} labelLine>
                  {sectorData.map((entry) => <Cell key={entry.sector} fill={SECTOR_COLORS[entry.sector] ?? "#8892a4"} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(2)}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-48 flex flex-col gap-2 pt-10">
            {sectorData.map((s) => (
              <div key={s.sector} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? "#8892a4" }} />
                <span className="text-[#c8d3e0] flex-1">{s.sector}</span>
                <span className="font-bold" style={{ color: SECTOR_COLORS[s.sector] }}>{s.weight.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "flow" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Estimated Value Flow by Holding ($M) — 1D and 1W</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "#8892a4" }} />
              <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => `$${v}M`} />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`$${v.toFixed(1)}M`]} />
              <Bar dataKey="1D Flow" shape={(props: any) => { const { x,y,width,height,value } = props; return <rect x={x} y={value>=0?y:y+height} width={width} height={Math.abs(height)} fill={value>=0?"#00e67666":"#ff444466"} stroke={value>=0?"#00e676":"#ff4444"} strokeWidth={1} />; }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
