import { useState } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

type SRZone = {
  id: string; type: "Resistance"|"Support"|"Pivot";
  priceHigh: number; priceLow: number; strength: number;
  touches: number; lastTouch: string; timeframe: string;
  status: "Holding"|"Broken"|"Approaching"|"Tested";
  color: string;
};

const ZONES: SRZone[] = [
  { id:"r1", type:"Resistance", priceHigh:268.0, priceLow:265.5, strength:94, touches:4, lastTouch:"Jun 3",  timeframe:"Daily", status:"Holding",    color:"#ff4444" },
  { id:"r2", type:"Resistance", priceHigh:255.0, priceLow:253.2, strength:88, touches:3, lastTouch:"May 22", timeframe:"Daily", status:"Approaching", color:"#ff6666" },
  { id:"r3", type:"Resistance", priceHigh:248.4, priceLow:247.0, strength:76, touches:2, lastTouch:"May 14", timeframe:"4H",    status:"Tested",     color:"#ff8c8c" },
  { id:"p1", type:"Pivot",      priceHigh:242.8, priceLow:241.6, strength:82, touches:5, lastTouch:"Today",  timeframe:"Daily", status:"Holding",    color:"#ffd600" },
  { id:"s1", type:"Support",    priceHigh:236.4, priceLow:234.8, strength:91, touches:4, lastTouch:"May 8",  timeframe:"Daily", status:"Holding",    color:"#00e676" },
  { id:"s2", type:"Support",    priceHigh:228.4, priceLow:226.8, strength:84, touches:3, lastTouch:"Apr 28", timeframe:"Daily", status:"Holding",    color:"#00d4aa" },
  { id:"s3", type:"Support",    priceHigh:218.0, priceLow:216.4, strength:96, touches:6, lastTouch:"Mar 15", timeframe:"Weekly",status:"Holding",    color:"#00c87c" },
];

const PRICES = Array.from({ length: 60 }, (_, i) => {
  const base = 234 + i * 0.14 + Math.sin(i * 0.4) * 8 + Math.cos(i * 0.2) * 4;
  return parseFloat(base.toFixed(2));
});
const DAYS = Array.from({ length: 60 }, (_, i) => {
  const d = new Date("2025-04-01"); d.setDate(d.getDate() + i);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
});
const CHART_DATA = PRICES.map((price, i) => ({ day: DAYS[i], price }));
const currentPrice = PRICES[PRICES.length - 1];

const STATUS_COLOR: Record<string, string> = { Holding:"#00e676", Broken:"#ff4444", Approaching:"#ffd600", Tested:"#ff8c00" };

export function SRZones() {
  const [selected, setSelected] = useState<SRZone | null>(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [tfFilter, setTfFilter] = useState("All");
  const [showChart, setShowChart] = useState(true);

  const filtered = ZONES.filter(z => {
    if (typeFilter !== "All" && z.type !== typeFilter) return false;
    if (tfFilter !== "All" && z.timeframe !== tfFilter) return false;
    return true;
  });

  const nearbyZones = ZONES.filter(z => Math.abs((z.priceHigh + z.priceLow) / 2 - currentPrice) < 20);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — Dynamic S/R Zones</span>
          <span className="text-xs text-[#8892a4]">Auto-detected with AI strength scoring</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","Resistance","Support","Pivot"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-xs transition-colors ${typeFilter === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{t}</button>
            ))}
          </div>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","4H","Daily","Weekly"].map(t => (
              <button key={t} onClick={() => setTfFilter(t)}
                className={`px-2.5 py-1 text-xs transition-colors ${tfFilter === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{t}</button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setShowChart(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showChart?"bg-[#00d4ff]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showChart?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">Chart</span>
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col">
        {showChart && (
          <div className="h-72 border-b border-[#1e2433] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="day" tick={{fontSize:8,fill:"#8892a4"}} interval={9} />
                <YAxis domain={[210,275]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v}`} />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} />
                {filtered.map(z => (
                  <ReferenceArea key={z.id} y1={z.priceLow} y2={z.priceHigh} fill={z.color+"22"} stroke={z.color} strokeOpacity={0.6} strokeWidth={1} />
                ))}
                <ReferenceLine y={currentPrice} stroke="#ffffff66" strokeDasharray="3 4" label={{value:`$${currentPrice.toFixed(2)}`,fill:"white",fontSize:9,position:"right"}} />
                <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0e14]">
                <tr className="border-b border-[#1e2433]">
                  {["Zone","Type","Price Range","Strength","Touches","Timeframe","Last Touch","Status"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a,b) => b.priceHigh - a.priceHigh).map(z => (
                  <tr key={z.id} onClick={() => setSelected(selected?.id === z.id ? null : z)}
                    className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.id === z.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}
                    style={{borderLeft:`3px solid ${z.color}`}}>
                    <td className="py-3 px-3"><div className="w-3 h-3 rounded-sm" style={{backgroundColor:z.color+"44",border:`1px solid ${z.color}`}} /></td>
                    <td className="py-3 px-3 font-bold text-xs" style={{color:z.color}}>{z.type}</td>
                    <td className="py-3 px-3 font-mono text-white">${z.priceLow.toFixed(2)} – ${z.priceHigh.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${z.strength}%`,backgroundColor:z.color}} />
                        </div>
                        <span className="font-bold text-[10px]" style={{color:z.color}}>{z.strength}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#ffd600]">{z.touches}</td>
                    <td className="py-3 px-3 text-[#8892a4]">{z.timeframe}</td>
                    <td className="py-3 px-3 text-[#8892a4]">{z.lastTouch}</td>
                    <td className="py-3 px-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:STATUS_COLOR[z.status]+"22",color:STATUS_COLOR[z.status]}}>{z.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="w-52 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Current Price</p>
              <p className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Nearby Zones</p>
              {nearbyZones.map(z => {
                const mid = (z.priceHigh + z.priceLow) / 2;
                const dist = mid - currentPrice;
                return (
                  <div key={z.id} className="flex justify-between text-xs py-1.5 border-b border-[#1e2433]">
                    <span style={{color:z.color}}>{z.type}</span>
                    <span className="font-mono" style={{color:dist > 0 ? "#ff4444" : "#00e676"}}>
                      {dist > 0 ? "+" : ""}{dist.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            {selected && (
              <div className="bg-[#131722] border rounded-lg p-3" style={{borderColor:selected.color+"44"}}>
                <p className="text-xs font-bold mb-2" style={{color:selected.color}}>{selected.type} Zone</p>
                {[["Range",`$${selected.priceLow.toFixed(2)}–$${selected.priceHigh.toFixed(2)}`],["Strength",`${selected.strength}/100`],["Touches",selected.touches.toString()],["TF",selected.timeframe],["Status",selected.status]].map(([l,v])=>(
                  <div key={l} className="flex justify-between text-[10px] py-1">
                    <span className="text-[#8892a4]">{l}</span>
                    <span className="font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
