
import { Candle } from '../types';

const BASE_URL = 'https://www.alphavantage.co/query';

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    // Use a lightweight call to check if the key works
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=IBM&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Alpha Vantage returns "Note" or "Information" for rate limits (which means key is valid but busy)
    // It returns "Error Message" for invalid keys.
    if (data['Error Message']) return false;
    
    // If we get a Global Quote or a Note, the key exists
    return !!(data['Global Quote'] || data['Note'] || data['Information']);
  } catch {
    return false;
  }
}

export async function fetchHistoricalData(symbol: string, timeframe: string): Promise<Candle[]> {
  const userKey = localStorage.getItem('alpha_vantage_api_key');
  const apiKey = userKey || 'demo';
  
  const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'XRP'];
  const isCrypto = cryptoSymbols.includes(symbol.toUpperCase()) || symbol.length > 5;
  
  let url = '';
  
  if (isCrypto) {
    const func = timeframe.includes('h') ? 'CRYPTO_INTRADAY' : 'DIGITAL_CURRENCY_DAILY';
    const intervalParam = timeframe.includes('h') ? `&interval=60min` : '';
    url = `${BASE_URL}?function=${func}&symbol=${symbol}&market=USD${intervalParam}&apikey=${apiKey}`;
  } else {
    if (timeframe.includes('d') || timeframe.includes('w')) {
      url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
    } else {
      url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&apikey=${apiKey}`;
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();

    if (data['Note'] || data['Information']) {
      throw new Error('API Rate limit reached. Free keys are limited to 25 requests per day.');
    }

    if (data['Error Message']) {
      throw new Error(`Symbol "${symbol}" not found or unsupported at this timeframe.`);
    }

    const seriesKey = Object.keys(data).find(key => key.toLowerCase().includes('time series'));
    if (!seriesKey) throw new Error('No historical data found for this selection.');
    
    const timeSeries = data[seriesKey];

    // Added volume property mapping to satisfy Candle interface requirements
    const candles: Candle[] = Object.keys(timeSeries).map((date) => {
      const entry = timeSeries[date];
      
      const getVal = (search: string) => {
        const key = Object.keys(entry).find(k => k.toLowerCase().includes(search));
        return key ? parseFloat(entry[key]) : 0;
      };

      return {
        time: date,
        open: getVal('open'),
        high: getVal('high'),
        low: getVal('low'),
        close: getVal('close'),
        volume: getVal('volume'),
      };
    })
    .filter(c => c.open > 0)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    if (candles.length === 0) throw new Error('Received empty dataset from API.');
    
    return candles;
  } catch (error: any) {
    console.warn('Data Fetch Error:', error.message);
    throw error;
  }
}