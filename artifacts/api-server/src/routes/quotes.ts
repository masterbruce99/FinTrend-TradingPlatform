import { Router } from "express";

const router = Router();

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// Helper: fetch chart meta for a single symbol to get quote data
async function fetchChartMeta(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.toUpperCase())}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data: any = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No data");
  return result.meta ?? {};
}

// Quotes — uses Yahoo v8 chart meta (works from server IPs)
router.get("/quotes", async (req, res) => {
  const { symbols } = req.query;
  if (!symbols || typeof symbols !== "string") {
    return res.status(400).json({ error: "symbols query param required, e.g. ?symbols=AAPL,NVDA" });
  }

  const symbolList = symbols.split(",").map(s => s.trim().toUpperCase()).slice(0, 20);

  try {
    const results = await Promise.allSettled(symbolList.map(fetchChartMeta));
    const quotes = results.map((r, i) => {
      if (r.status === "rejected") return null;
      const m = r.value;
      const price = m.regularMarketPrice ?? m.previousClose ?? 0;
      const prev = m.chartPreviousClose ?? m.previousClose ?? price;
      const change = price - prev;
      const changePct = prev ? (change / prev) * 100 : 0;
      return {
        symbol: symbolList[i],
        name: m.shortName || m.longName || symbolList[i],
        price,
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        volume: m.regularMarketVolume ?? 0,
        open: m.regularMarketOpen ?? prev,
        high: m.regularMarketDayHigh ?? price,
        low: m.regularMarketDayLow ?? price,
        prevClose: prev,
        week52High: m.fiftyTwoWeekHigh ?? null,
        week52Low: m.fiftyTwoWeekLow ?? null,
        marketCap: null,
        pe: null,
        avgVolume: null,
        bid: null,
        ask: null,
        preMarketPrice: m.preMarketPrice ?? null,
        preMarketChange: m.preMarketChange ?? null,
        preMarketChangePct: m.preMarketChangePercent ?? null,
        postMarketPrice: m.postMarketPrice ?? null,
        postMarketChange: m.postMarketChange ?? null,
        postMarketChangePct: m.postMarketChangePercent ?? null,
      };
    }).filter(Boolean);

    return res.json({ quotes, count: quotes.length, source: "Yahoo Finance (15-min delay)", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "Failed to fetch quotes", detail: err.message });
  }
});

// Chart data — Yahoo v8 (works from server)
router.get("/quotes/chart/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { interval = "5m", range = "1d" } = req.query;

  const allowedIntervals = ["1m","2m","5m","15m","30m","60m","1d","1wk","1mo"];
  const allowedRanges = ["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"];

  if (!allowedIntervals.includes(interval as string)) return res.status(400).json({ error: "Invalid interval" });
  if (!allowedRanges.includes(range as string)) return res.status(400).json({ error: "Invalid range" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.toUpperCase())}?interval=${interval}&range=${range}`;
    const response = await fetch(url, { headers: YF_HEADERS });
    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);

    const data: any = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "Symbol not found" });

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const closes = quote.close ?? [];
    const opens  = quote.open  ?? [];
    const highs  = quote.high  ?? [];
    const lows   = quote.low   ?? [];
    const volumes= quote.volume?? [];

    const bars = timestamps.map((ts, i) => ({
      time:   new Date(ts * 1000).toISOString(),
      open:   opens[i]   ? parseFloat(opens[i].toFixed(4))   : null,
      high:   highs[i]   ? parseFloat(highs[i].toFixed(4))   : null,
      low:    lows[i]    ? parseFloat(lows[i].toFixed(4))    : null,
      close:  closes[i]  ? parseFloat(closes[i].toFixed(4))  : null,
      volume: volumes[i] ?? null,
    })).filter(b => b.close !== null);

    const meta = result.meta ?? {};
    return res.json({
      symbol: meta.symbol,
      currency: meta.currency,
      exchange: meta.exchangeName,
      interval, range,
      bars,
      count: bars.length,
      delayed: true, delayMinutes: 15,
      source: "Yahoo Finance (15-min delay)",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Failed to fetch chart data", detail: err.message });
  }
});

// Symbol search — Yahoo v1/finance/search (works from server)
router.get("/quotes/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "q query param required" });
  }
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const response = await fetch(url, { headers: YF_HEADERS });
    if (!response.ok) throw new Error(`Yahoo search ${response.status}`);
    const data: any = await response.json();
    const results = (data?.quotes || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.shortname || item.longname || item.symbol,
      exchange: item.exchange || item.exchDisp,
      type: item.quoteType,
    }));
    return res.json({ results, count: results.length, source: "Yahoo Finance", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "Search failed", detail: err.message });
  }
});

// ─── ETF Screener — Yahoo Finance screener API (5,000+ ETFs) ─────────────────

const YF_UA_SCREEN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function getYahooAuthForScreener(): Promise<{ cookie: string; crumb: string } | null> {
  try {
    const res1 = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": YF_UA_SCREEN } });
    const rawCookie = res1.headers.get("set-cookie");
    if (!rawCookie) return null;
    const cookie = rawCookie.split(";")[0].trim();
    const res2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { Cookie: cookie, "User-Agent": YF_UA_SCREEN },
    });
    const crumb = await res2.text();
    if (!crumb || crumb.startsWith("{") || crumb.startsWith("<")) return null;
    return { cookie, crumb };
  } catch {
    return null;
  }
}

function classifyETFCategory(shortName: string, symbol: string): string {
  const n = (shortName || "").toLowerCase();
  const s = (symbol || "").toUpperCase();

  const leveragedSyms = new Set(["TQQQ","QLD","UPRO","SSO","SPXL","SOXL","FNGU","TECL","LABU","FAS","UDOW","URTY","CURE","DPST","WEBL","BULZ","DFEN","TSLL","NVDL","MSTU","ROM","TMF","AAPU","AMZU","MSFU","METL","CONL","NFLX","BOIL"]);
  const inverseSyms   = new Set(["SH","PSQ","SDS","QID","SPXS","SOXS","FAZ","SDOW","SRTY","TZA","REW","YANG","TWM","RWM","DOG","EUM","EWV","KOLD","DRIP","LABD","TECS","SQQQ","SPDN"]);
  const cryptoSyms    = new Set(["IBIT","FBTC","ARKB","BITO","GBTC","BITQ","ETHA","ETHW","BTCO","HODL","BRRR","BITB","EZBC","BTCW"]);
  const commoditySyms = new Set(["GLD","IAU","GLDM","SLV","SIVR","USO","UNG","DBO","DBB","DBA","PDBC","DBC","GSG","DJP","COMT","WEAT","CORN","SOYB","CANE","REMX","PALL","PPLT","SGOL","AAAU","BAR"]);
  const realEstateSyms= new Set(["VNQ","IYR","SCHH","REET","REM","MORT","INDS","SRVR","HOMZ","USRT","RWR","BBRE","KBWR","KBWY","IRET","FFR","PSA"]);
  const volatilitySyms= new Set(["VXX","UVXY","SVXY","VIXM","VIXY","VMIN","EXIV","SVOL"]);
  const fixedSyms     = new Set(["TLT","IEF","SHY","GOVT","SHV","SGOV","TBIL","BIL","VGLT","VGIT","VGSH","IEI","SPTL","AGG","BND","LQD","VCIT","VCSH","IGIB","IGSB","USIG","MBB","VMBS","SCHZ","HYG","JNK","USHY","HYDB","FALN","BKLN","SJNK","HYLS","MUB","HYD","HYMB","SUB","SHM","VTEB","ITM","MLN","JPST","MINT","NEAR","FLOT","FLRN","CLIP","CLTL","BSV","BIV","BLV","VCLT","IGLB","TIPS","VTIP","STIP","LTPZ","TBF","TBT","TMV"]);
  const intlSyms      = new Set(["IEFA","VEA","VXUS","VT","ACWI","EEM","VWO","IEMG","INDA","MCHI","EWZ","EWJ","EWG","EWU","EWA","EWC","EWH","EWS","EWT","EWY","EWI","EWP","EWQ","EWD","EWN","EWL","EWO","EWK","EWM","GXC","KWEB","CQQQ","FXI","ARGT","EZA","EIDO","EPOL","ECH","THD","FM","INDY","VNM","EPHE","ASHR","CNYA","AFK","ACWX"]);
  const dividendSyms  = new Set(["DVY","SDY","HDV","VYM","NOBL","DGRO","SCHD","VIG","REGL","FDVV","WDIV","SDIV","PFF","PGX","PFFD","SPFF","JEPI","JEPQ","QYLD","RYLD","XYLD","DIVO","NUSI","IDVO","SPHD","FDVV","TDIV","FDL"]);
  const broadSyms     = new Set(["SPY","VOO","IVV","VTI","ITOT","SCHB","IWB","IWM","VXF","SPTM","QQQ","ONEQ","SCHX","SCHK","FXAIX","FSKAX","FNILX"]);

  if (leveragedSyms.has(s) || /3x bull|ultra pro|direxion.*(bull 3x|3x bull)|microsectors.*3x|graniteShares.*2x long|t-rex 2x/i.test(n)) return "Leveraged";
  if (/2x (long|bull)|ultra (s&p 500|qqq|dow jones|nasdaq).*(2x|fund)|.*2x leveraged/i.test(n)) return "Leveraged";
  if (inverseSyms.has(s) || /\bbear\b|inverse|ultrashort|short (s&p|qqq|nasdaq|dow|russell|sector)|2x short|3x short/i.test(n)) return "Inverse";
  if (cryptoSyms.has(s) || /bitcoin|ethereum|crypto(?!graphy)|blockchain|digital asset/i.test(n)) return "Crypto";
  if (commoditySyms.has(s) || /\bgold\b.*etf|\bgold\b.*trust|\bsilver\b.*trust|oil fund|crude oil|natural gas fund|diversified commodity|precious metal|agriculture fund|palladium|platinum|\bwheat\b fund|\bcorn\b fund|commodity index/i.test(n)) return "Commodity";
  if (realEstateSyms.has(s) || /real estate|mortgage reit|\breit\b|realty.*etf/i.test(n)) return "Real Estate";
  if (volatilitySyms.has(s) || /\bvix\b|volatility (short|mid|long|futures)|vix.*futures/i.test(n)) return "Volatility";
  if (fixedSyms.has(s) || /treasury|t-bill|t-note|government bond|us bond|total bond|aggregate bond|muni(cipal)?|corporate bond|investment.grade bond|high.yield bond|senior loan|floating rate bond|inflation.protected|\btips\b.*etf|junk bond|preferred.*income|fixed income/i.test(n)) return "Fixed Income";
  if (intlSyms.has(s) || /china\b|japan\b|europe(an)?|asia(n)?|emerging market|international (stock|equity|developed)|developed market|world (stock|equity|ex-?us)|global (stock|equity|ex-?us|developed|international)|\bindia\b|\bkorea\b|\bbrazil\b|\bgermany\b|united kingdom|australia.*etf|\bcanada\b.*etf|latin america|africa|\btaiwan\b|\bsouth korea\b/i.test(n)) return "International";
  if (dividendSyms.has(s) || /dividend (aristocrat|growth|appreciation|achieve|select)|high dividend|covered call.*etf|equity premium income|option.*income etf/i.test(n)) return "Dividend";
  if (/\bdividend\b|\bincome\b.*etf|\byield\b.*etf/i.test(n) && !/bond|fixed|treasury|corporate|muni|preferred/i.test(n)) return "Dividend";
  if (/small.?cap|micro.?cap|russell 2000/i.test(n)) return "US Small Cap";
  if (/mid.?cap|s&p midcap|midcap 400|russell mid/i.test(n)) return "US Mid Cap";
  if (/ark (innovation|next generation|genomic|fintech|autonom|space)/i.test(n)) return "Thematic";
  if (/robo(tic)?|artificial intel|\bai\b (etf|fund)|machine learning|cybersec|cloud computing|metaverse|esport|gaming etf|cannabis|electric vehicle|autonomous|clean energy|solar energy|wind energy|fintech|disruptiv|genomic|space explor|internet of things|digital economy|digital infrastructure|\b5g\b|augmented reality|virtual reality|digital health/i.test(n)) return "Thematic";
  if (/select sector|sector spdr/i.test(n)) return "US Sector";
  if (/semiconductor|biotechnology|defense.*etf|aerospace.*etf|\bbank.*etf|regional bank|home.*construction|homebuilder|pharmaceutical|healthcare provider|medical device|insurance.*etf|oil.*gas explor|airline|software.*etf|cybersecurity/i.test(n)) return "US Sector";
  if (broadSyms.has(s) || /s&p 500 (etf|trust|index fund|index etf)|nasdaq-?100 etf|total (stock|market) (etf|fund|index)|russell 1000 etf|broad market etf/i.test(n)) return "US Broad";
  if (/\bvalue\b (etf|fund|index)|\bgrowth\b (etf|fund|index)|\bmomentum\b (etf|factor)|\bquality\b (etf|factor)|low volatil|minimum volatil|multi.?factor|dividend.*growth|fundamental index|factor (etf|fund)/i.test(n)) return "US Factor";
  if (/balanced|asset allocation|conservative.*port|moderate.*port|aggressive.*alloc|risk parity|managed futures|tail risk|market neutral/i.test(n)) return "Multi-Asset";
  return "Equity";
}

async function fetchScreenerPage(cookie: string, crumb: string, offset: number, size = 250): Promise<{ quotes: any[]; total: number }> {
  const url = `https://query2.finance.yahoo.com/v1/finance/screener?crumb=${encodeURIComponent(crumb)}&lang=en-US&region=US&formatted=false&corsDomain=finance.yahoo.com`;
  const body = {
    offset, size,
    sortField: "fundnetassets",
    sortType: "DESC",
    quoteType: "ETF",
    query: { operator: "AND", operands: [{ operator: "EQ", operands: ["region", "us"] }] },
    userId: "",
    userIdType: "guid",
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Cookie: cookie, "User-Agent": YF_UA_SCREEN, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Screener offset ${offset}: HTTP ${res.status}`);
  const data: any = await res.json();
  const result = data?.finance?.result?.[0];
  return {
    quotes: result?.quotes ?? [],
    total:  result?.total  ?? 0,
  };
}

// ─── 10-minute server-side cache ─────────────────────────────────────────────
let etfScreenerCache: { data: any; expiresAt: number } | null = null;

const CATEGORY_ORDER = [
  "US Broad","US Small Cap","US Mid Cap","US Factor","US Sector","Thematic",
  "Leveraged","Inverse","International","Fixed Income","Commodity","Real Estate",
  "Crypto","Dividend","Multi-Asset","Volatility","Equity",
];

router.get("/quotes/etf-screener", async (req, res) => {
  if (etfScreenerCache && Date.now() < etfScreenerCache.expiresAt) {
    return res.json(etfScreenerCache.data);
  }

  try {
    const auth = await getYahooAuthForScreener();
    if (!auth) throw new Error("Yahoo auth failed — could not get crumb");

    // Probe: get total count from first page
    const probe = await fetchScreenerPage(auth.cookie, auth.crumb, 0, 250);
    const total = probe.total;
    const allQuotes: any[] = [...probe.quotes];

    // Build remaining offsets and fetch 6 pages concurrently
    const pageSize = 250;
    const offsets: number[] = [];
    for (let o = pageSize; o < total; o += pageSize) offsets.push(o);

    const concurrency = 6;
    for (let i = 0; i < offsets.length; i += concurrency) {
      const batch = offsets.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(o => fetchScreenerPage(auth.cookie, auth.crumb, o, pageSize))
      );
      for (const r of results) {
        if (r.status === "fulfilled") allQuotes.push(...r.value.quotes);
      }
    }

    // Map to clean ETF records
    const etfs = allQuotes
      .filter(q => q.symbol && (q.regularMarketPrice ?? 0) > 0)
      .map(q => ({
        symbol:        q.symbol as string,
        name:          (q.shortName || q.longName || q.symbol) as string,
        category:      classifyETFCategory(q.shortName || q.longName || "", q.symbol),
        price:         parseFloat((q.regularMarketPrice ?? 0).toFixed(4)),
        change:        parseFloat((q.regularMarketChange ?? 0).toFixed(4)),
        changePct:     parseFloat((q.regularMarketChangePercent ?? 0).toFixed(4)),
        volume:        q.regularMarketVolume ?? null,
        week52High:    q.fiftyTwoWeekHigh ?? null,
        week52Low:     q.fiftyTwoWeekLow ?? null,
        ytdReturn:     q.ytdReturn != null ? parseFloat(q.ytdReturn.toFixed(2)) : null,
        return3M:      q.trailingThreeMonthReturns != null ? parseFloat(q.trailingThreeMonthReturns.toFixed(2)) : null,
        expenseRatio:  q.netExpenseRatio ?? null,
        aum:           q.netAssets ?? null,
        dividendYield: q.dividendYield ?? null,
        week52Change:  q.fiftyTwoWeekChangePercent != null ? parseFloat(q.fiftyTwoWeekChangePercent.toFixed(2)) : null,
      }));

    const categories = CATEGORY_ORDER.filter(c => etfs.some(e => e.category === c));

    const payload = {
      etfs,
      count:      etfs.length,
      total:      allQuotes.length,
      categories,
      source:     "Yahoo Finance screener (15-min delay)",
      asOf:       new Date().toISOString(),
    };

    etfScreenerCache = { data: payload, expiresAt: Date.now() + 10 * 60 * 1000 };
    return res.json(payload);
  } catch (err: any) {
    return res.status(502).json({ error: "ETF screener failed", detail: err.message });
  }
});

// Batch quotes — alias for /quotes with larger batch support
router.get("/quotes/batch", async (req, res) => {
  const { symbols } = req.query;
  if (!symbols || typeof symbols !== "string") {
    return res.status(400).json({ error: "symbols query param required" });
  }
  const symbolList = symbols.split(",").map(s => s.trim().toUpperCase()).slice(0, 50);

  try {
    const results = await Promise.allSettled(symbolList.map(fetchChartMeta));
    const quotes = results.map((r, i) => {
      if (r.status === "rejected") return null;
      const m = r.value;
      const price = m.regularMarketPrice ?? m.previousClose ?? 0;
      const prev = m.chartPreviousClose ?? m.previousClose ?? price;
      const change = price - prev;
      const changePct = prev ? (change / prev) * 100 : 0;
      return {
        symbol: symbolList[i],
        name: m.shortName || m.longName || symbolList[i],
        price,
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        volume: m.regularMarketVolume ?? 0,
        open: m.regularMarketOpen ?? prev,
        high: m.regularMarketDayHigh ?? price,
        low: m.regularMarketDayLow ?? price,
        prevClose: prev,
        week52High: m.fiftyTwoWeekHigh ?? null,
        week52Low: m.fiftyTwoWeekLow ?? null,
      };
    }).filter(Boolean);
    return res.json({ quotes, count: quotes.length, source: "Yahoo Finance", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "Failed", detail: err.message });
  }
});

// ─── Futures — Yahoo Finance futures quotes ───────────────────────────────────
const FUTURES_SYMBOLS = [
  { symbol: "ES=F", name: "E-mini S&P 500" },
  { symbol: "NQ=F", name: "E-mini NASDAQ 100" },
  { symbol: "YM=F", name: "E-mini Dow" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "CL=F", name: "WTI Crude Oil" },
  { symbol: "NG=F", name: "Natural Gas" },
  { symbol: "ZB=F", name: "US Treasury Bond" },
  { symbol: "ZN=F", name: "10-Year Note" },
  { symbol: "ZC=F", name: "Corn" },
  { symbol: "ZW=F", name: "Wheat" },
  { symbol: "ZS=F", name: "Soybeans" },
  { symbol: "KC=F", name: "Coffee" },
  { symbol: "CC=F", name: "Cocoa" },
  { symbol: "DX=F", name: "US Dollar Index" },
];

router.get("/quotes/futures", async (_req, res) => {
  try {
    const syms = FUTURES_SYMBOLS.map(f => f.symbol);
    const results = await Promise.allSettled(syms.map(fetchChartMeta));
    const quotes = results.map((r, i) => {
      if (r.status === "rejected") return null;
      const m = r.value;
      const price = m.regularMarketPrice ?? m.previousClose ?? 0;
      const prev = m.chartPreviousClose ?? m.previousClose ?? price;
      return {
        symbol: syms[i].replace("=F", ""),
        fullSymbol: syms[i],
        name: FUTURES_SYMBOLS[i].name,
        price,
        change: parseFloat((price - prev).toFixed(2)),
        changePct: parseFloat(((price - prev) / prev * 100).toFixed(2)),
        prevClose: prev,
        high: m.regularMarketDayHigh ?? price,
        low: m.regularMarketDayLow ?? price,
        volume: m.regularMarketVolume ?? 0,
      };
    }).filter(Boolean);
    return res.json({ quotes, count: quotes.length, source: "Yahoo Finance Futures", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "Futures fetch failed", detail: err.message });
  }
});

// ─── Analyst Recommendations ──────────────────────────────────────────────────
router.get("/quotes/analyst/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol.toUpperCase())}?modules=recommendationTrend`;
    const resp = await fetch(url, { headers: YF_HEADERS });
    if (!resp.ok) throw new Error(`Yahoo ${resp.status}`);
    const data: any = await resp.json();
    const trend = data?.quoteSummary?.result?.[0]?.recommendationTrend?.trend?.[0];
    if (!trend) return res.status(404).json({ error: "No analyst data available" });
    return res.json({
      symbol: symbol.toUpperCase(),
      strongBuy: trend.strongBuy ?? 0,
      buy: trend.buy ?? 0,
      hold: trend.hold ?? 0,
      sell: trend.sell ?? 0,
      strongSell: trend.strongSell ?? 0,
      total: (trend.strongBuy ?? 0) + (trend.buy ?? 0) + (trend.hold ?? 0) + (trend.sell ?? 0) + (trend.strongSell ?? 0),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Analyst data failed", detail: err.message });
  }
});

export default router;
