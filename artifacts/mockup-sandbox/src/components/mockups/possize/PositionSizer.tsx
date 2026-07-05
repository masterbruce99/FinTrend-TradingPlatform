import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function PositionSizer() {
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct] = useState(1.0);
  const [entry, setEntry] = useState(241.30);
  const [stop, setStop] = useState(232.00);
  const [target, setTarget] = useState(264.00);
  const [method, setMethod] = useState<"fixed"|"atr"|"kelly">("fixed");
  const [kelly_winrate, setKellyWinrate] = useState(60);
  const [kelly_rr, setKellyRR] = useState(2.0);

  const riskAmount = accountSize * (riskPct / 100);
  const stopDist = Math.abs(entry - stop);
  const targetDist = Math.abs(target - entry);
  const rrRatio = stopDist > 0 ? targetDist / stopDist : 0;
  const shares = stopDist > 0 ? Math.floor(riskAmount / stopDist) : 0;
  const positionValue = shares * entry;
  const positionPct = (positionValue / accountSize) * 100;
  const maxLoss = shares * stopDist;
  const maxGain = shares * targetDist;

  const kellyF = kelly_winrate / 100 - (1 - kelly_winrate / 100) / kelly_rr;
  const kellyShares = Math.floor((accountSize * Math.max(kellyF, 0)) / entry);

  const displayShares = method === "kelly" ? kellyShares : shares;
  const displayValue  = displayShares * entry;
  const displayPct    = (displayValue / accountSize) * 100;

  const SCENARIOS = [0.5, 1.0, 1.5, 2.0, 2.5].map(pct => ({
    risk: `${pct}%`,
    shares: Math.floor((accountSize * pct / 100) / Math.max(stopDist, 0.01)),
    value: Math.round((accountSize * pct / 100) / Math.max(stopDist, 0.01) * entry),
    loss: Math.round(accountSize * pct / 100),
    gain: Math.round((accountSize * pct / 100) / Math.max(stopDist, 0.01) * targetDist),
  }));

  const pieData = [
    { name:"Position", value: Math.min(displayPct, 100) },
    { name:"Rest", value: Math.max(100 - displayPct, 0) },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <span className="text-lg font-bold">Position Sizing Calculator</span>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["fixed","atr","kelly"] as const).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${method === m ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {m === "fixed" ? "Fixed %" : m === "atr" ? "ATR-Based" : "Kelly Criterion"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        {/* Inputs */}
        <div className="w-72 flex flex-col gap-4">
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Account</p>
            <label className="block mb-3">
              <p className="text-xs text-[#8892a4] mb-1">Account Size ($)</p>
              <input type="number" value={accountSize} onChange={e => setAccountSize(Number(e.target.value))}
                className="w-full bg-[#0b0e14] border border-[#1e2433] rounded px-3 py-2 text-white text-sm font-mono outline-none focus:border-[#00d4ff]" />
            </label>
            {method !== "kelly" && (
              <label className="block">
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-[#8892a4]">Risk per trade</p>
                  <p className="text-xs font-bold text-[#00d4ff]">{riskPct.toFixed(1)}%</p>
                </div>
                <input type="range" min={0.25} max={5} step={0.25} value={riskPct} onChange={e => setRiskPct(Number(e.target.value))} className="w-full accent-[#00d4ff]" />
                <div className="flex justify-between text-[9px] text-[#8892a4] mt-0.5"><span>0.25%</span><span>5%</span></div>
              </label>
            )}
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Trade Setup</p>
            {[["Entry Price ($)", entry, setEntry],["Stop Loss ($)", stop, setStop],["Target Price ($)", target, setTarget]].map(([l,v,setter]) => (
              <label key={l as string} className="block mb-3">
                <p className="text-xs text-[#8892a4] mb-1">{l as string}</p>
                <input type="number" step="0.1" value={v as number} onChange={e => (setter as (n:number)=>void)(Number(e.target.value))}
                  className="w-full bg-[#0b0e14] border border-[#1e2433] rounded px-3 py-2 text-white text-sm font-mono outline-none focus:border-[#00d4ff]" />
              </label>
            ))}
          </div>

          {method === "kelly" && (
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Kelly Parameters</p>
              <label className="block mb-3">
                <div className="flex justify-between mb-1"><p className="text-xs text-[#8892a4]">Win Rate</p><p className="text-xs font-bold text-[#00d4ff]">{kelly_winrate}%</p></div>
                <input type="range" min={30} max={80} value={kelly_winrate} onChange={e => setKellyWinrate(Number(e.target.value))} className="w-full accent-[#00d4ff]" />
              </label>
              <label className="block">
                <div className="flex justify-between mb-1"><p className="text-xs text-[#8892a4]">Avg R:R</p><p className="text-xs font-bold text-[#00d4ff]">{kelly_rr.toFixed(1)}:1</p></div>
                <input type="range" min={0.5} max={5} step={0.5} value={kelly_rr} onChange={e => setKellyRR(Number(e.target.value))} className="w-full accent-[#00d4ff]" />
              </label>
              <p className="text-xs mt-3 text-[#8892a4]">Kelly % = <span className="text-[#00d4ff] font-bold">{Math.max(kellyF * 100, 0).toFixed(1)}%</span></p>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Shares to Buy", displayShares.toLocaleString(), "#ffffff"],
              ["Position Size", `$${displayValue.toLocaleString()}`, "#00d4ff"],
              ["% of Account", `${displayPct.toFixed(1)}%`, displayPct > 20 ? "#ff4444" : displayPct > 10 ? "#ffd600" : "#00e676"],
              ["Risk Amount", `$${maxLoss.toLocaleString()}`, "#ff4444"],
              ["Reward Amount", `$${maxGain.toLocaleString()}`, "#00e676"],
              ["R:R Ratio", `${rrRatio.toFixed(2)}:1`, rrRatio >= 2 ? "#00e676" : rrRatio >= 1 ? "#ffd600" : "#ff4444"],
            ].map(([l,v,c]) => (
              <div key={l as string} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 text-center">
                <p className="text-[10px] text-[#8892a4] mb-1">{l}</p>
                <p className="text-xl font-bold" style={{color:c as string}}>{v}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 flex-1">
            <div className="flex-1 bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-xs text-[#8892a4] mb-4">Risk Scenarios — Position Size vs Risk %</p>
              <ResponsiveContainer width="100%" height="75%">
                <BarChart data={SCENARIOS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                  <XAxis dataKey="risk" tick={{fontSize:10,fill:"#8892a4"}} />
                  <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`$${v.toLocaleString()}`]} />
                  <Bar dataKey="value" name="Position" fill="#00d4ff44" stroke="#00d4ff" strokeWidth={1} />
                  <Bar dataKey="gain"  name="Max Gain"  fill="#00e67644" stroke="#00e676" strokeWidth={1} />
                  <Bar dataKey="loss"  name="Max Loss"  fill="#ff444444" stroke="#ff4444" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-52 bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex flex-col items-center">
              <p className="text-xs text-[#8892a4] mb-4">Account Allocation</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={2}>
                    <Cell fill={displayPct > 20 ? "#ff444488" : "#00d4ff88"} stroke={displayPct > 20 ? "#ff4444" : "#00d4ff"} />
                    <Cell fill="#1e243380" stroke="#1e2433" />
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${v.toFixed(1)}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-2xl font-bold mt-1" style={{color:displayPct > 20 ? "#ff4444" : "#00d4ff"}}>{displayPct.toFixed(1)}%</p>
              <p className="text-[10px] text-[#8892a4]">in this trade</p>
              {displayPct > 20 && <p className="text-[10px] text-[#ff4444] mt-2 text-center">⚠ Oversized — above 20% risk</p>}
              {displayPct <= 5 && <p className="text-[10px] text-[#00e676] mt-2 text-center">✓ Conservative sizing</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
