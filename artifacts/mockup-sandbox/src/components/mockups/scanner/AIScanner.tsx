import { useState } from "react";

type ScanResult = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  pattern: string;
  timeframe: string;
  confidence: number;
  signal: "Bullish" | "Bearish";
  volume: string;
  sector: string;
  age: string;
};

const RESULTS: ScanResult[] = [
  { id:1,  symbol:"NVDA",  name:"Nvidia",          price:875.40, change:4.21,  pattern:"Bull Flag",            timeframe:"1D", confidence:94, signal:"Bullish", volume:"3.2×",  sector:"Tech",     age:"2h ago" },
  { id:2,  symbol:"META",  name:"Meta Platforms",   price:524.30, change:3.14,  pattern:"Ascending Triangle",   timeframe:"4H", confidence:88, signal:"Bullish", volume:"2.1×",  sector:"Tech",     age:"45m ago" },
  { id:3,  symbol:"LLY",   name:"Eli Lilly",        price:892.10, change:2.34,  pattern:"Cup & Handle",         timeframe:"1D", confidence:85, signal:"Bullish", volume:"1.8×",  sector:"Health",   age:"3h ago" },
  { id:4,  symbol:"AAPL",  name:"Apple",            price:241.32, change:1.36,  pattern:"Breakout + Retest",    timeframe:"1H", confidence:82, signal:"Bullish", volume:"1.6×",  sector:"Tech",     age:"1h ago" },
  { id:5,  symbol:"JPM",   name:"JP Morgan",        price:201.50, change:2.01,  pattern:"Golden Cross",         timeframe:"1D", confidence:79, signal:"Bullish", volume:"1.4×",  sector:"Finance",  age:"5h ago" },
  { id:6,  symbol:"TSLA",  name:"Tesla",            price:245.10, change:-4.32, pattern:"Head & Shoulders",     timeframe:"4H", confidence:91, signal:"Bearish", volume:"4.8×",  sector:"Consumer", age:"30m ago" },
  { id:7,  symbol:"INTC",  name:"Intel",            price:31.20,  change:-3.44, pattern:"Bear Flag",            timeframe:"1D", confidence:86, signal:"Bearish", volume:"2.9×",  sector:"Tech",     age:"2h ago" },
  { id:8,  symbol:"XOM",   name:"ExxonMobil",       price:112.30, change:-2.56, pattern:"Double Top",           timeframe:"1D", confidence:77, signal:"Bearish", volume:"1.7×",  sector:"Energy",   age:"4h ago" },
  { id:9,  symbol:"MSFT",  name:"Microsoft",        price:418.90, change:2.12,  pattern:"Pennant",              timeframe:"4H", confidence:81, signal:"Bullish", volume:"1.5×",  sector:"Tech",     age:"1h ago" },
  { id:10, symbol:"AMZN",  name:"Amazon",           price:198.80, change:0.94,  pattern:"Flat Base",            timeframe:"1W", confidence:76, signal:"Bullish", volume:"1.3×",  sector:"Consumer", age:"6h ago" },
  { id:11, symbol:"QQQ",   name:"Nasdaq ETF",       price:448.60, change:-0.42, pattern:"Rising Wedge",         timeframe:"1D", confidence:73, signal:"Bearish", volume:"1.9×",  sector:"ETF",      age:"3h ago" },
  { id:12, symbol:"AMD",   name:"Advanced Micro",   price:168.40, change:3.88,  pattern:"Inverse H&S",          timeframe:"4H", confidence:84, signal:"Bullish", volume:"2.4×",  sector:"Tech",     age:"2h ago" },
];

const PATTERNS = ["All Patterns", "Bull Flag", "Ascending Triangle", "Cup & Handle", "Head & Shoulders", "Double Top", "Golden Cross", "Breakout + Retest"];
const TIMEFRAMES = ["All", "15m", "1H", "4H", "1D", "1W"];

export function AIScanner() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signal, setSignal] = useState<"all" | "Bullish" | "Bearish">("all");
  const [minConf, setMinConf] = useState(70);
  const [pattern, setPattern] = useState("All Patterns");
  const [tf, setTf] = useState("All");
  const [selected, setSelected] = useState<ScanResult | null>(RESULTS[0]);

  const runScan = () => {
    setRunning(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setRunning(false); return 100; }
        return p + 8;
      });
    }, 120);
  };

  const filtered = RESULTS.filter((r) => {
    if (signal !== "all" && r.signal !== signal) return false;
    if (r.confidence < minConf) return false;
    if (pattern !== "All Patterns" && r.pattern !== pattern) return false;
    if (tf !== "All" && r.timeframe !== tf) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AI Chart Scanner</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">S&P 500 + Nasdaq 100</span>
          <span className="text-xs text-[#00e676]">{filtered.length} matches</span>
        </div>
        <button onClick={runScan} disabled={running}
          className={`px-5 py-2 rounded text-sm font-bold transition-all ${running ? "bg-[#1e3a5f] text-[#00d4ff]" : "bg-[#00d4ff] text-[#0b0e14] hover:bg-[#33ddff]"}`}>
          {running ? `Scanning… ${progress}%` : "▶ Run Scan"}
        </button>
      </div>

      {running && (
        <div className="w-full h-0.5 bg-[#1e2433]">
          <div className="h-full bg-[#00d4ff] transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex items-center gap-3 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018]">
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {(["all", "Bullish", "Bearish"] as const).map((s) => (
            <button key={s} onClick={() => setSignal(s)}
              className={`px-3 py-1 text-xs capitalize transition-colors ${signal === s ? (s === "Bullish" ? "bg-[#00e67633] text-[#00e676]" : s === "Bearish" ? "bg-[#ff444433] text-[#ff4444]" : "bg-[#1e3a5f] text-[#00d4ff]") : "text-[#8892a4]"}`}>
              {s}
            </button>
          ))}
        </div>
        <select className="bg-[#131722] border border-[#1e2433] rounded px-2 py-1 text-xs text-white outline-none"
          value={pattern} onChange={(e) => setPattern(e.target.value)}>
          {PATTERNS.map((p) => <option key={p} className="bg-[#131722]">{p}</option>)}
        </select>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {TIMEFRAMES.map((t) => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-2.5 py-1 text-xs transition-colors ${tf === t ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-[#8892a4]">Min confidence:</span>
          <input type="range" min={50} max={95} value={minConf} onChange={(e) => setMinConf(Number(e.target.value))}
            className="w-24 accent-[#00d4ff]" />
          <span className="text-xs text-[#00d4ff] w-8">{minConf}%</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Symbol", "Pattern", "TF", "Conf.", "Signal", "Price", "Change", "Vol", "Sector", "Found"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)}
                  className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.id === r.id ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{r.symbol}</div>
                    <div className="text-[10px] text-[#8892a4]">{r.name}</div>
                  </td>
                  <td className="py-3 px-3 text-white">{r.pattern}</td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 bg-[#1e2433] text-[#8892a4] rounded text-[9px]">{r.timeframe}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-1.5 bg-[#1e2433] rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${r.confidence}%`, backgroundColor: r.confidence > 85 ? "#00e676" : r.confidence > 75 ? "#ffd600" : "#8892a4" }} />
                      </div>
                      <span className="font-bold" style={{ color: r.confidence > 85 ? "#00e676" : r.confidence > 75 ? "#ffd600" : "#8892a4" }}>{r.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.signal === "Bullish" ? "bg-[#00e67622] text-[#00e676]" : "bg-[#ff444422] text-[#ff4444]"}`}>{r.signal}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-white">${r.price.toFixed(2)}</td>
                  <td className={`py-3 px-3 font-mono font-bold ${r.change >= 0 ? "text-[#00e676]" : "text-[#ff4444]"}`}>{r.change >= 0 ? "+" : ""}{r.change.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-[#ffd600]">{r.volume}</td>
                  <td className="py-3 px-3 text-[#8892a4]">{r.sector}</td>
                  <td className="py-3 px-3 text-[#8892a4]">{r.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-60 border-l border-[#1e2433] p-4 flex flex-col gap-4">
            <div>
              <p className="text-lg font-bold">{selected.symbol}</p>
              <p className="text-xs text-[#8892a4]">{selected.name}</p>
            </div>
            <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-3">
              <p className="text-[10px] text-[#8892a4] mb-1">Pattern</p>
              <p className="text-sm font-bold text-white">{selected.pattern}</p>
              <p className="text-xs text-[#8892a4] mt-1">{selected.timeframe} • {selected.age}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Confidence", val: `${selected.confidence}%`, color: selected.confidence > 85 ? "#00e676" : "#ffd600" },
                { label: "Signal", val: selected.signal, color: selected.signal === "Bullish" ? "#00e676" : "#ff4444" },
                { label: "Volume", val: selected.volume, color: "#ffd600" },
                { label: "Sector", val: selected.sector, color: "#8892a4" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-[#131722] border border-[#1e2433] rounded p-2">
                  <p className="text-[9px] text-[#8892a4]">{label}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e2433] pt-3">
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">AI Notes</p>
              <p className="text-xs text-[#c8d3e0] leading-relaxed">
                {selected.signal === "Bullish"
                  ? `${selected.pattern} detected on ${selected.timeframe} with ${selected.volume} above-average volume. High probability continuation setup with strong momentum.`
                  : `${selected.pattern} forming on ${selected.timeframe} with elevated selling pressure. Increased risk of breakdown below key support.`}
              </p>
            </div>
            <button className="mt-auto py-2 rounded text-xs font-bold bg-[#1e3a5f] text-[#00d4ff] hover:bg-[#1e4a7f] transition-colors">
              Open Chart →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
