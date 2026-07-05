import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ScatterChart, Scatter, ReferenceLine } from "recharts";

const POSITIONS = [
  { symbol:"NVDA",  sector:"Tech",     value:91240, weight:18.2, beta:1.84, sharpe:2.42, var95:4840, correlation:0.84, pnl:+6440  },
  { symbol:"AAPL",  sector:"Tech",     value:72400, weight:14.5, beta:1.12, sharpe:1.84, var95:3120, correlation:0.72, pnl:+2840  },
  { symbol:"META",  sector:"Comm",     value:54800, weight:11.0, beta:1.42, sharpe:2.08, var95:2840, correlation:0.68, pnl:+4120  },
  { symbol:"TSLA",  sector:"Cons.D",   value:48200, weight:9.6,  beta:1.92, sharpe:1.24, var95:4240, correlation:0.62, pnl:-1820  },
  { symbol:"AMZN",  sector:"Tech",     value:44400, weight:8.9,  beta:1.28, sharpe:1.92, var95:2240, correlation:0.74, pnl:+6080  },
  { symbol:"MSFT",  sector:"Tech",     value:42200, weight:8.4,  beta:0.94, sharpe:2.14, var95:1840, correlation:0.68, pnl:-1625  },
  { symbol:"LLY",   sector:"Health",   value:38400, weight:7.7,  beta:0.72, sharpe:1.68, var95:1680, correlation:0.28, pnl:+3992  },
  { symbol:"COIN",  sector:"Fin",      value:36200, weight:7.2,  beta:2.24, sharpe:1.42, var95:3840, correlation:0.52, pnl:+9800  },
  { symbol:"SPY",   sector:"Index",    value:28400, weight:5.7,  beta:1.00, sharpe:1.20, var95:1120, correlation:1.00, pnl:+1380  },
  { symbol:"PLTR",  sector:"Tech",     value:22400, weight:4.5,  beta:1.68, sharpe:1.84, var95:2240, correlation:0.64, pnl:+8800  },
];

const totalValue = POSITIONS.reduce((s,p) => s + p.value, 0);
const portfolioBeta = POSITIONS.reduce((s,p) => s + p.beta * p.weight/100, 0);
const portfolioVaR  = POSITIONS.reduce((s,p) => s + p.var95, 0);
const totalPnL      = POSITIONS.reduce((s,p) => s + p.pnl, 0);
const sharpePort    = POSITIONS.reduce((s,p) => s + p.sharpe * p.weight/100, 0);

const SECTOR_ALLOC = Object.entries(
  POSITIONS.reduce((acc, p) => { acc[p.sector] = (acc[p.sector]||0) + p.weight; return acc; }, {} as Record<string,number>)
).map(([s,w]) => ({ sector:s, weight:w }));

const RISK_RADAR = [
  { metric:"Beta",        value:Math.min(portfolioBeta/2*100,100) },
  { metric:"Concentration", value:Math.max(...POSITIONS.map(p=>p.weight))/20*100 },
  { metric:"VaR",         value:portfolioVaR/totalValue*1000 },
  { metric:"Correlation", value:POSITIONS.reduce((s,p)=>s+p.correlation,0)/POSITIONS.length*100 },
  { metric:"Volatility",  value:65 },
  { metric:"Leverage",    value:20 },
];

const STRESS = [
  { scenario:"2020 COVID Crash",    impact:-28.4, probability:8 },
  { scenario:"2022 Rate Hike",      impact:-18.2, probability:15 },
  { scenario:"-10% SPY Move",       impact:-14.8, probability:22 },
  { scenario:"Tech Selloff -20%",   impact:-22.4, probability:12 },
  { scenario:"+5% Rate Spike",      impact:-9.4,  probability:18 },
  { scenario:"Crypto Crash -50%",   impact:-6.8,  probability:20 },
];

export function RiskDashboard() {
  const [view, setView] = useState<"overview"|"positions"|"stress">("overview");

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <span className="text-lg font-bold">Portfolio Risk Dashboard</span>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["overview","positions","stress"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view===v?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>
              {v === "stress" ? "Stress Test" : v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Portfolio Value",`$${(totalValue/1000).toFixed(1)}K`,"#ffffff"],
          ["Total P&L",`${totalPnL>=0?"+":""}$${totalPnL.toLocaleString()}`,(totalPnL>=0)?"#00e676":"#ff4444"],
          ["Portfolio Beta",portfolioBeta.toFixed(2),(portfolioBeta>1.5)?"#ff4444":portfolioBeta>1?"#ffd600":"#00e676"],
          ["95% Daily VaR",`-$${(portfolioVaR/1000).toFixed(1)}K`,"#ff4444"],
          ["Sharpe Ratio",sharpePort.toFixed(2),(sharpePort>=2)?"#00e676":sharpePort>=1?"#ffd600":"#ff4444"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-lg font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      {view === "overview" && (
        <div className="flex-1 p-4 grid grid-cols-2 gap-4">
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">Risk Radar</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RISK_RADAR}>
                <PolarGrid stroke="#1e2433" />
                <PolarAngleAxis dataKey="metric" tick={{fill:"#8892a4",fontSize:9}} />
                <Radar dataKey="value" stroke="#00d4ff" fill="#00d4ff22" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">Sector Allocation</p>
            <div className="space-y-2 mt-2">
              {SECTOR_ALLOC.sort((a,b)=>b.weight-a.weight).map(s => (
                <div key={s.sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8892a4]">{s.sector}</span>
                    <span className="font-bold text-white">{s.weight.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#1e2433] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#00d4ff]" style={{width:`${s.weight/20*100}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">Beta vs Sharpe Ratio</p>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                <XAxis type="number" dataKey="beta" name="Beta" tick={{fontSize:9,fill:"#8892a4"}} label={{value:"Beta →",position:"bottom",fontSize:9,fill:"#8892a4"}}/>
                <YAxis type="number" dataKey="sharpe" name="Sharpe" tick={{fontSize:9,fill:"#8892a4"}}/>
                <ReferenceLine x={1} stroke="#8892a433"/>
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                  content={({payload})=>{if(!payload?.length)return null;const d=payload[0].payload;return <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs"><p className="font-bold text-white">{d.symbol}</p><p className="text-[#8892a4]">β:{d.beta} Sharpe:{d.sharpe}</p></div>;}}/>
                <Scatter data={POSITIONS} shape={(p:any)=>{const{cx,cy,payload}=p;return <g><circle cx={cx} cy={cy} r={9} fill="#00d4ff22" stroke="#00d4ff" strokeWidth={1.5}/><text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontWeight="700" fill="white">{payload.symbol}</text></g>;}}/>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">VaR by Position</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={POSITIONS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433"/>
                <XAxis type="number" tick={{fontSize:8,fill:"#8892a4"}} tickFormatter={v=>`$${(v/1000).toFixed(1)}K`}/>
                <YAxis type="category" dataKey="symbol" tick={{fontSize:8,fill:"#8892a4"}} width={35}/>
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`-$${v.toLocaleString()}`,"95% VaR"]}/>
                <Bar dataKey="var95" fill="#ff444466" stroke="#ff4444" strokeWidth={1} radius={[0,2,2,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "positions" && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]"><tr className="border-b border-[#1e2433]">
              {["Symbol","Sector","Value","Weight","Beta","Sharpe","95% VaR","Correlation","P&L"].map(h=>(
                <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>{POSITIONS.sort((a,b)=>b.value-a.value).map(p=>(
              <tr key={p.symbol} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                <td className="py-3 px-3 font-bold text-white">{p.symbol}</td>
                <td className="py-3 px-3 text-[#8892a4]">{p.sector}</td>
                <td className="py-3 px-3 font-mono">${(p.value/1000).toFixed(1)}K</td>
                <td className="py-3 px-3"><div className="flex items-center gap-1.5"><div className="w-10 h-1.5 bg-[#1e2433] rounded-full overflow-hidden"><div className="h-full bg-[#00d4ff]" style={{width:`${p.weight/20*100}%`}}/></div><span className="font-bold text-[#00d4ff]">{p.weight.toFixed(1)}%</span></div></td>
                <td className="py-3 px-3 font-mono" style={{color:p.beta>1.5?"#ff4444":p.beta>1?"#ffd600":"#00e676"}}>{p.beta.toFixed(2)}</td>
                <td className="py-3 px-3 font-mono" style={{color:p.sharpe>=2?"#00e676":p.sharpe>=1?"#ffd600":"#ff4444"}}>{p.sharpe.toFixed(2)}</td>
                <td className="py-3 px-3 font-mono text-[#ff4444]">-${p.var95.toLocaleString()}</td>
                <td className="py-3 px-3 font-mono">{p.correlation.toFixed(2)}</td>
                <td className="py-3 px-3 font-mono font-bold" style={{color:p.pnl>=0?"#00e676":"#ff4444"}}>{p.pnl>=0?"+":""}${p.pnl.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {view === "stress" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Stress Test Scenarios — Estimated Portfolio Impact</p>
          <div className="space-y-3">
            {STRESS.map(s => {
              const dollarImpact = totalValue * s.impact / 100;
              return (
                <div key={s.scenario} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex items-center gap-6">
                  <div className="w-52 flex-shrink-0"><p className="text-sm font-bold text-white">{s.scenario}</p><p className="text-[10px] text-[#8892a4]">Probability: {s.probability}%</p></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#8892a4]">Impact on Portfolio</span>
                      <span className="font-bold text-[#ff4444]">{s.impact.toFixed(1)}% · ${dollarImpact.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                    </div>
                    <div className="w-full h-3 bg-[#1e2433] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#ff4444]" style={{width:`${Math.min(Math.abs(s.impact)/35*100,100)}%`}}/>
                    </div>
                  </div>
                  <div className="w-20 text-center flex-shrink-0">
                    <p className="text-xs text-[#8892a4]">Probability</p>
                    <p className="text-lg font-bold text-[#ffd600]">{s.probability}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
