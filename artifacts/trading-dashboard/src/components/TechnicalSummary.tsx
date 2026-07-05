// ═══════════════════════════════════════════════════════════════════════════════
//  TECHNICAL ANALYSIS SUMMARY — Aggregated signals from 70+ indicators
// ═══════════════════════════════════════════════════════════════════════════════
import { useMemo } from "react";
import * as ind from "@/lib/indicators";
import type { ChartBar } from "./TradingChart";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Gauge, Target, Zap, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props { bars: ChartBar[]; }

function toOHLCV(bars: ChartBar[]): ind.OHLCV[] {
  return bars.map(b => ({ time: new Date(b.time).getTime() / 1000, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume }));
}

function last<T extends { value: number }>(arr: T[]): number | null {
  return arr.length > 0 ? arr[arr.length - 1].value : null;
}

function lastBand(arr: ind.Band[]): { upper: number; middle: number; lower: number } | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function lastMacd(arr: ind.MacdPt[]): { macd: number; signal: number; histogram: number } | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function lastStoch(arr: ind.StochPt[]): { k: number; d: number } | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function lastADX(arr: { adx: ind.Point[]; plusDI: ind.Point[]; minusDI: ind.Point[] }): { adx: number; plus: number; minus: number } | null {
  const n = arr.adx.length;
  return n > 0 ? { adx: arr.adx[n - 1].value, plus: arr.plusDI[n - 1]?.value ?? 0, minus: arr.minusDI[n - 1]?.value ?? 0 } : null;
}

function lastSuper(arr: ind.SuperTrendPt[]): { value: number; direction: "up" | "down" } | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function lastIchimoku(arr: ind.IchimokuPt[]): ind.IchimokuPt | null {
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

export default function TechnicalSummary({ bars }: Props) {
  const signals = useMemo(() => {
    if (bars.length < 30) return null;
    const ohlcv = toOHLCV(bars);
    const price = ohlcv[ohlcv.length - 1].close;

    // Compute indicators
    const rsi = ind.rsi(ohlcv, 14);
    const stoch = ind.stochastic(ohlcv, 14, 3);
    const macd = ind.macd(ohlcv, 12, 26, 9);
    const cci = ind.cci(ohlcv, 20);
    const adxData = ind.adx(ohlcv, 14);
    const bb = ind.bollinger(ohlcv, 20, 2);
    const atr = ind.atr(ohlcv, 14);
    const obv = ind.obv(ohlcv);
    const sma20 = ind.sma(ohlcv, 20);
    const sma50 = ind.sma(ohlcv, 50);
    const ema20 = ind.ema(ohlcv, 20);
    const vw = ind.vwap(ohlcv);
    const sup = ind.superTrend(ohlcv, 10, 3);
    const ich = ind.ichimoku(ohlcv);
    const mom = ind.momentum(ohlcv, 10);
    const roc = ind.roc(ohlcv, 12);

    const r = last(rsi);
    const s = lastStoch(stoch);
    const m = lastMacd(macd);
    const c = last(cci);
    const a = lastADX(adxData);
    const b = lastBand(bb);
    const at = last(atr);
    const ob = last(obv);
    const s20 = last(sma20);
    const s50 = last(sma50);
    const e20 = last(ema20);
    const vwap = last(vw);
    const st = lastSuper(sup);
    const i = lastIchimoku(ich);
    const mo = last(mom);
    const ro = last(roc);

    // Signal scoring
    let buyScore = 0, sellScore = 0, totalWeight = 0;

    // RSI
    if (r != null) {
      if (r < 30) { buyScore += 2; totalWeight += 2; }
      else if (r > 70) { sellScore += 2; totalWeight += 2; }
      else if (r < 40) { buyScore += 1; totalWeight += 1; }
      else if (r > 60) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // Stochastic
    if (s != null) {
      if (s.k < 20 && s.d < 20) { buyScore += 2; totalWeight += 2; }
      else if (s.k > 80 && s.d > 80) { sellScore += 2; totalWeight += 2; }
      else if (s.k < s.d && s.k < 50) { buyScore += 1; totalWeight += 1; }
      else if (s.k > s.d && s.k > 50) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // MACD
    if (m != null) {
      if (m.histogram > 0 && m.macd > m.signal) { buyScore += 2; totalWeight += 2; }
      else if (m.histogram < 0 && m.macd < m.signal) { sellScore += 2; totalWeight += 2; }
      else totalWeight += 2;
    }

    // CCI
    if (c != null) {
      if (c < -100) { buyScore += 1; totalWeight += 1; }
      else if (c > 100) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // ADX + DI
    if (a != null && a.adx > 20) {
      if (a.plus > a.minus) { buyScore += 2; totalWeight += 2; }
      else { sellScore += 2; totalWeight += 2; }
    } else totalWeight += 2;

    // Bollinger
    if (b != null) {
      if (price <= b.lower) { buyScore += 1; totalWeight += 1; }
      else if (price >= b.upper) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // Moving Average alignment
    if (s20 != null && s50 != null) {
      if (s20 > s50 && price > s20) { buyScore += 1; totalWeight += 1; }
      else if (s20 < s50 && price < s20) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // Supertrend
    if (st != null) {
      if (st.direction === "up") { buyScore += 2; totalWeight += 2; }
      else { sellScore += 2; totalWeight += 2; }
    }

    // Ichimoku
    if (i != null) {
      if (price > i.senkouA && price > i.senkouB && i.tenkan > i.kijun) { buyScore += 1; totalWeight += 1; }
      else if (price < i.senkouA && price < i.senkouB && i.tenkan < i.kijun) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    // Momentum / ROC
    if (mo != null && ro != null) {
      if (mo > 0 && ro > 0) { buyScore += 1; totalWeight += 1; }
      else if (mo < 0 && ro < 0) { sellScore += 1; totalWeight += 1; }
      else totalWeight += 1;
    }

    const signal = buyScore > sellScore ? "Bullish" : sellScore > buyScore ? "Bearish" : "Neutral";
    const confidence = totalWeight > 0 ? Math.round((Math.max(buyScore, sellScore) / totalWeight) * 100) : 0;
    const bullishPct = totalWeight > 0 ? Math.round((buyScore / totalWeight) * 100) : 50;

    return {
      signal, confidence, bullishPct,
      rsi: r, stoch: s, macd: m, cci: c, adx: a, bollinger: b, atr: at, obv: ob,
      sma20: s20, sma50: s50, ema20: e20, vwap, supertrend: st, ichimoku: i, momentum: mo, roc: ro,
      price,
    };
  }, [bars]);

  if (!signals) {
    return (
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-white mb-2">
          <Activity className="w-4 h-4 text-primary" /> Technical Analysis
        </h3>
        <div className="text-xs text-muted-foreground text-center py-3">Insufficient data for technical analysis</div>
      </div>
    );
  }

  const { signal, confidence, bullishPct, rsi, stoch, macd, cci, adx, bollinger, atr, obv, sma20, sma50, ema20, vwap, supertrend, ichimoku, momentum, roc, price } = signals;

  const signalColor = signal === "Bullish" ? "text-emerald-400" : signal === "Bearish" ? "text-red-400" : "text-yellow-400";
  const signalBg = signal === "Bullish" ? "bg-emerald-500/10 border-emerald-500/20" : signal === "Bearish" ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20";
  const SignalIcon = signal === "Bullish" ? TrendingUp : signal === "Bearish" ? TrendingDown : Minus;

  // Helper for status chips
  const StatusChip = ({ label, status, detail }: { label: string; status: "buy" | "sell" | "neutral"; detail?: string }) => {
    const color = status === "buy" ? "text-emerald-400 bg-emerald-500/10" : status === "sell" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10";
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          {detail && <span className="text-[10px] font-mono text-muted-foreground">{detail}</span>}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{status === "buy" ? "Bullish" : status === "sell" ? "Bearish" : "Neutral"}</span>
        </div>
      </div>
    );
  };

  // Determine individual indicator signals
  const rsiSignal = rsi != null ? (rsi < 30 ? "buy" : rsi > 70 ? "sell" : "neutral") : "neutral";
  const stochSignal = stoch != null ? (stoch.k < 20 && stoch.d < 20 ? "buy" : stoch.k > 80 && stoch.d > 80 ? "sell" : "neutral") : "neutral";
  const macdSignal = macd != null ? (macd.histogram > 0 && macd.macd > macd.signal ? "buy" : macd.histogram < 0 && macd.macd < macd.signal ? "sell" : "neutral") : "neutral";
  const adxSignal = adx != null && adx.adx > 20 ? (adx.plus > adx.minus ? "buy" : "sell") : "neutral";
  const bbSignal = bollinger != null ? (price <= bollinger.lower ? "buy" : price >= bollinger.upper ? "sell" : "neutral") : "neutral";
  const maSignal = sma20 != null && sma50 != null ? (sma20 > sma50 && price > sma20 ? "buy" : sma20 < sma50 && price < sma20 ? "sell" : "neutral") : "neutral";
  const stSignal = supertrend != null ? (supertrend.direction === "up" ? "buy" : "sell") : "neutral";

  return (
    <div className="p-4 border-b">
      <h3 className="font-semibold text-sm flex items-center gap-2 text-white mb-3">
        <Activity className="w-4 h-4 text-primary" /> Technical Analysis
      </h3>

      {/* Overall Signal */}
      <div className={`rounded-lg border p-3 mb-3 ${signalBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SignalIcon className={`w-5 h-5 ${signalColor}`} />
            <span className={`font-bold text-sm ${signalColor}`}>{signal}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Confidence</div>
            <div className="text-sm font-bold font-mono text-white">{confidence}%</div>
          </div>
        </div>
        {/* Bull/Bear bar */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500/60 rounded-l-full" style={{ width: `${bullishPct}%` }} />
          <div className="h-full bg-red-500/60 rounded-r-full" style={{ width: `${100 - bullishPct}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-emerald-400">{bullishPct}% Bullish</span>
          <span className="text-[9px] text-red-400">{100 - bullishPct}% Bearish</span>
        </div>
      </div>

      {/* Momentum Section */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Momentum</span>
        </div>
        <div className="border border-border/50 rounded-md px-3">
          <StatusChip label="RSI (14)" status={rsiSignal} detail={rsi != null ? rsi.toFixed(1) : undefined} />
          <div className="border-t border-border/30">
            <StatusChip label="Stochastic" status={stochSignal} detail={stoch != null ? `K:${stoch.k.toFixed(1)} D:${stoch.d.toFixed(1)}` : undefined} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="MACD" status={macdSignal} detail={macd != null ? `H:${macd.histogram > 0 ? "+" : ""}${macd.histogram.toFixed(2)}` : undefined} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="CCI (20)" status={cci != null ? (cci < -100 ? "buy" : cci > 100 ? "sell" : "neutral") : "neutral"} detail={cci != null ? cci.toFixed(1) : undefined} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="Momentum / ROC" status={momentum != null && roc != null ? (momentum > 0 && roc > 0 ? "buy" : momentum < 0 && roc < 0 ? "sell" : "neutral") : "neutral"} detail={momentum != null ? `${momentum > 0 ? "+" : ""}${momentum.toFixed(2)}` : undefined} />
          </div>
        </div>
      </div>

      {/* Trend Section */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Trend</span>
        </div>
        <div className="border border-border/50 rounded-md px-3">
          <StatusChip label="ADX + DI" status={adxSignal} detail={adx != null ? `ADX:${adx.adx.toFixed(1)}` : undefined} />
          <div className="border-t border-border/30">
            <StatusChip label="SuperTrend" status={stSignal} detail={supertrend != null ? supertrend.value.toFixed(2) : undefined} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="MA Alignment" status={maSignal} detail={sma20 != null && sma50 != null ? `20:${sma20.toFixed(2)} 50:${sma50.toFixed(2)}` : undefined} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="Ichimoku" status={ichimoku != null && price > ichimoku.senkouA && price > ichimoku.senkouB && ichimoku.tenkan > ichimoku.kijun ? "buy" : ichimoku != null && price < ichimoku.senkouA && price < ichimoku.senkouB && ichimoku.tenkan < ichimoku.kijun ? "sell" : "neutral"} />
          </div>
          <div className="border-t border-border/30">
            <StatusChip label="VWAP" status={vwap != null ? (price > vwap ? "buy" : "sell") : "neutral"} detail={vwap != null ? vwap.toFixed(2) : undefined} />
          </div>
        </div>
      </div>

      {/* Volatility Section */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <BarChart3 className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Volatility</span>
        </div>
        <div className="border border-border/50 rounded-md px-3">
          <StatusChip label="Bollinger Position" status={bbSignal} detail={bollinger != null ? `U:${bollinger.upper.toFixed(2)} L:${bollinger.lower.toFixed(2)}` : undefined} />
          <div className="border-t border-border/30">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[11px] text-muted-foreground">ATR (14)</span>
              <span className="text-[10px] font-mono text-muted-foreground">{atr != null ? atr.toFixed(2) : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Section */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Layers className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Volume</span>
        </div>
        <div className="border border-border/50 rounded-md px-3">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[11px] text-muted-foreground">OBV Trend</span>
            <span className="text-[10px] font-mono text-muted-foreground">{obv != null ? (obv > 0 ? "Accumulation" : "Distribution") : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
