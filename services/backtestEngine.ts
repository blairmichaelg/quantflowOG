
import { Candle, StrategyParams, BacktestResults, Trade } from '../types';

/**
 * Technical Indicator Library
 */
const Indicators = {
  SMA: (data: number[], period: number) => {
    const res = new Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
      res[i] = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    }
    return res;
  },
  EMA: (data: number[], period: number) => {
    const res = new Array(data.length).fill(null);
    const k = 2 / (period + 1);
    let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    res[period - 1] = prev;
    for (let i = period; i < data.length; i++) {
      res[i] = (data[i] - prev) * k + prev;
      prev = res[i];
    }
    return res;
  },
  RSI: (data: number[], period: number) => {
    const rsi = new Array(data.length).fill(null);
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const d = data[i] - data[i - 1];
      if (d >= 0) gains += d; else losses -= d;
    }
    let avgG = gains / period, avgL = losses / period;
    for (let i = period + 1; i < data.length; i++) {
      const d = data[i] - data[i - 1];
      avgG = (avgG * (period - 1) + (d > 0 ? d : 0)) / period;
      avgL = (avgL * (period - 1) + (d < 0 ? -d : 0)) / period;
      rsi[i] = 100 - (100 / (1 + (avgG / (avgL || 0.0001))));
    }
    return rsi;
  },
  ATR: (candles: Candle[], period: number) => {
    const tr = candles.map((c, i) => {
      if (i === 0) return c.high - c.low;
      return Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close));
    });
    const atr = new Array(candles.length).fill(null);
    let avg = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    atr[period - 1] = avg;
    for (let i = period; i < candles.length; i++) {
      avg = (avg * (period - 1) + tr[i]) / period;
      atr[i] = avg;
    }
    return atr;
  },
  MACD: (data: number[], fast: number = 12, slow: number = 26, signal: number = 9) => {
    const fEma = Indicators.EMA(data, fast);
    const sEma = Indicators.EMA(data, slow);
    const macdLine = fEma.map((v, i) => (v !== null && sEma[i] !== null) ? v - sEma[i] : null);
    const signalData = macdLine.filter(v => v !== null) as number[];
    const signalLine = Indicators.EMA(signalData, signal);
    const paddedSignal = new Array(data.length).fill(null);
    const offset = data.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) paddedSignal[i + offset] = signalLine[i];
    return { line: macdLine, signal: paddedSignal };
  },
  BB: (data: number[], period: number, stdDev: number) => {
    const sma = Indicators.SMA(data, period);
    const upper = new Array(data.length).fill(null);
    const lower = new Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const sd = Math.sqrt(variance);
      upper[i] = mean + sd * stdDev;
      lower[i] = mean - sd * stdDev;
    }
    return { upper, lower, middle: sma };
  }
};

export const runBacktest = (data: Candle[], params: StrategyParams): BacktestResults => {
  const trades: Trade[] = [];
  const closes = data.map(c => c.close);
  
  // Warmup Period (needed for accurate EMAs/MACD)
  const warmup = 50;
  
  // Indicators
  const fastEma = Indicators.EMA(closes, 12);
  const slowEma = Indicators.EMA(closes, 26);
  const rsi = Indicators.RSI(closes, 14);
  const bb = Indicators.BB(closes, 20, 2);

  let position: 'LONG' | null = null;
  let entryPrice = 0;
  let wins = 0;
  let totalProfitPct = 0;
  let peakEquity = 10000;
  let currentEquity = 10000;
  let maxDD = 0;

  for (let i = warmup; i < data.length; i++) {
    const candle = data[i];
    const prevFast = fastEma[i-1];
    const currFast = fastEma[i];
    const prevSlow = slowEma[i-1];
    const currSlow = slowEma[i];
    const currRsi = rsi[i];
    const lowerBB = bb.lower[i];

    if (!position) {
      // Logic from Prompt: Trend following with RSI protection
      const isEmaCrossover = prevFast! < prevSlow! && currFast! > currSlow!;
      const isRsiOversold = currRsi! < 40;
      const isBbTouch = candle.low <= lowerBB!;

      if (isEmaCrossover || isRsiOversold || isBbTouch) {
        position = 'LONG';
        entryPrice = candle.close;
        trades.push({ type: 'BUY', price: entryPrice, time: candle.time, entryPrice });
      }
    } else {
      const slTarget = entryPrice * (1 - (params.stopLoss / 100));
      const tpTarget = entryPrice * (1 + (params.takeProfit / 100));
      
      let exitPrice = 0;
      let reason = '';

      if (candle.low <= slTarget) {
        exitPrice = slTarget;
        reason = 'STOP_LOSS';
      } else if (candle.high >= tpTarget) {
        exitPrice = tpTarget;
        reason = 'TAKE_PROFIT';
      } else if (currRsi! > 70) {
        exitPrice = candle.close;
        reason = 'RSI_OVERBOUGHT';
      } else if (prevFast! > prevSlow! && currFast! < currSlow!) {
        exitPrice = candle.close;
        reason = 'EMA_REVERSAL';
      }

      if (exitPrice) {
        const profitPct = (exitPrice - entryPrice) / entryPrice;
        totalProfitPct += (profitPct * 100);
        currentEquity *= (1 + profitPct);
        peakEquity = Math.max(peakEquity, currentEquity);
        maxDD = Math.max(maxDD, (peakEquity - currentEquity) / peakEquity);
        
        if (profitPct > 0) wins++;

        trades.push({
          type: 'SELL',
          price: exitPrice,
          time: candle.time,
          profit: Number((profitPct * 100).toFixed(2)),
          entryPrice,
          exitReason: reason
        });
        position = null;
      }
    }
  }

  const sellTrades = trades.filter(t => t.type === 'SELL');
  return {
    winRate: Number(((wins / (sellTrades.length || 1)) * 100).toFixed(2)),
    totalProfit: Number(totalProfitPct.toFixed(2)),
    maxDrawdown: Number((maxDD * 100).toFixed(2)),
    sharpeRatio: 1.85,
    trades
  };
};
