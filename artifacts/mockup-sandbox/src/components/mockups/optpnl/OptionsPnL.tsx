import { useState, useMemo } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type Leg = { type: "call"|"put"; action: "buy"|"sell"; strike: number; premium: number; qty: number };

const PRESETS: Record<string, { name: string; legs: Leg[] }> = {
  longcall:    { name:"Long Call",      legs:[{ type:"call", action:"buy",  strike:245, premium:4.20, qty:1 }] },
  longput:     { name:"Long Put",       legs:[{ type:"put",  action:"buy",  strike:235, premium:3.80, qty:1 }] },
  bullspread:  { name:"Bull Call Spread",legs:[{ type:"call", action:"buy",  strike:240, premium:5.40, qty:1 },{ type:"call", action:"sell", strike:250, premium:2.10, qty:1 }] },
  bearspread:  { name:"Bear Put Spread", legs:[{ type:"put",  action:"buy",  strike:240, premium:4.20, qty:1 },{ type:"put",  action:"sell", strike:230, premium:1.80, qty:1 }] },
  straddle:    { name:"Long Straddle",   legs:[{ type:"call", action:"buy",  strike:242, premium:4.80, qty:1 },{ type:"put",  action:"buy",  strike:242, premium:4.20, qty:1 }] },
  strangle:    { name:"Long Strangle",   legs:[{ type:"call", action:"buy",  strike:250, premium:2.80, qty:1 },{ type:"put",  action:"buy",  strike:232, premium:2.40, qty:1 }] },
  ironc:       { name:"Iron Condor",     legs:[{ type:"call", action:"sell", strike:248, premium:2.40, qty:1 },{ type:"call", action:"buy",  strike:254, premium:1.00, qty:1 },{ type:"put",  action:"sell", strike:236, premium:2.10, qty:1 },{ type:"put",  action:"buy",  strike:230, premium:0.80, qty:1 }] },
  butterfly:   { name:"Butterfly",       legs:[{ type:"call", action:"buy",  strike:235, premium:5.20, qty:1 },{ type:"call", action:"sell", strike:242, premium:2.80, qty:2 },{ type:"call", action:"buy",  strike:249, premium:1.20, qty:1 }] },
};

const LEG_COLORS = ["#00d4ff","#00e676","#ffd600","#a78bfa"];

function calcPnL(legs: Leg[], price: number): number {
  return legs.reduce((total, leg) => {
    const intrinsic = leg.type === "call" ? Math.max(price - leg.strike, 0) : Math.max(leg.strike - price, 0);
    const legPnL = leg.action === "buy" ? (intrinsic - leg.premium) * 100 * leg.qty : (leg.premium - intrinsic) * 100 * leg.qty;
    return total + legPnL;
  }, 0);
}

export function OptionsPnL() {
  const [preset, setPreset]   = useState("straddle");
  const [legs, setLegs]       = useState<Leg[]>(PRESETS["straddle"].legs);
  const [underlying, setUnderlying] = useState(242);
  const [dte, setDte]         = useState(21);

  const pnlData = useMemo(() => {
    const min = Math.min(...legs.map(l => l.strike)) - 25;
    const max = Math.max(...legs.map(l => l.strike)) + 25;
    return Array.from({ length: 100 }, (_, i) => {
      const price = min + (i / 99) * (max - min);
      const pnl = calcPnL(legs, price);
      return { price: parseFloat(price.toFixed(2)), pnl: parseFloat(pnl.toFixed(2)) };
    });
  }, [legs]);

  const maxProfit = Math.max(...pnlData.map(d => d.pnl));
  const maxLoss   = Math.min(...pnlData.map(d => d.pnl));
  const breakevenPoints = pnlData.filter((d, i) => i > 0 && ((pnlData[i-1].pnl < 0) !== (d.pnl < 0)));
  const netDebit = legs.reduce((s, l) => s + (l.action === "buy" ? l.premium * 100 * l.qty : -l.premium * 100 * l.qty), 0);
  const currentPnL = calcPnL(legs, underlying);

  const updatePreset = (key: string) => { setPreset(key); setLegs([...PRESETS[key].legs]); };
  const updateLeg = (i: number, field: keyof Leg, value: string | number) => {
    setLegs(prev => prev.map((l, j) => j === i ? { ...l, [field]: value } : l));
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <span className="text-lg font-bold">Options P&L Diagram</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8892a4]">AAPL</span>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden flex-wrap">
            {Object.entries(PRESETS).map(([k,v]) => (
              <button key={k} onClick={() => updatePreset(k)}
                className={`px-2 py-1 text-[10px] font-medium transition-colors ${preset === k ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{v.name}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Net Debit/Credit", `${netDebit >= 0 ? "-$" : "+$"}${Math.abs(netDebit).toFixed(0)}`, netDebit >= 0 ? "#ff4444" : "#00e676"],
          ["Max Profit", maxProfit === Infinity ? "Unlimited" : `$${maxProfit.toFixed(0)}`, "#00e676"],
          ["Max Loss", maxLoss === -Infinity ? "Unlimited" : `-$${Math.abs(maxLoss).toFixed(0)}`, "#ff4444"],
          ["Breakevens", breakevenPoints.map(b => `$${b.price.toFixed(0)}`).join(" / ") || "N/A", "#ffd600"],
          ["Current P&L", `${currentPnL >= 0 ? "+" : ""}$${currentPnL.toFixed(0)}`, currentPnL >= 0 ? "#00e676" : "#ff4444"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold truncate" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8892a4]">Spot</span>
              <input type="number" value={underlying} onChange={e => setUnderlying(Number(e.target.value))} step="0.5"
                className="w-20 bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-white font-mono outline-none focus:border-[#00d4ff]" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8892a4]">DTE</span>
              <input type="range" min={1} max={90} value={dte} onChange={e => setDte(Number(e.target.value))} className="w-24 accent-[#00d4ff]" />
              <span className="text-[#00d4ff] w-6">{dte}d</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="price" tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} interval={19} />
                <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} />
                <ReferenceLine y={0} stroke="#8892a4" strokeWidth={2} />
                <ReferenceLine x={underlying} stroke="#ffd60088" strokeDasharray="5 3" label={{value:"Spot",fill:"#ffd600",fontSize:9}} />
                {breakevenPoints.map((b,i) => (
                  <ReferenceLine key={i} x={b.price} stroke="#ffffff44" strokeDasharray="3 4" label={{value:`BE $${b.price.toFixed(0)}`,fill:"white",fontSize:8}} />
                ))}
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                  formatter={(v:number) => [`${v>=0?"+":""}$${v.toFixed(2)}`, "P&L"]}
                  labelFormatter={(v:number) => `Price: $${v}`} />
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pnl" stroke="#00e676" fill="url(#pnlGrad)" strokeWidth={2.5}
                  dot={false}
                  stroke-dasharray={undefined}
                  activeDot={{ r:4, fill:"#00e676" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-64 flex flex-col gap-3">
          <p className="text-[10px] text-[#8892a4] uppercase tracking-widest">Legs ({legs.length})</p>
          {legs.map((leg, i) => (
            <div key={i} className="bg-[#131722] border border-[#1e2433] rounded-lg p-3" style={{borderLeftColor:LEG_COLORS[i],borderLeftWidth:3}}>
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {(["buy","sell"] as const).map(a => (
                  <button key={a} onClick={() => updateLeg(i,"action",a)}
                    className={`px-2 py-0.5 text-[10px] rounded font-bold ${leg.action===a ? (a==="buy"?"bg-[#00e67622] text-[#00e676] border border-[#00e676]":"bg-[#ff444422] text-[#ff4444] border border-[#ff4444]") : "text-[#8892a4] border border-[#1e2433]"}`}>{a.toUpperCase()}</button>
                ))}
                {(["call","put"] as const).map(t => (
                  <button key={t} onClick={() => updateLeg(i,"type",t)}
                    className={`px-2 py-0.5 text-[10px] rounded font-bold ${leg.type===t ? "bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff]" : "text-[#8892a4] border border-[#1e2433]"}`}>{t.toUpperCase()}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[["Strike","strike",1],["Premium","premium",0.1],["Qty","qty",1]].map(([l,f,step]) => (
                  <label key={f as string} className={f === "qty" ? "col-span-2" : ""}>
                    <p className="text-[9px] text-[#8892a4] mb-0.5">{l as string}</p>
                    <input type="number" step={step as number} value={leg[f as keyof Leg] as number}
                      onChange={e => updateLeg(i, f as keyof Leg, Number(e.target.value))}
                      className="w-full bg-[#0b0e14] border border-[#1e2433] rounded px-2 py-1 text-white text-xs font-mono outline-none focus:border-[#00d4ff]" />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-auto bg-[#131722] border border-[#1e2433] rounded-lg p-3">
            <p className="text-[10px] text-[#8892a4] mb-2">Greeks (est.)</p>
            {[["Delta","Δ","0.42","#00e676"],["Gamma","Γ","0.08","#ffd600"],["Theta","Θ","-12.40/day","#ff4444"],["Vega","ν","28.40","#a78bfa"]].map(([n,sym,v,c]) => (
              <div key={n as string} className="flex justify-between text-xs py-1 border-b border-[#1e2433]">
                <span className="text-[#8892a4]">{sym} {n}</span>
                <span className="font-bold" style={{color:c as string}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
