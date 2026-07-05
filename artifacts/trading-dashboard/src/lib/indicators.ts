// ═══════════════════════════════════════════════════════════════════════════════
//  COMPLETE TECHNICAL INDICATORS LIBRARY — 70+ indicators, pure math over OHLCV
// ═══════════════════════════════════════════════════════════════════════════════

export interface OHLCV {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}
export interface Point { time: number; value: number; }
export interface TwoLine { time: number; v1: number; v2: number; }
export interface ThreeLine { time: number; v1: number; v2: number; v3: number; }
export interface Band { time: number; upper: number; middle: number; lower: number; }
export interface MacdPt { time: number; macd: number; signal: number; histogram: number; }
export interface StochPt { time: number; k: number; d: number; }
export interface IchimokuPt { time: number; tenkan: number; kijun: number; senkouA: number; senkouB: number; chikou: number; }
export interface PivotPt { time: number; pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number; }
export interface SARPt { time: number; value: number; trend: "up" | "down"; }
export interface SuperTrendPt { time: number; value: number; direction: "up" | "down"; }
export interface AlligatorPt { time: number; jaw: number; teeth: number; lips: number; }
export interface FractalPt { time: number; isHigh: boolean; isLow: boolean; }
export interface VolumeProfileBin { price: number; volume: number; color: string; }

// ── Helpers ─────────────────────────────────────────────────────────────────
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => sum(a) / a.length;
const std = (a: number[]) => {
  const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
};
const min = (a: number[]) => Math.min(...a);
const max = (a: number[]) => Math.max(...a);
const emaStep = (prev: number, price: number, mult: number) => price * mult + prev * (1 - mult);
const highest = (data: OHLCV[], field: keyof OHLCV, i: number, period: number) =>
  max(data.slice(Math.max(0, i - period + 1), i + 1).map(d => d[field] as number));
const lowest = (data: OHLCV[], field: keyof OHLCV, i: number, period: number) =>
  min(data.slice(Math.max(0, i - period + 1), i + 1).map(d => d[field] as number));
const tr = (c: OHLCV, p: OHLCV) => Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
const tp = (c: OHLCV) => (c.high + c.low + c.close) / 3;
const typicalPrice = tp;

// ── Moving Averages ──────────────────────────────────────────────────────────
export function sma(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    out.push({ time: data[i].time, value: mean(data.slice(i - p + 1, i + 1).map(d => d[f] as number)) });
  }
  return out;
}
export function ema(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const m = 2 / (p + 1), out: Point[] = [];
  let e = mean(data.slice(0, p).map(d => d[f] as number));
  out.push({ time: data[p - 1].time, value: e });
  for (let i = p; i < data.length; i++) { e = emaStep(e, data[i][f] as number, m); out.push({ time: data[i].time, value: e }); }
  return out;
}
export function wma(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const d = (p * (p + 1)) / 2, out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += (data[i - j][f] as number) * (p - j);
    out.push({ time: data[i].time, value: s / d });
  }
  return out;
}
export function smma(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  let s = mean(data.slice(0, p).map(d => d[f] as number));
  out.push({ time: data[p - 1].time, value: s });
  for (let i = p; i < data.length; i++) { s = (s * (p - 1) + (data[i][f] as number)) / p; out.push({ time: data[i].time, value: s }); }
  return out;
}
export function dema(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const e1 = ema(data, p, f), e2 = ema(e1.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), p, "close");
  const out: Point[] = [];
  for (let i = 0; i < e1.length && i < e2.length; i++) out.push({ time: e1[i].time, value: 2 * e1[i].value - e2[i].value });
  return out;
}
export function tema(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const e1 = ema(data, p, f);
  const tmp = e1.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 }));
  const e2 = ema(tmp, p, "close");
  const tmp2 = e2.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 }));
  const e3 = ema(tmp2, p, "close");
  const out: Point[] = [];
  for (let i = 0; i < e1.length && i < e2.length && i < e3.length; i++)
    out.push({ time: e1[i].time, value: 3 * e1[i].value - 3 * e2[i].value + e3[i].value });
  return out;
}
export function hullMA(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const half = Math.floor(p / 2);
  const w1 = wma(data, half, f);
  const w2 = wma(data, p, f);
  const aligned: Point[] = [];
  for (let i = 0; i < w1.length && i < w2.length; i++) aligned.push({ time: w1[i].time, value: 2 * w1[i].value - w2[i].value });
  const tmp = aligned.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 }));
  return wma(tmp, Math.floor(Math.sqrt(p)), "close");
}
export function alma(data: OHLCV[], p: number, offset = 0.85, sigma = 6, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  const m = Math.floor(offset * (p - 1));
  const s = p / sigma;
  const w: number[] = [];
  let wSum = 0;
  for (let i = 0; i < p; i++) {
    const v = Math.exp(-((i - m) ** 2) / (2 * s * s));
    w.push(v); wSum += v;
  }
  for (let i = p - 1; i < data.length; i++) {
    let v = 0;
    for (let j = 0; j < p; j++) v += (data[i - j][f] as number) * w[p - 1 - j];
    out.push({ time: data[i].time, value: v / wSum });
  }
  return out;
}
export function linearRegression(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const slice = data.slice(i - p + 1, i + 1).map((d, idx) => ({ x: idx, y: d[f] as number }));
    const n = slice.length, sx = sum(slice.map(s => s.x)), sy = sum(slice.map(s => s.y));
    const sxx = sum(slice.map(s => s.x * s.x)), sxy = sum(slice.map(s => s.x * s.y));
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    out.push({ time: data[i].time, value: intercept + slope * (n - 1) });
  }
  return out;
}
export function vwma(data: OHLCV[], p: number, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const slice = data.slice(i - p + 1, i + 1);
    const wSum = sum(slice.map(d => d.volume));
    const v = wSum > 0 ? sum(slice.map(d => (d[f] as number) * d.volume)) / wSum : slice[p - 1][f] as number;
    out.push({ time: data[i].time, value: v });
  }
  return out;
}
export function vwap(data: OHLCV[]): Point[] {
  let cumTPV = 0, cumVol = 0;
  return data.map(d => {
    const t = (d.high + d.low + d.close) / 3;
    cumTPV += t * d.volume; cumVol += d.volume;
    return { time: d.time, value: cumVol > 0 ? cumTPV / cumVol : t };
  });
}

// ── Ribbon (5 EMAs) ────────────────────────────────────────────────────────
export function maRibbon(data: OHLCV[]): Record<string, Point[]> {
  return { ema8: ema(data, 8), ema13: ema(data, 13), ema21: ema(data, 21), ema55: ema(data, 55), ema89: ema(data, 89) };
}

// ── Bollinger + Donchian + Keltner + Envelope + Price Channel ──────────────
export function bollinger(data: OHLCV[], p = 20, mult = 2): Band[] {
  const out: Band[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1).map(d => d.close);
    const m = mean(s);
    const sdv = std(s);
    out.push({ time: data[i].time, upper: m + mult * sdv, middle: m, lower: m - mult * sdv });
  }
  return out;
}
export function bbTrend(data: OHLCV[], p = 20): Point[] {
  const bb = bollinger(data, p);
  const out: Point[] = [];
  for (let i = 0; i < bb.length; i++) {
    const idx = data.findIndex(d => d.time === bb[i].time);
    if (idx >= 0) {
      const range = bb[i].upper - bb[i].lower;
      out.push({ time: bb[i].time, value: range > 0 ? ((data[idx].close - bb[i].lower) / range) * 100 : 50 });
    }
  }
  return out;
}
export function donchian(data: OHLCV[], p = 20): Band[] {
  const out: Band[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const u = max(s.map(d => d.high)), l = min(s.map(d => d.low));
    out.push({ time: data[i].time, upper: u, middle: (u + l) / 2, lower: l });
  }
  return out;
}
export function keltner(data: OHLCV[], emaP = 20, atrP = 10, mult = 2): Band[] {
  const e = ema(data, emaP, "close");
  const a = atr(data, atrP);
  const out: Band[] = [];
  const aMap = new Map(a.map(v => [v.time, v.value]));
  for (let i = 0; i < e.length; i++) {
    const av = aMap.get(e[i].time);
    if (av != null) out.push({ time: e[i].time, upper: e[i].value + mult * av, middle: e[i].value, lower: e[i].value - mult * av });
  }
  return out;
}
export function envelope(data: OHLCV[], p = 20, pct = 0.05, f: keyof OHLCV = "close"): { upper: Point[]; lower: Point[] } {
  const m = sma(data, p, f);
  return {
    upper: m.map(v => ({ time: v.time, value: v.value * (1 + pct) })),
    lower: m.map(v => ({ time: v.time, value: v.value * (1 - pct) })),
  };
}
export function priceChannel(data: OHLCV[], p = 20): Band[] {
  return donchian(data, p);
}

// ── Volatility ──────────────────────────────────────────────────────────────
export function atr(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  let a = mean(data.slice(1, p + 1).map((d, i) => tr(d, data[i])));
  out.push({ time: data[p].time, value: a });
  for (let i = p + 1; i < data.length; i++) { a = (a * (p - 1) + tr(data[i], data[i - 1])) / p; out.push({ time: data[i].time, value: a }); }
  return out;
}
export function historicalVolatility(data: OHLCV[], p = 20): Point[] {
  const out: Point[] = [];
  for (let i = p; i < data.length; i++) {
    const logRets = [];
    for (let j = i - p + 1; j <= i; j++) logRets.push(Math.log(data[j].close / data[j - 1].close));
    out.push({ time: data[i].time, value: std(logRets) * Math.sqrt(252) * 100 });
  }
  return out;
}
export function stdDeviation(data: OHLCV[], p = 20, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++)
    out.push({ time: data[i].time, value: std(data.slice(i - p + 1, i + 1).map(d => d[f] as number)) });
  return out;
}
export function stdError(data: OHLCV[], p = 20, f: keyof OHLCV = "close"): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1).map(d => d[f] as number);
    out.push({ time: data[i].time, value: std(s) / Math.sqrt(s.length) });
  }
  return out;
}
export function stdErrorBands(data: OHLCV[], p = 20, f: keyof OHLCV = "close"): { upper: Point[]; lower: Point[]; middle: Point[] } {
  const m = sma(data, p, f);
  const se = stdError(data, p, f);
  return {
    upper: m.map((v, i) => ({ time: v.time, value: v.value + 2 * (se[i]?.value ?? 0) })),
    lower: m.map((v, i) => ({ time: v.time, value: v.value - 2 * (se[i]?.value ?? 0) })),
    middle: m,
  };
}
export function chandeKrollStop(data: OHLCV[], p = 10, mult = 1): { upper: Point[]; lower: Point[] } {
  const a = atr(data, p);
  const outU: Point[] = [], outL: Point[] = [];
  const aMap = new Map(a.map(v => [v.time, v.value]));
  for (let i = p; i < data.length; i++) {
    const av = aMap.get(data[i].time);
    if (av != null) {
      const highStop = max(data.slice(Math.max(0, i - p + 1), i + 1).map(d => d.high)) - mult * av;
      const lowStop = min(data.slice(Math.max(0, i - p + 1), i + 1).map(d => d.low)) + mult * av;
      outU.push({ time: data[i].time, value: highStop });
      outL.push({ time: data[i].time, value: lowStop });
    }
  }
  return { upper: outU, lower: outL };
}
export function chaikinVolatility(data: OHLCV[], emaP = 10, rocP = 10): Point[] {
  const out: Point[] = [];
  for (let i = emaP + rocP - 1; i < data.length; i++) {
    const hL1 = mean(data.slice(i - emaP - rocP + 1, i - rocP + 1).map(d => d.high - d.low));
    const hL2 = mean(data.slice(i - emaP + 1, i + 1).map(d => d.high - d.low));
    out.push({ time: data[i].time, value: hL1 > 0 ? ((hL2 - hL1) / hL1) * 100 : 0 });
  }
  return out;
}
export function volatilityIndex(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  const s = stdDeviation(data, p);
  const m = sma(data, p);
  for (let i = 0; i < s.length && i < m.length; i++)
    out.push({ time: s[i].time, value: m[i].value > 0 ? (s[i].value / m[i].value) * 100 : 0 });
  return out;
}

// ── RSI + Stochastic + CCI + Williams %R ───────────────────────────────────
export function rsi(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) { const ch = data[i].close - data[i - 1].close; ag += ch > 0 ? ch : 0; al += ch < 0 ? -ch : 0; }
  ag /= p; al /= p;
  out.push({ time: data[p].time, value: al === 0 ? 100 : 100 - 100 / (1 + ag / al) });
  for (let i = p + 1; i < data.length; i++) {
    const ch = data[i].close - data[i - 1].close;
    ag = (ag * (p - 1) + (ch > 0 ? ch : 0)) / p;
    al = (al * (p - 1) + (ch < 0 ? -ch : 0)) / p;
    out.push({ time: data[i].time, value: al === 0 ? 100 : 100 - 100 / (1 + ag / al) });
  }
  return out;
}
export function stochastic(data: OHLCV[], kP = 14, dP = 3): StochPt[] {
  const raw: Point[] = [];
  for (let i = kP - 1; i < data.length; i++) {
    const s = data.slice(i - kP + 1, i + 1);
    const l = min(s.map(d => d.low)), h = max(s.map(d => d.high));
    raw.push({ time: data[i].time, value: h === l ? 50 : ((data[i].close - l) / (h - l)) * 100 });
  }
  const d = sma(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), dP, "close");
  const out: StochPt[] = [];
  for (let i = 0; i < d.length; i++) {
    const kIdx = raw.findIndex(r => r.time === d[i].time);
    if (kIdx >= 0) out.push({ time: d[i].time, k: raw[kIdx].value, d: d[i].value });
  }
  return out;
}
export function cci(data: OHLCV[], p = 20): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const tps = s.map(d => tp(d));
    const m = mean(tps);
    const md = mean(tps.map(t => Math.abs(t - m)));
    out.push({ time: data[i].time, value: md === 0 ? 0 : (tp(data[i]) - m) / (0.015 * md) });
  }
  return out;
}
export function williamsR(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const h = max(s.map(d => d.high)), l = min(s.map(d => d.low));
    out.push({ time: data[i].time, value: h === l ? -50 : ((h - data[i].close) / (h - l)) * -100 });
  }
  return out;
}
export function stochasticRSI(data: OHLCV[], rsiP = 14, stochP = 14, kP = 3, dP = 3): StochPt[] {
  const r = rsi(data, rsiP);
  const minR = min(r.map(v => v.value)), maxR = max(r.map(v => v.value));
  const raw: Point[] = r.map(v => ({ time: v.time, value: maxR === minR ? 50 : ((v.value - minR) / (maxR - minR)) * 100 }));
  const k = sma(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), kP, "close");
  const d = sma(k.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), dP, "close");
  const out: StochPt[] = [];
  for (let i = 0; i < k.length && i < d.length; i++) out.push({ time: k[i].time, k: k[i].value, d: d[i].value });
  return out;
}

// ── MACD + AO + TRIX ────────────────────────────────────────────────────────
export function macd(data: OHLCV[], fast = 12, slow = 26, sig = 9): MacdPt[] {
  const eF = ema(data, fast), eS = ema(data, slow);
  const macdL: Point[] = [];
  for (let i = 0; i < eF.length && i < eS.length; i++) macdL.push({ time: eF[i].time, value: eF[i].value - eS[i].value });
  const mult = 2 / (sig + 1);
  let sigVal = mean(macdL.slice(0, sig).map(m => m.value));
  const out: MacdPt[] = [];
  out.push({ time: macdL[sig - 1].time, macd: macdL[sig - 1].value, signal: sigVal, histogram: macdL[sig - 1].value - sigVal });
  for (let i = sig; i < macdL.length; i++) {
    sigVal = emaStep(sigVal, macdL[i].value, mult);
    out.push({ time: macdL[i].time, macd: macdL[i].value, signal: sigVal, histogram: macdL[i].value - sigVal });
  }
  return out;
}
export function awesomeOscillator(data: OHLCV[], fast = 5, slow = 34): Point[] {
  const med = data.map(d => ({ ...d, close: (d.high + d.low) / 2 }));
  const f = sma(med, fast, "close"), s = sma(med, slow, "close");
  const out: Point[] = [];
  for (let i = 0; i < f.length && i < s.length; i++) out.push({ time: f[i].time, value: f[i].value - s[i].value });
  return out;
}
export function trix(data: OHLCV[], p = 15): Point[] {
  const e1 = ema(data, p), tmp1 = e1.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 }));
  const e2 = ema(tmp1, p, "close"), tmp2 = e2.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 }));
  const e3 = ema(tmp2, p, "close");
  const out: Point[] = [];
  for (let i = 1; i < e3.length; i++) {
    const ret = (e3[i].value - e3[i - 1].value) / e3[i - 1].value;
    out.push({ time: e3[i].time, value: isFinite(ret) ? ret * 100 : 0 });
  }
  return out;
}

// ── Momentum + ROC + MOM ────────────────────────────────────────────────────
export function momentum(data: OHLCV[], p = 10): Point[] {
  const out: Point[] = [];
  for (let i = p; i < data.length; i++) out.push({ time: data[i].time, value: data[i].close - data[i - p].close });
  return out;
}
export function roc(data: OHLCV[], p = 12): Point[] {
  const out: Point[] = [];
  for (let i = p; i < data.length; i++)
    out.push({ time: data[i].time, value: data[i - p].close !== 0 ? ((data[i].close - data[i - p].close) / data[i - p].close) * 100 : 0 });
  return out;
}
export const rateOfChange = roc;

// ── OBV + ADL + CMF + PVT + CVI + Volume Oscillator ─────────────────────────
export function obv(data: OHLCV[]): Point[] {
  let v = 0;
  return data.map((d, i) => {
    if (i === 0) v = d.volume;
    else { const ch = d.close - data[i - 1].close; if (ch > 0) v += d.volume; else if (ch < 0) v -= d.volume; }
    return { time: d.time, value: v };
  });
}
export function adl(data: OHLCV[]): Point[] {
  let v = 0;
  return data.map(d => {
    const mfm = d.high !== d.low ? ((d.close - d.low) - (d.high - d.close)) / (d.high - d.low) : 0;
    v += mfm * d.volume;
    return { time: d.time, value: v };
  });
}
export function chaikinMoneyFlow(data: OHLCV[], p = 20): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const volSum = sum(s.map(d => d.volume));
    const mfv = sum(s.map(d => d.high !== d.low ? ((d.close - d.low) - (d.high - d.close)) / (d.high - d.low) * d.volume : 0));
    out.push({ time: data[i].time, value: volSum > 0 ? mfv / volSum : 0 });
  }
  return out;
}
export function chaikinOscillator(data: OHLCV[], fast = 3, slow = 10): Point[] {
  const a = adl(data);
  const eF = ema(a.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), fast, "close");
  const eS = ema(a.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), slow, "close");
  const out: Point[] = [];
  for (let i = 0; i < eF.length && i < eS.length; i++) out.push({ time: eF[i].time, value: eF[i].value - eS[i].value });
  return out;
}
export function pvt(data: OHLCV[]): Point[] {
  let v = 0;
  return data.map((d, i) => {
    if (i > 0 && data[i - 1].close !== 0) v += ((d.close - data[i - 1].close) / data[i - 1].close) * d.volume;
    return { time: d.time, value: v };
  });
}
export function cvi(data: OHLCV[]): Point[] {
  let v = 0;
  return data.map(d => { v += d.volume; return { time: d.time, value: v }; });
}
export function volumeOscillator(data: OHLCV[], fast = 14, slow = 28): Point[] {
  const f = sma(data, fast, "volume"), s = sma(data, slow, "volume");
  const out: Point[] = [];
  for (let i = 0; i < f.length && i < s.length; i++)
    out.push({ time: f[i].time, value: s[i].value !== 0 ? ((f[i].value - s[i].value) / s[i].value) * 100 : 0 });
  return out;
}
export function volumeMA(data: OHLCV[], p = 20): Point[] {
  return sma(data, p, "volume");
}

// ── MFI + Ultimate Oscillator + RVI + CMO + Choppiness + Coppock + Mass Index ─
export function mfi(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  let posFlow = 0, negFlow = 0;
  for (let i = 1; i <= p; i++) {
    const rawTP = tp(data[i]), rawPrev = tp(data[i - 1]);
    if (rawTP > rawPrev) posFlow += rawTP * data[i].volume;
    else negFlow += rawTP * data[i].volume;
  }
  out.push({ time: data[p].time, value: negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow) });
  for (let i = p + 1; i < data.length; i++) {
    const t = tp(data[i]), pt = tp(data[i - 1]);
    if (t > pt) { posFlow = (posFlow * (p - 1) + t * data[i].volume) / p; negFlow = (negFlow * (p - 1)) / p; }
    else { negFlow = (negFlow * (p - 1) + t * data[i].volume) / p; posFlow = (posFlow * (p - 1)) / p; }
    out.push({ time: data[i].time, value: negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow) });
  }
  return out;
}
export function ultimateOscillator(data: OHLCV[], s = 7, m = 14, l = 28): Point[] {
  const out: Point[] = [];
  for (let i = l; i < data.length; i++) {
    const bpS = sum(data.slice(i - s + 1, i + 1).map(d => d.close - Math.min(d.low, data[data.indexOf(d) - 1]?.close ?? d.low)));
    const trS = sum(data.slice(i - s + 1, i + 1).map((d, idx) => tr(d, data[data.indexOf(d) - 1] || d)));
    const bpM = sum(data.slice(i - m + 1, i + 1).map(d => d.close - Math.min(d.low, data[data.indexOf(d) - 1]?.close ?? d.low)));
    const trM = sum(data.slice(i - m + 1, i + 1).map((d, idx) => tr(d, data[data.indexOf(d) - 1] || d)));
    const bpL = sum(data.slice(i - l + 1, i + 1).map(d => d.close - Math.min(d.low, data[data.indexOf(d) - 1]?.close ?? d.low)));
    const trL = sum(data.slice(i - l + 1, i + 1).map((d, idx) => tr(d, data[data.indexOf(d) - 1] || d)));
    const avgS = trS > 0 ? bpS / trS : 0, avgM = trM > 0 ? bpM / trM : 0, avgL = trL > 0 ? bpL / trL : 0;
    out.push({ time: data[i].time, value: ((4 * avgS + 2 * avgM + avgL) / 7) * 100 });
  }
  return out;
}
export function relativeVigorIndex(data: OHLCV[], p = 10): { rvi: Point[]; signal: Point[] } {
  const raw: Point[] = [];
  for (let i = 0; i < data.length; i++) {
    const num = (data[i].close - data[i].open) + (data[i - 1]?.close - data[i - 1]?.open || 0) + (data[i - 2]?.close - data[i - 2]?.open || 0) + (data[i - 3]?.close - data[i - 3]?.open || 0);
    const den = (data[i].high - data[i].low) + (data[i - 1]?.high - data[i - 1]?.low || 0) + (data[i - 2]?.high - data[i - 2]?.low || 0) + (data[i - 3]?.high - data[i - 3]?.low || 0);
    raw.push({ time: data[i].time, value: den !== 0 ? num / den : 0 });
  }
  const rvi = sma(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), p, "close");
  const sig = sma(rvi.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), 4, "close");
  return { rvi, signal: sig };
}
export function relativeVolatilityIndex(data: OHLCV[], p = 10): Point[] {
  const out: Point[] = [];
  let stdUp = 0, stdDn = 0;
  for (let i = 1; i <= p; i++) {
    const ch = data[i].close - data[i - 1].close;
    if (ch > 0) stdUp += (ch - mean(data.slice(1, p + 1).map((d, j) => d.close - data[j].close))) ** 2;
    else stdDn += (ch - mean(data.slice(1, p + 1).map((d, j) => d.close - data[j].close))) ** 2;
  }
  // Simplified RVI
  return data.slice(p).map((d, i) => {
    const slice = data.slice(i + 1, i + p + 1);
    const ups = slice.filter((v, j) => v.close > data[i + j].close).map(v => v.close);
    const dns = slice.filter((v, j) => v.close < data[i + j].close).map(v => v.close);
    const uStd = ups.length > 1 ? std(ups) : 0, dStd = dns.length > 1 ? std(dns) : 0;
    return { time: d.time, value: uStd + dStd > 0 ? (uStd / (uStd + dStd)) * 100 : 50 };
  });
}
export function cmo(data: OHLCV[], p = 20): Point[] {
  const out: Point[] = [];
  for (let i = p; i < data.length; i++) {
    let sumUp = 0, sumDn = 0;
    for (let j = i - p + 1; j <= i; j++) {
      const ch = data[j].close - data[j - 1].close;
      if (ch > 0) sumUp += ch; else sumDn += -ch;
    }
    out.push({ time: data[i].time, value: sumUp + sumDn > 0 ? ((sumUp - sumDn) / (sumUp + sumDn)) * 100 : 0 });
  }
  return out;
}
export function choppinessIndex(data: OHLCV[], p = 14): Point[] {
  const out: Point[] = [];
  for (let i = p; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const trSum = sum(s.map((d, idx) => idx > 0 ? tr(d, s[idx - 1]) : d.high - d.low));
    const maxHigh = max(s.map(d => d.high)), minLow = min(s.map(d => d.low));
    const range = maxHigh - minLow;
    out.push({ time: data[i].time, value: range > 0 ? 100 * Math.log10(trSum / range) / Math.log10(p) : 0 });
  }
  return out;
}
export function coppockCurve(data: OHLCV[]): Point[] {
  const roc1 = roc(data, 14), roc2 = roc(data, 11);
  const aligned: Point[] = [];
  for (let i = 0; i < roc1.length && i < roc2.length; i++) aligned.push({ time: roc1[i].time, value: roc1[i].value + roc2[i].value });
  return wma(aligned.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), 10, "close");
}
export function massIndex(data: OHLCV[], emaP = 9, sumP = 25): Point[] {
  const out: Point[] = [];
  const e = ema(data.map(d => ({ ...d, close: d.high - d.low })), emaP, "close");
  const e2 = ema(e.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), emaP, "close");
  for (let i = sumP - 1; i < e.length && i < e2.length; i++) {
    let sum = 0;
    for (let j = i - sumP + 1; j <= i; j++) sum += e[j].value / e2[j].value;
    out.push({ time: e[i].time, value: sum });
  }
  return out;
}

// ── Balance of Power + Ease of Movement + Elder Ray + Fisher + SMI Ergodic ──
export function balanceOfPower(data: OHLCV[], p = 14): Point[] {
  const raw = data.map(d => ({ time: d.time, value: d.high !== d.low ? (d.close - d.open) / (d.high - d.low) : 0 }));
  return sma(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), p, "close");
}
export function easeOfMovement(data: OHLCV[], p = 14): Point[] {
  const raw: Point[] = [];
  for (let i = 1; i < data.length; i++) {
    const dist = ((data[i].high + data[i].low) / 2) - ((data[i - 1].high + data[i - 1].low) / 2);
    const box = data[i].volume > 0 ? (data[i].high - data[i].low) / data[i].volume : 0;
    raw.push({ time: data[i].time, value: box !== 0 ? dist / box : 0 });
  }
  return sma(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), p, "close");
}
export function elderRay(data: OHLCV[], p = 13): { bull: Point[]; bear: Point[] } {
  const e = ema(data, p);
  const eMap = new Map(e.map(v => [v.time, v.value]));
  const bull: Point[] = [], bear: Point[] = [];
  for (const d of data) {
    const ev = eMap.get(d.time);
    if (ev != null) {
      bull.push({ time: d.time, value: d.high - ev });
      bear.push({ time: d.time, value: d.low - ev });
    }
  }
  return { bull, bear };
}
export function fisherTransform(data: OHLCV[], p = 10): Point[] {
  const out: Point[] = [];
  let val = 0;
  for (let i = p - 1; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const h = max(s.map(d => d.high)), l = min(s.map(d => d.low));
    const raw = h !== l ? 2 * ((data[i].close - l) / (h - l)) - 1 : 0;
    const smooth = Math.max(-0.999, Math.min(0.999, raw * 0.33 + val * 0.67));
    val = smooth;
    out.push({ time: data[i].time, value: 0.5 * Math.log((1 + smooth) / (1 - smooth)) });
  }
  return out;
}
export function smiErgodic(data: OHLCV[], fast = 4, slow = 8, sig = 5): { smi: Point[]; signal: Point[] } {
  const out: Point[] = [];
  for (let i = slow; i < data.length; i++) {
    const s = data.slice(i - slow + 1, i + 1);
    const hh = max(s.map(d => d.high)), ll = min(s.map(d => d.low));
    const price = data[i].close - (hh + ll) / 2;
    const range = (hh - ll) / 2;
    out.push({ time: data[i].time, value: range > 0 ? (price / range) * 100 : 0 });
  }
  const emaFast = ema(out.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), fast, "close");
  const emaSlow = ema(out.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), slow, "close");
  const smi: Point[] = [];
  for (let i = 0; i < emaFast.length && i < emaSlow.length; i++) smi.push({ time: emaFast[i].time, value: emaFast[i].value - emaSlow[i].value });
  const sigLine = ema(smi.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), sig, "close");
  return { smi, signal: sigLine };
}

// ── DPO + Klinger + Price Oscillator + TSI + Typical Price ──────────────────
export function detrendedPriceOscillator(data: OHLCV[], p = 20): Point[] {
  const offset = Math.floor(p / 2) + 1;
  const m = sma(data, p);
  const out: Point[] = [];
  for (let i = offset; i < m.length; i++) {
    const idx = data.findIndex(d => d.time === m[i].time);
    if (idx >= offset) out.push({ time: data[idx].time, value: data[idx].close - m[i - offset].value });
  }
  return out;
}
export function klingerOscillator(data: OHLCV[], fast = 34, slow = 55, sig = 13): { kvo: Point[]; signal: Point[] } {
  const raw: Point[] = [];
  let trend = 0, prevTrend = 0;
  for (let i = 1; i < data.length; i++) {
    const dm = data[i].high + data[i].low + data[i].close - (data[i - 1].high + data[i - 1].low + data[i - 1].close);
    const cm = dm > 0 && prevTrend >= 0 ? (trend + dm) : dm < 0 && prevTrend < 0 ? (trend + dm) : dm;
    trend = cm;
    prevTrend = dm;
    const vf = data[i].volume * Math.abs(2 * (data[i].close - data[i].low) / (data[i].high - data[i].low) - 1) * Math.sign(cm) * 100;
    raw.push({ time: data[i].time, value: vf });
  }
  const eF = ema(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), fast, "close");
  const eS = ema(raw.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), slow, "close");
  const kvo: Point[] = [];
  for (let i = 0; i < eF.length && i < eS.length; i++) kvo.push({ time: eF[i].time, value: eF[i].value - eS[i].value });
  const sigLine = ema(kvo.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), sig, "close");
  return { kvo, signal: sigLine };
}
export function priceOscillator(data: OHLCV[], fast = 12, slow = 26): Point[] {
  const f = ema(data, fast), s = ema(data, slow);
  const out: Point[] = [];
  for (let i = 0; i < f.length && i < s.length; i++)
    out.push({ time: f[i].time, value: s[i].value !== 0 ? ((f[i].value - s[i].value) / s[i].value) * 100 : 0 });
  return out;
}
export function trueStrengthIndex(data: OHLCV[], r = 25, s = 13): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < data.length; i++) out.push({ time: data[i].time, value: data[i].close - data[i - 1].close });
  const a1 = ema(out.map(v => ({ ...data[0], time: v.time, close: Math.abs(v.value), open: v.value, high: v.value, low: v.value, volume: 0 })), r, "close");
  const a2 = ema(a1.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), s, "close");
  const b1 = ema(out.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), r, "close");
  const b2 = ema(b1.map(v => ({ ...data[0], time: v.time, close: v.value, open: v.value, high: v.value, low: v.value, volume: 0 })), s, "close");
  const result: Point[] = [];
  for (let i = 0; i < b2.length; i++) result.push({ time: b2[i].time, value: a2[i]?.value > 0 ? (b2[i].value / a2[i].value) * 100 : 0 });
  return result;
}
export function trendStrengthIndex(data: OHLCV[], r = 25, s = 13): Point[] {
  return trueStrengthIndex(data, r, s);
}
export function typicalPriceIndicator(data: OHLCV[]): Point[] {
  return data.map(d => ({ time: d.time, value: tp(d) }));
}

// ── ADX/DMI + Aroon ──────────────────────────────────────────────────────────
export function adx(data: OHLCV[], p = 14): { adx: Point[]; plusDI: Point[]; minusDI: Point[] } {
  const outADX: Point[] = [], outPlus: Point[] = [], outMinus: Point[] = [];
  let atrSum = 0, plusSum = 0, minusSum = 0;
  for (let i = 1; i <= p; i++) {
    const plusDM = data[i].high - data[i - 1].high;
    const minusDM = data[i - 1].low - data[i].low;
    atrSum += tr(data[i], data[i - 1]);
    plusSum += plusDM > minusDM && plusDM > 0 ? plusDM : 0;
    minusSum += minusDM > plusDM && minusDM > 0 ? minusDM : 0;
  }
  let atrVal = atrSum / p, plusDI = 100 * (plusSum / p) / atrVal, minusDI = 100 * (minusSum / p) / atrVal;
  let dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
  let adxVal = dx;
  outADX.push({ time: data[p].time, value: adxVal });
  outPlus.push({ time: data[p].time, value: plusDI });
  outMinus.push({ time: data[p].time, value: minusDI });
  for (let i = p + 1; i < data.length; i++) {
    const plusDM = data[i].high - data[i - 1].high;
    const minusDM = data[i - 1].low - data[i].low;
    const t = tr(data[i], data[i - 1]);
    atrVal = (atrVal * (p - 1) + t) / p;
    plusSum = (plusSum * (p - 1) + (plusDM > minusDM && plusDM > 0 ? plusDM : 0)) / p;
    minusSum = (minusSum * (p - 1) + (minusDM > plusDM && minusDM > 0 ? minusDM : 0)) / p;
    plusDI = atrVal > 0 ? 100 * plusSum / atrVal : 0;
    minusDI = atrVal > 0 ? 100 * minusSum / atrVal : 0;
    dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
    adxVal = (adxVal * (p - 1) + dx) / p;
    outADX.push({ time: data[i].time, value: adxVal });
    outPlus.push({ time: data[i].time, value: plusDI });
    outMinus.push({ time: data[i].time, value: minusDI });
  }
  return { adx: outADX, plusDI: outPlus, minusDI: outMinus };
}
export function aroon(data: OHLCV[], p = 14): { up: Point[]; down: Point[]; osc: Point[] } {
  const up: Point[] = [], down: Point[] = [], osc: Point[] = [];
  for (let i = p; i < data.length; i++) {
    const s = data.slice(i - p + 1, i + 1);
    const highs = s.map((d, idx) => ({ v: d.high, idx }));
    const lows = s.map((d, idx) => ({ v: d.low, idx }));
    const highIdx = p - 1 - highs.reduce((a, b) => b.v > a.v ? b : a, highs[0]).idx;
    const lowIdx = p - 1 - lows.reduce((a, b) => b.v < a.v ? b : a, lows[0]).idx;
    const aUp = (highIdx / p) * 100, aDn = (lowIdx / p) * 100;
    up.push({ time: data[i].time, value: aUp });
    down.push({ time: data[i].time, value: aDn });
    osc.push({ time: data[i].time, value: aUp - aDn });
  }
  return { up, down, osc };
}

// ── Parabolic SAR + SuperTrend + Ichimoku + Pivot Points + Zig Zag ──────────
export function parabolicSAR(data: OHLCV[], step = 0.02, maxStep = 0.2): SARPt[] {
  const out: SARPt[] = [];
  let af = step, ep = data[0].high, sar = data[0].low, long = true;
  for (let i = 1; i < data.length; i++) {
    if (long) {
      sar = sar + af * (ep - sar);
      if (data[i].low < sar) { long = false; sar = ep; ep = data[i].low; af = step; }
      else { if (data[i].high > ep) { ep = data[i].high; af = Math.min(af + step, maxStep); } }
    } else {
      sar = sar + af * (ep - sar);
      if (data[i].high > sar) { long = true; sar = ep; ep = data[i].high; af = step; }
      else { if (data[i].low < ep) { ep = data[i].low; af = Math.min(af + step, maxStep); } }
    }
    out.push({ time: data[i].time, value: sar, trend: long ? "up" : "down" });
  }
  return out;
}
export function superTrend(data: OHLCV[], p = 10, mult = 3): SuperTrendPt[] {
  const a = atr(data, p);
  const out: SuperTrendPt[] = [];
  const aMap = new Map(a.map(v => [v.time, v.value]));
  let prevUpper = 0, prevLower = 0, prevDir = "up";
  for (let i = p; i < data.length; i++) {
    const av = aMap.get(data[i].time) ?? 0;
    const med = (data[i].high + data[i].low) / 2;
    const upper = med + mult * av;
    const lower = med - mult * av;
    let dir = prevDir;
    if (prevDir === "up" && data[i].close < prevUpper) dir = "down";
    else if (prevDir === "down" && data[i].close > prevLower) dir = "up";
    const val = dir === "up" ? lower : upper;
    prevUpper = upper; prevLower = lower; prevDir = dir as "up" | "down";
    out.push({ time: data[i].time, value: val, direction: dir as "up" | "down" });
  }
  return out;
}
export function ichimoku(data: OHLCV[], tenkan = 9, kijun = 26, senkouB = 52, disp = 26): IchimokuPt[] {
  return data.map((d, i) => {
    const tS = data.slice(Math.max(0, i - tenkan + 1), i + 1);
    const kS = data.slice(Math.max(0, i - kijun + 1), i + 1);
    const sS = data.slice(Math.max(0, i - senkouB + 1), i + 1);
    const tenkanVal = (max(tS.map(x => x.high)) + min(tS.map(x => x.low))) / 2;
    const kijunVal = (max(kS.map(x => x.high)) + min(kS.map(x => x.low))) / 2;
    const senkouBVal = (max(sS.map(x => x.high)) + min(sS.map(x => x.low))) / 2;
    const ci = i - disp;
    return {
      time: d.time, tenkan: tenkanVal, kijun: kijunVal,
      senkouA: (tenkanVal + kijunVal) / 2, senkouB: senkouBVal,
      chikou: ci >= 0 ? data[ci].close : NaN,
    };
  });
}
export function pivotPoints(data: OHLCV[]): PivotPt[] {
  const out: PivotPt[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const pp = (prev.high + prev.low + prev.close) / 3;
    const r1 = 2 * pp - prev.low, s1 = 2 * pp - prev.high;
    const r2 = pp + (prev.high - prev.low), s2 = pp - (prev.high - prev.low);
    const r3 = prev.high + 2 * (pp - prev.low), s3 = prev.low - 2 * (prev.high - pp);
    out.push({ time: data[i].time, pp, r1, r2, r3, s1, s2, s3 });
  }
  return out;
}
export function zigZag(data: OHLCV[], deviation = 5): Point[] {
  const out: Point[] = [];
  let lastExtreme = data[0].close, lastIdx = 0, trend: "up" | "down" = "up";
  out.push({ time: data[0].time, value: data[0].close });
  for (let i = 1; i < data.length; i++) {
    const change = ((data[i].close - lastExtreme) / lastExtreme) * 100;
    if (trend === "up") {
      if (data[i].close > lastExtreme) { lastExtreme = data[i].close; lastIdx = i; }
      else if (change <= -deviation) { out.push({ time: data[lastIdx].time, value: lastExtreme }); trend = "down"; lastExtreme = data[i].close; lastIdx = i; }
    } else {
      if (data[i].close < lastExtreme) { lastExtreme = data[i].close; lastIdx = i; }
      else if (change >= deviation) { out.push({ time: data[lastIdx].time, value: lastExtreme }); trend = "up"; lastExtreme = data[i].close; lastIdx = i; }
    }
  }
  if (lastIdx < data.length - 1) out.push({ time: data[lastIdx].time, value: lastExtreme });
  return out;
}

// ── Williams Alligator + Williams Fractal ─────────────────────────────────────
export function williamsAlligator(data: OHLCV[]): AlligatorPt[] {
  const jaw = smma(data, 13, "close");
  const teeth = smma(data, 8, "close");
  const lips = smma(data, 5, "close");
  const out: AlligatorPt[] = [];
  for (let i = 0; i < jaw.length; i++) {
    const jIdx = data.findIndex(d => d.time === jaw[i].time);
    out.push({ time: jaw[i].time, jaw: jaw[i].value, teeth: teeth[i]?.value ?? NaN, lips: lips[i]?.value ?? NaN });
  }
  return out;
}
export function williamsFractal(data: OHLCV[], p = 5): FractalPt[] {
  const half = Math.floor(p / 2);
  return data.map((d, i) => {
    if (i < half || i >= data.length - half) return { time: d.time, isHigh: false, isLow: false };
    const pre = data.slice(i - half, i), post = data.slice(i + 1, i + half + 1);
    const isHigh = d.high > max(pre.map(x => x.high)) && d.high > max(post.map(x => x.high));
    const isLow = d.low < min(pre.map(x => x.low)) && d.low < min(post.map(x => x.low));
    return { time: d.time, isHigh, isLow };
  });
}

// ── Correlation Coefficient + Advance/Decline (simplified) ──────────────────
export function correlationCoefficient(dataA: OHLCV[], dataB: OHLCV[], p = 20): Point[] {
  const out: Point[] = [];
  for (let i = p - 1; i < dataA.length && i < dataB.length; i++) {
    const sA = dataA.slice(i - p + 1, i + 1).map(d => d.close);
    const sB = dataB.slice(i - p + 1, i + 1).map(d => d.close);
    const mA = mean(sA), mB = mean(sB);
    let num = 0, denA = 0, denB = 0;
    for (let j = 0; j < p; j++) {
      const da = sA[j] - mA, db = sB[j] - mB;
      num += da * db; denA += da * da; denB += db * db;
    }
    out.push({ time: dataA[i].time, value: denA > 0 && denB > 0 ? num / Math.sqrt(denA * denB) : 0 });
  }
  return out;
}

// ── Heikin Ashi ─────────────────────────────────────────────────────────────
export function heikinAshi(data: OHLCV[]): OHLCV[] {
  let prevHA = data[0];
  return data.map((d, i) => {
    const close = (d.open + d.high + d.low + d.close) / 4;
    const open = i === 0 ? (d.open + d.close) / 2 : (prevHA.open + prevHA.close) / 2;
    const high = Math.max(d.high, open, close);
    const low = Math.min(d.low, open, close);
    prevHA = { time: d.time, open, high, low, close, volume: d.volume };
    return prevHA;
  });
}

// ── Volume Profile (binned by price) ────────────────────────────────────────
export function volumeProfile(data: OHLCV[], bins = 24): VolumeProfileBin[] {
  const prices = data.map(d => (d.high + d.low) / 2);
  const minP = min(prices), maxP = max(prices);
  const step = (maxP - minP) / bins;
  const result: VolumeProfileBin[] = [];
  for (let i = 0; i < bins; i++) {
    const lo = minP + i * step, hi = minP + (i + 1) * step;
    let vol = 0;
    for (let j = 0; j < data.length; j++) {
      const p = (data[j].high + data[j].low) / 2;
      if (p >= lo && p < hi) vol += data[j].volume;
    }
    result.push({ price: (lo + hi) / 2, volume: vol, color: "" });
  }
  // Normalize colors
  const maxVol = max(result.map(r => r.volume));
  return result.map(r => ({
    ...r,
    color: maxVol > 0 ? `rgba(41,98,255,${0.2 + (r.volume / maxVol) * 0.8})` : "rgba(41,98,255,0.2)",
  }));
}

// ── Auto Fibonacci (Retracement from swing high/low) ──────────────────────────
export function autoFibonacci(data: OHLCV[]): { levels: Point[]; high: number; low: number } {
  let swingHigh = data[0].high, swingLow = data[0].low, highIdx = 0, lowIdx = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].high > swingHigh) { swingHigh = data[i].high; highIdx = i; }
    if (data[i].low < swingLow) { swingLow = data[i].low; lowIdx = i; }
  }
  const diff = swingHigh - swingLow;
  const fibs = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const levels: Point[] = [];
  const lastTime = data[data.length - 1].time;
  for (const f of fibs) levels.push({ time: lastTime, value: highIdx > lowIdx ? swingLow + diff * f : swingHigh - diff * f });
  return { levels, high: swingHigh, low: swingLow };
}
