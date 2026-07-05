import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

type StockScore = {
  symbol: string; name: string; price: number; change: number; overallScore: number;
  trend: number; momentum: number; volume: number; volatility: number; pattern: number; breadth: number;
  maScore: number; rsiScore: number; macdScore: number; bollingerScore: number; vwapScore: number;
  rating: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  signals: string[];
};

const STOCKS: StockScore[] = [
  { symbol:"NVDA", name:"Nvidia",        price:875.4, change:4.19,  overallScore:94, trend:96, momentum:92, volume:88, volatility:72, pattern:98, breadth:88, maScore:95, rsiScore:78, macdScore:92, bollingerScore:84, vwapScore:96, rating:"Strong Buy",  signals:["Bull flag breakout","EMA 9>21>50 aligned","Volume surge 2.1× avg","AVWAP reclaim","RSI 68 — room to run"] },
  { symbol:"META", name:"Meta",          price:524.3, change:3.12,  overallScore:88, trend:92, momentum:86, volume:82, volatility:68, pattern:88, breadth:84, maScore:90, rsiScore:72, macdScore:86, bollingerScore:80, vwapScore:90, rating:"Strong Buy",  signals:["Ascending triangle break","Golden cross (50/200)","Institutional accumulation","Above all MAs"] },
  { symbol:"AAPL", name:"Apple",         price:241.3, change:1.35,  overallScore:76, trend:78, momentum:74, volume:72, volatility:84, pattern:72, breadth:76, maScore:80, rsiScore:62, macdScore:72, bollingerScore:78, vwapScore:78, rating:"Buy",        signals:["Holding 200 EMA","EMA 9>21 bullish","Volume below avg — watch","Cup & handle forming"] },
  { symbol:"AMD",  name:"AMD",           price:168.4, change:3.94,  overallScore:82, trend:84, momentum:80, volume:78, volatility:74, pattern:86, breadth:80, maScore:82, rsiScore:68, macdScore:80, bollingerScore:76, vwapScore:84, rating:"Buy",        signals:["Inv H&S breakout","MACD bullish cross","Data center catalyst","EMA stack bullish"] },
  { symbol:"TSLA", name:"Tesla",         price:245.1, change:-4.18, overallScore:28, trend:24, momentum:32, volume:42, volatility:38, pattern:22, breadth:28, maScore:24, rsiScore:34, macdScore:28, bollingerScore:32, vwapScore:24, rating:"Strong Sell", signals:["Head & shoulders top","Below all MAs","MACD death cross","Distribution on volume","RSI 34 — no support"] },
  { symbol:"INTC", name:"Intel",         price:31.2,  change:-3.41, overallScore:22, trend:18, momentum:24, volume:38, volatility:44, pattern:20, breadth:22, maScore:18, rsiScore:28, macdScore:22, bollingerScore:28, vwapScore:18, rating:"Strong Sell", signals:["Downtrend intact","50 EMA>200 EMA (death)","Guidance cut catalyst","All-time low proximity"] },
  { symbol:"SPY",  name:"S&P 500 ETF",   price:523.4, change:0.82,  overallScore:72, trend:74, momentum:70, volume:68, volatility:78, pattern:68, breadth:72, maScore:74, rsiScore:64, macdScore:68, bollingerScore:74, vwapScore:72, rating:"Buy",        signals:["Above 200 MA","Consolidating at ATH","Breadth improving","VIX declining"] },
  { symbol:"LLY",  name:"Eli Lilly",     price:892.1, change:2.27,  overallScore:90, trend:94, momentum:88, volume:84, volatility:76, pattern:92, breadth:88, maScore:92, rsiScore:74, macdScore:88, bollingerScore:82, vwapScore:92, rating:"Strong Buy",  signals:["Cup & handle break","FDA catalyst","Sector leader","Volume 1.8× avg","EMA 9>21>50 bullish"] },
];

const RATING_COLOR: Record<string, string> = { "Strong Buy":"#00e676", "Buy":"#00d4ff", "Neutral":"#ffd600", "Sell":"#ff8c00", "Strong Sell":"#ff4444" };

export function TechScore() {
  const [selected, setSelected] = useState<StockScore>(STOCKS[0]);
  const [view, setView] = useState<"list" | "detail" | "compare">("list");

  const radarData = [
    { metric:"Trend",     score: selected.trend },
    { metric:"Momentum",  score: selected.momentum },
    { metric:"Volume",    score: selected.volume },
    { metric:"Pattern",   score: selected.pattern },
    { metric:"Breadth",   score: selected.breadth },
    { metric:"Volatility",score: selected.volatility },
  ];

  const scoreColor = (s: number) => s >= 80 ? "#00e676" : s >= 60 ? "#ffd600" : s >= 40 ? "#ff8c00" : "#ff4444";

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Technical Rating Score</span>
          <span className="text-xs text-[#8892a4]">AI-powered technical analysis scoring</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["list","detail","compare"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {v === "compare" ? "Compare" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === "list" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {[...STOCKS].sort((a,b) => b.overallScore - a.overallScore).map((s) => (
              <button key={s.symbol} onClick={() => { setSelected(s); setView("detail"); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg border transition-all text-left ${selected.symbol === s.symbol ? "border-[#00d4ff] bg-[#00d4ff08]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                <div className="w-14">
                  <p className="font-bold text-white">{s.symbol}</p>
                  <p className="text-[10px] text-[#8892a4]">${s.price.toFixed(2)}</p>
                </div>
                <div className="w-16 text-center">
                  <div className="text-2xl font-bold" style={{ color: scoreColor(s.overallScore) }}>{s.overallScore}</div>
                  <div className="text-[8px] text-[#8892a4]">Score</div>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-[#1e2433] rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.overallScore}%`, backgroundColor: scoreColor(s.overallScore) }} />
                  </div>
                  <div className="flex gap-2">
                    {[["T", s.trend],["M", s.momentum],["V", s.volume],["P", s.pattern]].map(([l, v]) => (
                      <div key={l as string} className="flex items-center gap-0.5 text-[9px]">
                        <span className="text-[#8892a4]">{l}:</span>
                        <span style={{ color: scoreColor(Number(v)) }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: RATING_COLOR[s.rating] + "22", color: RATING_COLOR[s.rating] }}>{s.rating}</span>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-bold" style={{ color: s.change >= 0 ? "#00e676" : "#ff4444" }}>
                    {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "detail" && (
        <div className="flex flex-1 min-h-0 p-4 gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold" style={{ color: scoreColor(selected.overallScore) }}>{selected.overallScore}</div>
              <div>
                <p className="text-lg font-bold text-white">{selected.symbol} — {selected.name}</p>
                <p className="font-bold" style={{ color: RATING_COLOR[selected.rating] }}>{selected.rating}</p>
              </div>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e2433" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#8892a4" }} />
                  <Radar dataKey="score" stroke={scoreColor(selected.overallScore)} fill={scoreColor(selected.overallScore)} fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor:"#131722", border:"1px solid #1e2433", fontSize:11, borderRadius:4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-64 flex flex-col gap-4">
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Component Scores</p>
              {[["Trend",selected.trend],["Momentum",selected.momentum],["Volume",selected.volume],["Pattern",selected.pattern],["Breadth",selected.breadth],["Volatility",selected.volatility]].map(([l,v]) => (
                <div key={l as string} className="mb-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-[#8892a4]">{l}</span>
                    <span className="font-bold" style={{ color: scoreColor(Number(v)) }}>{v}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b0e14] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Number(v)}%`, backgroundColor: scoreColor(Number(v)) }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4 flex-1">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Active Signals</p>
              {selected.signals.map((sig, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-[#1e2433] text-xs">
                  <span className="text-[#00d4ff] mt-0.5">→</span>
                  <span className="text-[#c8d3e0]">{sig}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "compare" && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-4 gap-2">
            {["Trend","Momentum","Volume","Pattern","Breadth","Overall"].map((metric) => (
              <div key={metric} className="col-span-4 mb-2">
                <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2 px-1">{metric}</p>
                <div className="flex gap-2">
                  {STOCKS.map((s) => {
                    const v = metric === "Overall" ? s.overallScore : metric === "Trend" ? s.trend : metric === "Momentum" ? s.momentum : metric === "Volume" ? s.volume : metric === "Pattern" ? s.pattern : s.breadth;
                    return (
                      <div key={s.symbol} className="flex-1 bg-[#131722] border border-[#1e2433] rounded p-2">
                        <p className="text-[9px] text-[#8892a4] mb-1">{s.symbol}</p>
                        <div className="w-full h-12 bg-[#0b0e14] rounded-sm overflow-hidden flex items-end">
                          <div className="w-full rounded-sm" style={{ height: `${v}%`, backgroundColor: scoreColor(v) + "99" }} />
                        </div>
                        <p className="text-[10px] font-bold mt-1" style={{ color: scoreColor(v) }}>{v}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
