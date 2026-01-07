
import { Candle } from '../types';

export const generateMockData = (count: number = 200, timeframe: string = '1d'): Candle[] => {
  const data: Candle[] = [];
  let price = 65000;
  const now = new Date();
  
  // Calculate milliseconds based on timeframe
  let step = 3600000 * 24; // Default 1d
  if (timeframe === '1h') step = 3600000;
  if (timeframe === '4h') step = 3600000 * 4;
  if (timeframe === '1w') step = 3600000 * 24 * 7;

  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * step);
    const volatility = price * 0.015;
    const open = price + (Math.random() - 0.5) * volatility;
    const high = open + Math.random() * volatility;
    const low = open - Math.random() * volatility;
    const close = (high + low) / 2 + (Math.random() - 0.5) * (volatility / 2);
    
    // Format time: Daily/Weekly uses YYYY-MM-DD, Intraday uses Full ISO or similar
    const timeStr = timeframe.includes('h') 
      ? time.toISOString().replace('T', ' ').substring(0, 19)
      : time.toISOString().split('T')[0];

    data.push({
      time: timeStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2))
    });
    price = close;
  }
  return data;
};
