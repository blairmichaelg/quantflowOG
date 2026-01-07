
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type EventType = 'MARKET' | 'SIGNAL' | 'ORDER' | 'FILL';

export interface BaseEvent {
  type: EventType;
  timestamp: number;
  id: string;
}

export interface MarketEvent extends BaseEvent {
  type: 'MARKET';
  candle: Candle;
}

export interface SignalEvent extends BaseEvent {
  type: 'SIGNAL';
  direction: 'LONG' | 'SHORT' | 'EXIT';
  asset: string;
  strength?: number;
}

export interface OrderEvent extends BaseEvent {
  type: 'ORDER';
  direction: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  price: number;
  quantity: number;
}

export interface FillEvent extends BaseEvent {
  type: 'FILL';
  direction: 'BUY' | 'SELL';
  executionPrice: number;
  slippage: number;
  commission: number;
  quantity: number;
}

export interface Trade {
  type: 'BUY' | 'SELL';
  price: number;
  time: string;
  timestamp: number;
  profit?: number;
  entryPrice?: number;
  exitPrice?: number;
  exitReason?: string;
  slippage?: number;
  fee?: number;
}

export interface TCABreakdown {
  explicitCosts: number; 
  implicitCosts: number; 
  opportunityCosts: number; 
  implementationShortfall: number;
}

export interface RiskMetrics {
  winRate: number;
  totalProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  omegaRatio: number;
  var95: number; 
  expectation: number;
  profitFactor: number;
  tca: TCABreakdown;
}

export interface BacktestResults extends RiskMetrics {
  trades: Trade[];
  equityCurve: { time: string, value: number }[];
  drawdownCurve: { time: string, value: number }[];
  robustnessScore?: number;
}

export interface IndicatorConfig {
  type: 'EMA' | 'SMA' | 'RSI' | 'MACD' | 'BB' | 'ATR' | 'STOCH' | 'ADX' | 'OBV';
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME';
  params: Record<string, number>;
  enabled: boolean;
}

export interface AlternativeDataState {
  darkPoolEnabled: boolean;
  uoaEnabled: boolean;
  predictionMarketEnabled: boolean;
  onChainEnabled: boolean;
}

export interface StrategyParams {
  asset: string;
  timeframe: string;
  prompt: string;
  stopLoss: number;
  takeProfit: number;
  logicMode: 'ALL' | 'ANY';
  indicators: IndicatorConfig[];
  latencyMs: number;
  slippageModel: 'ZERO' | 'DYNAMIC';
  initialCapital: number;
  leverage: number;
  altData: AlternativeDataState;
}

export enum NavigationTab {
  HOME = 'HOME',
  STRATEGY = 'STRATEGY',
  RESULTS = 'RESULTS',
  LABS = 'LABS',
  SETTINGS = 'SETTINGS'
}

export interface MonteCarloResult {
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
  survivalRate: number;
  simulations: { time: string, value: number }[][];
}
