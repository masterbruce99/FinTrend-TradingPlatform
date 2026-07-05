import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, ScatterChart, Scatter } from "recharts";

type EarningsRecord = {
  quarter: string; date: string; epsEst: number; epsActual: number; surprise: number;
  revEst: number; revActual: number; revSurprise: number; guidance: "Raised" | "Lowered" | "In-Line" | "None";
  reaction1D: number; reaction1W: number;
};

const HISTORY: Record<string, EarningsRecord[]> = {
  AAPL: [
    { quarter:"Q1 '25", date:"Jan 30", epsEst:2.34, epsActual:2.40, surprise:2.56,  revEst:124.1,  revActual:124.3, revSurprise:0.2, guidance:"Raised",   reaction1D:3.2,  reaction1W:5.4 },
    { quarter:"Q4 '24", date:"Oct 31", epsEst:1.58, epsActual:1.64, surprise:3.80,  revEst:94.2,   revActual:94.9,  revSurprise:0.7, guidance:"In-Line",  reaction1D:1.8,  reaction1W:3.2 },
    { quarter:"Q3 '24", date:"Aug 1",  epsEst:1.33, epsActual:1.40, surprise:5.26,  revEst:84.2,   revActual:85.8,  revSurprise:1.9, guidance:"Raised",   reaction1D:4.8,  reaction1W:6.2 },
    { quarter:"Q2 '24", date:"May 2",  epsEst:1.50, epsActual:1.53, surprise:2.00,  revEst:90.5,   revActual:90.8,  revSurprise:0.3, guidance:"In-Line",  reaction1D:7.2,  reaction1W:9.4 },
    { quarter:"Q1 '24", date:"Feb 1",  epsEst:2.11, epsActual:2.18, surprise:3.32,  revEst:117.9,  revActual:119.6, revSurprise:1.4, guidance:"In-Line",  reaction1D:-0.4, reaction1W:1.2 },
    { quarter:"Q4 '23", date:"Nov 2",  epsEst:1.40, epsActual:1.46, surprise:4.29,  revEst:89.4,   revActual:89.5,  revSurprise:0.1, guidance:"In-Line",  reaction1D:2.4,  reaction1W:3.8 },
    { quarter:"Q3 '23", date:"Aug 3",  epsEst:1.20, epsActual:1.26, surprise:5.00,  revEst:81.7,   revActual:83.0,  revSurprise:1.6, guidance:"Raised",   reaction1D:4.2,  reaction1W:5.8 },
    { quarter:"Q2 '23", date:"May 4",  epsEst:1.43, epsActual:1.52, surprise:6.29,  revEst:92.9,   revActual:94.8,  revSurprise:2.0, guidance:"Raised",   reaction1D:4.7,  reaction1W:7.2 },
  ],
  NVDA: [
    { quarter:"Q4 '25", date:"Feb 26", epsEst:5.58, epsActual:5.89, surprise:5.56,  revEst:38.0,   revActual:39.3,  revSurprise:3.4, guidance:"Raised",   reaction1D:4.8,  reaction1W:8.4 },
    { quarter:"Q3 '25", date:"Nov 20", epsEst:0.73, epsActual:0.81, surprise:10.96, revEst:33.2,   revActual:35.1,  revSurprise:5.7, guidance:"Raised",   reaction1D:2.4,  reaction1W:6.8 },
    { quarter:"Q2 '25", date:"Aug 28", epsEst:0.63, epsActual:0.68, surprise:7.94,  revEst:28.6,   revActual:30.0,  revSurprise:4.9, guidance:"Raised",   reaction1D:6.4,  reaction1W:12.8 },
    { quarter:"Q1 '25", date:"May 22", epsEst:5.57, epsActual:6.12, surprise:9.87,  revEst:24.5,   revActual:26.0,  revSurprise:6.1, guidance:"Raised",   reaction1D:9.8,  reaction1W:18.4 },
    { quarter:"Q4 '24", date:"Feb 21", epsEst:4.59, epsActual:5.16, surprise:12.42, revEst:20.4,   revActual:22.1,  revSurprise:8.3, guidance:"Raised",   reaction1D:8.2,  reaction1W:14.2 },
    { quarter:"Q3 '24", date:"Nov 21", epsEst:3.35, epsActual:4.02, surprise:20.00, revEst:16.1,   revActual:18.1,  revSurprise:12.4,guidance:"Raised",   reaction1D:-2.4, reaction1W:4.2 },
    { quarter:"Q2 '24", date:"Aug 28", epsEst:2.54, epsActual:2.70, surprise:6.30,  revEst:11.0,   revActual:13.5,  revSurprise:22.7,guidance:"Raised",   reaction1D:6.4,  reaction1W:10.4 },
    { quarter:"Q1 '24", date:"May 22", epsEst:5.57, epsActual:6.12, surprise:9.87,  revEst:24.5,   revActual:26.0,  revSurprise:6.1, guidance:"Raised",   reaction1D:16.4, reaction1W:28.4 },
  ],
};

const UPCOMING = [
  { symbol:"AAPL", date:"Aug 1",   epsEst:1.42, revEst:85.4, impliedMove:4.2, guidance:"N/A" },
  { symbol:"MSFT", date:"Jul 30",  epsEst:3.12, revEst:68.4, impliedMove:5.8, guidance:"N/A" },
  { symbol:"META", date:"Jul 30",  epsEst:5.24, revEst:42.8, impliedMove:7.4, guidance:"N/A" },
  { symbol:"AMZN", date:"Aug 1",   epsEst:1.36, revEst:148.6,impliedMove:6.2, guidance:"N/A" },
  { symbol:"NVDA", date:"Aug 28",  epsEst:0.63, revEst:28.6, impliedMove:9.8, guidance:"N/A" },
  { symbol:"TSLA", date:"Jul 23",  epsEst:0.46, revEst:24.2, impliedMove:11.4,guidance:"N/A" },
  { symbol:"LLY",  date:"Aug 7",   epsEst:3.84, revEst:11.8, impliedMove:6.4, guidance:"N/A" },
];

const GUID_COLOR: Record<string, string> = { Raised:"#00e676", Lowered:"#ff4444", "In-Line":"#ffd600", None:"#8892a4" };

export function EarningsSurprise() {
  const [symbol, setSymbol] = useState<"AAPL"|"NVDA">("NVDA");
  const [view, setView] = useState<"history"|"upcoming"|"scatter">("history");
  const data = HISTORY[symbol];

  const avgSurprise = data.reduce((s, d) => s + d.surprise, 0) / data.length;
  const avgReaction = data.reduce((s, d) => s + d.reaction1D, 0) / data.length;
  const beatCount   = data.filter(d => d.surprise > 0).length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Earnings Surprise Tracker</span>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["AAPL","NVDA"] as const).map(s => (
              <button key={s} onClick={() => setSymbol(s)}
                className={`px-4 py-1.5 text-sm font-bold transition-colors ${symbol === s ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["history","upcoming","scatter"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "scatter" ? "Beat vs Move" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Avg EPS Beat", `+${avgSurprise.toFixed(2)}%`, "#00e676"],
          ["Beat Rate", `${beatCount}/${data.length}`, "#ffd600"],
          ["Avg 1D Move", `${avgReaction >= 0 ? "+" : ""}${avgReaction.toFixed(2)}%`, avgReaction >= 0 ? "#00e676" : "#ff4444"],
          ["Next Earnings", symbol === "AAPL" ? "Aug 1" : "Aug 28", "#00d4ff"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-lg font-bold" style={{ color: c as string }}>{v}</p></div>
        ))}
      </div>

      {view === "history" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4 flex-col">
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">EPS Surprise % by Quarter</p>
            <ResponsiveContainer width="100%" height="45%">
              <BarChart data={[...data].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "#8892a4" }} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={0} stroke="#8892a4" />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(2)}%`]} />
                <Bar dataKey="surprise" name="EPS Surprise" shape={(props: any) => {
                  const { x,y,width,height,value } = props;
                  return <rect x={x} y={value>=0?y:y+height} width={Math.max(width-2,1)} height={Math.abs(height)} fill={value>=0?"#00e67688":"#ff444488"} stroke={value>=0?"#00e676":"#ff4444"} strokeWidth={1} rx={2}/>;
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#8892a4] mb-3">1-Day Post-Earnings Move %</p>
            <ResponsiveContainer width="100%" height="45%">
              <BarChart data={[...data].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "#8892a4" }} />
                <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={0} stroke="#8892a4" />
                <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} formatter={(v:number) => [`${v.toFixed(2)}%`]} />
                <Bar dataKey="reaction1D" name="1D Move" shape={(props: any) => {
                  const { x,y,width,height,value } = props;
                  return <rect x={x} y={value>=0?y:y+height} width={Math.max(width-2,1)} height={Math.abs(height)} fill={value>=0?"#00d4ff44":"#ff444444"} stroke={value>=0?"#00d4ff":"#ff4444"} strokeWidth={1} rx={2}/>;
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-auto" style={{ maxHeight: 220 }}>
            <table className="w-full text-xs"><thead className="sticky top-0 bg-[#0b0e14]"><tr className="border-b border-[#1e2433]">{["Quarter","Date","EPS Est","EPS Act","Surprise","Rev Surprise","Guidance","1D","1W"].map(h=><th key={h} className="text-left py-2 px-3 text-[#8892a4] font-medium">{h}</th>)}</tr></thead>
              <tbody>{data.map(d=>(
                <tr key={d.quarter} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                  <td className="py-2 px-3 font-bold text-white">{d.quarter}</td>
                  <td className="py-2 px-3 text-[#8892a4]">{d.date}</td>
                  <td className="py-2 px-3 font-mono text-[#8892a4]">${d.epsEst.toFixed(2)}</td>
                  <td className="py-2 px-3 font-mono font-bold text-white">${d.epsActual.toFixed(2)}</td>
                  <td className="py-2 px-3 font-mono font-bold" style={{color:d.surprise>=0?"#00e676":"#ff4444"}}>{d.surprise>=0?"+":""}{d.surprise.toFixed(2)}%</td>
                  <td className="py-2 px-3 font-mono" style={{color:d.revSurprise>=0?"#00e676":"#ff4444"}}>{d.revSurprise>=0?"+":""}{d.revSurprise.toFixed(1)}%</td>
                  <td className="py-2 px-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:GUID_COLOR[d.guidance]+"22",color:GUID_COLOR[d.guidance]}}>{d.guidance}</span></td>
                  <td className="py-2 px-3 font-mono font-bold" style={{color:d.reaction1D>=0?"#00e676":"#ff4444"}}>{d.reaction1D>=0?"+":""}{d.reaction1D.toFixed(1)}%</td>
                  <td className="py-2 px-3 font-mono" style={{color:d.reaction1W>=0?"#00e676":"#ff4444"}}>{d.reaction1W>=0?"+":""}{d.reaction1W.toFixed(1)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {view === "upcoming" && (
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-[#8892a4] mb-4">Upcoming Earnings — Next 30 Days</p>
          <div className="space-y-2">
            {UPCOMING.map(u => (
              <div key={u.symbol} className="flex items-center gap-4 p-4 bg-[#131722] border border-[#1e2433] rounded-lg">
                <div className="w-16"><p className="font-bold text-white text-base">{u.symbol}</p><p className="text-[10px] text-[#8892a4]">{u.date}</p></div>
                <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
                  <div><p className="text-[#8892a4]">EPS Est</p><p className="font-bold text-white">${u.epsEst.toFixed(2)}</p></div>
                  <div><p className="text-[#8892a4]">Rev Est</p><p className="font-bold text-white">${u.revEst.toFixed(1)}B</p></div>
                  <div><p className="text-[#8892a4]">Implied Move</p><p className="font-bold text-[#ffd600]">±{u.impliedMove.toFixed(1)}%</p></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8892a4] mb-1">Options Implied</div>
                  <div className="w-24 h-2 bg-[#1e2433] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ffd600] rounded-full" style={{ width: `${Math.min(u.impliedMove * 8, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "scatter" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">EPS Surprise % vs 1-Day Stock Move — {symbol}</p>
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis type="number" dataKey="surprise" name="EPS Surprise %" tick={{ fontSize:9, fill:"#8892a4" }} tickFormatter={v=>`${v}%`} label={{ value:"EPS Surprise →", position:"bottom", fontSize:10, fill:"#8892a4" }} />
              <YAxis type="number" dataKey="reaction1D" name="1D Move %" tick={{ fontSize:9, fill:"#8892a4" }} tickFormatter={v=>`${v}%`} />
              <ReferenceLine x={0} stroke="#8892a4" strokeDasharray="3 4" />
              <ReferenceLine y={0} stroke="#8892a4" strokeDasharray="3 4" />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload as EarningsRecord;
                  return <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs"><p className="font-bold text-white">{d.quarter}</p><p className="text-[#00e676]">Surprise: +{d.surprise}%</p><p className="text-[#00d4ff]">1D: {d.reaction1D}%</p></div>;
                }} />
              <Scatter data={data} fill="#00d4ff88" stroke="#00d4ff" r={8}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const c = payload.reaction1D >= 0 ? "#00e676" : "#ff4444";
                  return <g><circle cx={cx} cy={cy} r={8} fill={c+"44"} stroke={c} strokeWidth={2}/><text x={cx} y={cy-12} textAnchor="middle" fontSize={9} fill={c}>{payload.quarter}</text></g>;
                }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
