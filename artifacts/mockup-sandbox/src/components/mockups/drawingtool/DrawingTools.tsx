import { useState } from "react";

type Tool = {
  id: string;
  icon: string;
  label: string;
  group: string;
};

const TOOLS: Tool[] = [
  { id:"cursor",   icon:"↖",  label:"Cursor / Select",        group:"Basic" },
  { id:"trendline",icon:"╱",  label:"Trend Line",             group:"Lines" },
  { id:"hline",    icon:"─",  label:"Horizontal Line",        group:"Lines" },
  { id:"vline",    icon:"│",  label:"Vertical Line",          group:"Lines" },
  { id:"ray",      icon:"→",  label:"Ray",                    group:"Lines" },
  { id:"channel",  icon:"⊟",  label:"Parallel Channel",       group:"Lines" },
  { id:"pitchfork",icon:"Ψ",  label:"Andrews' Pitchfork",     group:"Lines" },
  { id:"fib",      icon:"φ",  label:"Fibonacci Retracement",  group:"Fibonacci" },
  { id:"fibext",   icon:"φ+", label:"Fibonacci Extension",    group:"Fibonacci" },
  { id:"fibfan",   icon:"◁",  label:"Fibonacci Fan",          group:"Fibonacci" },
  { id:"fibarc",   icon:"◡",  label:"Fibonacci Arc",          group:"Fibonacci" },
  { id:"rect",     icon:"□",  label:"Rectangle",              group:"Shapes" },
  { id:"triangle", icon:"△",  label:"Triangle",               group:"Shapes" },
  { id:"ellipse",  icon:"○",  label:"Ellipse",                group:"Shapes" },
  { id:"text",     icon:"T",  label:"Text Label",             group:"Annotations" },
  { id:"callout",  icon:"💬", label:"Callout",                group:"Annotations" },
  { id:"arrow",    icon:"↑",  label:"Arrow",                  group:"Annotations" },
  { id:"measure",  icon:"↔",  label:"Measure",                group:"Annotations" },
];

const INDICATORS = [
  { name:"RSI", params:["Length: 14","OB: 70","OS: 30"], color:"#00d4ff", active:true },
  { name:"EMA",      params:["Period: 9","Source: Close"],   color:"#00e676", active:true },
  { name:"EMA",      params:["Period: 21","Source: Close"],  color:"#ffd600", active:true },
  { name:"MACD",     params:["Fast: 12","Slow: 26","Signal: 9"], color:"#a78bfa", active:false },
  { name:"Bollinger Bands", params:["Length: 20","StdDev: 2"], color:"#ff8c00", active:true },
  { name:"Volume",   params:["MA: 20"],                      color:"#8892a4", active:true },
  { name:"VWAP",     params:["Anchor: Session"],             color:"#ff4444", active:false },
];

const GROUPS = [...new Set(TOOLS.map((t) => t.group))];

export function DrawingTools() {
  const [activeTool, setActiveTool] = useState("cursor");
  const [indicators, setIndicators] = useState(INDICATORS);
  const [tab, setTab] = useState<"draw" | "indicators" | "settings">("draw");
  const [lineColor, setLineColor] = useState("#00e676");
  const [lineWidth, setLineWidth] = useState(2);
  const [lineStyle, setLineStyle] = useState("solid");

  const toggleIndicator = (idx: number) => {
    setIndicators((prev) => prev.map((ind, i) => i === idx ? { ...ind, active: !ind.active } : ind));
  };

  const COLORS = ["#00e676","#00d4ff","#ff4444","#ffd600","#a78bfa","#ff8c00","#ffffff","#8892a4"];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Drawing Tools & Indicator Settings</span>
        </div>
        <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
          {([["draw","Drawing Tools"],["indicators","Indicators"],["settings","Chart Settings"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${tab === k ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {tab === "draw" && (
          <>
            <div className="w-56 border-r border-[#1e2433] overflow-auto p-3">
              {GROUPS.map((group) => (
                <div key={group} className="mb-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2 px-1">{group}</p>
                  {TOOLS.filter((t) => t.group === group).map((tool) => (
                    <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs mb-0.5 transition-colors ${activeTool === tool.id ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4] hover:bg-[#131722] hover:text-white"}`}>
                      <span className="w-5 text-center font-bold text-sm">{tool.icon}</span>
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col p-6 gap-6">
              <div>
                <p className="text-sm font-bold text-white mb-4">
                  Active: <span className="text-[#00d4ff]">{TOOLS.find((t) => t.id === activeTool)?.label}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Line Color</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setLineColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: c, borderColor: lineColor === c ? "white" : "transparent" }} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: lineColor }} />
                    <span className="text-xs text-[#8892a4] font-mono">{lineColor}</span>
                  </div>
                </div>

                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Line Style</p>
                  <div className="space-y-2">
                    {[["solid","━━━━━━━"],["dashed","╌╌╌╌╌╌╌"],["dotted","···········"]].map(([style, preview]) => (
                      <button key={style} onClick={() => setLineStyle(style)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${lineStyle === style ? "bg-[#1e3a5f]" : "hover:bg-[#0f1320]"}`}>
                        <span className="text-sm font-mono" style={{ color: lineColor }}>{preview}</span>
                        <span className="text-xs capitalize text-[#8892a4]">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Line Width</p>
                  <input type="range" min={1} max={5} value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="w-full accent-[#00d4ff] mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full" style={{ height: lineWidth * 2, backgroundColor: lineColor }} />
                    <span className="text-xs text-[#8892a4] w-8">{lineWidth}px</span>
                  </div>
                </div>

                <div className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                  <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">Opacity</p>
                  <input type="range" min={20} max={100} defaultValue={100}
                    className="w-full accent-[#00d4ff]" />
                  <p className="text-xs text-[#8892a4] mt-1">100%</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-5 py-2 bg-[#00d4ff] text-[#0b0e14] rounded text-sm font-bold hover:bg-[#33ddff]">Apply to All</button>
                <button className="px-5 py-2 border border-[#1e2433] text-[#8892a4] rounded text-sm hover:text-white">Reset Defaults</button>
              </div>
            </div>
          </>
        )}

        {tab === "indicators" && (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">{indicators.filter((i) => i.active).length} active indicators</p>
              <button className="px-4 py-2 bg-[#1e3a5f] text-[#00d4ff] rounded text-xs font-bold hover:bg-[#1e4a7f]">+ Add Indicator</button>
            </div>
            <div className="space-y-2">
              {indicators.map((ind, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${ind.active ? "border-[#1e2433] bg-[#131722]" : "border-[#1e2433] bg-[#0d1018] opacity-50"}`}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ind.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{ind.name}</p>
                    <p className="text-xs text-[#8892a4]">{ind.params.join(" • ")}</p>
                  </div>
                  <button className="text-xs text-[#00d4ff] hover:underline">Edit</button>
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${ind.active ? "bg-[#00d4ff]" : "bg-[#1e2433]"}`}
                    onClick={() => toggleIndicator(idx)}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${ind.active ? "right-0.5" : "left-0.5"}`} />
                  </div>
                  <button className="text-[#8892a4] hover:text-[#ff4444] text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="flex-1 p-6 grid grid-cols-2 gap-6">
            {[
              { label:"Chart Style", options:["Candlestick","Heikin Ashi","Bar","Line","Area"], selected:0 },
              { label:"Color Scheme", options:["Dark","Light","Custom"], selected:0 },
              { label:"Candle Colors", options:["Green/Red","Blue/Orange","White/Black"], selected:0 },
              { label:"Volume Display", options:["Bars","Colored Bars","Hidden"], selected:1 },
            ].map(({ label, options, selected: sel }) => (
              <div key={label} className="bg-[#131722] border border-[#1e2433] rounded-lg p-4">
                <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-3">{label}</p>
                <div className="space-y-1">
                  {options.map((opt, i) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer py-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${i === sel ? "border-[#00d4ff]" : "border-[#1e2433]"}`}>
                        {i === sel && <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />}
                      </div>
                      <span className="text-xs text-[#c8d3e0]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {[
              { label:"Grid Lines", checked:true },
              { label:"Crosshair", checked:true },
              { label:"Price Scale", checked:true },
              { label:"Time Scale", checked:true },
              { label:"Session Separators", checked:false },
              { label:"Extended Hours", checked:false },
              { label:"Earnings Markers", checked:true },
              { label:"Dividend Markers", checked:false },
            ].map(({ label, checked }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#1e2433]">
                <span className="text-xs text-[#c8d3e0]">{label}</span>
                <div className={`w-9 h-5 rounded-full relative cursor-pointer ${checked ? "bg-[#00d4ff]" : "bg-[#1e2433]"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
