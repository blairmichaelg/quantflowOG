
export const IndicatorLib = {
  SMA: (data: number[], period: number) => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  },
  EMA: (data: number[], period: number, prevEma: number | null) => {
    const k = 2 / (period + 1);
    const price = data[data.length - 1];
    if (prevEma === null) return price;
    return (price - prevEma) * k + prevEma;
  },
  RSI: (data: number[], period: number) => {
    if (data.length <= period) return null;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
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
  OBV: (candles: any[]) => {
    if (candles.length < 2) return 0;
    let obv = 0;
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) obv += candles[i].volume;
      else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume;
    }
    return obv;
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
  }
};
