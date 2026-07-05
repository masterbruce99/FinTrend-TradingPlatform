import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts";

const generateHistory = (base: number, noise: number, trend: number, len = 60) =>
  Array.from({ length: len }, (_, i) => base + trend * i + Math.sin(i * 0.4) * noise + (Math.random() - 0.5) * noise * 0.5);

const TICK_HIST  = generateHistory(0, 400, 2, 78);
const TRIN_HIST  = generateHistory(1.0, 0.3, -0.004, 78);
const ADVDEC_HIST= generateHistory(0, 600, 8, 78);
const VOLD_HIST  = generateHistory(0, 800000000, 5000000, 78);
const MCLELLAN   = generateHistory(0, 40, 0.3, 78);

const TIMES = Array.from({ length: 78 }, (_, i) => {
  const mins = i * 5;
  const h = 9 + Math.floor((30 + mins) / 60);
  const m = (30 + mins) % 60;
  return `${h}:${m.toString().padStart(2,"0")}`;
});

const histData = TIMES.map((t, i) => ({
  time: t,
  TICK:     Math.round(TICK_HIST[i]),
  TRIN:     parseFloat(TRIN_HIST[i].toFixed(3)),
  "AD":     Math.round(ADVDEC_HIST[i]),
  VOLD:     Math.round(VOLD_HIST[i]),
  McClellan:parseFloat(MCLELLAN[i].toFixed(2)),
}));

const INTERNALS = [
  { id:"TICK", label:"NYSE TICK",     desc:"Advancing minus declining stocks (tick-by-tick)", bullish:"> +600 strong", bearish:"< -600 weak" },
  { id:"TRIN", label:"TRIN / ARMS",   desc:"Volume-weighted breadth — below 1.0 = bullish money flow", bullish:"< 0.75 bullish", bearish:"> 1.25 bearish" },
  { id:"AD",   label:"A/D Line",      desc:"Cumulative advance-decline line — market breadth trend", bullish:"New highs = broad bull", bearish:"Divergence = weakness" },
  { id:"VOLD", label:"UVOL-DVOL",     desc:"Upside volume minus downside volume — dollar flow", bullish:"Positive = accumulation", bearish:"Negative = distribution" },
  { id:"McClellan", label:"McClellan", desc:"Breadth oscillator based on advancing/declining issues", bullish:"> +100 overbought", bearish:"< -100 oversold" },
];

export function MarketInternals() {
  const [activeInternal, setActiveInternal] = useState("TICK");
  const [liveData, setLiveData] = useState({ TICK: 284, TRIN: 0.82, AD: 1840, VOLD: 420000000, McClellan: 28.4 });

  useEffect(() => {
    const id = setInterval(() => {
      setLiveData((prev) => ({
        TICK:      Math.round(prev.TICK + (Math.random() - 0.48) * 80),
        TRIN:      parseFloat(Math.max(0.3, Math.min(3.0, prev.TRIN + (Math.random() - 0.51) * 0.04)).toFixed(3)),
        AD:        Math.round(prev.AD + (Math.random() - 0.47) * 40),
        VOLD:      Math.round(prev.VOLD + (Math.random() - 0.48) * 20000000),
        McClellan: parseFloat((prev.McClellan + (Math.random() - 0.5) * 1.5).toFixed(2)),
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const cur = activeInternal as keyof typeof liveData;
  const info = INTERNALS.find((i) => i.id === activeInternal)!;

  const tickColor = (v: number) => v > 600 ? "#00e676" : v > 0 ? "#a0cfa0" : v > -600 ? "#ff9999" : "#ff4444";
  const trinColor = (v: number) => v < 0.75 ? "#00e676" : v < 1.0 ? "#a0cfa0" : v < 1.25 ? "#ff9999" : "#ff4444";
  const adColor  = (v: number) => v > 800 ? "#00e676" : v > 0 ? "#a0cfa0" : v > -800 ? "#ff9999" : "#ff4444";
  const voldColor = (v: number) => v > 0 ? "#00e676" : "#ff4444";
  const mcColor  = (v: number) => v > 50 ? "#ff4444" : v > 0 ? "#00e676" : v > -50 ? "#ffd600" : "#00d4ff";

  const getColor = (id: string, v: number) => {
    if (id === "TICK") return tickColor(v);
    if (id === "TRIN") return trinColor(v);
    if (id === "AD")   return adColor(v);
    if (id === "VOLD") return voldColor(v);
    return mcColor(v);
  };

  const formatVal = (id: string, v: number) => {
    if (id === "VOLD") return `${v > 0 ? "+" : ""}${(v / 1000000).toFixed(0)}M`;
    if (id === "TRIN") return v.toFixed(3);
    return v.toFixed(id === "McClellan" ? 1 : 0);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Market Internals</span>
          <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-xs text-[#00e676]">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-5 border-b border-[#1e2433]">
        {INTERNALS.map((item) => {
          const v = liveData[item.id as keyof typeof liveData];
          const c = getColor(item.id, v);
          return (
            <button key={item.id} onClick={() => setActiveInternal(item.id)}
              className={`p-4 text-center border-r border-[#1e2433] transition-all ${activeInternal === item.id ? "bg-[#131722]" : "hover:bg-[#0d1018]"}`}>
              <p className="text-[10px] text-[#8892a4] mb-1">{item.label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: c }}>{formatVal(item.id, v)}</p>
              <div className={`w-full h-0.5 mt-2 rounded-full ${activeInternal === item.id ? "bg-[#00d4ff]" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      <div className="px-5 py-3 border-b border-[#1e2433] bg-[#0d1018] flex items-center gap-6">
        <div>
          <p className="text-sm font-bold">{info.label}</p>
          <p className="text-xs text-[#8892a4]">{info.desc}</p>
        </div>
        <div className="flex gap-6 ml-auto text-xs">
          <span className="text-[#00e676]">↑ {info.bullish}</span>
          <span className="text-[#ff4444]">↓ {info.bearish}</span>
        </div>
      </div>

      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {activeInternal === "TRIN" ? (
            <LineChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#8892a4" }} interval={11} />
              <YAxis domain={[0.3, 2.5]} tick={{ fontSize: 9, fill: "#8892a4" }} />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} />
              <ReferenceLine y={1.0} stroke="#8892a4" strokeDasharray="4 4" label={{ value:"Neutral", fill:"#8892a4", fontSize:9 }} />
              <ReferenceLine y={0.75} stroke="#00e67666" strokeDasharray="3 4" />
              <ReferenceLine y={1.25} stroke="#ff444466" strokeDasharray="3 4" />
              <Line type="monotone" dataKey="TRIN" stroke="#ffd600" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: "#8892a4" }} interval={11} />
              <YAxis tick={{ fontSize: 9, fill: "#8892a4" }} tickFormatter={(v) => activeInternal === "VOLD" ? `${(v/1e6).toFixed(0)}M` : v.toFixed(0)} />
              <ReferenceLine y={0} stroke="#8892a4" strokeWidth={1} />
              <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }}
                formatter={(v:number) => [formatVal(activeInternal, v)]} />
              {activeInternal === "TICK" && <>
                <ReferenceLine y={600}  stroke="#00e67644" strokeDasharray="4 4" />
                <ReferenceLine y={-600} stroke="#ff444444" strokeDasharray="4 4" />
              </>}
              <Area type="monotone" dataKey={activeInternal} stroke={getColor(activeInternal, liveData[cur])} fill={getColor(activeInternal, liveData[cur]) + "22"} strokeWidth={2} dot={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
