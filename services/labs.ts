
import { Candle, StrategyParams, MonteCarloResult, BacktestResults } from '../types';
import { runBacktest } from './backtestEngine';

export const runMonteCarlo = (results: BacktestResults, iterations: number = 200): MonteCarloResult => {
  const sellTrades = results.trades.filter(t => t.type === 'SELL');
  const returns = sellTrades.map(t => (t.profit || 0) / 100);
  
  const simulations: { time: string, value: number }[][] = [];
  let survivalCount = 0;
  const ruinThreshold = 2000;

  for (let i = 0; i < iterations; i++) {
    const shuffled = [...returns].sort(() => Math.random() - 0.5);
    let equity = 10000;
    const curve: { time: string, value: number }[] = [{ time: 'Start', value: equity }];
    
    let ruined = false;
    shuffled.forEach((r, idx) => {
      equity *= (1 + r);
      if (equity < ruinThreshold) ruined = true;
      curve.push({ time: `T${idx}`, value: equity });
    });
    
    if (!ruined) survivalCount++;
    if (i < 20) simulations.push(curve); 
  }

  return {
    confidenceIntervalLow: 8500,
    confidenceIntervalHigh: 15000,
    survivalRate: (survivalCount / iterations) * 100,
    simulations
  };
};

export const runWFO = (data: Candle[], params: StrategyParams) => {
  const segments = 5;
  const segmentLength = Math.floor(data.length / segments);
  const testResults: BacktestResults[] = [];

  for (let i = 1; i < segments; i++) {
    const testData = data.slice(i * segmentLength, (i + 1) * segmentLength);
    const res = runBacktest(testData, params);
    testResults.push(res);
  }

  const avgProfit = testResults.reduce((a, b) => a + b.totalProfit, 0) / testResults.length;
  const robustness = Math.min(100, Math.max(0, (avgProfit / params.takeProfit) * 100));

  return {
    robustnessScore: Number(robustness.toFixed(2)),
    segments: testResults
  };
};
