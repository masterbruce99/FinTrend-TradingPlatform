import { useState, useRef, useEffect } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { useSidekick } from "@/context/SidekickContext";

interface ContextMenuState {
  x: number;
  y: number;
  symbol: string;
  visible: boolean;
}

export function useChartContextMenu(symbol: string) {
  const { openWithSymbol } = useSidekick();
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, symbol, visible: false });

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, symbol, visible: true });
  };

  const close = () => setMenu((m) => ({ ...m, visible: false }));

  const analyze = () => {
    openWithSymbol(symbol, "chart");
    close();
  };

  return { menu, onContextMenu, close, analyze };
}

export function ChartContextMenu({ state, onClose, onAnalyze }: {
  state: ContextMenuState;
  onClose: () => void;
  onAnalyze: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (state.visible) {
      document.addEventListener("mousedown", clickOutside);
      return () => document.removeEventListener("mousedown", clickOutside);
    }
    return undefined;
  }, [state.visible, onClose]);

  if (!state.visible) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[60] bg-[#131722] border border-[#2a3142] rounded-lg shadow-2xl py-1 min-w-[220px]"
      style={{ left: state.x, top: state.y }}
    >
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-[#1e2433] mb-1">
        {state.symbol}
      </div>
      <button
        onClick={onAnalyze}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#1e2433] transition-colors text-left"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        Analyze this chart with Sidekick
      </button>
      <button
        onClick={onClose}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#1e2433] transition-colors text-left text-muted-foreground"
      >
        <BarChart3 className="w-4 h-4" />
        Close menu
      </button>
    </div>
  );
}
