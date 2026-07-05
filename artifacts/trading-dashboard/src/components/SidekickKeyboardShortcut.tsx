import { useEffect } from "react";
import { useSidekick } from "@/context/SidekickContext";

export function SidekickKeyboardShortcut() {
  const { toggle, setOpen } = useSidekick();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      // Escape to close
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggle, setOpen]);

  return null;
}
