import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";

type Trade = {
  id: number; date: string; symbol: string; side: "Long"|"Short";
  entry: number; exit: number; qty: number; pnl: number; pnlPct: number;
  setup: string; grade: "A"|"B"|"C"|"D"; notes: string; mae: number; mfe: number;
};

const TRADES: Trade[] = [
  { id:1,  date:"May 28", symbol:"NVDA", side:"Long",  entry:848.0, exit:912.4, qty:10, pnl:6440,  pnlPct:7.59,  setup:"Bull Flag",       grade:"A", notes:"Perfect entry at flag breakout, held through volatility", mae:-1.2, mfe:8.4 },
  { id:2,  date:"May 27", symbol:"AAPL", side:"Long",  entry:241.3, exit:238.4, qty:50, pnl:-145,  pnlPct:-1.20, setup:"Failed Breakout",  grade:"D", notes:"Chased breakout, should have waited for confirmation",     mae:-2.1, mfe:0.4 },
  { id:3,  date:"May 26", symbol:"META", side:"Long",  entry:504.2, exit:524.8, qty:20, pnl:4120,  pnlPct:4.09,  setup:"Earnings Play",   grade:"A", notes:"Earnings beat play, sized correctly, took partial at target", mae:-0.8, mfe:5.2 },
  { id:4,  date:"May 23", symbol:"TSLA", side:"Short", entry:245.1, exit:228.4, qty:40, pnl:6680,  pnlPct:6.82,  setup:"H&S Breakdown",   grade:"A", notes:"Textbook H&S neckline break, added at retest",              mae:-0.6, mfe:7.8 },
  { id:5,  date:"May 22", symbol:"AMD",  side:"Long",  entry:168.4, exit:172.4, qty:60, pnl:2400,  pnlPct:2.38,  setup:"Support Bounce",  grade:"B", notes:"Good trade but exited too early, more upside available",   mae:-1.8, mfe:4.2 },
  { id:6,  date:"May 21", symbol:"INTC", side:"Short", entry:30.8,  exit:32.4,  qty:200,pnl:-3200, pnlPct:-5.19, setup:"Breakdown Fail",  grade:"D", notes:"Stopped out, support held stronger than expected",         mae:-5.4, mfe:0.8 },
  { id:7,  date:"May 20", symbol:"SPY",  side:"Long",  entry:524.8, exit:529.4, qty:30, pnl:1380,  pnlPct:0.88,  setup:"Gap Fill",        grade:"B", notes:"Quick scalp on gap fill, clean execution",                 mae:-0.4, mfe:1.2 },
  { id:8,  date:"May 19", symbol:"COIN", side:"Long",  entry:244.8, exit:284.0, qty:25, pnl:9800,  pnlPct:16.01, setup:"Crypto Rally",    grade:"A", notes:"Held full position through crypto rally, conviction paid",  mae:-2.4, mfe:18.4 },
  { id:9,  date:"May 16", symbol:"LLY",  side:"Long",  entry:892.1, exit:942.0, qty:8,  pnl:3992,  pnlPct:5.59,  setup:"Phase 3 Catalyst",grade:"A", notes:"Drug catalyst play, sized appropriately for binary event",  mae:-1.0, mfe:7.2 },
  { id:10, date:"May 15", symbol:"MSFT", side:"Long",  entry:418.9, exit:412.4, qty:25, pnl:-1625, pnlPct:-1.55, setup:"Fade Failed",     grade:"C", notes:"Market reversed, stopped out at plan price",               mae:-2.2, mfe:0.6 },
  { id:11, date:"May 14", symbol:"AMZN", side:"Long",  entry:197.2, exit:212.4, qty:40, pnl:6080,  pnlPct:7.71,  setup:"AWS Narrative",   grade:"A", notes:"Long thesis played out well, AWS margins expanding",        mae:-0.8, mfe:9.4 },
  { id:12, date:"May 13", symbol:"PLTR", side:"Long",  entry:22.4,  exit:26.8,  qty:200,pnl:8800,  pnlPct:19.64, setup:"Cup & Handle",    grade:"A", notes:"Multi-week cup, held through 3 week consolidation",        mae:-1.4, mfe:22.4 },
];

const cumulativePnL = TRADES.slice().reverse().reduce((acc: {date:string,cumPnL:number}[], t, i) => {
  const prev = acc[i-1]?.cumPnL ?? 0;
  acc.push({ date: t.date, cumPnL: prev + t.pnl });
  return acc;
}, []);

const totalPnL   = TRADES.reduce((s,t) => s + t.pnl, 0);
const winTrades  = TRADES.filter(t => t.pnl > 0);
const lossTrades = TRADES.filter(t => t.pnl <= 0);
const winRate    = (winTrades.length / TRADES.length * 100).toFixed(1);
const avgWin     = winTrades.reduce((s,t) => s + t.pnl, 0)  / winTrades.length;
const avgLoss    = lossTrades.reduce((s,t) => s + t.pnl, 0) / lossTrades.length;
const profitFactor = Math.abs(winTrades.reduce((s,t)=>s+t.pnl,0) / lossTrades.reduce((s,t)=>s+t.pnl,0));

const GRADE_COLOR: Record<string,string> = { A:"#00e676", B:"#00d4ff", C:"#ffd600", D:"#ff4444" };
const gradeData = ["A","B","C","D"].map(g => ({ grade:g, count:TRADES.filter(t=>t.grade===g).length, color:GRADE_COLOR[g] }));

export function TradeJournal() {
  const [view, setView] = useState<"list"|"stats"|"curve">("list");
  const [selectedTrade, setSelectedTrade] = useState<Trade|null>(null);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Trade Journal</span>
          <span className="text-xs text-[#8892a4]">{TRADES.length} trades — May 2025</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["list","stats","curve"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view===v?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>
              {v === "curve" ? "Equity Curve" : v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Total P&L", `${totalPnL>=0?"+":""}$${totalPnL.toLocaleString()}`, totalPnL>=0?"#00e676":"#ff4444"],
          ["Win Rate",  `${winRate}%`,       winRate >= "60" ? "#00e676":"#ff4444"],
          ["Profit Factor", profitFactor.toFixed(2), profitFactor >= 1.5 ? "#00e676":"#ffd600"],
          ["Avg Win/Loss", `${(avgWin/Math.abs(avgLoss)).toFixed(2)}:1`, "#00d4ff"],
          ["Best Trade", `+$${Math.max(...TRADES.map(t=>t.pnl)).toLocaleString()}`, "#00e676"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-lg font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      {view === "list" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0e14]"><tr className="border-b border-[#1e2433]">
                {["Date","Symbol","Side","Entry","Exit","Qty","P&L","P&L %","Setup","Grade"].map(h=>(
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>{TRADES.map(t => (
                <tr key={t.id} onClick={() => setSelectedTrade(selectedTrade?.id===t.id?null:t)}
                  className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selectedTrade?.id===t.id?"bg-[#131722]":"hover:bg-[#0f1320]"}`}>
                  <td className="py-2 px-3 text-[#8892a4]">{t.date}</td>
                  <td className="py-2 px-3 font-bold text-white">{t.symbol}</td>
                  <td className="py-2 px-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.side==="Long"?"bg-[#00e67622] text-[#00e676]":"bg-[#ff444422] text-[#ff4444]"}`}>{t.side}</span></td>
                  <td className="py-2 px-3 font-mono text-[#8892a4]">${t.entry.toFixed(2)}</td>
                  <td className="py-2 px-3 font-mono text-white">${t.exit.toFixed(2)}</td>
                  <td className="py-2 px-3 text-[#8892a4]">{t.qty}</td>
                  <td className="py-2 px-3 font-bold font-mono" style={{color:t.pnl>=0?"#00e676":"#ff4444"}}>{t.pnl>=0?"+":""}${t.pnl.toLocaleString()}</td>
                  <td className="py-2 px-3 font-mono" style={{color:t.pnlPct>=0?"#00e676":"#ff4444"}}>{t.pnlPct>=0?"+":""}{t.pnlPct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-[#8892a4] max-w-[140px] truncate">{t.setup}</td>
                  <td className="py-2 px-3"><span className="font-bold text-sm" style={{color:GRADE_COLOR[t.grade]}}>{t.grade}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {selectedTrade && (
            <div className="w-64 border-l border-[#1e2433] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg text-white">{selectedTrade.symbol}</p>
                <span className="font-bold text-2xl" style={{color:GRADE_COLOR[selectedTrade.grade]}}>{selectedTrade.grade}</span>
              </div>
              {[["Setup",selectedTrade.setup,"#00d4ff"],["MAE",`-${selectedTrade.mae.toFixed(1)}%`,"#ff4444"],["MFE",`+${selectedTrade.mfe.toFixed(1)}%`,"#00e676"],["Captured",`${(selectedTrade.pnlPct/selectedTrade.mfe*100).toFixed(0)}% of move`,"#ffd600"]].map(([l,v,c]) => (
                <div key={l as string} className="flex justify-between text-xs border-b border-[#1e2433] pb-2">
                  <span className="text-[#8892a4]">{l}</span><span className="font-bold" style={{color:c as string}}>{v}</span>
                </div>
              ))}
              <p className="text-xs text-[#8892a4] uppercase tracking-widest mt-1">Notes</p>
              <p className="text-xs text-[#c8d3e0] leading-relaxed">{selectedTrade.notes}</p>
            </div>
          )}
        </div>
      )}

      {view === "stats" && (
        <div className="flex-1 p-4 grid grid-cols-2 gap-4">
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-4">P&L by Trade</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...TRADES].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="symbol" tick={{fontSize:8,fill:"#8892a4"}} />
                <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${(v/1000).toFixed(1)}K`} />
                <ReferenceLine y={0} stroke="#8892a4" />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${v>=0?"+":""}$${v.toLocaleString()}`,"P&L"]} />
                <Bar dataKey="pnl" shape={(p:any)=>{const {x,y,width,height,value}=p;return <rect x={x} y={value>=0?y:y+height} width={Math.max(width-1,1)} height={Math.abs(height)} fill={value>=0?"#00e67688":"#ff444488"} stroke={value>=0?"#00e676":"#ff4444"} strokeWidth={1} rx={2}/>;}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-4">Trade Grades</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart><Pie data={gradeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count">
                  {gradeData.map((g,i) => <Cell key={i} fill={g.color+"99"} stroke={g.color} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="flex-1">
                {gradeData.map(g=>(
                  <div key={g.grade} className="flex items-center gap-2 py-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{backgroundColor:g.color}}/>
                    <span className="text-sm font-bold" style={{color:g.color}}>{g.grade}</span>
                    <span className="text-xs text-[#8892a4] flex-1">{g.count} trades</span>
                    <span className="text-xs font-bold text-white">{(g.count/TRADES.length*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">Key Statistics</p>
            {[
              ["Trades",TRADES.length.toString(),"#fff"],["Wins",winTrades.length.toString(),"#00e676"],["Losses",lossTrades.length.toString(),"#ff4444"],
              ["Avg Win",`$${avgWin.toFixed(0)}`,"#00e676"],["Avg Loss",`$${avgLoss.toFixed(0)}`,"#ff4444"],
              ["Best Day",`+$${Math.max(...TRADES.map(t=>t.pnl)).toLocaleString()}`,"#00e676"],
              ["Worst Day",`-$${Math.abs(Math.min(...TRADES.map(t=>t.pnl))).toLocaleString()}`,"#ff4444"],
            ].map(([l,v,c])=>(
              <div key={l as string} className="flex justify-between text-xs py-1.5 border-b border-[#1e2433]">
                <span className="text-[#8892a4]">{l}</span><span className="font-bold" style={{color:c as string}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-xs text-[#8892a4] mb-3">MAE vs MFE (avg)</p>
            <div className="flex flex-col gap-3 mt-4">
              {["mae","mfe"].map(field=>{
                const avg = TRADES.reduce((s,t)=>s+t[field as "mae"|"mfe"],0)/TRADES.length;
                const label = field === "mae" ? "Avg MAE (Max Adverse)" : "Avg MFE (Max Favorable)";
                const color = field === "mae" ? "#ff4444" : "#00e676";
                return (
                  <div key={field}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-[#8892a4]">{label}</span><span className="font-bold" style={{color}}>{field==="mae"?"-":"+"}{avg.toFixed(2)}%</span></div>
                    <div className="w-full h-3 bg-[#1e2433] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${Math.min(avg*8,100)}%`,backgroundColor:color}}/>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-[#8892a4] mt-2">Efficiency: <span className="font-bold text-[#00d4ff]">{(TRADES.reduce((s,t)=>s+t.pnlPct/t.mfe,0)/TRADES.length*100).toFixed(0)}%</span> of available move captured</p>
            </div>
          </div>
        </div>
      )}

      {view === "curve" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Cumulative P&L Curve — May 2025</p>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={cumulativePnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="date" tick={{fontSize:9,fill:"#8892a4"}} />
              <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${(v/1000).toFixed(1)}K`} />
              <ReferenceLine y={0} stroke="#8892a4" />
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`$${v.toLocaleString()}`,"Cumulative P&L"]} />
              <defs><linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/><stop offset="95%" stopColor="#00e676" stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="cumPnL" stroke="#00e676" fill="url(#curveGrad)" strokeWidth={2.5} dot={{r:4,fill:"#00e676"}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
