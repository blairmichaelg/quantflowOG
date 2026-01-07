
export const IndicatorLib = {
  SMA: (data: number[], period: number) => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  },
  EMA: (data: number[], period: number, prevEma: number | null) => {
    const k = 2 / (period + 1);
    const price = data[data.length - 1];
    if (prevEma === null) {
      if (data.length < period) return price;
      return data.slice(-period).reduce((a, b) => a + b, 0) / period;
    }
    return (price - prevEma) * k + prevEma;
  },
  RSI: (data: number[], period: number) => {
    if (data.length <= period) return null;
    let gains = 0, losses = 0;
    for (let i = data.length - period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    const avgG = gains / period;
    const avgL = losses / period;
    if (avgL === 0) return 100;
    const rs = avgG / avgL;
    return 100 - (100 / (1 + rs));
  },
  ATR: (candles: any[], period: number) => {
    if (candles.length < period) return 0;
    const ranges = candles.slice(-period).map((c, i, arr) => {
      const highLow = c.high - c.low;
      if (i === 0) return highLow;
      const highPrevClose = Math.abs(c.high - arr[i - 1].close);
      const lowPrevClose = Math.abs(c.low - arr[i - 1].close);
      return Math.max(highLow, highPrevClose, lowPrevClose);
    });
    return ranges.reduce((a, b) => a + b, 0) / period;
  },
  MACD: (data: number[], fast: number, slow: number, signal: number, prevFast: number | null, prevSlow: number | null, prevSignal: number | null) => {
    if (data.length < slow) return null;
    const currentFast = IndicatorLib.EMA(data, fast, prevFast);
    const currentSlow = IndicatorLib.EMA(data, slow, prevSlow);
    const macdLine = currentFast - currentSlow;
    const signalLine = IndicatorLib.EMA([macdLine], signal, prevSignal);
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine,
      fast: currentFast,
      slow: currentSlow
    };
  },
  BB: (data: number[], period: number, stdDev: number) => {
    if (data.length < period) return null;
    const sma = IndicatorLib.SMA(data, period);
    if (sma === null) return null;
    const slice = data.slice(-period);
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const sd = Math.sqrt(variance);
    return {
      upper: sma + sd * stdDev,
      lower: sma - sd * stdDev,
      middle: sma
    };
  },
  STOCH: (candles: any[], period: number) => {
    if (candles.length < period) return null;
    const slice = candles.slice(-period);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const close = candles[candles.length - 1].close;
    if (high === low) return 50;
    return ((close - low) / (high - low)) * 100;
  },
  OBV: (candles: any[], prevObv: number = 0) => {
    if (candles.length < 2) return prevObv;
    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    if (curr.close > prev.close) return prevObv + curr.volume;
    if (curr.close < prev.close) return prevObv - curr.volume;
    return prevObv;
  },
  ADX: (candles: any[], period: number) => {
    if (candles.length < period * 2) return null;
    // Implementation of Wilder's DMI/ADX
    let tr: number[] = [];
    let dmPlus: number[] = [];
    let dmMinus: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const p = candles[i-1];
      tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
      const moveUp = c.high - p.high;
      const moveDown = p.low - c.low;
      dmPlus.push(moveUp > moveDown && moveUp > 0 ? moveUp : 0);
      dmMinus.push(moveDown > moveUp && moveDown > 0 ? moveDown : 0);
    }
    
    const smoothTR = tr.slice(-period).reduce((a, b) => a + b, 0);
    const smoothPlus = dmPlus.slice(-period).reduce((a, b) => a + b, 0);
    const smoothMinus = dmMinus.slice(-period).reduce((a, b) => a + b, 0);
    
    const diPlus = (smoothPlus / smoothTR) * 100;
    const diMinus = (smoothMinus / smoothTR) * 100;
    const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
    
    return dx; // Simplified ADX return for trend strength
  }
};
