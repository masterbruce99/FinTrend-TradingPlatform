import { useState } from "react";

type Layout = {
  id: string;
  name: string;
  description: string;
  panels: { symbol: string; tf: string; x: number; y: number; w: number; h: number }[];
  thumbnail: string;
};

const LAYOUTS: Layout[] = [
  { id:"single",  name:"Single Chart",        description:"Full-screen single chart view", thumbnail:"1",
    panels:[{ symbol:"AAPL", tf:"1D", x:0,y:0,w:12,h:8 }] },
  { id:"2col",    name:"2 Charts Side",        description:"Two charts side by side",       thumbnail:"2h",
    panels:[{ symbol:"AAPL",tf:"1D",x:0,y:0,w:6,h:8 },{ symbol:"NVDA",tf:"1D",x:6,y:0,w:6,h:8 }] },
  { id:"2row",    name:"2 Charts Stacked",     description:"Two charts stacked vertically", thumbnail:"2v",
    panels:[{ symbol:"AAPL",tf:"1H",x:0,y:0,w:12,h:4 },{ symbol:"AAPL",tf:"1D",x:0,y:4,w:12,h:4 }] },
  { id:"3col",    name:"3 Charts",             description:"Three charts horizontally",     thumbnail:"3h",
    panels:[{ symbol:"AAPL",tf:"1D",x:0,y:0,w:4,h:8 },{ symbol:"NVDA",tf:"1D",x:4,y:0,w:4,h:8 },{ symbol:"TSLA",tf:"1D",x:8,y:0,w:4,h:8 }] },
  { id:"4grid",   name:"4 Charts Grid",        description:"2×2 grid layout",              thumbnail:"4g",
    panels:[{ symbol:"AAPL",tf:"1H",x:0,y:0,w:6,h:4 },{ symbol:"NVDA",tf:"1H",x:6,y:0,w:6,h:4 },{ symbol:"MSFT",tf:"4H",x:0,y:4,w:6,h:4 },{ symbol:"META",tf:"4H",x:6,y:4,w:6,h:4 }] },
  { id:"master",  name:"Master + 2 Mini",      description:"Large main + 2 small panels",  thumbnail:"1+2",
    panels:[{ symbol:"SPY",tf:"1D",x:0,y:0,w:8,h:8 },{ symbol:"QQQ",tf:"1D",x:8,y:0,w:4,h:4 },{ symbol:"GLD",tf:"1D",x:8,y:4,w:4,h:4 }] },
];

type Workspace = { id: string; name: string; layoutId: string; lastUsed: string; watchlist: string[] };

const WORKSPACES: Workspace[] = [
  { id:"ws1", name:"Day Trading Setup",   layoutId:"4grid",  lastUsed:"2 min ago",   watchlist:["AAPL","NVDA","TSLA","META"] },
  { id:"ws2", name:"Swing Trading",       layoutId:"2col",   lastUsed:"1 hour ago",  watchlist:["SPY","QQQ","LLY","JPM"] },
  { id:"ws3", name:"Options Watch",       layoutId:"master", lastUsed:"Yesterday",   watchlist:["NVDA","AAPL","MSFT","AMZN"] },
  { id:"ws4", name:"Macro Overview",      layoutId:"3col",   lastUsed:"2 days ago",  watchlist:["SPY","TLT","GLD","DXY"] },
  { id:"ws5", name:"Earnings Season",     layoutId:"2row",   lastUsed:"3 days ago",  watchlist:["AAPL","NVDA","META","AMZN"] },
];

const TIMEFRAMES = ["1m","5m","15m","1H","4H","1D","1W"];

export function LayoutManager() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(WORKSPACES[0]);
  const [activeLayout, setActiveLayout] = useState<Layout>(LAYOUTS.find((l) => l.id === WORKSPACES[0].layoutId) ?? LAYOUTS[0]);
  const [view, setView] = useState<"layouts" | "workspaces">("workspaces");

  const layout = activeLayout;
  const GRID_COLS = 12;
  const GRID_ROWS = 8;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Layout Manager</span>
          <span className="text-xs text-[#8892a4]">Workspace Switcher</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#131722] border border-[#1e2433] rounded overflow-hidden">
            {(["workspaces","layouts"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs capitalize font-medium transition-colors ${view === v ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#8892a4]"}`}>
                {v}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-[#00d4ff] text-[#0b0e14] rounded text-xs font-bold hover:bg-[#33ddff]">+ New Workspace</button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 p-4 gap-4">
        <div className="w-60 flex flex-col gap-3 overflow-y-auto">
          {view === "workspaces" ? (
            <>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest">Saved Workspaces</p>
              {WORKSPACES.map((ws) => {
                const wsLayout = LAYOUTS.find((l) => l.id === ws.layoutId);
                return (
                  <button key={ws.id} onClick={() => { setActiveWorkspace(ws); setActiveLayout(wsLayout ?? LAYOUTS[0]); }}
                    className={`text-left p-3 rounded-lg border transition-all ${activeWorkspace.id === ws.id ? "border-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{ws.name}</span>
                      <span className="text-[9px] text-[#8892a4]">{ws.lastUsed}</span>
                    </div>
                    <p className="text-[10px] text-[#8892a4]">{wsLayout?.name}</p>
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {ws.watchlist.map((sym) => (
                        <span key={sym} className="text-[9px] bg-[#1e2433] text-[#00d4ff] px-1 py-0.5 rounded">{sym}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <p className="text-[10px] text-[#8892a4] uppercase tracking-widest">Chart Layouts</p>
              {LAYOUTS.map((l) => (
                <button key={l.id} onClick={() => setActiveLayout(l)}
                  className={`text-left p-3 rounded-lg border transition-all ${activeLayout.id === l.id ? "border-[#00d4ff] bg-[#00d4ff11]" : "border-[#1e2433] bg-[#131722] hover:border-[#8892a4]"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-6 bg-[#0b0e14] border border-[#1e2433] rounded flex items-center justify-center text-[9px] text-[#00d4ff] font-bold">{l.thumbnail}</div>
                    <span className="text-xs font-bold text-white">{l.name}</span>
                  </div>
                  <p className="text-[10px] text-[#8892a4]">{l.description}</p>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{activeWorkspace.name}</p>
              <p className="text-xs text-[#8892a4]">{layout.name} • {layout.panels.length} panel{layout.panels.length > 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-[#1e2433] rounded text-xs text-[#8892a4] hover:text-white">Duplicate</button>
              <button className="px-3 py-1.5 bg-[#00e676] text-[#0b0e14] rounded text-xs font-bold hover:bg-[#33ff99]">Load Workspace</button>
            </div>
          </div>

          <div className="flex-1 bg-[#0d1018] rounded-lg border border-[#1e2433] p-2 relative overflow-hidden">
            <div className="w-full h-full" style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`, gap: "2px" }}>
              {layout.panels.map((panel, i) => (
                <div key={i} className="bg-[#131722] border border-[#1e2433] rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#00d4ff] transition-colors"
                  style={{ gridColumn: `${panel.x + 1} / span ${panel.w}`, gridRow: `${panel.y + 1} / span ${panel.h}` }}>
                  <span className="text-sm font-bold text-white">{panel.symbol}</span>
                  <span className="text-[10px] text-[#8892a4]">{panel.tf}</span>
                  <div className="mt-1.5 flex gap-0.5">
                    {TIMEFRAMES.map((tf) => (
                      <span key={tf} className={`text-[8px] px-1 py-0.5 rounded ${tf === panel.tf ? "bg-[#1e3a5f] text-[#00d4ff]" : "text-[#1e2433]"}`}>{tf}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
