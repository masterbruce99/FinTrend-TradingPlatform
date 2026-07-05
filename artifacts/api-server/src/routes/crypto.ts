import { Router } from "express";

const router = Router();

const COINGECKO = "https://api.coingecko.com/api/v3";

async function cgFetch(url: string) {
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${url}`);
  return res.json() as Promise<any>;
}

const CG_IDS: Record<string, string> = {
  "BTCUSDT": "bitcoin",
  "ETHUSDT": "ethereum",
  "SOLUSDT": "solana",
  "BNBUSDT": "binancecoin",
  "XRPUSDT": "ripple",
  "DOGEUSDT": "dogecoin",
  "ADAUSDT": "cardano",
  "AVAXUSDT": "avalanche-2",
  "DOTUSDT": "polkadot",
  "MATICUSDT": "polygon",
};

const CG_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries(CG_IDS).map(([k, v]) => [v, k])
);

// Tickers — CoinGecko markets endpoint
router.get("/crypto/tickers", async (req, res) => {
  const symbols = ((req.query.symbols as string) || "BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT").split(",").map(s => s.trim().toUpperCase());
  const ids = symbols.map(s => CG_IDS[s]).filter(Boolean).join(",");
  if (!ids) return res.status(400).json({ error: "No valid symbols" });

  try {
    const data = await cgFetch(`${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`);
    const tickers = (Array.isArray(data) ? data : []).map((c: any) => ({
      symbol: CG_SYMBOLS[c.id] || c.symbol?.toUpperCase() + "USDT",
      price: c.current_price ?? 0,
      change: c.price_change_24h ?? 0,
      changePct: c.price_change_percentage_24h ?? 0,
      volume: c.total_volume ?? 0,
      quoteVolume: c.market_cap ?? 0,
      high: c.high_24h ?? 0,
      low: c.low_24h ?? 0,
    }));

    return res.json({ tickers, source: "CoinGecko (real-time, free)", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "CoinGecko tickers fetch failed", detail: err.message });
  }
});

// OHLCV klines — CoinGecko market_chart
router.get("/crypto/klines/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const id = CG_IDS[sym];
  if (!id) return res.status(400).json({ error: `Unknown symbol: ${sym}` });

  const interval = (req.query.interval as string) || "1h";
  const limit = Math.min(Number(req.query.limit) || 100, 365);

  // Map interval to CoinGecko days
  const days = interval === "1m" || interval === "5m" || interval === "15m" || interval === "30m"
    ? 1
    : interval === "1h" || interval === "2h" || interval === "4h"
    ? 7
    : interval === "1d"
    ? Math.min(limit, 365)
    : 30;

  try {
    const data = await cgFetch(`${COINGECKO}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
    const prices: [number, number][] = data?.prices ?? [];
    const volumes: [number, number][] = data?.total_volumes ?? [];

    const bars = prices.map((p, i) => {
      const prev = prices[i - 1];
      const open = prev ? prev[1] : p[1];
      // Approximate high/low from single price point (CoinGecko gives average)
      const close = p[1];
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      return {
        time: new Date(p[0]).toISOString(),
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
        volume: volumes[i]?.[1] ?? 0,
      };
    });

    // Downsample if needed
    const step = Math.max(1, Math.floor(bars.length / limit));
    const sampled = step === 1 ? bars : bars.filter((_, i) => i % step === 0).slice(-limit);

    return res.json({ symbol: sym, interval, bars: sampled, count: sampled.length, source: "CoinGecko (real-time, free)", asOf: new Date().toISOString() });
  } catch (err: any) {
    return res.status(502).json({ error: "CoinGecko klines fetch failed", detail: err.message });
  }
});

// Funding rate — CoinGecko doesn't have this. Return gracefully with explanation.
router.get("/crypto/funding/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  return res.json({
    symbol: sym,
    markPrice: null,
    indexPrice: null,
    fundingRate: null,
    nextFundingTime: null,
    openInterest: null,
    rateHistory: [],
    source: "Binance funding API is unavailable from server IPs (requires browser context). Funding data loads directly in the browser.",
    asOf: new Date().toISOString(),
  });
});

export default router;
