import { useState } from "react";

const EXAMPLE_SCRIPTS = {
  "RSI Strategy": `// RSI Overbought/Oversold Strategy
// TrendSpider Script Language v2

input length = 14       // RSI period
input ob = 70           // Overbought level
input os = 30           // Oversold level
input ema_fast = 9
input ema_slow = 21

// Calculate indicators
rsi = rsi(close, length)
ema_f = ema(close, ema_fast)
ema_s = ema(close, ema_slow)

// Entry conditions
long_entry = crossover(rsi, os) and ema_f > ema_s
short_entry = crossunder(rsi, ob) and ema_f < ema_s

// Exit conditions
long_exit  = crossunder(rsi, ob) or close < ema_s
short_exit = crossover(rsi, os)  or close > ema_s

// Plot signals
plot(rsi, "RSI", color.blue)
hline(ob, "OB", color.red, dashed)
hline(os, "OS", color.green, dashed)

// Alerts
alertcondition(long_entry,  "Long Entry",  "RSI crossed above OS")
alertcondition(short_entry, "Short Entry", "RSI crossed below OB")`,

  "VWAP Bounce": `// VWAP Bounce Detector
// Fires when price pulls back to VWAP and bounces

input lookback = 5
input vol_multiplier = 1.5

// Calculate VWAP
vwap_val = vwap(close, volume)

// Volume check
avg_vol = sma(volume, 20)
high_vol = volume > avg_vol * vol_multiplier

// Bounce detection
near_vwap  = abs(close - vwap_val) < atr(14) * 0.5
prev_below = low[1] < vwap_val
now_above  = close > vwap_val

bounce = near_vwap and prev_below and now_above and high_vol

// Visualize
plot(vwap_val, "VWAP", color.yellow, linewidth=2)
plotshape(bounce, "Bounce", shape.circle, color.lime)

alertcondition(bounce, "VWAP Bounce", "Price bounced off VWAP with volume")`,

  "Multi-TF Signal": `// Multi-Timeframe Confluence Signal
// Fires only when all timeframes align

// Daily trend
daily_trend  = request.security(symbol, "D",  ema(close, 20) > ema(close, 50))

// 4H momentum
h4_momentum  = request.security(symbol, "240", rsi(close, 14) > 50)

// 1H entry
h1_macd = macd(close, 12, 26, 9)
h1_bull = h1_macd.hist > 0 and h1_macd.hist > h1_macd.hist[1]

// All aligned
confluence = daily_trend and h4_momentum and h1_bull

// Output
plot(confluence ? 1 : 0, "Confluence", color.aqua)
bgcolor(confluence ? color.new(color.green, 90) : na)
alertcondition(confluence, "MTF Confluence", "All timeframes aligned bullish")`,
};

const OUTPUT_LINES = [
  { type: "info",    text: "✓ Script compiled successfully" },
  { type: "info",    text: "✓ Running backtest on AAPL 1D (2023-01-01 → 2024-12-31)" },
  { type: "success", text: "  Trades found: 14" },
  { type: "success", text: "  Win rate: 64.3%" },
  { type: "success", text: "  Profit factor: 2.18" },
  { type: "warning", text: "  Max drawdown: -8.4%" },
  { type: "info",    text: "  Sharpe ratio: 1.74" },
  { type: "success", text: "✓ Alerts registered: 2" },
  { type: "info",    text: "✓ Indicators plotted: RSI, EMA(9), EMA(21)" },
];

export function ScriptEditor() {
  const [activeScript, setActiveScript] = useState("RSI Strategy");
  const [code, setCode] = useState(EXAMPLE_SCRIPTS["RSI Strategy"]);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [outputLines, setOutputLines] = useState<typeof OUTPUT_LINES>([]);

  const runScript = () => {
    setRunning(true);
    setShowOutput(true);
    setOutputLines([]);
    OUTPUT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setOutputLines((prev) => [...prev, line]);
        if (i === OUTPUT_LINES.length - 1) setRunning(false);
      }, i * 200);
    });
  };

  const KEYWORDS = ["input", "rsi", "ema", "sma", "vwap", "macd", "atr", "plot", "hline", "plotshape", "bgcolor", "alertcondition", "crossover", "crossunder", "request.security", "color", "close", "volume", "high", "low", "open"];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2433]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">Script / Indicator Editor</span>
          <span className="text-xs bg-[#1e2433] text-[#8892a4] px-2 py-0.5 rounded">TrendSpider Script v2</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={runScript} disabled={running}
            className={`px-5 py-2 rounded text-sm font-bold transition-all ${running ? "bg-[#1e3a5f] text-[#00d4ff]" : "bg-[#00e676] text-[#0b0e14] hover:bg-[#33ff99]"}`}>
            {running ? "▶ Running..." : "▶ Run"}
          </button>
          <button className="px-4 py-2 rounded text-sm border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">Save</button>
          <button className="px-4 py-2 rounded text-sm border border-[#1e2433] text-[#8892a4] hover:text-white transition-colors">Share</button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-48 border-r border-[#1e2433] flex flex-col">
          <div className="px-3 py-2 border-b border-[#1e2433]">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest">My Scripts</p>
          </div>
          {Object.keys(EXAMPLE_SCRIPTS).map((name) => (
            <button key={name} onClick={() => { setActiveScript(name); setCode(EXAMPLE_SCRIPTS[name as keyof typeof EXAMPLE_SCRIPTS]); setShowOutput(false); }}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-[#1e2433] transition-colors ${activeScript === name ? "bg-[#131722] text-[#00d4ff]" : "text-[#8892a4] hover:bg-[#0f1320] hover:text-white"}`}>
              {name}
            </button>
          ))}
          <button className="w-full text-left px-3 py-2.5 text-xs text-[#1e2433] hover:text-[#8892a4] border-b border-[#1e2433]">
            + New Script
          </button>

          <div className="mt-auto p-3 border-t border-[#1e2433]">
            <p className="text-[10px] text-[#8892a4] uppercase tracking-widest mb-2">Functions</p>
            {["rsi()", "ema()", "sma()", "macd()", "vwap()", "atr()", "bb()", "stoch()"].map((fn) => (
              <button key={fn} className="w-full text-left text-[10px] text-[#00d4ff] py-0.5 hover:underline font-mono">{fn}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto bg-[#0d1018]">
            <div className="flex min-h-full">
              <div className="py-4 px-3 text-right select-none border-r border-[#1e2433]">
                {code.split("\n").map((_, i) => (
                  <div key={i} className="text-[11px] text-[#3a4455] font-mono leading-5">{i + 1}</div>
                ))}
              </div>
              <textarea
                className="flex-1 bg-transparent text-sm font-mono leading-5 p-4 outline-none resize-none text-[#c8d3e0] caret-[#00d4ff]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                style={{ tabSize: 4, fontFamily: "'Fira Code', 'Courier New', monospace" }}
              />
            </div>
          </div>

          {showOutput && (
            <div className="h-40 border-t border-[#1e2433] bg-[#080b10] overflow-auto p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-[#8892a4] uppercase tracking-widest">Output</span>
                {running && <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />}
              </div>
              {outputLines.map((line, i) => (
                <div key={i} className={`text-xs font-mono mb-0.5 ${line.type === "success" ? "text-[#00e676]" : line.type === "warning" ? "text-[#ffd600]" : line.type === "error" ? "text-[#ff4444]" : "text-[#8892a4]"}`}>
                  {line.text}
                </div>
              ))}
              {running && <span className="text-[#00d4ff] text-xs font-mono animate-pulse">▋</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
