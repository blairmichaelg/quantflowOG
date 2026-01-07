
import { 
  Candle, StrategyParams, BacktestResults, Trade, 
  MarketEvent, SignalEvent, OrderEvent, FillEvent, BaseEvent, TCABreakdown 
} from '../types';
import { IndicatorLib } from './indicators';
import { calculateAdvancedMetrics } from './metrics';

export class EventDrivenEngine {
  private queue: BaseEvent[] = [];
  private position: 'LONG' | null = null;
  private entryPrice = 0;
  private entryTime = '';
  private currentEquity: number;
  private trades: Trade[] = [];
  private equityCurve: { time: string, value: number }[] = [];
  private emaCache: Record<string, number> = {};
  private indicatorValues: Record<string, any> = {};
  
  private explicitCosts = 0;
  private implicitCosts = 0;

  constructor(private params: StrategyParams) {
    this.currentEquity = params.initialCapital;
  }

  public run(data: Candle[]): BacktestResults {
    this.resetState();
    
    // Data Handler: Drip-feeding MarketEvents
    data.forEach((candle, idx) => {
      this.queue.push({ 
        type: 'MARKET', 
        timestamp: idx, 
        id: `mkt-${idx}`, 
        candle 
      } as MarketEvent);
    });

    let pointer = 0;
    while (pointer < this.queue.length) {
      const event = this.queue[pointer++];
      this.handleEvent(event, data);
    }

    return this.generateResults(data);
  }

  private resetState() {
    this.queue = [];
    this.position = null;
    this.entryPrice = 0;
    this.trades = [];
    this.equityCurve = [];
    this.emaCache = {};
    this.indicatorValues = {};
    this.currentEquity = this.params.initialCapital;
    this.explicitCosts = 0;
    this.implicitCosts = 0;
  }

  private handleEvent(event: BaseEvent, fullData: Candle[]) {
    switch (event.type) {
      case 'MARKET':
        this.processMarket(event as MarketEvent, fullData);
        break;
      case 'SIGNAL':
        this.processSignal(event as SignalEvent);
        break;
      case 'ORDER':
        this.processOrder(event as OrderEvent, fullData);
        break;
      case 'FILL':
        this.processFill(event as FillEvent, fullData);
        break;
    }
  }

  private processMarket(event: MarketEvent, fullData: Candle[]) {
    const { candle, timestamp } = event;
    const warmup = 50;
    if (timestamp < warmup) return;

    // State Isolation: Only look at history
    const history = fullData.slice(0, timestamp + 1);
    const closes = history.map(c => c.close);
    
    // Update Logic Indicators
    this.params.indicators.filter(i => i.enabled).forEach(ind => {
      const key = `${ind.type}_${ind.params.period || 'const'}`;
      if (ind.type === 'EMA') {
        this.emaCache[ind.params.period] = IndicatorLib.EMA(closes, ind.params.period, this.emaCache[ind.params.period] || null);
        this.indicatorValues[key] = this.emaCache[ind.params.period];
      } else if (ind.type === 'RSI') {
        this.indicatorValues[key] = IndicatorLib.RSI(closes, ind.params.period);
      } else if (ind.type === 'BB') {
        this.indicatorValues[key] = IndicatorLib.BB(closes, ind.params.period, ind.params.stdDev || 2);
      }
    });

    if (!this.position) {
      // Alternative Data Simulation
      let altGate = true;
      if (this.params.altData.darkPoolEnabled) {
        // Simulate Dark Pool Signal based on cumulative volume deviation
        const avgVol = history.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
        altGate = candle.volume > avgVol * 1.15;
      }

      const conditions: boolean[] = [];
      this.params.indicators.filter(i => i.enabled).forEach(ind => {
        const key = `${ind.type}_${ind.params.period || 'const'}`;
        const val = this.indicatorValues[key];
        if (val == null) return;

        if (ind.type === 'EMA') conditions.push(candle.close > val);
        if (ind.type === 'RSI') conditions.push(val < 35);
        if (ind.type === 'BB') conditions.push(candle.close < val.lower);
      });

      const entryTrigger = this.params.logicMode === 'ALL' 
        ? (conditions.length > 0 && conditions.every(c => c))
        : conditions.some(c => c);

      if (entryTrigger && altGate) {
        this.queue.push({ type: 'SIGNAL', timestamp, id: `sig-${timestamp}`, direction: 'LONG', asset: this.params.asset } as SignalEvent);
      }
    } else {
      const sl = this.entryPrice * (1 - (this.params.stopLoss / 100));
      const tp = this.entryPrice * (1 + (this.params.takeProfit / 100));

      if (candle.low <= sl) {
        this.queue.push({ type: 'SIGNAL', timestamp, id: `sl-${timestamp}`, direction: 'EXIT' } as SignalEvent);
      } else if (candle.high >= tp) {
        this.queue.push({ type: 'SIGNAL', timestamp, id: `tp-${timestamp}`, direction: 'EXIT' } as SignalEvent);
      }
    }
  }

  private processSignal(event: SignalEvent) {
    if (event.direction === 'EXIT' && !this.position) return;
    const direction = event.direction === 'LONG' ? 'BUY' : 'SELL';
    
    // Portfolio Handler: Sizing logic (100% of capital for simplicity)
    this.queue.push({
      type: 'ORDER',
      timestamp: event.timestamp,
      id: `ord-${event.timestamp}`,
      direction,
      orderType: 'MARKET',
      price: 0,
      quantity: 1
    } as OrderEvent);
  }

  private processOrder(event: OrderEvent, fullData: Candle[]) {
    // Execution Handler: Latency + Slippage
    const candle = fullData[event.timestamp];
    
    // NIST Sync Simulation (micro-delay)
    const basePrice = candle.close;
    
    // Dynamic Microstructure Slippage Model
    const atr = IndicatorLib.ATR(fullData.slice(0, event.timestamp + 1), 14);
    const avgVol = fullData.slice(Math.max(0, event.timestamp - 30), event.timestamp).reduce((a, b) => a + b.volume, 0) / 30;
    const liquidityImpact = Math.min(2.5, candle.volume / (avgVol || 1));
    
    const slipBps = this.params.slippageModel === 'DYNAMIC' ? (atr / basePrice * 0.1 * liquidityImpact) : 0.0001;
    const slippage = basePrice * slipBps;
    
    const executionPrice = event.direction === 'BUY' ? (basePrice + slippage) : (basePrice - slippage);
    const commission = executionPrice * 0.0004;

    this.implicitCosts += slippage;
    this.explicitCosts += commission;

    this.queue.push({
      type: 'FILL',
      timestamp: event.timestamp,
      id: `fill-${event.timestamp}`,
      direction: event.direction,
      executionPrice,
      slippage,
      commission,
      quantity: event.quantity
    } as FillEvent);
  }

  private processFill(event: FillEvent, fullData: Candle[]) {
    const candle = fullData[event.timestamp];
    if (event.direction === 'BUY') {
      this.position = 'LONG';
      this.entryPrice = event.executionPrice;
      this.entryTime = candle.time;
      this.trades.push({ 
        type: 'BUY', price: this.entryPrice, time: this.entryTime, timestamp: event.timestamp, 
        entryPrice: this.entryPrice, slippage: event.slippage, fee: event.commission 
      });
    } else {
      const netProfitPct = (event.executionPrice - this.entryPrice) / this.entryPrice;
      const finalProfit = (netProfitPct - (event.commission / this.entryPrice)) * 100;
      
      this.currentEquity *= (1 + (finalProfit / 100));
      this.equityCurve.push({ time: candle.time, value: this.currentEquity });

      this.trades.push({
        type: 'SELL', price: event.executionPrice, time: candle.time, timestamp: event.timestamp,
        profit: Number(finalProfit.toFixed(3)), entryPrice: this.entryPrice, 
        exitReason: 'LOGIC', slippage: event.slippage, fee: event.commission
      });
      this.position = null;
    }
  }

  private generateResults(data: Candle[]): BacktestResults {
    const returns = this.trades.filter(t => t.type === 'SELL').map(t => t.profit! / 100);
    const metrics = calculateAdvancedMetrics(returns, this.params.initialCapital, this.currentEquity);
    
    const tca: TCABreakdown = {
      explicitCosts: this.explicitCosts,
      implicitCosts: this.implicitCosts,
      opportunityCosts: 0,
      implementationShortfall: (this.explicitCosts + this.implicitCosts) / this.params.initialCapital * 100
    };

    return { ...metrics, tca, trades: this.trades, equityCurve: this.equityCurve, drawdownCurve: [] };
  }
}

export const runBacktest = (data: Candle[], params: StrategyParams): BacktestResults => {
  const engine = new EventDrivenEngine(params);
  return engine.run(data);
};
