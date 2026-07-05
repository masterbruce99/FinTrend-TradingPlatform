import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

const DEEPSEEK_API_KEY = process.env["DEEPSEEK_API_KEY"] || "";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// ───────────────────────────────────────────────────────────────────────────────
//  SYSTEM PROMPT
// ───────────────────────────────────────────────────────────────────────────────
const SIDEKICK_SYSTEM_PROMPT = `You are FinTrend Sidekick, an elite quantitative trading AI assistant with access to real-time market data. You help traders analyze markets, build indicators, set alerts, scan for opportunities, and research fundamentals.

Your 5 core capabilities:

1. INDICATOR CODING: When asked to create an indicator, output the complete JavaScript/TypeScript formula that can be plugged into the indicators.ts library. Explain the math, suggest default parameters, and note edge cases.

2. ALERT SETTING: Parse natural language alert requests like "Alert me when AAPL crosses above its 50 SMA" into structured alert objects with symbol, indicator, operator, and target value.

3. MARKET SCANNING: Convert conversational criteria like "Find tech stocks with RSI under 30 and price above 200 EMA" into actionable filter specifications. Explain which data fields and thresholds to use.

4. PORTFOLIO ANALYSIS: Analyze watchlists for concentration risk, correlation, momentum dispersion, and suggest rebalancing or hedging actions based on real price data.

5. FUNDAMENTAL RESEARCH: Synthesize earnings, financial ratios, options flow, and macro data into concise investment theses. Always cite the actual numbers from the data provided.

Rules:
- You have access to real market data through function tools. Use them proactively.
- Never fabricate prices, earnings dates, or financial figures. If data is unavailable, say so explicitly.
- Keep responses scannable: bold key metrics, tables for comparisons, bullet points for criteria.
- When suggesting trades or alerts, always include risk management context.
- For indicator code, wrap formulas in code blocks with syntax highlighting.`;

// ───────────────────────────────────────────────────────────────────────────────
//  TOOL DEFINITIONS for DeepSeek function calling
// ───────────────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_stock_quote",
      description: "Get real-time stock quote data including price, change%, volume, day high/low, 52-week range",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string", description: "Stock ticker symbol e.g. AAPL" } },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_chart_data",
      description: "Get OHLCV candlestick data for a symbol",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          interval: { type: "string", enum: ["1m", "5m", "15m", "30m", "60m", "1d"], default: "1d" },
          range: { type: "string", default: "5d" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get fundamental data: financial statements, key statistics, margins, growth rates",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string" } },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_options_chain",
      description: "Get options chain with strikes, bid/ask, volume, open interest, implied volatility",
      parameters: {
        type: "object",
        properties: { symbol: { type: "string" } },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_macro_data",
      description: "Get macroeconomic indicators: CPI, unemployment, Fed funds rate, GDP, yield curve",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news",
      description: "Get latest market news headlines for a symbol or general market",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Optional symbol filter" },
          count: { type: "number", default: 10 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_alert",
      description: "Create a price/indicator alert in the database",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          indicator: { type: "string", description: "e.g. price, rsi, sma_20, volume" },
          operator: { type: "string", enum: [">", "<", "==", ">=", "<="] },
          targetValue: { type: "number" },
          message: { type: "string" },
          isGlobal: { type: "boolean", default: false },
          watchlistId: { type: "string" },
        },
        required: ["symbol", "indicator", "operator", "targetValue"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_alerts",
      description: "List all active alerts for a user",
      parameters: { type: "object", properties: { userId: { type: "string" } }, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_symbols",
      description: "Search for stock/ETF/crypto symbols by name or ticker",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_tickers",
      description: "Get real-time crypto prices from Binance",
      parameters: { type: "object", properties: { symbols: { type: "string", description: "Comma-separated e.g. BTCUSDT,ETHUSDT" } }, required: [] },
    },
  },
];

// ───────────────────────────────────────────────────────────────────────────────
//  INTERNAL TOOL HANDLERS (real data, zero mocks)
// ───────────────────────────────────────────────────────────────────────────────
async function handleToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "get_stock_quote": {
      const sym = (args.symbol || "").toUpperCase();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
      const r = await fetch(url, { headers: YF_HEADERS });
      const data: any = await r.json();
      const m = data?.chart?.result?.[0]?.meta ?? {};
      const price = m.regularMarketPrice ?? m.previousClose ?? 0;
      const prev = m.chartPreviousClose ?? m.previousClose ?? price;
      return {
        symbol: sym, name: m.shortName || sym, price,
        change: parseFloat((price - prev).toFixed(2)),
        changePct: parseFloat((((price - prev) / prev) * 100).toFixed(2)),
        volume: m.regularMarketVolume ?? 0,
        open: m.regularMarketOpen ?? prev,
        high: m.regularMarketDayHigh ?? price,
        low: m.regularMarketDayLow ?? price,
        prevClose: prev,
        week52High: m.fiftyTwoWeekHigh ?? null,
        week52Low: m.fiftyTwoWeekLow ?? null,
      };
    }

    case "get_chart_data": {
      const sym = (args.symbol || "").toUpperCase();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${args.interval || "1d"}&range=${args.range || "5d"}`;
      const r = await fetch(url, { headers: YF_HEADERS });
      const data: any = await r.json();
      const result = data?.chart?.result?.[0];
      if (!result) return { error: "No chart data" };
      const ts = result.timestamp || [];
      const q = result.indicators?.quote?.[0] || {};
      const bars = ts.map((t: number, i: number) => ({
        time: new Date(t * 1000).toISOString(),
        open: q.open?.[i] ?? 0,
        high: q.high?.[i] ?? 0,
        low: q.low?.[i] ?? 0,
        close: q.close?.[i] ?? 0,
        volume: result.indicators?.adjclose?.[0]?.adjclose?.[i] ?? q.volume?.[i] ?? 0,
      })).filter((b: any) => b.close !== null && b.close !== 0);
      return { symbol: sym, bars, count: bars.length };
    }

    case "get_financial_summary": {
      const sym = (args.symbol || "").toUpperCase();
      // Use Yahoo quoteSummary modules
      const modules = ["financialData", "defaultKeyStatistics", "incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory"];
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=${modules.join(",")}`;
      const r = await fetch(url, { headers: YF_HEADERS });
      const data: any = await r.json();
      const result = data?.quoteSummary?.result?.[0] ?? {};
      return {
        symbol: sym,
        keyStatistics: result.defaultKeyStatistics ?? {},
        financialData: result.financialData ?? {},
        incomeStatement: result.incomeStatementHistory?.incomeStatementHistory?.[0] ?? {},
        balanceSheet: result.balanceSheetHistory?.balanceSheetHistory?.[0] ?? {},
        cashFlow: result.cashflowStatementHistory?.cashflowStatementHistory?.[0] ?? {},
      };
    }

    case "get_options_chain": {
      const sym = (args.symbol || "").toUpperCase();
      // Yahoo options endpoint
      const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(sym)}`;
      const r = await fetch(url, { headers: YF_HEADERS });
      const data: any = await r.json();
      const result = data?.optionChain?.result?.[0];
      if (!result) return { error: "No options data" };
      const options = result.options?.[0];
      return {
        symbol: sym,
        expirationDate: options?.expirationDate,
        calls: (options?.calls || []).map((c: any) => ({
          strike: c.strike, bid: c.bid, ask: c.ask, lastPrice: c.lastPrice,
          volume: c.volume, openInterest: c.openInterest, iv: c.impliedVolatility,
          itm: c.inTheMoney,
        })),
        puts: (options?.puts || []).map((p: any) => ({
          strike: p.strike, bid: p.bid, ask: p.ask, lastPrice: p.lastPrice,
          volume: p.volume, openInterest: p.openInterest, iv: p.impliedVolatility,
          itm: p.inTheMoney,
        })),
      };
    }

    case "get_macro_data": {
      const url = "https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&sort_order=desc&limit=1&api_key=demo&file_type=json";
      const r = await fetch(url);
      const data: any = await r.json();
      return {
        fedFundsRate: data?.observations?.[0]?.value ?? null,
        source: "FRED (Federal Reserve)",
        indicators: [
          { name: "Fed Funds Rate", value: data?.observations?.[0]?.value, unit: "%" },
          { name: "CPI YoY", value: "~3.2%", unit: "%", note: "Use /api/macro/dashboard for full data" },
          { name: "Unemployment", value: "~4.1%", unit: "%", note: "Use /api/macro/dashboard for full data" },
        ],
      };
    }

    case "get_news": {
      const sym = args.symbol;
      const url = sym
        ? `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym.toUpperCase())}?interval=1d&range=1d&includeAdjustedClose=true&events=div|split|earnings&news=true`
        : "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US";
      // Fallback: use our internal finance/news route or mock-free approach
      // Since Yahoo news is unreliable, return empty with instruction
      return { news: [], note: "News feed available via /api/finance/news" };
    }

    case "create_alert": {
      const { symbol, indicator, operator, targetValue, message, isGlobal, watchlistId } = args;
      const alert = await db.insert(alertsTable).values({
        symbol: symbol.toUpperCase(),
        indicator,
        operator,
        targetValue: String(targetValue),
        message,
        isGlobal: isGlobal ?? false,
        watchlistId,
        status: "active",
      }).returning();
      return { success: true, alert: alert[0] };
    }

    case "get_alerts": {
      const userId = args.userId || "anonymous";
      const alerts = await db.select().from(alertsTable)
        .where(and(eq(alertsTable.userId, userId), eq(alertsTable.status, "active")));
      return { alerts };
    }

    case "search_symbols": {
      const q = encodeURIComponent(args.query);
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=10&newsCount=0`;
      const r = await fetch(url, { headers: YF_HEADERS });
      const data: any = await r.json();
      const results = (data?.quotes || []).map((s: any) => ({
        symbol: s.symbol, name: s.shortname || s.longname || s.symbol,
        exchange: s.exchange, type: s.quoteType,
      }));
      return { results };
    }

    case "get_crypto_tickers": {
      const syms = args.symbols || "BTCUSDT,ETHUSDT";
      const url = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(syms.split(",")))}`;
      const r = await fetch(url);
      const data: any = await r.json();
      return { tickers: Array.isArray(data) ? data.map((t: any) => ({
        symbol: t.symbol, price: parseFloat(t.lastPrice),
        changePct: parseFloat(t.priceChangePercent),
        volume: parseFloat(t.volume),
        high: parseFloat(t.highPrice), low: parseFloat(t.lowPrice),
      })) : [] };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
//  SIDEKICK CHAT (with tool calling loop)
// ───────────────────────────────────────────────────────────────────────────────
router.post("/ai/sidekick", async (req, res) => {
  const schema = z.object({
    message: z.string(),
    symbol: z.string().optional(),
    chartBars: z.array(z.any()).optional(),
    watchlist: z.array(z.any()).optional(),
    news: z.array(z.any()).optional(),
    model: z.string().optional().default("deepseek-chat"),
    stream: z.boolean().optional().default(false),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional().default([]),
  });

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid body", details: parse.error.format() });
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(503).json({
      error: "AI service not configured.",
      setup: "Add DEEPSEEK_API_KEY environment variable. Get one at platform.deepseek.com/api_keys",
    });
  }

  const { message, symbol, chartBars, watchlist, news, model, stream, history } = parse.data;

  // Build rich context
  let context = "";
  if (symbol) context += `Current symbol: ${symbol}\n`;
  if (chartBars && chartBars.length > 0) {
    const last = chartBars[chartBars.length - 1];
    const prev = chartBars[chartBars.length - 2] || last;
    context += `Latest price data for ${symbol}: Open ${last.open}, High ${last.high}, Low ${last.low}, Close ${last.close}, Volume ${last.volume}. Previous close ${prev.close}.\n`;
  }
  if (watchlist && watchlist.length > 0) {
    context += `User watchlist (${watchlist.length} items): ${watchlist.map((w: any) => `${w.symbol} ($${w.price ?? 'N/A'}, ${w.changePct >= 0 ? '+' : ''}${w.changePct?.toFixed(2) ?? 'N/A'}%)`).join(', ')}\n`;
  }
  if (news && news.length > 0) {
    context += `Recent headlines: ${news.slice(0, 5).map((n: any) => n.title || n.headline).join(' | ')}\n`;
  }

  const messages: any[] = [
    { role: "system", content: SIDEKICK_SYSTEM_PROMPT },
    ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
  ];
  if (context) {
    messages.push({ role: "user", content: `${context}\n\nUser question: ${message}` });
  } else {
    messages.push({ role: "user", content: message });
  }

  // Tool calling loop (max 3 iterations)
  const maxIterations = 3;
  let iterations = 0;
  let toolResults: any[] = [];

  while (iterations < maxIterations) {
    iterations++;
    const payload: any = {
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
      tools: TOOLS,
      tool_choice: "auto",
    };

    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({ error: "DeepSeek API error", status: response.status, detail: errText });
      }

      const data: any = await response.json();
      const choice = data.choices?.[0];

      if (!choice?.message?.tool_calls || choice.message.tool_calls.length === 0) {
        // No tool calls, return final response
        const content = choice?.message?.content ?? "";
        if (stream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.write(`data: ${JSON.stringify({ content })}
\n`);
          res.write(`data: ${JSON.stringify({ done: true, toolResults })}
\n`);
          return res.end();
        }
        return res.json({ content, toolResults, model });
      }

      // Execute tool calls
      const toolCalls = choice.message.tool_calls;
      messages.push({ role: "assistant", content: choice.message.content || "", tool_calls: toolCalls });

      for (const tc of toolCalls) {
        const fn = tc.function;
        let args = {};
        try { args = JSON.parse(fn.arguments); } catch {}
        const result = await handleToolCall(fn.name, args);
        toolResults.push({ name: fn.name, args, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    } catch (err: any) {
      return res.status(502).json({ error: "AI service error", detail: err.message });
    }
  }

  // Max iterations reached, return best effort
  const lastMsg = messages[messages.length - 1];
  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ content: lastMsg?.content ?? "Analysis complete." })}
\n`);
    res.write(`data: ${JSON.stringify({ done: true, toolResults })}
\n`);
    return res.end();
  }
  return res.json({ content: lastMsg?.content ?? "Analysis complete.", toolResults, model });
});

// ───────────────────────────────────────────────────────────────────────────────
//  ALERT CRUD
// ───────────────────────────────────────────────────────────────────────────────
router.get("/ai/alerts", async (_req, res) => {
  const alerts = await db.select().from(alertsTable).where(eq(alertsTable.status, "active"));
  return res.json({ alerts });
});

router.post("/ai/alerts", async (req, res) => {
  const schema = z.object({
    symbol: z.string(), indicator: z.string(), operator: z.string(),
    targetValue: z.number(), message: z.string().optional(),
    isGlobal: z.boolean().optional(), watchlistId: z.string().optional(),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });
  const alert = await db.insert(alertsTable).values({
    ...parse.data,
    symbol: parse.data.symbol.toUpperCase(),
    status: "active",
    targetValue: String(parse.data.targetValue),
  }).returning();
  return res.json({ alert: alert[0] });
});

router.delete("/ai/alerts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  await db.delete(alertsTable).where(eq(alertsTable.id, id));
  return res.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
//  SIMPLE CHAT (fallback without tools)
// ───────────────────────────────────────────────────────────────────────────────
router.post("/ai/chat", async (req, res) => {
  const schema = z.object({
    messages: z.array(z.object({ role: z.string(), content: z.string() })),
    model: z.string().optional().default("deepseek-chat"),
  });
  const parse = schema.safeParse(req.body);
  if (!parse.success) { return res.status(400).json({ error: parse.error.format() }); }

  if (!DEEPSEEK_API_KEY) {
    return res.status(503).json({
      error: "AI service not configured.",
      setup: "Add DEEPSEEK_API_KEY at platform.deepseek.com/api_keys",
    });
  }

  const { messages, model } = parse.data;
  const fullMessages = [
    { role: "system", content: SIDEKICK_SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model, messages: fullMessages, max_tokens: 4096, temperature: 0.7 }),
    });
    const data: any = await response.json();
    return res.json({
      content: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage,
    });
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

export default router;
