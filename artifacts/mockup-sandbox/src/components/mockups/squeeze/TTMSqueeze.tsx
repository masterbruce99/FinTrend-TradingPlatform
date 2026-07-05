import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

const N = 80;
const BASE = Array.from({ length: N }, (_, i) => 238 + Math.sin(i * 0.25) * 12 + Math.cos(i * 0.15) * 6 + i * 0.12);

function sma(arr: number[], len: number, i: number) {
  if (i < len - 1) return null;
  return arr.slice(i - len + 1, i + 1).reduce((a, b) => a + b, 0) / len;
}
function stddev(arr: number[], len: number, i: number) {
  const m = sma(arr, len, i)!;
  const variance = arr.slice(i - len + 1, i + 1).reduce((a, b) => a + (b - m) ** 2, 0) / len;
  return Math.sqrt(variance);
}

const CHART_DATA = BASE.map((price, i) => {
  const bb_upper = i >= 19 ? (sma(BASE, 20, i)! + 2 * stddev(BASE, 20, i)!) : null;
  const bb_lower = i >= 19 ? (sma(BASE, 20, i)! - 2 * stddev(BASE, 20, i)!) : null;
  const kc_atr   = i >= 19 ? Math.abs(BASE[i] - BASE[i-1]) * 1.5 + 3 : 6;
  const kc_mid   = i >= 19 ? sma(BASE, 20, i) : null;
  const kc_upper = kc_mid ? kc_mid + kc_atr : null;
  const kc_lower = kc_mid ? kc_mid - kc_atr : null;
  const squeeze  = bb_upper !== null && kc_upper !== null && bb_upper < kc_upper && (bb_lower ?? 0) > (kc_lower ?? 0);
  const momentum = i >= 19 ? (sma(BASE, 20, i)! - (Math.max(...BASE.slice(i-19,i+1)) + Math.min(...BASE.slice(i-19,i+1))) / 2) * (Math.random() * 0.4 + 0.8) : null;

  const times = Array.from({length:N},(_,j)=>{const h=9+Math.floor((30+j*5)/60),m=(30+j*5)%60;return `${h}:${m.toString().padStart(2,"0")}`});
  return {
    time: times[i], price,
    bb_upper, bb_lower, kc_upper, kc_lower,
    squeeze, momentum,
    squeezeColor: squeeze ? "#ffd600" : "#00e676",
  };
});

const lastMom = CHART_DATA[CHART_DATA.length - 1].momentum ?? 0;
const prevMom = CHART_DATA[CHART_DATA.length - 2].momentum ?? 0;
const squeezeActive = CHART_DATA.slice(-5).filter(d => d.squeeze).length >= 3;
const squeezeJustFired = !squeezeActive && CHART_DATA.slice(-8).some(d => d.squeeze);

export function TTMSqueeze() {
  const [view, setView] = useState<"main"|"momentum"|"both">("both");
  const [showBB, setShowBB] = useState(true);
  const [showKC, setShowKC] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — TTM Squeeze</span>
          <span className="text-xs text-[#8892a4]">Bollinger Bands inside Keltner Channels</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold ${squeezeActive ? "border-[#ffd60044] bg-[#ffd60011] text-[#ffd600]" : squeezeJustFired ? "border-[#00e67644] bg-[#00e67611] text-[#00e676]" : "border-[#1e2433] text-[#8892a4]"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${squeezeActive ? "bg-[#ffd600] animate-pulse" : squeezeJustFired ? "bg-[#00e676]" : "bg-[#8892a4]"}`} />
            {squeezeActive ? "SQUEEZE ON" : squeezeJustFired ? "SQUEEZE FIRED" : "No Squeeze"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setShowBB(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showBB?"bg-[#00d4ff]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showBB?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">BB</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setShowKC(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showKC?"bg-[#a78bfa]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showKC?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">KC</span>
          </label>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["both","main","momentum"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v === "both" ? "Combined" : v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Price", `$${BASE[BASE.length-1].toFixed(2)}`, "white"],
          ["Momentum", `${lastMom >= 0 ? "+" : ""}${lastMom.toFixed(2)}`, lastMom > 0 ? (lastMom > prevMom ? "#00e676" : "#a0cfa0") : lastMom < prevMom ? "#ff4444" : "#ffa0a0"],
          ["Trend", lastMom > 0 ? (lastMom > prevMom ? "▲ Accelerating" : "▲ Decelerating") : (lastMom < prevMom ? "▼ Accelerating" : "▼ Decelerating"), lastMom > 0 ? "#00e676" : "#ff4444"],
          ["Signal", squeezeActive ? "Wait — coiling" : squeezeJustFired ? (lastMom > 0 ? "Long signal fired!" : "Short signal fired!") : "No squeeze", squeezeJustFired ? (lastMom > 0 ? "#00e676" : "#ff4444") : "#8892a4"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-base font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        {(view === "main" || view === "both") && (
          <div style={{ flex: view === "both" ? 1.4 : 1 }}>
            <p className="text-[10px] text-[#8892a4] mb-1">Price + BB/KC Channels</p>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{fontSize:7,fill:"#8892a4"}} interval={11} />
                <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} />
                {showKC && <><Line type="monotone" dataKey="kc_upper" stroke="#a78bfa66" strokeWidth={1} dot={false} strokeDasharray="5 3" connectNulls /><Line type="monotone" dataKey="kc_lower" stroke="#a78bfa66" strokeWidth={1} dot={false} strokeDasharray="5 3" connectNulls /></>}
                {showBB && <><Line type="monotone" dataKey="bb_upper" stroke="#00d4ff66" strokeWidth={1.5} dot={false} connectNulls /><Line type="monotone" dataKey="bb_lower" stroke="#00d4ff66" strokeWidth={1.5} dot={false} connectNulls /></>}
                <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {(view === "momentum" || view === "both") && (
          <div style={{ flex: view === "both" ? 0.8 : 1 }}>
            <p className="text-[10px] text-[#8892a4] mb-1">Momentum Histogram + Squeeze Dots</p>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="time" tick={{fontSize:7,fill:"#8892a4"}} interval={11} />
                <YAxis tick={{fontSize:9,fill:"#8892a4"}} />
                <ReferenceLine y={0} stroke="#8892a4" />
                <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} />
                <Bar dataKey="momentum" shape={(props: any) => {
                  const { x,y,width,height,value } = props;
                  const isAccel = value !== null && (CHART_DATA[CHART_DATA.findIndex(d=>d.momentum===value)-1]?.momentum ?? 0);
                  const growing = value >= 0 ? value > Number(isAccel) : value < Number(isAccel);
                  const fill = value >= 0 ? (growing ? "#00e676" : "#8eded8") : (growing ? "#ff4444" : "#ff9898");
                  return <rect x={x} y={value>=0?y:y+height} width={Math.max(width-1,1)} height={Math.abs(height)} fill={fill} />;
                }} connectNulls />
                <Line dataKey="squeeze" dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return <circle key={cx} cx={cx} cy={0} r={3} fill={payload.squeeze ? "#ffd600" : "#00e676"} />;
                }} stroke="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
