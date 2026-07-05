import { useState } from "react";

type DivStock = {
  symbol: string;
  name: string;
  price: number;
  dividend: number;
  yield: number;
  frequency: "Monthly" | "Quarterly" | "Annual";
  exDate: string;
  payDate: string;
  growth5y: number;
  payout: number;
  sector: string;
  consecutive: number;
  aristocrat: boolean;
};

const STOCKS: DivStock[] = [
  { symbol:"JNJ",   name:"J&J",             price:147.60, dividend:1.24, yield:3.36, frequency:"Quarterly", exDate:"Jun 10", payDate:"Jun 25", growth5y:5.2, payout:48, sector:"Health",   consecutive:62, aristocrat:true },
  { symbol:"KO",    name:"Coca-Cola",        price:63.20,  dividend:0.485,yield:3.07, frequency:"Quarterly", exDate:"Jun 13", payDate:"Jul 1",  growth5y:4.8, payout:74, sector:"Consumer", consecutive:62, aristocrat:true },
  { symbol:"PG",    name:"Procter & Gamble", price:168.40, dividend:0.9407,yield:2.23,frequency:"Quarterly",exDate:"Jun 19", payDate:"Jul 15", growth5y:5.4, payout:64, sector:"Consumer", consecutive:67, aristocrat:true },
  { symbol:"MMM",   name:"3M Company",       price:128.80, dividend:0.70, yield:2.17, frequency:"Quarterly", exDate:"Jun 20", payDate:"Jul 12", growth5y:3.1, payout:82, sector:"Industrial",consecutive:65, aristocrat:true },
  { symbol:"ABBV",  name:"AbbVie",           price:168.20, dividend:1.55, yield:3.69, frequency:"Quarterly", exDate:"Jun 14", payDate:"May 15", growth5y:8.4, payout:56, sector:"Health",   consecutive:52, aristocrat:true },
  { symbol:"JPM",   name:"JP Morgan",        price:201.50, dividend:1.25, yield:2.48, frequency:"Quarterly", exDate:"Jul 5",  payDate:"Jul 31", growth5y:12.1,payout:28, sector:"Finance",  consecutive:14, aristocrat:false },
  { symbol:"AAPL",  name:"Apple",            price:241.32, dividend:0.25, yield:0.41, frequency:"Quarterly", exDate:"Aug 9",  payDate:"Aug 15", growth5y:4.8, payout:15, sector:"Tech",     consecutive:12, aristocrat:false },
  { symbol:"MSFT",  name:"Microsoft",        price:418.90, dividend:0.75, yield:0.72, frequency:"Quarterly", exDate:"Aug 14", payDate:"Sep 12", growth5y:10.2,payout:26, sector:"Tech",     consecutive:22, aristocrat:false },
  { symbol:"NEE",   name:"NextEra Energy",   price:76.40,  dividend:0.515,yield:2.70, frequency:"Quarterly", exDate:"Jun 4",  payDate:"Jun 15", growth5y:10.8,payout:60, sector:"Utility",  consecutive:28, aristocrat:false },
  { symbol:"REALTY",name:"Realty Income",    price:56.20,  dividend:0.264,yield:5.63, frequency:"Monthly",   exDate:"Jun 30", payDate:"Jul 15", growth5y:3.2, payout:78, sector:"REIT",     consecutive:30, aristocrat:true },
  { symbol:"O",     name:"AGNC Investment",  price:10.40,  dividend:0.12, yield:13.85,frequency:"Monthly",  exDate:"Jun 28", payDate:"Jul 8",  growth5y:-2.1,payout:105,sector:"REIT",     consecutive:8,  aristocrat:false },
  { symbol:"XOM",   name:"ExxonMobil",       price:112.30, dividend:0.99, yield:3.53, frequency:"Quarterly", exDate:"May 13", payDate:"Jun 10", growth5y:6.2, payout:46, sector:"Energy",   consecutive:42, aristocrat:true },
];

export function DividendCalendar() {
  const [minYield, setMinYield] = useState(0);
  const [maxPayout, setMaxPayout] = useState(100);
  const [aristocratOnly, setAristocratOnly] = useState(false);
  const [frequency, setFrequency] = useState("All");
  const [sortBy, setSortBy] = useState<"yield" | "growth5y" | "consecutive">("yield");
  const [selected, setSelected] = useState<DivStock | null>(STOCKS[0]);

  const filtered = STOCKS
    .filter((s) => {
      if (s.yield < minYield) return false;
      if (s.payout > maxPayout) return false;
      if (aristocratOnly && !s.aristocrat) return false;
      if (frequency !== "All" && s.frequency !== frequency) return false;
      return true;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Dividend Calendar & Screener</span>
          <span className="text-xs text-[#8892a4]">{filtered.length} stocks</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {["All","Monthly","Quarterly","Annual"].map((f) => (
              <button key={f} onClick={() => setFrequency(f)}
                className={`px-2.5 py-1 text-xs transition-colors ${frequency === f ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {f}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${aristocratOnly ? "bg-[#ffd600]" : "bg-[#1e2433]"}`} onClick={() => setAristocratOnly(!aristocratOnly)}>
              <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${aristocratOnly ? "right-0.5" : "left-0.5"}`} />
            </div>
            <span className="text-[#ffd600]">Aristocrats only</span>
          </label>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-52 border-r border-[#1e2433] p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Min Yield %</p>
            <input type="range" min={0} max={10} step={0.5} value={minYield} onChange={(e) => setMinYield(Number(e.target.value))}
              className="w-full accent-[#00d4ff]" />
            <p className="text-xs text-[#00d4ff] mt-1">{minYield.toFixed(1)}%+</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Max Payout %</p>
            <input type="range" min={30} max={110} step={5} value={maxPayout} onChange={(e) => setMaxPayout(Number(e.target.value))}
              className="w-full accent-[#a78bfa]" />
            <p className="text-xs text-[#a78bfa] mt-1">&lt;{maxPayout}%</p>
          </div>
          <div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Sort By</p>
            {([["yield","Yield"],["growth5y","5Y Growth"],["consecutive","Consecutive Yrs"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs mb-1 transition-colors ${sortBy === key ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-[#1e2433] pt-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Upcoming Ex-Dates</p>
            {STOCKS.sort((a, b) => a.exDate.localeCompare(b.exDate)).slice(0, 5).map((s) => (
              <div key={s.symbol} className="flex justify-between py-1.5 border-b border-[#1e2433] text-xs">
                <span className="font-bold text-white">{s.symbol}</span>
                <span className="text-[#ffd600]">{s.exDate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0b0e14]">
              <tr className="border-b border-[#1e2433]">
                {["Symbol","Yield","Dividend","Frequency","Ex-Date","Pay Date","5Y Growth","Payout","Streak",""].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[#8892a4] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.symbol} onClick={() => setSelected(s)}
                  className={`border-b border-[#1e2433] cursor-pointer transition-colors ${selected?.symbol === s.symbol ? "bg-[#131722]" : "hover:bg-[#0f1320]"}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{s.symbol}</span>
                      {s.aristocrat && <span className="text-[8px] text-[#ffd600]">★</span>}
                    </div>
                    <div className="text-[10px] text-[#8892a4]">{s.name}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-lg font-bold" style={{ color: s.yield > 5 ? "#ffd600" : s.yield > 3 ? "#00e676" : "#8892a4" }}>
                      {s.yield.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-white">${s.dividend.toFixed(3)}</td>
                  <td className="py-3 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.frequency === "Monthly" ? "bg-[#00e67622] text-[#00e676]" : s.frequency === "Quarterly" ? "bg-[#00d4ff22] text-[#00d4ff]" : "bg-[#a78bfa22] text-[#a78bfa]"}`}>
                      {s.frequency}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#ffd600] font-mono">{s.exDate}</td>
                  <td className="py-3 px-3 text-[#8892a4] font-mono">{s.payDate}</td>
                  <td className="py-3 px-3 font-mono" style={{ color: s.growth5y > 0 ? "#00e676" : "#ff4444" }}>
                    {s.growth5y > 0 ? "+" : ""}{s.growth5y.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-[#1e2433] rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(s.payout, 100)}%`, backgroundColor: s.payout > 80 ? "#ff4444" : s.payout > 60 ? "#ffd600" : "#00e676" }} />
                      </div>
                      <span className={s.payout > 80 ? "text-[#ff4444]" : "text-[#8892a4]"}>{s.payout}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#8892a4]">{s.consecutive}yr</td>
                  <td className="py-3 px-3">
                    {s.aristocrat && <span className="text-[9px] text-[#ffd600] border border-[#ffd60044] px-1.5 py-0.5 rounded">Aristocrat</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
