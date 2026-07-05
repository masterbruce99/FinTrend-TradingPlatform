import { useState } from "react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const N = 80;
const PRICES = Array.from({ length: N }, (_, i) =>
  parseFloat((235 + Math.sin(i * 0.22) * 14 + Math.cos(i * 0.12) * 7 + i * 0.18 + (i > 50 ? (i-50)*0.3 : 0)).toFixed(2))
);

function highest(arr: number[], period: number, i: number) {
  return Math.max(...arr.slice(Math.max(0, i - period + 1), i + 1));
}
function lowest(arr: number[], period: number, i: number) {
  return Math.min(...arr.slice(Math.max(0, i - period + 1), i + 1));
}

const DATA = PRICES.map((close, i) => {
  const tenkanSen  = i >= 8  ? (highest(PRICES,9,i)  + lowest(PRICES,9,i))  / 2 : null;
  const kijunSen   = i >= 25 ? (highest(PRICES,26,i) + lowest(PRICES,26,i)) / 2 : null;
  const senkouA    = i >= 8  && i >= 25 ? ((highest(PRICES,9,i-1)+lowest(PRICES,9,i-1))/2 + (highest(PRICES,26,i-1)+lowest(PRICES,26,i-1))/2) / 2 : null;
  const senkouB    = i >= 51 ? (highest(PRICES,52,i-1) + lowest(PRICES,52,i-1)) / 2 : null;
  const chikouSpan = i >= 25 ? PRICES[i - 25] : null;
  const cloudTop   = senkouA !== null && senkouB !== null ? Math.max(senkouA, senkouB) : null;
  const cloudBot   = senkouA !== null && senkouB !== null ? Math.min(senkouA, senkouB) : null;
  const bullCloud  = senkouA !== null && senkouB !== null && senkouA > senkouB;

  const DAYS = Array.from({length:N},(_,j)=>{const d=new Date("2025-02-01");d.setDate(d.getDate()+j);return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})});
  return { day: DAYS[i], close, tenkanSen, kijunSen, senkouA, senkouB, cloudTop, cloudBot, bullCloud, chikouSpan };
});

const last = DATA[DATA.length - 1];
const prevLast = DATA[DATA.length - 2];
const aboveCloud = last.close > (last.cloudTop ?? 0);
const tka = last.tenkanSen !== null && last.kijunSen !== null && last.tenkanSen > last.kijunSen;
const bullSignal = aboveCloud && tka;

const SIGNALS = DATA.filter((d, i) => {
  if (i === 0) return false;
  const prev = DATA[i-1];
  return (d.tenkanSen !== null && d.kijunSen !== null && prev.tenkanSen !== null && prev.kijunSen !== null &&
    ((d.tenkanSen > d.kijunSen) !== (prev.tenkanSen > prev.kijunSen)));
}).slice(-4);

export function IchimokuCloud() {
  const [showComponents, setShowComponents] = useState({ tenkan:true, kijun:true, chikou:true, cloud:true });
  const toggle = (k: keyof typeof showComponents) => setShowComponents(s => ({...s,[k]:!s[k]}));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — Ichimoku Cloud</span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold ${bullSignal?"border-[#00e67644] bg-[#00e67611] text-[#00e676]":"border-[#ff444444] bg-[#ff444411] text-[#ff4444]"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${bullSignal?"bg-[#00e676]":"bg-[#ff4444]"}`}/>
            {bullSignal ? "Bullish Alignment" : "Bearish Alignment"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            ["Tenkan","tenkan","#00d4ff"],["Kijun","kijun","#ff8c00"],
            ["Chikou","chikou","#a78bfa"],["Cloud","cloud","#8892a4"],
          ].map(([l,k,c]) => (
            <button key={k} onClick={() => toggle(k as keyof typeof showComponents)}
              className={`px-2.5 py-1 text-xs rounded border transition-all font-medium ${showComponents[k as keyof typeof showComponents] ? "border-current opacity-100" : "opacity-30 border-[#1e2433]"}`}
              style={{color:c as string, borderColor:showComponents[k as keyof typeof showComponents]?(c as string):"#1e2433"}}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["Price",    `$${last.close.toFixed(2)}`,                last.close > (DATA[DATA.length-2].close) ? "#00e676":"#ff4444"],
          ["Tenkan-Sen", last.tenkanSen ? `$${last.tenkanSen.toFixed(2)}` : "—", "#00d4ff"],
          ["Kijun-Sen",  last.kijunSen  ? `$${last.kijunSen.toFixed(2)}`  : "—", "#ff8c00"],
          ["Cloud",    aboveCloud ? "Above (Bullish)" : "Below (Bearish)", aboveCloud?"#00e676":"#ff4444"],
          ["TK Cross", tka ? "Bullish (T>K)" : "Bearish (K>T)", tka?"#00e676":"#ff4444"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
              <XAxis dataKey="day" tick={{fontSize:8,fill:"#8892a4"}} interval={11} />
              <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:"#8892a4"}} tickFormatter={v=>`$${v.toFixed(0)}`} />
              <Tooltip contentStyle={{backgroundColor:"#131722",border:"1px solid #1e2433",fontSize:11,borderRadius:4}}
                formatter={(v:any) => v ? [`$${Number(v).toFixed(2)}`] : ["—"]} />
              {showComponents.cloud && (
                <>
                  <Area type="monotone" dataKey="cloudTop" fill="#00e67622" stroke="none" connectNulls />
                  <Area type="monotone" dataKey="cloudBot" fill="#0b0e14" stroke="none" connectNulls />
                  <Line type="monotone" dataKey="senkouA" stroke="#00e67666" strokeWidth={1} dot={false} connectNulls strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="senkouB" stroke="#ff444466" strokeWidth={1} dot={false} connectNulls strokeDasharray="5 3" />
                </>
              )}
              {showComponents.chikou && <Line type="monotone" dataKey="chikouSpan" stroke="#a78bfa88" strokeWidth={1.5} dot={false} connectNulls />}
              {showComponents.kijun  && <Line type="monotone" dataKey="kijunSen"   stroke="#ff8c00"   strokeWidth={2}   dot={false} connectNulls />}
              {showComponents.tenkan && <Line type="monotone" dataKey="tenkanSen"  stroke="#00d4ff"   strokeWidth={2}   dot={false} connectNulls />}
              <Line type="monotone" dataKey="close" stroke="#ffffff" strokeWidth={2.5} dot={false} />
              {SIGNALS.map((s, i) => (
                <ReferenceLine key={i} x={s.day} stroke="#ffd60044" strokeDasharray="3 4"
                  label={{value:s.tenkanSen! > s.kijunSen! ? "↑TK" : "↓TK", fill:s.tenkanSen! > s.kijunSen! ? "#00e676":"#ff4444", fontSize:9}} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="w-52 flex flex-col gap-4">
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Ichimoku Checklist</p>
            {[
              ["Price above cloud",   aboveCloud],
              ["Tenkan above Kijun",  tka],
              ["Price above Tenkan",  last.tenkanSen !== null && last.close > last.tenkanSen],
              ["Price above Kijun",   last.kijunSen  !== null && last.close > last.kijunSen],
              ["Chikou above price",  last.chikouSpan !== null && last.chikouSpan > last.close * 0.98],
            ].map(([label,pass]) => (
              <div key={label as string} className="flex items-center justify-between py-1.5 border-b border-[#1e2433]">
                <span className="text-xs text-[#8892a4]">{label as string}</span>
                <span className={`text-xs font-bold ${pass ? "text-[#00e676]" : "text-[#ff4444]"}`}>{pass ? "✓" : "✗"}</span>
              </div>
            ))}
            <div className="mt-3 text-center">
              <p className="text-xs text-[#8892a4] mb-1">Bullish Signals</p>
              <p className="text-2xl font-bold text-[#00d4ff]">{[aboveCloud,tka,last.tenkanSen !== null && last.close > last.tenkanSen,last.kijunSen !== null && last.close > last.kijunSen].filter(Boolean).length}/4</p>
            </div>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">TK Cross Signals</p>
            {SIGNALS.slice(0,3).map((s,i) => (
              <div key={i} className="py-2 border-b border-[#1e2433]">
                <div className="flex justify-between">
                  <span className="text-xs text-[#8892a4]">{s.day}</span>
                  <span className="text-[10px] font-bold" style={{color:s.tenkanSen! > s.kijunSen! ? "#00e676":"#ff4444"}}>
                    {s.tenkanSen! > s.kijunSen! ? "▲ Bullish Cross" : "▼ Bearish Cross"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Key Levels</p>
            {[["Tenkan",last.tenkanSen,"#00d4ff"],["Kijun",last.kijunSen,"#ff8c00"],["Cloud Top",last.cloudTop,"#00e676"],["Cloud Bot",last.cloudBot,"#ff4444"]].map(([l,v,c]) => (
              <div key={l as string} className="flex justify-between py-1.5 border-b border-[#1e2433]">
                <span className="text-xs text-[#8892a4]">{l as string}</span>
                <span className="text-xs font-bold font-mono" style={{color:c as string}}>{v ? `$${(v as number).toFixed(2)}` : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
