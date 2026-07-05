import { Sparkles, Command } from "lucide-react";
import { useSidekick } from "@/context/SidekickContext";

export function SidekickHeaderButton() {
  const { toggle } = useSidekick();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
      title="Open Sidekick (Cmd+K / Ctrl+K)"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="hidden md:inline">Sidekick</span>
      <span className="hidden lg:inline-flex items-center gap-0.5 ml-1 text-[10px] text-primary/60 bg-primary/5 px-1 rounded">
        <Command className="w-2.5 h-2.5" />K
      </span>
    </button>
  );
}
