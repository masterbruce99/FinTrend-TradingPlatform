import { Router } from "express";

const router = Router();

const YF_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function getYahooAuth(): Promise<{ cookie: string; crumb: string } | null> {
  try {
    const res1 = await fetch("https://fc.yahoo.com", {
      redirect: "manual",
      headers: { "User-Agent": YF_UA },
    });
    const rawCookie = res1.headers.get("set-cookie");
    if (!rawCookie) return null;
    const cookie = rawCookie.split(";")[0].trim();

    const res2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { Cookie: cookie, "User-Agent": YF_UA },
    });
    const crumb = await res2.text();
    if (!crumb || crumb.startsWith("{")) return null;
    return { cookie, crumb };
  } catch {
    return null;
  }
}

function normalize(val: any): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object" && "raw" in val) return val.raw ?? null;
  return null;
}

function normalizeStatement(item: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    if (k === "endDate") {
      if (typeof v === "number") {
        out[k] = new Date(v * 1000).toISOString().split("T")[0];
      } else if (typeof v === "object" && v !== null && "raw" in v) {
        out[k] = new Date((v as any).raw * 1000).toISOString().split("T")[0];
      } else if (typeof v === "object" && v !== null && "fmt" in v) {
        out[k] = (v as any).fmt;
      } else {
        out[k] = v;
      }
    } else if (k === "maxAge") {
      out[k] = v;
    } else {
      out[k] = normalize(v);
    }
  }
  return out;
}

async function fetchQuoteSummary(symbol: string, modules: string) {
  const auth = await getYahooAuth();
  if (!auth) throw new Error("Yahoo auth failed");
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol.toUpperCase())}?modules=${modules}&crumb=${encodeURIComponent(auth.crumb)}`;
  const res = await fetch(url, {
    headers: { Cookie: auth.cookie, "User-Agent": YF_UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo quoteSummary ${res.status}`);
  const data: any = await res.json();
  return data?.quoteSummary?.result?.[0] ?? null;
}

// Earnings Calendar — fetches calendarEvents for a curated set of symbols
const EARNINGS_SYMBOLS = [
  "AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","NFLX","AMD","INTC",
  "CRM","ORCL","IBM","UBER","LYFT","COIN","PYPL","SQ","SHOP","SNOW",
  "PLTR","MARA","SMCI","LRCX","KLAC","QCOM","AVGO","TXN","ADI","MRVL",
  "NOW","NET","DDOG","ZS","CRWD","OKTA","SNOW","AI","PLTR","HOOD",
  "SPOT","RBLX","DUOL","ABNB","DDOG","GTLB","CFLT","MDB","S","FSLY",
];

router.get("/finance/earnings-calendar", async (req, res) => {
  try {
    const auth = await getYahooAuth();
    if (!auth) {
      return res.json({ earnings: [], count: 0, source: "Yahoo auth unavailable", asOf: new Date().toISOString() });
    }

    // Fetch calendarEvents in parallel batches of 10
    const batchSize = 10;
    let allEarnings: any[] = [];
    for (let i = 0; i < EARNINGS_SYMBOLS.length; i += batchSize) {
      const batch = EARNINGS_SYMBOLS.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (sym) => {
          const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=calendarEvents&crumb=${encodeURIComponent(auth.crumb)}`;
          const res = await fetch(url, { headers: { Cookie: auth.cookie, "User-Agent": YF_UA, Accept: "application/json" } });
          if (!res.ok) return null;
          const data: any = await res.json();
          const result = data?.quoteSummary?.result?.[0]?.calendarEvents;
          if (!result?.earnings?.earningsDate?.[0]) return null;

          const e = result.earnings;
          return {
            symbol: sym,
            date: e.earningsDate[0].fmt,
            dateRaw: e.earningsDate[0].raw,
            isEstimate: e.isEarningsDateEstimate ?? true,
            epsEstimate: normalize(e.earningsAverage),
            epsLow: normalize(e.earningsLow),
            epsHigh: normalize(e.earningsHigh),
            revenueEstimate: normalize(e.revenueAverage),
            revenueLow: normalize(e.revenueLow),
            revenueHigh: normalize(e.revenueHigh),
          };
        })
      );
      const batchData = batchResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map(r => r.value)
        .filter(Boolean);
      allEarnings = allEarnings.concat(batchData);
    }

    // Sort by date ascending (future first)
    allEarnings.sort((a, b) => a.dateRaw - b.dateRaw);

    // Filter to upcoming + recent (last 7 days to next 30 days)
    const now = Math.floor(Date.now() / 1000);
    const upcoming = allEarnings.filter(e => e.dateRaw >= now - 7 * 86400);

    return res.json({
      earnings: upcoming,
      count: upcoming.length,
      source: "Yahoo Finance v10 quoteSummary",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Earnings calendar failed", detail: err.message });
  }
});

// News — via crumb-authenticated Yahoo v7
router.get("/finance/news", async (req, res) => {
  try {
    const auth = await getYahooAuth();
    if (!auth) {
      return res.json({ news: [], count: 0, source: "Yahoo auth unavailable", asOf: new Date().toISOString() });
    }
    const url = `https://query1.finance.yahoo.com/v2/finance/news?count=${req.query.count ?? 20}&crumb=${encodeURIComponent(auth.crumb)}`;
    const result = await fetch(url, {
      headers: { Cookie: auth.cookie, "User-Agent": YF_UA },
    });
    const data: any = await result.json();
    const items = data?.Content?.result?.Data?.items || [];
    const news = items.map((item: any) => ({
      id: item.id || item.uuid,
      headline: item.title || item.content?.title,
      summary: item.summary || item.content?.summary,
      url: item.url || item.link,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url,
      publisher: item.publisher || item.content?.provider?.displayName,
      publishedAt: item.published || item.content?.pubDate,
      symbols: item.tickers || [],
    })).slice(0, 50);
    return res.json({ news, count: news.length, source: "Yahoo Finance", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.json({ news: [], count: 0, source: "Yahoo Finance (error: " + err.message + ")", asOf: new Date().toISOString() });
  }
});

// Financial summary — via crumb-authenticated quoteSummary
router.get("/finance/summary/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const result = await fetchQuoteSummary(symbol, "financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory");
    if (!result) {
      return res.json({ symbol, financialData: {}, keyStatistics: {}, income: [], balance: [], cashflow: [], source: "No data", asOf: new Date().toISOString() });
    }

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const sd = result.summaryDetail || {};

    const income = (result.incomeStatementHistory?.incomeStatementHistory || []).map(normalizeStatement);
    const balance = (result.balanceSheetHistory?.balanceSheetStatements || []).map(normalizeStatement);
    const cashflow = (result.cashflowStatementHistory?.cashflowStatements || []).map(normalizeStatement);

    return res.json({
      symbol,
      financialData: {
        currentPrice: normalize(fd.currentPrice),
        targetMeanPrice: normalize(fd.targetMeanPrice),
        targetHighPrice: normalize(fd.targetHighPrice),
        targetLowPrice: normalize(fd.targetLowPrice),
        recommendationMean: normalize(fd.recommendationMean),
        recommendationKey: fd.recommendationKey || null,
        numberOfAnalystOpinions: normalize(fd.numberOfAnalystOpinions),
        totalRevenue: normalize(fd.totalRevenue),
        revenueGrowth: normalize(fd.revenueGrowth),
        grossMargins: normalize(fd.grossMargins),
        operatingMargins: normalize(fd.operatingMargins),
        profitMargins: normalize(fd.profitMargins),
        returnOnEquity: normalize(fd.returnOnEquity),
        returnOnAssets: normalize(fd.returnOnAssets),
        totalDebt: normalize(fd.totalDebt),
        totalCash: normalize(fd.totalCash),
        freeCashflow: normalize(fd.freeCashflow),
        operatingCashflow: normalize(fd.operatingCashflow),
        earningsGrowth: normalize(fd.earningsGrowth),
        revenuePerShare: normalize(fd.revenuePerShare),
        ebitda: normalize(fd.ebitda),
      },
      keyStatistics: {
        trailingEps: normalize(ks.trailingEps),
        forwardEps: normalize(ks.forwardEps),
        trailingPE: normalize(ks.trailingPE),
        forwardPE: normalize(ks.forwardPE),
        priceToBook: normalize(ks.priceToBook),
        enterpriseToEbitda: normalize(ks.enterpriseToEbitda),
        beta: normalize(ks.beta),
        shortRatio: normalize(ks.shortRatio),
        sharesOutstanding: normalize(ks.sharesOutstanding),
        bookValue: normalize(ks.bookValue),
        dividendYield: normalize(ks.dividendYield),
        payoutRatio: normalize(ks.payoutRatio),
        fiftyTwoWeekChange: normalize(ks["52WeekChange"]),
        heldPercentInstitutions: normalize(ks.heldPercentInstitutions),
      },
      income,
      balance,
      cashflow,
      source: "Yahoo Finance v10 quoteSummary",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Financial summary fetch failed", detail: err.message, symbol });
  }
});

// Options chain — via crumb-authenticated Yahoo
router.get("/finance/options/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const auth = await getYahooAuth();
    if (!auth) {
      return res.json({ symbol, underlyingPrice: null, expirationDates: [], calls: [], puts: [], source: "Yahoo auth unavailable", asOf: new Date().toISOString() });
    }
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}?crumb=${encodeURIComponent(auth.crumb)}`;
    const result = await fetch(url, {
      headers: { Cookie: auth.cookie, "User-Agent": YF_UA },
    });
    const data: any = await result.json();
    const optChain = data?.optionChain?.result?.[0];
    if (!optChain) {
      return res.json({ symbol, underlyingPrice: null, expirationDates: [], calls: [], puts: [], source: "Yahoo Finance (no data)", asOf: new Date().toISOString() });
    }

    const underlying = optChain.underlyingSymbol;
    const underlyingPrice = optChain.quote?.regularMarketPrice ?? optChain.quote?.lastPrice ?? null;
    const expDates = optChain.expirationDates?.map((ts: number) => new Date(ts * 1000).toISOString().split("T")[0]) || [];

    const options = optChain.options?.[0];
    const calls = (options?.calls || []).map((o: any) => ({
      strike: normalize(o.strike),
      expiration: o.expiration ? new Date(o.expiration * 1000).toISOString().split("T")[0] : null,
      lastPrice: normalize(o.lastPrice),
      bid: normalize(o.bid),
      ask: normalize(o.ask),
      change: normalize(o.change),
      changePct: normalize(o.percentChange),
      volume: normalize(o.volume),
      openInterest: normalize(o.openInterest),
      impliedVol: normalize(o.impliedVolatility),
      inTheMoney: !!o.inTheMoney,
    }));
    const puts = (options?.puts || []).map((o: any) => ({
      strike: normalize(o.strike),
      expiration: o.expiration ? new Date(o.expiration * 1000).toISOString().split("T")[0] : null,
      lastPrice: normalize(o.lastPrice),
      bid: normalize(o.bid),
      ask: normalize(o.ask),
      change: normalize(o.change),
      changePct: normalize(o.percentChange),
      volume: normalize(o.volume),
      openInterest: normalize(o.openInterest),
      impliedVol: normalize(o.impliedVolatility),
      inTheMoney: !!o.inTheMoney,
    }));

    return res.json({
      symbol: underlying || symbol,
      underlyingPrice,
      expirationDates: expDates,
      calls,
      puts,
      source: "Yahoo Finance",
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ error: "Options fetch failed", detail: err.message, symbol });
  }
});

export default router;
