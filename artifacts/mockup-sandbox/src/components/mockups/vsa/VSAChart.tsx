import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type VSABar = {
  time: string; open: number; high: number; low: number; close: number; volume: number;
  vsaType: string; vsaSignal: string; spread: "Wide"|"Narrow"|"Normal"; background: "Up"|"Down";
  color: string; significance: "High"|"Medium"|"Low";
};

const BASE = [238,240,239,242,241,244,248,246,251,255,253,249,248,244,240,238,241,244,248,252,
              251,254,258,262,260,264,268,272,270,268,264,260,256,252,248,252,256,260,264,268];

const VSA_TYPES: Record<string, { color: string; desc: string }> = {
  "Accumulation": { color:"#00e676",desc:"Low spread bar on high volume closing near high — smart money buying" },
  "Distribution":  { color:"#ff4444",desc:"Wide spread bar on high volume closing near low — smart money selling" },
  "No Demand":     { color:"#ff8c00",desc:"Narrow spread up bar on low volume — weak buyers, expect reversal" },
  "No Supply":     { color:"#00d4ff",desc:"Narrow spread down bar on low volume — weak sellers, expect reversal" },
  "Stopping Vol":  { color:"#a78bfa",desc:"High volume down bar closing near high — sellers absorbed" },
  "Effort No Res": { color:"#ffd600",desc:"High volume bar with no follow-through — hidden supply/demand" },
  "Climax Buy":    { color:"#ff4444",desc:"Ultra high volume wide spread — climax exhaustion top" },
  "Climax Sell":   { color:"#00e676",desc:"Ultra high volume wide spread down — climax exhaustion bottom" },
  "Normal":        { color:"#8892a4",desc:"Normal market activity — no significant VSA signal" },
};

const BARS: VSABar[] = BASE.map((close, i) => {
  const open = BASE[Math.max(0, i-1)];
  const spread = Math.abs(close - open);
  const avgSpread = 4;
  const vol = Math.round(800000 + Math.sin(i * 0.7) * 600000 + (i % 7 === 0 ? 2000000 : 0));
  const avgVol = 1000000;
  const isWide = spread > avgSpread * 1.5;
  const isNarrow = spread < avgSpread * 0.6;
  const isHighVol = vol > avgVol * 1.5;
  const isLowVol = vol < avgVol * 0.6;
  const closingNearHigh = (close - Math.min(open, close)) / Math.max(spread, 0.01) > 0.6;
  const closingNearLow  = (close - Math.min(open, close)) / Math.max(spread, 0.01) < 0.3;
  const isUp = close > open;

  let vsaType = "Normal";
  let vsaSignal = "";
  let significance: "High"|"Medium"|"Low" = "Low";

  if (!isUp && isHighVol && i >= 5 && BASE[i] < Math.min(...BASE.slice(Math.max(0,i-3),i))) {
    vsaType = "Stopping Vol"; vsaSignal = "Potential bottom"; significance = "High";
  } else if (isUp && isWide && isHighVol && closingNearHigh && i >= 5 && BASE[i] > Math.max(...BASE.slice(Math.max(0,i-5),i))) {
    vsaType = "Climax Buy"; vsaSignal = "Watch for reversal"; significance = "High";
  } else if (!isUp && isWide && isHighVol && closingNearHigh) {
    vsaType = "Accumulation"; vsaSignal = "Smart money buying"; significance = "High";
  } else if (isUp && isWide && isHighVol && closingNearLow) {
    vsaType = "Distribution"; vsaSignal = "Smart money selling"; significance = "High";
  } else if (isUp && isNarrow && isLowVol) {
    vsaType = "No Demand"; vsaSignal = "Bearish signal"; significance = "Medium";
  } else if (!isUp && isNarrow && isLowVol) {
    vsaType = "No Supply"; vsaSignal = "Bullish signal"; significance = "Medium";
  } else if (isHighVol && isNarrow) {
    vsaType = "Effort No Res"; vsaSignal = "Hidden absorption"; significance = "Medium";
  }

  const times = Array.from({length:40},(_,j)=>{const h=9+Math.floor((30+j*10)/60),m=(30+j*10)%60;return `${h}:${m.toString().padStart(2,"0")}`});
  return {
    time: times[i], open, close, high: Math.max(open,close)+spread*0.3+1, low: Math.min(open,close)-spread*0.3-0.5,
    volume: vol, vsaType, vsaSignal,
    spread: isWide ? "Wide" : isNarrow ? "Narrow" : "Normal",
    background: isUp ? "Up" : "Down",
    color: VSA_TYPES[vsaType].color,
    significance,
  };
});

const SIGNALS = BARS.filter(b => b.vsaType !== "Normal").slice(-8).reverse();

export function VSAChart() {
  const [selected, setSelected] = useState<VSABar | null>(SIGNALS[0] ?? null);
  const [view, setView] = useState<"chart"|"signals">("chart");

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — Volume Spread Analysis</span>
          <span className="text-xs text-[#8892a4]">Wyckoff VSA Method</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["chart","signals"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "signals" ? "Signal Feed" : "VSA Chart"}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4 flex-col">
          <div style={{flex:1.6}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={BARS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{fontSize:7,fill:"#8892a4"}} interval={7} />
                <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                  content={({payload,label}) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as VSABar;
                    return <div className="bg-[#131722] border border-[#1e2433] rounded p-2 text-xs">
                      <p className="font-bold text-white">{label}</p>
                      <p style={{color:d.color}}>{d.vsaType}</p>
                      <p className="text-[#8892a4]">{d.vsaSignal}</p>
                      <p className="text-[#8892a4]">Spread: {d.spread} | Vol: {(d.volume/1000000).toFixed(2)}M</p>
                    </div>;
                  }} />
                <Line type="monotone" dataKey="close" stroke="#ffffff" strokeWidth={2} dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.vsaType === "Normal") return <circle cx={cx} cy={cy} r={0} fill="none" />;
                  return <circle cx={cx} cy={cy} r={6} fill={payload.color+"44"} stroke={payload.color} strokeWidth={2} />;
                }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{flex:0.8}}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={BARS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{fontSize:7,fill:"#8892a4"}} interval={7} />
                <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`${(v/1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${(v/1000000).toFixed(2)}M`,"Volume"]} />
                <Bar dataKey="volume" shape={(props: any) => {
                  const { x,y,width,height,payload } = props;
                  return <rect x={x} y={y} width={Math.max(width-1,1)} height={height} fill={payload.color+"77"} stroke={payload.vsaType !== "Normal" ? payload.color : "none"} strokeWidth={payload.vsaType !== "Normal" ? 1 : 0} />;
                }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === "signals" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {SIGNALS.map((bar, i) => (
              <button key={i} onClick={() => setSelected(bar)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${selected?.time === bar.time ? "border-[#00d4ff] bg-[#00d4ff08]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor:bar.color}} />
                    <span className="font-bold" style={{color:bar.color}}>{bar.vsaType}</span>
                    <span className="text-xs text-[#8892a4]">at {bar.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{backgroundColor:bar.color+"22",color:bar.color}}>{bar.significance}</span>
                    <span className="text-xs font-bold text-white">${bar.close.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-[#c8d3e0]">{bar.vsaSignal} — {VSA_TYPES[bar.vsaType]?.desc}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-[#8892a4]">
                  <span>Spread: {bar.spread}</span>
                  <span>Vol: {(bar.volume/1000000).toFixed(2)}M</span>
                  <span>Background: {bar.background}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="w-56 border-l border-[#1e2433] p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-4">VSA Glossary</p>
            {Object.entries(VSA_TYPES).filter(([k]) => k !== "Normal").map(([name, info]) => (
              <div key={name} className="mb-3 pb-3 border-b border-[#1e2433]">
                <p className="text-[10px] font-bold mb-0.5" style={{color:info.color}}>{name}</p>
                <p className="text-[9px] text-[#8892a4] leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
