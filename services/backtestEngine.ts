
import { 
  Candle, StrategyParams, BacktestResults, Trade, 
  MarketEvent, SignalEvent, OrderEvent, FillEvent, BaseEvent, TCABreakdown, TickEvent 
} from '../types';
import { IndicatorLib } from './indicators';
import { calculateAdvancedMetrics } from './metrics';

export function runBacktest(data: Candle[], params: StrategyParams): BacktestResults {
  const engine = new EventDrivenEngine(params);
  return engine.run(data);
}

export class EventDrivenEngine {
  private queue: BaseEvent[] = [];
  private position: 'LONG' | null = null;
  private entryPrice = 0;
  private entryTime = '';
  private currentEquity: number;
  private trades: Trade[] = [];
  private equityCurve: { time: string, value: number }[] = [];
  private indicatorCaches: Record<string, any> = {};
  private indicatorValues: Record<string, any> = {};
  
  private explicitCosts = 0;
  private implicitCosts = 0;

  constructor(private params: StrategyParams) {
    this.currentEquity = params.initialCapital;
  }

  public run(data: Candle[]): BacktestResults {
    this.resetState();
    
    data.forEach((candle, idx) => {
      this.queue.push({ 
        type: 'MARKET', 
        timestamp: idx, 
        id: `mkt-${idx}`, 
        candle 
      } as MarketEvent);

      const ticks = this.generateIntraBarTicks(candle, idx);
      ticks.forEach(t => this.queue.push(t));
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
    this.indicatorCaches = {};
    this.indicatorValues = {};
    this.currentEquity = this.params.initialCapital;
    this.explicitCosts = 0;
    this.implicitCosts = 0;
  }

  private generateIntraBarTicks(candle: Candle, timestamp: number): TickEvent[] {
    const spread = candle.close * 0.0001; 
    const prices = [candle.open, candle.low, candle.high, candle.close];
    return prices.map((p, i) => ({
      type: 'TICK',
      timestamp,
      id: `tick-${timestamp}-${i}`,
      price: p,
      volume: candle.volume / 4,
      bid: p - spread / 2,
      ask: p + spread / 2
    }));
  }

  private handleEvent(event: BaseEvent, fullData: Candle[]) {
    switch (event.type) {
      case 'MARKET':
        this.processMarket(event as MarketEvent, fullData);
        break;
      case 'TICK':
        this.processTick(event as TickEvent);
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
    const { timestamp, candle } = event;
    const history = fullData.slice(0, timestamp + 1);
    const closes = history.map(c => c.close);
    
    this.params.indicators.filter(i => i.enabled).forEach(ind => {
      const key = ind.id;
      let val: any = null;
      
      switch(ind.type) {
        case 'EMA':
          val = IndicatorLib.EMA(closes, ind.params.period, this.indicatorCaches[key] || null);
          this.indicatorCaches[key] = val;
          break;
        case 'SMA':
          val = IndicatorLib.SMA(closes, ind.params.period);
          break;
        case 'RSI':
          val = IndicatorLib.RSI(closes, ind.params.period);
          break;
        case 'BB':
          val = IndicatorLib.BB(closes, ind.params.period, ind.params.stdDev || 2);
          break;
        case 'ATR':
          val = IndicatorLib.ATR(history, ind.params.period);
          break;
        case 'MACD':
          const cache = this.indicatorCaches[key] || {};
          val = IndicatorLib.MACD(closes, 12, 26, 9, cache.fast || null, cache.slow || null, cache.signal || null);
          this.indicatorCaches[key] = val;
          break;
        case 'STOCH':
          val = IndicatorLib.STOCH(history, ind.params.period);
          break;
        case 'OBV':
          val = IndicatorLib.OBV(history, this.indicatorCaches[key] || 0);
          this.indicatorCaches[key] = val;
          break;
        case 'ADX':
          val = IndicatorLib.ADX(history, ind.params.period);
          break;
      }
      this.indicatorValues[key] = val;
    });

    if (!this.position) {
      const signals: boolean[] = [];
      
      this.params.indicators.filter(i => i.enabled).forEach(ind => {
        const val = this.indicatorValues[ind.id];
        if (val === null) return;

        if (ind.type === 'EMA') signals.push(candle.close > val);
        if (ind.type === 'SMA') signals.push(candle.close > val);
        if (ind.type === 'RSI') signals.push(val < 30);
        if (ind.type === 'BB') signals.push(candle.close < val.lower);
        if (ind.type === 'STOCH') signals.push(val < 20);
        if (ind.type === 'MACD') signals.push(val.histogram > 0);
        if (ind.type === 'ADX') signals.push(val > 25);
      });

      let altConfirm = true;
      if (this.params.altData.darkPoolEnabled) {
        const avgVol = IndicatorLib.SMA(history.map(h => h.volume), 20) || 1;
        altConfirm = candle.volume > avgVol * 1.1;
      }

      const entry = this.params.logicMode === 'ALL' 
        ? (signals.length > 0 && signals.every(s => s))
        : signals.some(s => s);

      if (entry && altConfirm) {
        this.queue.push({ 
          type: 'SIGNAL', 
          timestamp, 
          id: `entry-${timestamp}`, 
          direction: 'LONG', 
          asset: this.params.asset 
        } as SignalEvent);
      }
    }
  }

  private processTick(event: TickEvent) {
    if (!this.position) return;

    const slPrice = this.entryPrice * (1 - (this.params.stopLoss / 100));
    const tpPrice = this.entryPrice * (1 + (this.params.takeProfit / 100));

    if (event.price <= slPrice) {
      this.queue.push({ type: 'SIGNAL', timestamp: event.timestamp, id: `sl-${event.id}`, direction: 'EXIT' } as SignalEvent);
    } else if (event.price >= tpPrice) {
      this.queue.push({ type: 'SIGNAL', timestamp: event.timestamp, id: `tp-${event.id}`, direction: 'EXIT' } as SignalEvent);
    }
  }

  private processSignal(event: SignalEvent) {
    if (event.direction === 'EXIT' && !this.position) return;
    const direction = event.direction === 'LONG' ? 'BUY' : 'SELL';
    
    this.queue.push({
      type: 'ORDER',
      timestamp: event.timestamp,
      id: `ord-${event.id}`,
      direction,
      orderType: 'MARKET',
      price: 0,
      quantity: 1
    } as OrderEvent);
  }

  private processOrder(event: OrderEvent, fullData: Candle[]) {
    const candle = fullData[event.timestamp];
    const basePrice = candle.close;
    
    const atr = IndicatorLib.ATR(fullData.slice(0, event.timestamp + 1), 14);
    const slipBps = this.params.slippageModel === 'DYNAMIC' ? (atr / basePrice * 0.05) : 0.0005;
    const slippage = basePrice * slipBps;
    
    const executionPrice = event.direction === 'BUY' ? (basePrice + slippage) : (basePrice - slippage);
    const commission = executionPrice * 0.0004;

    this.implicitCosts += slippage;
    this.explicitCosts += commission;

    this.queue.push({
      type: 'FILL',
      timestamp: event.timestamp,
      id: `fill-${event.id}`,
      direction: event.direction,
      executionPrice,
      slippage,
      commission,
      quantity: 1
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
      const netReturn = (event.executionPrice - this.entryPrice) / this.entryPrice;
      const finalProfit = (netReturn - (event.commission / this.entryPrice)) * 100;
      
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
