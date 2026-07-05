import { Sparkles } from "lucide-react";
import { useSidekick } from "@/context/SidekickContext";

export function WatchlistSidekickButton({ symbol }: { symbol: string }) {
  const { openWithSymbol } = useSidekick();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openWithSymbol(symbol, "watchlist");
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary"
      title={`Ask Sidekick about ${symbol}`}
    >
      <Sparkles className="w-3.5 h-3.5" />
    </button>
  );
}
