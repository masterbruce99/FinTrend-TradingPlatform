import { useRef, useEffect, useMemo } from "react";
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time, CandlestickData, LineData, HistogramData } from "lightweight-charts";
import * as ind from "@/lib/indicators";
import type { OHLCV, Point, SARPt, SuperTrendPt, AlligatorPt, FractalPt, VolumeProfileBin, PivotPt, IchimokuPt } from "@/lib/indicators";

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPLETE TRADING CHART — 70+ indicators via lightweight-charts v5
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChartBar {
  time: string; open: number; high: number; low: number; close: number; volume: number;
}
export type IndicatorType = "overlay" | "volume" | "pane";
export interface IndicatorDef {
  key: string; label: string; group: string; type: IndicatorType;
}

export const ALL_INDICATORS: IndicatorDef[] = [
  // Moving Averages
  { key: "sma",         label: "SMA",              group: "Moving Averages", type: "overlay" },
  { key: "ema",         label: "EMA",              group: "Moving Averages", type: "overlay" },
  { key: "wma",         label: "WMA",              group: "Moving Averages", type: "overlay" },
  { key: "smma",        label: "SMMA",             group: "Moving Averages", type: "overlay" },
  { key: "dema",        label: "DEMA",             group: "Moving Averages", type: "overlay" },
  { key: "tema",        label: "TEMA",             group: "Moving Averages", type: "overlay" },
  { key: "alma",        label: "ALMA",             group: "Moving Averages", type: "overlay" },
  { key: "hma",         label: "Hull MA",          group: "Moving Averages", type: "overlay" },
  { key: "linreg",      label: "Linear Reg",       group: "Moving Averages", type: "overlay" },
  { key: "vwma",        label: "VWMA",             group: "Moving Averages", type: "overlay" },
  { key: "vwap",        label: "VWAP",             group: "Moving Averages", type: "overlay" },
  { key: "maribbon",    label: "MA Ribbon",        group: "Moving Averages", type: "overlay" },
  // Volatility
  { key: "bollinger",   label: "Bollinger Bands",  group: "Volatility",      type: "overlay" },
  { key: "bbtrend",     label: "BB Trend",         group: "Volatility",      type: "pane" },
  { key: "donchian",    label: "Donchian",         group: "Volatility",      type: "overlay" },
  { key: "keltner",     label: "Keltner Channels", group: "Volatility",      type: "overlay" },
  { key: "envelope",    label: "Envelope",         group: "Volatility",      type: "overlay" },
  { key: "pricechannel",label: "Price Channel",    group: "Volatility",      type: "overlay" },
  { key: "atr",         label: "ATR",              group: "Volatility",      type: "pane" },
  { key: "choppiness",  label: "Choppiness",       group: "Volatility",      type: "pane" },
  { key: "chaikinvol",  label: "Chaikin Volatility",group:"Volatility",     type: "pane" },
  { key: "ckstop",      label: "Chande Kroll Stop",group: "Volatility",      type: "overlay" },
  { key: "massindex",   label: "Mass Index",       group: "Volatility",      type: "pane" },
  { key: "stddev",      label: "Std Deviation",    group: "Volatility",      type: "pane" },
  { key: "stderror",    label: "Std Error",        group: "Volatility",      type: "pane" },
  { key: "volatilityidx",label:"Volatility Index", group: "Volatility",      type: "pane" },
  { key: "historicalvol",label:"Historical Vol",   group: "Volatility",      type: "pane" },
  // Momentum
  { key: "rsi",         label: "RSI",              group: "Momentum",        type: "pane" },
  { key: "stochastic",  label: "Stochastic",       group: "Momentum",        type: "pane" },
  { key: "stochrsi",    label: "Stoch RSI",        group: "Momentum",        type: "pane" },
  { key: "cci",         label: "CCI",              group: "Momentum",        type: "pane" },
  { key: "cmo",         label: "CMO",              group: "Momentum",        type: "pane" },
  { key: "macd",        label: "MACD",             group: "Momentum",        type: "pane" },
  { key: "ao",          label: "Awesome Osc",      group: "Momentum",        type: "pane" },
  { key: "momentum",    label: "Momentum",         group: "Momentum",        type: "pane" },
  { key: "roc",         label: "ROC",              group: "Momentum",        type: "pane" },
  { key: "trix",        label: "TRIX",             group: "Momentum",        type: "pane" },
  { key: "williamsR",   label: "Williams %R",      group: "Momentum",        type: "pane" },
  { key: "mfi",         label: "MFI",              group: "Momentum",        type: "pane" },
  { key: "ultimate",    label: "Ultimate Osc",     group: "Momentum",        type: "pane" },
  { key: "rvi",         label: "RVI",              group: "Momentum",        type: "pane" },
  { key: "relvolidx",   label: "Rel. Vol Index",   group: "Momentum",        type: "pane" },
  { key: "tsi",         label: "True Strength",  group: "Momentum",        type: "pane" },
  { key: "coppock",     label: "Coppock Curve",    group: "Momentum",        type: "pane" },
  { key: "fisher",      label: "Fisher Transform", group: "Momentum",        type: "pane" },
  { key: "smi",         label: "SMI Ergodic",      group: "Momentum",        type: "pane" },
  { key: "dpo",         label: "DPO",              group: "Momentum",        type: "pane" },
  { key: "klinger",     label: "Klinger",          group: "Momentum",        type: "pane" },
  { key: "priceosc",    label: "Price Osc",        group: "Momentum",        type: "pane" },
  { key: "typical",     label: "Typical Price",    group: "Momentum",        type: "overlay" },
  // Volume
  { key: "volume",      label: "Volume",           group: "Volume",          type: "volume" },
  { key: "volumeMA",    label: "Volume MA",        group: "Volume",          type: "volume" },
  { key: "volosc",      label: "Volume Osc",       group: "Volume",          type: "pane" },
  { key: "obv",         label: "OBV",              group: "Volume",          type: "pane" },
  { key: "adl",         label: "ADL",              group: "Volume",          type: "pane" },
  { key: "cmf",         label: "CMF",              group: "Volume",          type: "pane" },
  { key: "chaikinosc",  label: "Chaikin Osc",      group: "Volume",          type: "pane" },
  { key: "pvt",         label: "PVT",              group: "Volume",          type: "pane" },
  { key: "cvi",         label: "CVI",              group: "Volume",          type: "pane" },
  { key: "bop",         label: "Balance of Power", group: "Volume",          type: "pane" },
  { key: "eom",         label: "Ease of Movement", group: "Volume",          type: "pane" },
  { key: "elder",       label: "Elder Ray",        group: "Volume",          type: "pane" },
  { key: "volprofile",  label: "Volume Profile",   group: "Volume",          type: "overlay" },
  // Trend
  { key: "adx",         label: "ADX",              group: "Trend",           type: "pane" },
  { key: "aroon",       label: "Aroon",            group: "Trend",           type: "pane" },
  { key: "parabolicSAR",label: "Parabolic SAR",    group: "Trend",           type: "overlay" },
  { key: "supertrend",  label: "SuperTrend",       group: "Trend",           type: "overlay" },
  { key: "ichimoku",    label: "Ichimoku Cloud",   group: "Trend",           type: "overlay" },
  { key: "alligator",   label: "Alligator",        group: "Trend",           type: "overlay" },
  { key: "fractal",     label: "Fractal",          group: "Trend",           type: "overlay" },
  { key: "zigzag",      label: "Zig Zag",          group: "Trend",           type: "overlay" },
  // Levels
  { key: "pivotPoints", label: "Pivot Points",     group: "Levels",          type: "overlay" },
  { key: "autoFib",     label: "Auto Fib",         group: "Levels",          type: "overlay" },
  { key: "heikinashi",  label: "Heikin Ashi",      group: "Candle Types",    type: "overlay" },
];

export type IndicatorKey = typeof ALL_INDICATORS[number]["key"];
export interface IndicatorToggles { [key: string]: boolean; }

// ── Colors ─────────────────────────────────────────────────────────────────
const BG = "#131722", GRID = "#2A2E39", TXT = "#787B86", ACC = "#2962FF";
const UP = "#26A69A", DN = "#EF5350";
const C = {
  sma: "#FF6D00", ema: "#2196F3", wma: "#9C27B0", smma: "#00BCD4", dema: "#FF5722", tema: "#8BC34A",
  alma: "#E91E63", hma: "#00E5FF", linreg: "#FFC107", vwma: "#CDDC39", vwap: "#E040FB",
  ribbon: ["#FF6D00", "#2196F3", "#9C27B0", "#00BCD4", "#8BC34A"],
  bb: "#FF9800", donchian: "#00E5FF", keltner: "#FF5722", envelope: "#9C27B0", pricech: "#CDDC39",
  sarUp: "#26A69A", sarDn: "#EF5350", superUp: "#26A69A", superDn: "#EF5350",
  ichi: { tenkan: "#2962FF", kijun: "#FF6D00", senkouA: "#26A69A", senkouB: "#EF5350", chikou: "#9C27B0" },
  pivot: { pp: "#787B86", r: "#EF5350", s: "#26A69A" },
  alligator: { jaw: "#2196F3", teeth: "#FF9800", lips: "#4CAF50" },
  fractal: "#FFEB3B", zigzag: "#FF9800", autofib: "#9C27B0",
  rsi: "#2196F3", stoch: "#FF9800", macd: "#2196F3", macdSig: "#FF9800", ao: "#26A69A",
  mom: "#2196F3", roc: "#FF9800", trix: "#9C27B0", cmo: "#00BCD4",
  cci: "#2196F3", williams: "#FF9800", mfi: "#9C27B0", ultimate: "#00BCD4",
  rvi: "#FF5722", relvol: "#8BC34A", tsi: "#E91E63", coppock: "#FF6D00",
  fisher: "#2196F3", smi: "#FF9800", dpo: "#9C27B0", klinger: "#00BCD4",
  priceosc: "#FF5722", typical: "#FFC107", bbtrend: "#9C27B0",
  atr: "#2196F3", choppiness: "#FF9800", chaikinvol: "#8BC34A", ckstop: "#FF5722",
  mass: "#E91E63", stddev: "#00BCD4", stderr: "#FF6D00", histvol: "#9C27B0", volidx: "#FF5722",
  obv: "#2196F3", adl: "#FF9800", cmf: "#8BC34A", chaikinosc: "#FF5722", pvt: "#9C27B0",
  cvi: "#00BCD4", bop: "#FF9800", eom: "#4CAF50", elderBull: "#26A69A", elderBear: "#EF5350",
  volosc: "#2196F3", volma: "#FF9800",
  adx: "#2196F3", plusDI: "#26A69A", minusDI: "#EF5350",
  aroonUp: "#26A69A", aroonDn: "#EF5350",
  volprofile: "#2962FF",
};

// ── Chart Options ────────────────────────────────────────────────────────────────────
const MAIN_OPTS = {
  layout: { background: { type: ColorType.Solid, color: BG }, textColor: TXT },
  grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
  crosshair: { mode: 1, vertLine: { color: ACC, labelBackgroundColor: ACC }, horzLine: { color: ACC, labelBackgroundColor: ACC } },
  rightPriceScale: { borderColor: GRID, scaleMargins: { top: 0.1, bottom: 0.1 } },
  leftPriceScale: { visible: false },
  timeScale: { borderColor: GRID, timeVisible: true, secondsVisible: false },
  handleScroll: { vertTouchDrag: false },
};
const PANE_OPTS = {
  layout: { background: { type: ColorType.Solid, color: BG }, textColor: TXT },
  grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
  rightPriceScale: { borderColor: GRID, scaleMargins: { top: 0.1, bottom: 0.1 } },
  timeScale: { visible: false },
  handleScroll: { vertTouchDrag: false },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function toOHLCV(bars: ChartBar[]): OHLCV[] {
  return bars.map(b => ({
    time: Math.floor(new Date(b.time).getTime() / 1000),
    open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume,
  }));
}
function toCandleData(bars: ChartBar[]): CandlestickData[] {
  return bars.map(b => ({
    time: Math.floor(new Date(b.time).getTime() / 1000) as Time,
    open: b.open, high: b.high, low: b.low, close: b.close,
  }));
}
function toLineData(points: Point[]): LineData[] {
  return points.map(p => ({ time: p.time as Time, value: p.value }));
}
function timeRange(points: Point[]): { first: number; last: number } {
  return { first: points[0]?.time ?? 0, last: points[points.length - 1]?.time ?? 0 };
}

// ── Main Component ───────────────────────────────────────────────────────────
interface SeriesMeta { chart: IChartApi; series: ISeriesApi<any>; key: string; }

export default function TradingChart({ bars, active, height = 420, compareBars }: { bars: ChartBar[]; active: IndicatorToggles; height?: number; compareBars?: ChartBar[] }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const volRef  = useRef<HTMLDivElement>(null);
  const rsiRef  = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const stochRef= useRef<HTMLDivElement>(null);
  const cciRef  = useRef<HTMLDivElement>(null);
  const momRef  = useRef<HTMLDivElement>(null);
  const volpaneRef = useRef<HTMLDivElement>(null);
  const adxRef  = useRef<HTMLDivElement>(null);
  const trendRef= useRef<HTMLDivElement>(null);

  const mainChart = useRef<IChartApi | null>(null);
  const volChart  = useRef<IChartApi | null>(null);
  const rsiChart  = useRef<IChartApi | null>(null);
  const macdChart = useRef<IChartApi | null>(null);
  const stochChart= useRef<IChartApi | null>(null);
  const cciChart  = useRef<IChartApi | null>(null);
  const momChart  = useRef<IChartApi | null>(null);
  const volpaneChart = useRef<IChartApi | null>(null);
  const adxChart  = useRef<IChartApi | null>(null);
  const trendChart= useRef<IChartApi | null>(null);

  const tracked = useRef<Map<string, SeriesMeta>>(new Map());
  const ohlcv = useMemo(() => toOHLCV(bars), [bars]);

  // ── Create charts ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainRef.current) return;
    const tMap = tracked.current;
    const mc = createChart(mainRef.current, { ...MAIN_OPTS, height });
    mainChart.current = mc;
    const candle = mc.addSeries(CandlestickSeries, { upColor: UP, downColor: DN, borderVisible: false, wickUpColor: UP, wickDownColor: DN });
    tMap.set("candle", { chart: mc, series: candle, key: "candle" });

    const makePane = (ref: React.RefObject<HTMLDivElement | null>, chartRef: React.MutableRefObject<IChartApi | null>, h = 110) => {
      if (!ref.current) return null;
      const c = createChart(ref.current, { ...PANE_OPTS, height: h });
      chartRef.current = c;
      return c;
    };
    const vc = makePane(volRef, volChart, 90);
    const rc = makePane(rsiRef, rsiChart, 110);
    const mac = makePane(macdRef, macdChart, 110);
    const sc = makePane(stochRef, stochChart, 110);
    const cc = makePane(cciRef, cciChart, 110);
    const moc = makePane(momRef, momChart, 110);
    const vpc = makePane(volpaneRef, volpaneChart, 110);
    const ac = makePane(adxRef, adxChart, 110);
    const tc = makePane(trendRef, trendChart, 110);

    const sync = (source: IChartApi, targets: (IChartApi | null)[]) => {
      source.timeScale().subscribeSizeChange(() => {
        const r = source.timeScale().getVisibleLogicalRange();
        if (!r) return;
        targets.forEach(t => t?.timeScale().setVisibleLogicalRange(r));
      });
    };
    sync(mc, [vc, rc, mac, sc, cc, moc, vpc, ac, tc]);

    const ro = new ResizeObserver(() => {
      mc.resize(mainRef.current!.clientWidth, height);
      [vc, rc, mac, sc, cc, moc, vpc, ac, tc].forEach((c, i) => {
        const refs = [volRef, rsiRef, macdRef, stochRef, cciRef, momRef, volpaneRef, adxRef, trendRef];
        if (c && refs[i].current) c.resize(refs[i].current!.clientWidth, 110);
      });
    });
    ro.observe(mainRef.current);
    [volRef, rsiRef, macdRef, stochRef, cciRef, momRef, volpaneRef, adxRef, trendRef].forEach(r => { if (r.current) ro.observe(r.current); });

    return () => {
      ro.disconnect();
      mc.remove();
      [vc, rc, mac, sc, cc, moc, vpc, ac, tc].forEach(c => c?.remove());
      mainChart.current = null;
      [volChart, rsiChart, macdChart, stochChart, cciChart, momChart, volpaneChart, adxChart, trendChart].forEach(r => r.current = null);
      tMap.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // ── Update data ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainChart.current || bars.length === 0) return;
    const mc = mainChart.current;
    const tMap = tracked.current;

    const removePrefix = (prefix: string) => {
      for (const [k, v] of tMap.entries()) {
        if (k.startsWith(prefix)) {
          try { v.chart.removeSeries(v.series); } catch {}
          tMap.delete(k);
        }
      }
    };
    const addLine = (key: string, chart: IChartApi, pts: Point[], color: string, w = 2 as 1 | 2 | 3 | 4, style?: 0 | 1 | 2 | 3 | 4) => {
      const s = chart.addSeries(LineSeries, { color, lineWidth: w, lineStyle: style ?? 0 as 0 | 1 | 2 | 3 | 4, lastValueVisible: false, title: key });
      s.setData(toLineData(pts));
      tMap.set(key, { chart, series: s, key });
    };
    const addHist = (key: string, chart: IChartApi, data: HistogramData[]) => {
      const s = chart.addSeries(HistogramSeries, { lastValueVisible: false });
      s.setData(data);
      tMap.set(key, { chart, series: s, key });
    };

    // Main candles
    const candleMeta = tMap.get("candle");
    if (candleMeta) {
      (candleMeta.series as ISeriesApi<"Candlestick">).setData(toCandleData(bars));
      mc.timeScale().fitContent();
    }

    // ── Compare overlay ───────────────────────────────────────────────────
    if (compareBars && compareBars.length > 0) {
      const compOHLCV = toOHLCV(compareBars);
      // normalize compare close line to same scale by using % change from first bar
      const base = bars[0]?.close ?? compOHLCV[0]?.close ?? 1;
      const firstComp = compOHLCV[0]?.close ?? base;
      const ratio = base / (firstComp || base);
      const compPts: Point[] = compOHLCV.map((d) => ({ time: d.time as unknown as number, value: d.close * ratio }));
      const s = mc.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 2, lineStyle: 3, lastValueVisible: true, title: "Compare" });
      s.setData(toLineData(compPts));
      // remove any previous compare
      const prev = tMap.get("ov_compare");
      if (prev) try { prev.chart.removeSeries(prev.series); } catch {}
      tMap.set("ov_compare", { chart: mc, series: s, key: "ov_compare" });
    } else {
      const prev = tMap.get("ov_compare");
      if (prev) { try { prev.chart.removeSeries(prev.series); } catch {} tMap.delete("ov_compare"); }
    }

    // ── Overlays ────────────────────────────────────────────────────────
    removePrefix("ov_");
    if (active.sma) addLine("ov_sma", mc, ind.sma(ohlcv, 20), C.sma);
    if (active.ema) addLine("ov_ema", mc, ind.ema(ohlcv, 20), C.ema);
    if (active.wma) addLine("ov_wma", mc, ind.wma(ohlcv, 20), C.wma);
    if (active.smma) addLine("ov_smma", mc, ind.smma(ohlcv, 20), C.smma);
    if (active.dema) addLine("ov_dema", mc, ind.dema(ohlcv, 20), C.dema);
    if (active.tema) addLine("ov_tema", mc, ind.tema(ohlcv, 20), C.tema);
    if (active.alma) addLine("ov_alma", mc, ind.alma(ohlcv, 20), C.alma);
    if (active.hma) addLine("ov_hma", mc, ind.hullMA(ohlcv, 20), C.hma);
    if (active.linreg) addLine("ov_linreg", mc, ind.linearRegression(ohlcv, 20), C.linreg);
    if (active.vwma) addLine("ov_vwma", mc, ind.vwma(ohlcv, 20), C.vwma);
    if (active.vwap) addLine("ov_vwap", mc, ind.vwap(ohlcv), C.vwap);
    if (active.typical) addLine("ov_typical", mc, ind.typicalPriceIndicator(ohlcv), C.typical);

    if (active.maribbon) {
      const ribbon = ind.maRibbon(ohlcv);
      addLine("ov_rib1", mc, ribbon.ema8, C.ribbon[0], 1);
      addLine("ov_rib2", mc, ribbon.ema13, C.ribbon[1], 1);
      addLine("ov_rib3", mc, ribbon.ema21, C.ribbon[2], 1);
      addLine("ov_rib4", mc, ribbon.ema55, C.ribbon[3], 1);
      addLine("ov_rib5", mc, ribbon.ema89, C.ribbon[4], 1);
    }

    if (active.bollinger) {
      const bb = ind.bollinger(ohlcv, 20, 2);
      addLine("ov_bb_u", mc, bb.map(b => ({ time: b.time, value: b.upper })), C.bb, 1, 2);
      addLine("ov_bb_m", mc, bb.map(b => ({ time: b.time, value: b.middle })), C.bb, 1, 3);
      addLine("ov_bb_l", mc, bb.map(b => ({ time: b.time, value: b.lower })), C.bb, 1, 2);
    }
    if (active.donchian) {
      const dn = ind.donchian(ohlcv, 20);
      addLine("ov_dn_u", mc, dn.map(b => ({ time: b.time, value: b.upper })), C.donchian, 1, 2);
      addLine("ov_dn_m", mc, dn.map(b => ({ time: b.time, value: b.middle })), C.donchian, 1, 3);
      addLine("ov_dn_l", mc, dn.map(b => ({ time: b.time, value: b.lower })), C.donchian, 1, 2);
    }
    if (active.keltner) {
      const kc = ind.keltner(ohlcv, 20, 10, 2);
      addLine("ov_kc_u", mc, kc.map(b => ({ time: b.time, value: b.upper })), C.keltner, 1, 2);
      addLine("ov_kc_m", mc, kc.map(b => ({ time: b.time, value: b.middle })), C.keltner, 1);
      addLine("ov_kc_l", mc, kc.map(b => ({ time: b.time, value: b.lower })), C.keltner, 1, 2);
    }
    if (active.envelope) {
      const env = ind.envelope(ohlcv, 20, 0.05);
      addLine("ov_env_u", mc, env.upper, C.envelope, 1, 2);
      addLine("ov_env_l", mc, env.lower, C.envelope, 1, 2);
    }
    if (active.pricechannel) {
      const pc = ind.priceChannel(ohlcv, 20);
      addLine("ov_pc_u", mc, pc.map(b => ({ time: b.time, value: b.upper })), C.pricech, 1, 2);
      addLine("ov_pc_m", mc, pc.map(b => ({ time: b.time, value: b.middle })), C.pricech, 1, 3);
      addLine("ov_pc_l", mc, pc.map(b => ({ time: b.time, value: b.lower })), C.pricech, 1, 2);
    }
    if (active.parabolicSAR) {
      const pts = ind.parabolicSAR(ohlcv);
      const s = mc.addSeries(LineSeries, { color: C.sarUp, lineWidth: 1, lastValueVisible: false, pointMarkersVisible: true, pointMarkersRadius: 2 });
      s.setData(toLineData(pts.map(p => ({ time: p.time, value: p.value }))));
      tMap.set("ov_sar", { chart: mc, series: s, key: "ov_sar" });
    }
    if (active.supertrend) {
      const st = ind.superTrend(ohlcv);
      const upPts = st.filter(p => p.direction === "up").map(p => ({ time: p.time, value: p.value }));
      const dnPts = st.filter(p => p.direction === "down").map(p => ({ time: p.time, value: p.value }));
      addLine("ov_st_up", mc, upPts, C.superUp, 2);
      addLine("ov_st_dn", mc, dnPts, C.superDn, 2);
    }
    if (active.ichimoku) {
      const ic = ind.ichimoku(ohlcv);
      addLine("ov_ichi_tenkan", mc, ic.map(p => ({ time: p.time, value: p.tenkan })).filter(p => !isNaN(p.value)), C.ichi.tenkan, 1);
      addLine("ov_ichi_kijun", mc, ic.map(p => ({ time: p.time, value: p.kijun })).filter(p => !isNaN(p.value)), C.ichi.kijun, 1);
      addLine("ov_ichi_senkouA", mc, ic.map(p => ({ time: p.time, value: p.senkouA })).filter(p => !isNaN(p.value)), C.ichi.senkouA, 1, 2);
      addLine("ov_ichi_senkouB", mc, ic.map(p => ({ time: p.time, value: p.senkouB })).filter(p => !isNaN(p.value)), C.ichi.senkouB, 1, 2);
    }
    if (active.alligator) {
      const al = ind.williamsAlligator(ohlcv);
      addLine("ov_all_jaw", mc, al.map(p => ({ time: p.time, value: p.jaw })), C.alligator.jaw, 1);
      addLine("ov_all_teeth", mc, al.map(p => ({ time: p.time, value: p.teeth })), C.alligator.teeth, 1);
      addLine("ov_all_lips", mc, al.map(p => ({ time: p.time, value: p.lips })), C.alligator.lips, 1);
    }
    if (active.zigzag) {
      const zz = ind.zigZag(ohlcv, 5);
      addLine("ov_zz", mc, zz, C.zigzag, 2);
    }
    if (active.pivotPoints) {
      const pp = ind.pivotPoints(ohlcv);
      addLine("ov_pp_pp", mc, pp.map(p => ({ time: p.time, value: p.pp })), C.pivot.pp, 1, 3);
      addLine("ov_pp_r1", mc, pp.map(p => ({ time: p.time, value: p.r1 })), C.pivot.r, 1, 2);
      addLine("ov_pp_s1", mc, pp.map(p => ({ time: p.time, value: p.s1 })), C.pivot.s, 1, 2);
    }
    if (active.autoFib) {
      const fib = ind.autoFibonacci(ohlcv);
      for (const lvl of fib.levels) {
        const s = mc.addSeries(LineSeries, { color: C.autofib, lineWidth: 1, lineStyle: 2, lastValueVisible: false, title: "AutoFib" });
        s.setData([{ time: lvl.time as Time, value: lvl.value }]);
        tMap.set(`ov_fib_${lvl.value}`, { chart: mc, series: s, key: `ov_fib_${lvl.value}` });
      }
    }
    if (active.heikinashi) {
      const ha = ind.heikinAshi(ohlcv);
      const s = mc.addSeries(CandlestickSeries, { upColor: "#4CAF50", downColor: "#F44336", borderVisible: false, wickUpColor: "#4CAF50", wickDownColor: "#F44336", lastValueVisible: false });
      s.setData(ha.map(d => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close })));
      tMap.set("ov_ha", { chart: mc, series: s, key: "ov_ha" });
    }

    // ── Volume pane ─────────────────────────────────────────────────────
    if (volChart.current && (active.volume || active.volumeMA)) {
      removePrefix("vol_");
      const vc = volChart.current;
      if (active.volume) {
        const s = vc.addSeries(HistogramSeries, { priceScaleId: "left" });
        s.setData(bars.map(b => ({ time: Math.floor(new Date(b.time).getTime() / 1000) as Time, value: b.volume, color: b.close >= b.open ? UP : DN })));
        tMap.set("vol_hist", { chart: vc, series: s, key: "vol_hist" });
      }
      if (active.volumeMA) {
        addLine("vol_ma", vc, ind.volumeMA(ohlcv, 20), C.volma, 1);
      }
    } else if (volChart.current) { removePrefix("vol_"); }

    // ── Volume Osc / OBV / ADL / CMF etc pane ────────────────────────
    if (volpaneChart.current && (active.obv || active.adl || active.cmf || active.chaikinosc || active.pvt || active.cvi || active.bop || active.eom || active.elder || active.volosc)) {
      removePrefix("volpane_");
      const vpc = volpaneChart.current;
      if (active.obv) addLine("volpane_obv", vpc, ind.obv(ohlcv), C.obv, 2);
      if (active.adl) addLine("volpane_adl", vpc, ind.adl(ohlcv), C.adl, 2);
      if (active.cmf) addLine("volpane_cmf", vpc, ind.chaikinMoneyFlow(ohlcv, 20), C.cmf, 2);
      if (active.chaikinosc) addLine("volpane_chaikinosc", vpc, ind.chaikinOscillator(ohlcv), C.chaikinosc, 2);
      if (active.pvt) addLine("volpane_pvt", vpc, ind.pvt(ohlcv), C.pvt, 2);
      if (active.cvi) addLine("volpane_cvi", vpc, ind.cvi(ohlcv), C.cvi, 2);
      if (active.bop) addLine("volpane_bop", vpc, ind.balanceOfPower(ohlcv, 14), C.bop, 2);
      if (active.eom) addLine("volpane_eom", vpc, ind.easeOfMovement(ohlcv, 14), C.eom, 2);
      if (active.elder) {
        const { bull, bear } = ind.elderRay(ohlcv, 13);
        addLine("volpane_elder_bull", vpc, bull, C.elderBull, 2);
        addLine("volpane_elder_bear", vpc, bear, C.elderBear, 2);
      }
      if (active.volosc) addLine("volpane_volosc", vpc, ind.volumeOscillator(ohlcv, 14, 28), C.volosc, 2);
    } else if (volpaneChart.current) { removePrefix("volpane_"); }

    // ── RSI pane ─────────────────────────────────────────────────────
    if (rsiChart.current && (active.rsi || active.stochrsi || active.cmo)) {
      removePrefix("rsi_");
      const rc = rsiChart.current;
      if (active.rsi) {
        const pts = ind.rsi(ohlcv, 14);
        addLine("rsi_line", rc, pts, C.rsi, 2);
        const { first, last } = timeRange(pts);
        [30, 50, 70].forEach(lvl => {
          const s = rc.addSeries(LineSeries, { color: lvl === 50 ? "#555" : ACC, lineWidth: 1, lineStyle: 2, lastValueVisible: false });
          s.setData([{ time: first as Time, value: lvl }, { time: last as Time, value: lvl }]);
          tMap.set(`rsi_lvl_${lvl}`, { chart: rc, series: s, key: `rsi_lvl_${lvl}` });
        });
      }
      if (active.stochrsi) {
        const pts = ind.stochasticRSI(ohlcv);
        addLine("rsi_stoch_k", rc, pts.map(p => ({ time: p.time, value: p.k })), C.stoch, 2);
        addLine("rsi_stoch_d", rc, pts.map(p => ({ time: p.time, value: p.d })), C.stoch, 2, 2);
      }
      if (active.cmo) addLine("rsi_cmo", rc, ind.cmo(ohlcv, 20), C.cmo, 2);
    } else if (rsiChart.current) { removePrefix("rsi_"); }

    // ── MACD pane ───────────────────────────────────────────────────────
    if (macdChart.current && (active.macd || active.ao || active.trix)) {
      removePrefix("macd_");
      const mac = macdChart.current;
      if (active.macd) {
        const md = ind.macd(ohlcv, 12, 26, 9);
        const hist = mac.addSeries(HistogramSeries, { priceScaleId: "left", lastValueVisible: false });
        hist.setData(md.map(d => ({ time: d.time as Time, value: d.histogram, color: d.histogram >= 0 ? UP : DN })));
        tMap.set("macd_hist", { chart: mac, series: hist, key: "macd_hist" });
        addLine("macd_line", mac, md.map(d => ({ time: d.time, value: d.macd })), C.macd, 2);
        addLine("macd_sig", mac, md.map(d => ({ time: d.time, value: d.signal })), C.macdSig, 2, 2);
      }
      if (active.ao) addLine("macd_ao", mac, ind.awesomeOscillator(ohlcv), C.ao, 2);
      if (active.trix) addLine("macd_trix", mac, ind.trix(ohlcv, 15), C.trix, 2);
    } else if (macdChart.current) { removePrefix("macd_"); }

    // ── Stochastic pane ───────────────────────────────────────────────────────
    if (stochChart.current && (active.stochastic || active.williamsR || active.fisher)) {
      removePrefix("stoch_");
      const sc = stochChart.current;
      if (active.stochastic) {
        const sd = ind.stochastic(ohlcv, 14, 3);
        addLine("stoch_k", sc, sd.map(d => ({ time: d.time, value: d.k })), C.stoch, 2);
        addLine("stoch_d", sc, sd.map(d => ({ time: d.time, value: d.d })), C.stoch, 2, 2);
        const { first, last } = timeRange(sd.map(d => ({ time: d.time, value: d.k })));
        [20, 80].forEach(lvl => {
          const s = sc.addSeries(LineSeries, { color: ACC, lineWidth: 1, lineStyle: 2, lastValueVisible: false });
          s.setData([{ time: first as Time, value: lvl }, { time: last as Time, value: lvl }]);
          tMap.set(`stoch_lvl_${lvl}`, { chart: sc, series: s, key: `stoch_lvl_${lvl}` });
        });
      }
      if (active.williamsR) addLine("stoch_wpr", sc, ind.williamsR(ohlcv, 14), C.williams, 2);
      if (active.fisher) addLine("stoch_fisher", sc, ind.fisherTransform(ohlcv, 10), C.fisher, 2);
    } else if (stochChart.current) { removePrefix("stoch_"); }

    // ── CCI pane ────────────────────────────────────────────────────────────────────
    if (cciChart.current && (active.cci || active.atr || active.chaikinvol || active.stddev || active.stderr || active.volatilityidx || active.historicalvol || active.massindex || active.bbtrend)) {
      removePrefix("cci_");
      const cc = cciChart.current;
      if (active.cci) {
        const pts = ind.cci(ohlcv, 20);
        addLine("cci_line", cc, pts, C.cci, 2);
        const { first, last } = timeRange(pts);
        [-100, 0, 100].forEach(lvl => {
          const s = cc.addSeries(LineSeries, { color: lvl === 0 ? "#555" : ACC, lineWidth: 1, lineStyle: 2, lastValueVisible: false });
          s.setData([{ time: first as Time, value: lvl }, { time: last as Time, value: lvl }]);
          tMap.set(`cci_lvl_${lvl}`, { chart: cc, series: s, key: `cci_lvl_${lvl}` });
        });
      }
      if (active.atr) addLine("cci_atr", cc, ind.atr(ohlcv, 14), C.atr, 2);
      if (active.chaikinvol) addLine("cci_chaikinvol", cc, ind.chaikinVolatility(ohlcv), C.chaikinvol, 2);
      if (active.stddev) addLine("cci_stddev", cc, ind.stdDeviation(ohlcv, 20), C.stddev, 2);
      if (active.stderr) addLine("cci_stderr", cc, ind.stdError(ohlcv, 20), C.stderr, 2);
      if (active.volatilityidx) addLine("cci_volidx", cc, ind.volatilityIndex(ohlcv, 14), C.volidx, 2);
      if (active.historicalvol) addLine("cci_histvol", cc, ind.historicalVolatility(ohlcv, 20), C.histvol, 2);
      if (active.massindex) addLine("cci_mass", cc, ind.massIndex(ohlcv), C.mass, 2);
      if (active.bbtrend) addLine("cci_bbtrend", cc, ind.bbTrend(ohlcv, 20), C.bbtrend, 2);
    } else if (cciChart.current) { removePrefix("cci_"); }

    // ── Momentum / ROC pane ──────────────────────────────────────────────────────────
    if (momChart.current && (active.momentum || active.roc || active.mfi || active.ultimate || active.rvi || active.relvolidx || active.coppock || active.smi || active.dpo || active.priceosc || active.klinger || active.tsi)) {
      removePrefix("mom_");
      const moc = momChart.current;
      if (active.momentum) addLine("mom_mom", moc, ind.momentum(ohlcv, 10), C.mom, 2);
      if (active.roc) addLine("mom_roc", moc, ind.roc(ohlcv, 12), C.roc, 2);
      if (active.mfi) addLine("mom_mfi", moc, ind.mfi(ohlcv, 14), C.mfi, 2);
      if (active.ultimate) addLine("mom_ultimate", moc, ind.ultimateOscillator(ohlcv), C.ultimate, 2);
      if (active.rvi) {
        const { rvi, signal } = ind.relativeVigorIndex(ohlcv, 10);
        addLine("mom_rvi", moc, rvi, C.rvi, 2);
        addLine("mom_rvi_sig", moc, signal, C.rvi, 2, 2);
      }
      if (active.relvolidx) addLine("mom_relvol", moc, ind.relativeVolatilityIndex(ohlcv, 10), C.relvol, 2);
      if (active.coppock) addLine("mom_coppock", moc, ind.coppockCurve(ohlcv), C.coppock, 2);
      if (active.smi) {
        const { smi, signal } = ind.smiErgodic(ohlcv);
        addLine("mom_smi", moc, smi, C.smi, 2);
        addLine("mom_smi_sig", moc, signal, C.smi, 2, 2);
      }
      if (active.dpo) addLine("mom_dpo", moc, ind.detrendedPriceOscillator(ohlcv, 20), C.dpo, 2);
      if (active.priceosc) addLine("mom_priceosc", moc, ind.priceOscillator(ohlcv), C.priceosc, 2);
      if (active.klinger) {
        const { kvo, signal } = ind.klingerOscillator(ohlcv);
        addLine("mom_kvo", moc, kvo, C.klinger, 2);
        addLine("mom_kvo_sig", moc, signal, C.klinger, 2, 2);
      }
      if (active.tsi) addLine("mom_tsi", moc, ind.trueStrengthIndex(ohlcv), C.tsi, 2);
    } else if (momChart.current) { removePrefix("mom_"); }

    // ── ADX / Aroon pane ──────────────────────────────────────────────────────────
    if (adxChart.current && (active.adx || active.aroon || active.choppiness)) {
      removePrefix("adx_");
      const ac = adxChart.current;
      if (active.adx) {
        const { adx, plusDI, minusDI } = ind.adx(ohlcv, 14);
        addLine("adx_adx", ac, adx, C.adx, 2);
        addLine("adx_plus", ac, plusDI, C.plusDI, 2);
        addLine("adx_minus", ac, minusDI, C.minusDI, 2);
      }
      if (active.aroon) {
        const { up, down } = ind.aroon(ohlcv, 14);
        addLine("adx_aroon_up", ac, up, C.aroonUp, 2);
        addLine("adx_aroon_dn", ac, down, C.aroonDn, 2);
      }
      if (active.choppiness) addLine("adx_chop", ac, ind.choppinessIndex(ohlcv, 14), C.choppiness, 2);
    } else if (adxChart.current) { removePrefix("adx_"); }

    // ── CK Stop trend pane ───────────────────────────────────────────────────────
    if (trendChart.current && active.ckstop) {
      removePrefix("trend_");
      const tc = trendChart.current;
      const { upper, lower } = ind.chandeKrollStop(ohlcv);
      addLine("trend_ck_u", tc, upper, C.ckstop, 2);
      addLine("trend_ck_l", tc, lower, C.ckstop, 2, 2);
    } else if (trendChart.current) { removePrefix("trend_"); }

  }, [bars, ohlcv, active]);

  const showVol = active.volume || active.volumeMA;
  const showVolPane = active.obv || active.adl || active.cmf || active.chaikinosc || active.pvt || active.cvi || active.bop || active.eom || active.elder || active.volosc;
  const showRSI = active.rsi || active.stochrsi || active.cmo;
  const showMACD = active.macd || active.ao || active.trix;
  const showStoch = active.stochastic || active.williamsR || active.fisher;
  const showCCI = active.cci || active.atr || active.chaikinvol || active.stddev || active.stderr || active.volatilityidx || active.historicalvol || active.massindex || active.bbtrend;
  const showMom = active.momentum || active.roc || active.mfi || active.ultimate || active.rvi || active.relvolidx || active.coppock || active.smi || active.dpo || active.priceosc || active.klinger || active.tsi;
  const showADX = active.adx || active.aroon || active.choppiness;
  const showTrend = active.ckstop;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: BG }}>
      <div style={{ display: "flex" }}>
        <div ref={mainRef} style={{ flex: 1, height, minHeight: 300 }} />
        {active.volprofile && bars.length > 0 && (
          <VolumeProfilePanel bars={bars} height={height} />
        )}
      </div>
      {showVol && <div ref={volRef} style={{ width: "100%", height: 90 }} />}
      {showVolPane && <div ref={volpaneRef} style={{ width: "100%", height: 110 }} />}
      {showRSI && <div ref={rsiRef} style={{ width: "100%", height: 110 }} />}
      {showMACD && <div ref={macdRef} style={{ width: "100%", height: 110 }} />}
      {showStoch && <div ref={stochRef} style={{ width: "100%", height: 110 }} />}
      {showCCI && <div ref={cciRef} style={{ width: "100%", height: 110 }} />}
      {showMom && <div ref={momRef} style={{ width: "100%", height: 110 }} />}
      {showADX && <div ref={adxRef} style={{ width: "100%", height: 110 }} />}
      {showTrend && <div ref={trendRef} style={{ width: "100%", height: 110 }} />}
    </div>
  );
}

// ── Volume Profile Panel ─────────────────────────────────────────────────────────────────────────────────────
function VolumeProfilePanel({ bars, height }: { bars: ChartBar[]; height: number }) {
  const profile = useMemo(() => {
    const ohlcv = toOHLCV(bars);
    return ind.volumeProfile(ohlcv, 24);
  }, [bars]);

  const maxVol = useMemo(() => Math.max(...profile.map(p => p.volume), 1), [profile]);

  return (
    <div style={{ width: 80, height, background: BG, borderLeft: `1px solid ${GRID}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 0" }}>
      {profile.map((bin, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", height: `${100 / profile.length}%` }}>
          <div style={{ height: "60%", background: bin.color, borderRadius: 1, width: `${(bin.volume / maxVol) * 100}%`, transition: "width 0.3s" }} />
        </div>
      ))}
    </div>
  );
}

// ── Indicators Panel UI ────────────────────────────────────────────────────────────────────
export function IndicatorsPanel({ active, onToggle }: { active: IndicatorToggles; onToggle: (key: IndicatorKey) => void }) {
  const groups: Record<string, typeof ALL_INDICATORS> = {};
  for (const item of ALL_INDICATORS) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#D9D9D9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, padding: "0 12px" }}>
        Technical Indicators ({Object.values(active).filter(Boolean).length})
      </div>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: TXT, textTransform: "uppercase", letterSpacing: "0.06em", padding: "3px 12px", fontWeight: 600 }}>{group}</div>
          {items.map(item => (
            <label key={item.key} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "4px 12px",
              cursor: "pointer", fontSize: 12, color: active[item.key] ? "#D9D9D9" : TXT,
              background: active[item.key] ? "#1e2230" : "transparent",
              transition: "background 0.1s",
            }} onMouseEnter={e => (e.currentTarget.style.background = "#1e2230")} onMouseLeave={e => (e.currentTarget.style.background = active[item.key] ? "#1e2230" : "transparent")}>
              <input type="checkbox" checked={!!active[item.key]} onChange={() => onToggle(item.key)} style={{ accentColor: ACC, width: 13, height: 13 }} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
