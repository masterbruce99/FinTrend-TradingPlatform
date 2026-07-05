import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, X, Send, Loader2, ChevronRight, Zap, Sparkles,
  Copy, CheckCircle2, Paperclip, ArrowDown, BarChart3
} from "lucide-react";
import { useSidekick } from "@/context/SidekickContext";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolResults?: any[];
  timestamp: number;
}

const CAPABILITY_BUTTONS = [
  { label: "Explain RSI", icon: Zap, prompt: "Explain the RSI formula and give me JavaScript implementation for lightweight-charts." },
  { label: "Alert on cross", icon: Zap, prompt: "Set an alert when price crosses above 50-day SMA." },
  { label: "Scan oversold", icon: Zap, prompt: "Find tech stocks with RSI under 30 and price above 200 EMA." },
  { label: "Portfolio risk", icon: Zap, prompt: "Analyze my watchlist for concentration risk." },
  { label: "Fundamentals", icon: Zap, prompt: "Pull AAPL earnings, margins, and options flow summary." },
];

/* ── Code block with Copy button ───────────────────────── */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-b border-[#2a3142] rounded-t-md">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white transition-colors"
        >
          {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 4px 4px", fontSize: 12, padding: "8px 12px" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

/* ── Collapsed vertical bar ────────────────────────────── */
function CollapsedBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="fixed right-0 top-20 bottom-20 z-[45] w-[44px] flex flex-col items-center gap-4 py-4 border-l border-[#1e2433] bg-[#0b0e14] hover:bg-[#0d1117] transition-colors cursor-pointer"
      onClick={onOpen}
      title="Sidekick AI"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 w-px bg-[#1e2433]" />
      <div className="rotate-90 text-[9px] text-muted-foreground uppercase tracking-widest whitespace-nowrap origin-center translate-y-6">
        Sidekick AI
      </div>
      <div className="flex-1 w-px bg-[#1e2433]" />
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
    </div>
  );
}

/* ── Main Sidekick Panel ───────────────────────────────── */
export function SidekickPanel() {
  const { open, setOpen, inputRef, prefill, setPrefill } = useSidekick();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "**FinTrend Sidekick** is ready.\n\nI can help you with indicator coding, alert setup, market scanning, portfolio analysis, and fundamental research.\n\nTry a quick action or ask me anything.",
      timestamp: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Prefill from context triggers
  useEffect(() => {
    if (prefill && open) {
      setInput(prefill);
      setPrefill(null);
      const t = setTimeout(() => handleSend(prefill), 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [prefill, open]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const resp = await fetch(`/api/ai/sidekick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, model: "deepseek-chat", stream: false }),
      });

      if (resp.status === 503) {
        const data = await resp.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Sidekick needs setup.**\n\n${data.setup || "Add a DEEPSEEK_API_KEY environment variable."}\n\n1. Go to [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)\n2. Create a free API key\n3. Add it as \`DEEPSEEK_API_KEY\` in Replit Secrets`,
            timestamp: Date.now(),
          },
        ]);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content || "No response.",
          toolResults: data.toolResults,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `**Error:** ${err.message || "Failed to reach AI service"}`, timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return <CollapsedBar onOpen={() => setOpen(true)} />;
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="fixed inset-0 z-[44] bg-black/40 md:hidden" onClick={() => setOpen(false)} />

      {/* Expanded Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-[360px] max-w-full bg-[#0b0e14] border-l border-[#1e2433] flex flex-col shadow-2xl">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2433] bg-[#0d1117] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">Sidekick AI</div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Connected to Live Data
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white transition-colors p-1 rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Quick Actions ─────────────────────────── */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {CAPABILITY_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleSend(btn.prompt)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1e2433]/60 hover:bg-[#1e2433] text-[11px] text-left transition-colors"
              >
                <btn.icon className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages ──────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[94%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/15 text-foreground border border-primary/20"
                  : "bg-[#131722] text-foreground border border-[#1e2433]"
              }`}>
                <ReactMarkdown
                  components={{
                    code({ inline, className, children }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const lang = match ? match[1] : "javascript";
                      const codeStr = String(children).replace(/\n$/, "");
                      if (!inline && match) {
                        return <CodeBlock language={lang} code={codeStr} />;
                      }
                      return <code className="bg-[#1e2433] px-1 py-0.5 rounded text-xs text-primary">{children}</code>;
                    },
                    strong({ children }: any) {
                      return <span className="font-bold text-white">{children}</span>;
                    },
                    table({ children }: any) {
                      return <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse">{children}</table></div>;
                    },
                    thead({ children }: any) { return <thead className="bg-[#1e2433] text-muted-foreground">{children}</thead>; },
                    th({ children }: any) { return <th className="px-2 py-1.5 text-left border border-[#2a3142] font-medium">{children}</th>; },
                    td({ children }: any) { return <td className="px-2 py-1.5 border border-[#2a3142]">{children}</td>; },
                    h3({ children }: any) { return <h3 className="text-sm font-bold text-white mt-3 mb-1">{children}</h3>; },
                    ul({ children }: any) { return <ul className="list-disc pl-4 space-y-0.5">{children}</ul>; },
                    ol({ children }: any) { return <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>; },
                    a({ href, children }: any) { return <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{children}</a>; },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                {msg.toolResults && msg.toolResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.toolResults.map((tr: any, ti: number) => (
                      <div key={ti} className="text-[10px] text-muted-foreground bg-[#1e2433] rounded px-2 py-1 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        Called <code className="text-primary">{tr.name}</code>
                        {tr.result?.symbol && <span>&rarr; {tr.result.symbol}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#131722] border border-[#1e2433] rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sidekick is analyzing...
              </div>
            </div>
          )}
          <div className="h-2" />
        </div>

        {/* ── Input ─────────────────────────────────── */}
        <div className="px-3 py-3 border-t border-[#1e2433] bg-[#0d1117] flex-shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Sidekick anything..."
                rows={1}
                className="w-full bg-[#1e2433] border border-[#2a3142] rounded-lg px-3 py-2 pr-8 text-sm resize-none focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
              <button className="absolute right-2 bottom-2 text-muted-foreground hover:text-white transition-colors" title="Attach (future)">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[9px] text-muted-foreground/60">Shift + Enter for new line</span>
            <span className="text-[9px] text-muted-foreground/60">DeepSeek AI &middot; Real data</span>
          </div>
        </div>
      </div>
    </>
  );
}
