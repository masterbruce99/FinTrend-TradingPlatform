import { createContext, useContext, useState, useCallback, type ReactNode, useRef } from "react";

export interface SidekickContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  focusInput: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  prefill: string | null;
  setPrefill: (v: string | null) => void;
  openWithPrompt: (prompt: string) => void;
  openWithSymbol: (symbol: string, contextType: "chart" | "watchlist") => void;
}

const SidekickContext = createContext<SidekickContextValue | null>(null);

export function SidekickProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [prefill, setPrefill] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      if (next) setTimeout(() => inputRef.current?.focus(), 300);
      return next;
    });
  }, []);

  const openWithPrompt = useCallback((prompt: string) => {
    setPrefill(prompt);
    setOpenState(true);
    setTimeout(() => {
      inputRef.current?.focus();
      // Auto-send if there's a prefill
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      inputRef.current?.dispatchEvent(event);
    }, 350);
  }, []);

  const openWithSymbol = useCallback((symbol: string, contextType: "chart" | "watchlist") => {
    const prompts: Record<string, string> = {
      chart: `Analyze the current technical structure for ${symbol}. What are the key support and resistance levels, trend direction, and any notable patterns?`,
      watchlist: `Search for recent news and technical setups for ${symbol}. Summarize the key catalysts and price action.`,
    };
    setPrefill(prompts[contextType] || prompts.watchlist);
    setOpenState(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
  }, []);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return (
    <SidekickContext.Provider value={{
      open, setOpen, toggle, focusInput, inputRef,
      prefill, setPrefill, openWithPrompt, openWithSymbol,
    }}>
      {children}
    </SidekickContext.Provider>
  );
}

export function useSidekick() {
  const ctx = useContext(SidekickContext);
  if (!ctx) throw new Error("useSidekick must be inside SidekickProvider");
  return ctx;
}
