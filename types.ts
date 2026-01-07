
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Trade {
  type: 'BUY' | 'SELL';
  price: number;
  time: string;
  profit?: number;
  entryPrice?: number;
  exitPrice?: number;
  exitReason?: string;
}

export interface BacktestResults {
  winRate: number;
  totalProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
}

export interface IndicatorConfig {
  type: 'EMA' | 'SMA' | 'RSI' | 'MACD' | 'BB' | 'ATR' | 'STOCH' | 'ADX' | 'OBV' | 'WMA';
  params: Record<string, number>;
}

export interface StrategyParams {
  asset: string;
  timeframe: string;
  prompt: string; // Natural language description
  stopLoss: number;
  takeProfit: number;
  // Compiled from prompt by AI
  compiledLogic?: {
    indicators: IndicatorConfig[];
    entryConditions: string;
    exitConditions: string;
  };
}

export enum NavigationTab {
  HOME = 'HOME',
  STRATEGY = 'STRATEGY',
  RESULTS = 'RESULTS',
  SETTINGS = 'SETTINGS'
}
