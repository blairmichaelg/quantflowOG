
import { RiskMetrics, TCABreakdown } from '../types';

export const calculateAdvancedMetrics = (returns: number[], initial: number, final: number): RiskMetrics => {
  const count = returns.length || 1;
  const totalProfitPct = ((final - initial) / initial) * 100;
  
  const wins = returns.filter(r => r > 0);
  const losses = returns.filter(r => r <= 0);
  const winRate = (wins.length / count) * 100;
  
  const mean = returns.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count);

  const downside = returns.filter(r => r < 0);
  const downsideDev = Math.sqrt(downside.reduce((a, b) => a + Math.pow(b, 2), 0) / count);
  
  const sharpe = stdDev === 0 ? 0 : (mean / stdDev) * Math.sqrt(252);
  const sortino = downsideDev === 0 ? 0 : (mean / downsideDev) * Math.sqrt(252);
  
  let peak = 1;
  let current = 1;
  let mdd = 0;
  returns.forEach(r => {
    current *= (1 + r);
    if (current > peak) peak = current;
    const dd = (peak - current) / peak;
    if (dd > mdd) mdd = dd;
  });

  const calmar = mdd === 0 ? 0 : (totalProfitPct / 100) / mdd;

  const sumGains = wins.reduce((a, b) => a + b, 0);
  const sumLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
  const omega = sumLosses === 0 ? sumGains : sumGains / sumLosses;

  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor(count * 0.05);
  const var95 = sortedReturns.length > 0 ? Math.abs(sortedReturns[varIndex] * 100) : 0;

  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const expectation = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);

  const profitFactor = sumLosses === 0 ? sumGains : sumGains / sumLosses;

  return {
    winRate: Number(winRate.toFixed(2)),
    totalProfit: Number(totalProfitPct.toFixed(2)),
    maxDrawdown: Number((mdd * 100).toFixed(2)),
    sharpeRatio: Number(sharpe.toFixed(2)),
    sortinoRatio: Number(sortino.toFixed(2)),
    calmarRatio: Number(calmar.toFixed(2)),
    omegaRatio: Number(omega.toFixed(2)),
    var95: Number(var95.toFixed(2)),
    expectation: Number(expectation.toFixed(4)),
    profitFactor: Number(profitFactor.toFixed(2)),
    tca: { explicitCosts: 0, implicitCosts: 0, opportunityCosts: 0, implementationShortfall: 0 }
  };
};
