import { useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
const TIME_BRACKETS = Array.from({ length: 13 }, (_, i) => {
  const h = 9 + Math.floor((30 + i * 30) / 60);
  const m = (30 + i * 30) % 60;
  return `${h}:${m.toString().padStart(2,"0")}`;
});

const PRICE_RANGE = Array.from({ length: 50 }, (_, i) => parseFloat((220 + i * 0.6).toFixed(2)));

function buildTPO() {
  const pocIdx = 28;
  const vahIdx = 39;
  const valIdx = 16;
  const tpoMap: Record<number, string[]> = {};

  PRICE_RANGE.forEach((_, priceIdx) => {
    tpoMap[priceIdx] = [];
    TIME_BRACKETS.forEach((_, timeIdx) => {
      const letter = LETTERS[timeIdx];
      const distFromPOC = Math.abs(priceIdx - pocIdx);
      const probActive = distFromPOC < 8 ? 0.85 : distFromPOC < 14 ? 0.55 : distFromPOC < 20 ? 0.3 : 0.12;
      if (Math.random() < probActive) {
        tpoMap[priceIdx].push(letter);
      }
    });
  });
  return tpoMap;
}

const TPO_MAP = buildTPO();
const POC_IDX = 28;
const VAH_IDX = 39;
const VAL_IDX = 16;

const MAX_LETTERS = Math.max(...Object.values(TPO_MAP).map(a => a.length));
const TIME_COLORS: Record<string, string> = {
  A:"#00d4ff", B:"#00c4ef", C:"#a78bfa", D:"#8b5cf6", E:"#ffd600", F:"#f59e0b",
  G:"#00e676", H:"#10b981", I:"#ff6b6b", J:"#ef4444", K:"#f97316", L:"#fb923c", M:"#64748b",
};

export function MarketProfile() {
  const [view, setView] = useState<"tpo"|"volume"|"composite">("tpo");
  const [showInitBalance, setShowInitBalance] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string|null>(null);
  const [showLetters, setShowLetters] = useState(true);

  const ibTop = VAH_IDX - 8;
  const ibBot = VAL_IDX + 8;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">AAPL — Market Profile (TPO)</span>
          <span className="text-xs text-[#8892a4]">Time Price Opportunity · 30-min brackets</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setShowInitBalance(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showInitBalance?"bg-[#ffd600]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showInitBalance?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">IB Range</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs" onClick={() => setShowLetters(v=>!v)}>
            <div className={`w-7 h-3.5 rounded-full relative transition-colors ${showLetters?"bg-[#00d4ff]":"bg-[#1e2433]"}`}><div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${showLetters?"right-0.5":"left-0.5"}`}/></div>
            <span className="text-[#8892a4]">Letters</span>
          </label>
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["tpo","volume","composite"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize font-medium transition-colors ${view===v?"bg-[#1e3a5f] text-[#00d4ff]":"text-[#8892a4]"}`}>
                {v === "composite" ? "Composite" : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 px-5 py-2 border-b border-[#1e2433] bg-[#0d1018] gap-4 text-center">
        {[
          ["POC", `$${PRICE_RANGE[POC_IDX].toFixed(2)}`, "#ffd600"],
          ["VAH", `$${PRICE_RANGE[VAH_IDX].toFixed(2)}`, "#00e676"],
          ["VAL", `$${PRICE_RANGE[VAL_IDX].toFixed(2)}`, "#ff4444"],
          ["IB Range",`$${PRICE_RANGE[ibBot].toFixed(2)} – $${PRICE_RANGE[ibTop].toFixed(2)}`,"#a78bfa"],
        ].map(([l,v,c]) => (
          <div key={l as string}><p className="text-[10px] text-[#8892a4]">{l}</p><p className="text-sm font-bold" style={{color:c as string}}>{v}</p></div>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-0.5">
            {[...PRICE_RANGE].reverse().map((price, revIdx) => {
              const priceIdx = PRICE_RANGE.length - 1 - revIdx;
              const letters = TPO_MAP[priceIdx] || [];
              const isPOC = priceIdx === POC_IDX;
              const isVAH = priceIdx === VAH_IDX;
              const isVAL = priceIdx === VAL_IDX;
              const isIB  = showInitBalance && priceIdx >= ibBot && priceIdx <= ibTop;
              const inVA  = priceIdx >= VAL_IDX && priceIdx <= VAH_IDX;

              return (
                <div key={priceIdx} className="flex items-center gap-1" style={{ minHeight: 14 }}>
                  <span className="text-[8px] font-mono w-12 text-right flex-shrink-0"
                    style={{ color: isPOC ? "#ffd600" : isVAH ? "#00e676" : isVAL ? "#ff4444" : "#4a5568" }}>
                    ${price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-0.5 flex-1 relative"
                    style={{ backgroundColor: isPOC ? "#ffd60008" : isIB ? "#a78bfa08" : inVA ? "#00e67606" : "transparent" }}>
                    {view === "tpo" && showLetters && letters.map((letter, j) => (
                      <span key={j} className="text-[9px] font-bold leading-none cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ color: selectedLetter === letter ? "#ffffff" : TIME_COLORS[letter] || "#8892a4", fontFamily:"monospace" }}
                        onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}>
                        {letter}
                      </span>
                    ))}
                    {view === "volume" && (
                      <div className="h-2.5 rounded-sm" style={{
                        width: `${(letters.length / MAX_LETTERS) * 100}%`,
                        minWidth: letters.length > 0 ? 2 : 0,
                        backgroundColor: isPOC ? "#ffd60088" : inVA ? "#a78bfa66" : "#00d4ff44",
                        border: isPOC ? "1px solid #ffd600" : "none",
                      }}/>
                    )}
                    {view === "composite" && letters.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        <div className="h-2.5 rounded-sm" style={{
                          width: `${(letters.length / MAX_LETTERS) * 60}%`,
                          minWidth: 2,
                          backgroundColor: isPOC ? "#ffd60066" : inVA ? "#a78bfa44" : "#00d4ff33",
                        }}/>
                        {showLetters && letters.slice(0,4).map((l,j) => (
                          <span key={j} className="text-[7px] font-mono" style={{color:TIME_COLORS[l]||"#8892a4"}}>{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isPOC && <span className="text-[8px] font-bold text-[#ffd600] flex-shrink-0 ml-1">POC</span>}
                  {isVAH && <span className="text-[8px] font-bold text-[#00e676] flex-shrink-0 ml-1">VAH</span>}
                  {isVAL && <span className="text-[8px] font-bold text-[#ff4444] flex-shrink-0 ml-1">VAL</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-52 flex flex-col gap-4">
          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Time Bracket Key</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_BRACKETS.map((t,i) => (
                <div key={i} className={`text-center rounded p-1 cursor-pointer transition-all ${selectedLetter === LETTERS[i] ? "ring-1 ring-white" : ""}`}
                  style={{ backgroundColor: (TIME_COLORS[LETTERS[i]] || "#8892a4")+"22" }}
                  onClick={() => setSelectedLetter(selectedLetter === LETTERS[i] ? null : LETTERS[i])}>
                  <p className="text-[11px] font-bold" style={{ color: TIME_COLORS[LETTERS[i]] || "#8892a4" }}>{LETTERS[i]}</p>
                  <p className="text-[8px] text-[#8892a4]">{t}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Structure Analysis</p>
            {[
              ["Shape", "Normal Distribution", "#00e676"],
              ["Range", `$${(PRICE_RANGE[VAH_IDX]-PRICE_RANGE[VAL_IDX]).toFixed(2)}`, "#00d4ff"],
              ["IB Ext", "B bracket extension", "#ffd600"],
              ["Tail", "Buying tail at VAL", "#00e676"],
              ["POC Migration", "Single print POC", "#a78bfa"],
            ].map(([l,v,c]) => (
              <div key={l as string} className="flex justify-between text-xs py-1.5 border-b border-[#1e2433]">
                <span className="text-[#8892a4]">{l}</span><span className="font-bold" style={{color:c as string}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
