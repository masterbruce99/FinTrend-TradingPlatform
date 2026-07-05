import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type Mover = {
  symbol: string; name: string; price: number; prevClose: number;
  change: number; changePct: number; volume: number; avgVolume: number;
  session: "Pre"|"Post"; catalyst: string; float: number;
};

const PRE_MOVERS: Mover[] = [
  { symbol:"NVDA", name:"Nvidia",        price:912.40, prevClose:875.4, change:37.0,  changePct:4.23,  volume:4284000, avgVolume:42000000, session:"Pre",  catalyst:"Earnings beat, guidance raised", float:2460 },
  { symbol:"TSLA", name:"Tesla",         price:228.40, prevClose:245.1, change:-16.7, changePct:-6.81, volume:8420000, avgVolume:88000000, session:"Pre",  catalyst:"Recall announced — 44K vehicles",  float:3200 },
  { symbol:"GME",  name:"GameStop",      price:38.40,  prevClose:24.4,  change:14.0,  changePct:57.38, volume:28400000,avgVolume:4800000,  session:"Pre",  catalyst:"Ryan Cohen tweet + short squeeze",  float:232 },
  { symbol:"LLY",  name:"Eli Lilly",     price:942.0,  prevClose:892.1, change:49.9,  changePct:5.59,  volume:1240000, avgVolume:4400000,  session:"Pre",  catalyst:"Phase 3 obesity drug trial success", float:948 },
  { symbol:"COIN", name:"Coinbase",      price:284.0,  prevClose:244.8, change:39.2,  changePct:16.01, volume:3840000, avgVolume:6800000,  session:"Pre",  catalyst:"Crypto rally + SEC settlement news",  float:238 },
  { symbol:"MRNA", name:"Moderna",       price:118.4,  prevClose:138.6, change:-20.2, changePct:-14.57,volume:4820000, avgVolume:7200000,  session:"Pre",  catalyst:"Trial failure announcement",         float:382 },
];

const POST_MOVERS: Mover[] = [
  { symbol:"META", name:"Meta",           price:548.4,  prevClose:524.3, change:24.1,  changePct:4.60,  volume:8420000, avgVolume:18000000, session:"Post", catalyst:"Q2 earnings beat, raised guidance", float:2148 },
  { symbol:"MSFT", name:"Microsoft",      price:448.0,  prevClose:418.9, change:29.1,  changePct:6.95,  volume:12400000,avgVolume:22000000, session:"Post", catalyst:"Azure cloud revenue +28% YoY",      float:7440 },
  { symbol:"AMZN", name:"Amazon",         price:212.4,  prevClose:197.2, change:15.2,  changePct:7.71,  volume:18400000,avgVolume:42000000, session:"Post", catalyst:"AWS margin expansion beat",         float:10200 },
  { symbol:"AAPL", name:"Apple",          price:234.8,  prevClose:241.3, change:-6.5,  changePct:-2.69, volume:24800000,avgVolume:58000000, session:"Post", catalyst:"iPhone revenue missed estimates",   float:15400 },
  { symbol:"SNAP", name:"Snap",           price:12.4,   prevClose:9.8,   change:2.6,   changePct:26.53, volume:42400000,avgVolume:28000000, session:"Post", catalyst:"DAU growth surprise beat",          float:1640 },
];

const GAPPERS = Array.from({ length: 12 }, (_, i) => ({
  symbol: ["NVDA","GME","LLY","COIN","SNAP","RBLX","PLTR","SOFI","NIO","HOOD","MARA","RIOT"][i],
  gap: [4.23,57.38,5.59,16.01,26.53,-8.4,12.4,-14.57,8.2,-6.8,22.4,18.6][i],
}));

export function PreMarket() {
  const [session, setSession] = useState<"pre"|"post"|"gappers">("pre");
  const [movers, setMovers] = useState([...PRE_MOVERS]);
  const [time, setTime] = useState("07:42:18 ET");

  useEffect(() => {
    const id = setInterval(() => {
      setMovers(prev => prev.map(m => ({
        ...m,
        price: parseFloat((m.price * (1 + (Math.random() - 0.499) * 0.002)).toFixed(2)),
        change: parseFloat((m.price - m.prevClose).toFixed(2)),
        changePct: parseFloat(((m.price - m.prevClose) / m.prevClose * 100).toFixed(2)),
        volume: m.volume + Math.round(Math.random() * 50000),
      })));
      setTime(new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" }) + " ET");
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const displayMovers = session === "pre" ? movers : session === "post" ? POST_MOVERS : [];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Extended Hours Scanner</span>
          <span className="w-2 h-2 rounded-full bg-[#ffd600] animate-pulse" />
          <span className="text-xs text-[#ffd600]">{time}</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["pre","post","gappers"] as const).map(v => (
            <button key={v} onClick={() => setSession(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${session === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "pre" ? "Pre-Market" : v === "post" ? "After Hours" : "Gap Scanner"}
            </button>
          ))}
        </div>
      </div>

      {session !== "gappers" && (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0e14]">
                <tr className="border-b border-[#1e2433]">
                  {["Symbol","Price","Change","Change %","EH Volume","Rel. Vol","Catalyst"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayMovers.sort((a,b) => Math.abs(b.changePct) - Math.abs(a.changePct)).map(m => (
                  <tr key={m.symbol} className="border-b border-[#1e2433] hover:bg-[#0f1320]">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{m.symbol}</div>
                      <div className="text-[9px] text-[#8892a4]">{m.name}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">${m.price.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold" style={{color:m.change>=0?"#00e676":"#ff4444"}}>{m.change>=0?"+":""}{m.change.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-lg" style={{color:m.changePct>=0?"#00e676":"#ff4444"}}>{m.changePct>=0?"+":""}{m.changePct.toFixed(2)}%</td>
                    <td className="py-3 px-3 font-mono text-[#8892a4]">{(m.volume/1000000).toFixed(2)}M</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                          <div className="h-full bg-[#ffd600]" style={{width:`${Math.min(m.volume/m.avgVolume*50,100)}%`}} />
                        </div>
                        <span className="font-bold text-[#ffd600] text-[10px]">{(m.volume/m.avgVolume).toFixed(1)}×</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#8892a4] max-w-xs truncate">{m.catalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {session === "gappers" && (
        <div className="flex-1 p-6">
          <p className="text-xs text-[#8892a4] mb-4">Today's Gap-Up / Gap-Down at Open</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={[...GAPPERS].sort((a,b) => b.gap - a.gap)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="symbol" tick={{fontSize:10,fill:"#8892a4"}} />
              <YAxis tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`${v}%`} />
              <ReferenceLine y={0} stroke="#8892a4" strokeWidth={2} />
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}} formatter={(v:number)=>[`${v.toFixed(2)}%`,"Gap"]} />
              <Bar dataKey="gap" shape={(props: any) => {
                const { x,y,width,height,value } = props;
                return <rect x={x} y={value>=0?y:y+height} width={Math.max(width-2,1)} height={Math.abs(height)} fill={value>=0?"#00e67688":"#ff444488"} stroke={value>=0?"#00e676":"#ff4444"} strokeWidth={1} rx={3}/>;
              }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
