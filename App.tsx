
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Chart } from './components/Chart';
import { EquityChart } from './components/EquityChart';
import { NavigationTab, StrategyParams, BacktestResults, Candle, Trade } from './types';
import { generateMockData } from './services/mockData';
import { runBacktest } from './services/backtestEngine';
import { fetchHistoricalData } from './services/alphaVantage';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TrendingUp, BarChart3, RefreshCw, Sparkles, BrainCircuit, Wand2, 
  Target, ShieldX, LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight,
  Loader2, Activity, Database, ListFilter, MessageSquare, PlusCircle, Download
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.HOME);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'LIVE' | 'SIMULATED'>('SIMULATED');
  
  const [params, setParams] = useState<StrategyParams>({
    asset: 'BTC',
    timeframe: '1d',
    prompt: 'EMA cross with RSI filtering. Enter when 12 EMA crosses above 26 EMA and RSI < 40.',
    stopLoss: 2.5,
    takeProfit: 8.0
  });

  const [historicalData, setHistoricalData] = useState<Candle[]>([]);
  const [results, setResults] = useState<BacktestResults | null>(null);

  const handleExportCSV = () => {
    if (!results) return;

    const summaryRows = [
      ['QuantFlow Backtest Report'],
      ['Asset', params.asset],
      ['Timeframe', params.timeframe],
      ['Total Profit %', `${results.totalProfit}%`],
      ['Win Rate %', `${results.winRate}%`],
      ['Max Drawdown %', `${results.maxDrawdown}%`],
      ['Sharpe Ratio', results.sharpeRatio],
      ['Strategy Prompt', params.prompt],
      ['Generated At', new Date().toLocaleString()],
      [''],
      ['TRADE LOG'],
      ['Time', 'Type', 'Price', 'Entry Price', 'Profit %', 'Exit Reason']
    ];

    const tradeRows = results.trades.map(t => [
      t.time,
      t.type,
      t.price,
      t.entryPrice || '',
      t.profit !== undefined ? `${t.profit}%` : '',
      t.exitReason || ''
    ]);

    const csvContent = summaryRows.concat(tradeRows)
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `quantflow_${params.asset}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compileAndRun = async () => {
    setIsCompiling(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this strategy and explain how it will be executed: "${params.prompt}". 
        Include which technical indicators will be prioritized (EMA, RSI, BB, etc).`,
        config: {
          thinkingConfig: { thinkingBudget: 8000 }
        }
      });
      setAiInsight(response.text || "Strategy interpreted.");
      handleRunBacktest(dataSource === 'LIVE');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRunBacktest = async (requestLive: boolean = false) => {
    setIsLoading(true);
    try {
      let data: Candle[] = [];
      const storedKey = localStorage.getItem('alpha_vantage_api_key');
      
      if (requestLive && storedKey) {
        data = await fetchHistoricalData(params.asset, params.timeframe);
        setDataSource('LIVE');
      } else {
        data = generateMockData(500, params.timeframe);
        setDataSource('SIMULATED');
      }

      setHistoricalData(data);
      const res = runBacktest(data, params);
      setResults(res);
      setActiveTab(NavigationTab.RESULTS);
    } catch (err: any) {
      const fallback = generateMockData(500, params.timeframe);
      setHistoricalData(fallback);
      setResults(runBacktest(fallback, params));
      setDataSource('SIMULATED');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { handleRunBacktest(false); }, []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === NavigationTab.HOME && (
        <div className="space-y-6 animate-in fade-in duration-700">
          <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-transparent">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total PnL</h2>
                <p className="text-4xl font-bold tracking-tighter">$14,290<span className="text-zinc-500">.42</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Activity size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 w-fit px-4 py-1.5 rounded-full border border-emerald-500/20">
              <TrendingUp size={14} /> +22.4% Strategy Performance
            </div>
            <Sparkles className="absolute top-[-20px] right-[-20px] opacity-10 text-blue-500" size={120} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTab(NavigationTab.STRATEGY)} className="glass p-6 rounded-3xl text-left hover:bg-white/5 active:scale-95 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Wand2 size={24} />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Builder</p>
              <p className="font-bold text-lg">New Logic</p>
            </button>
            <button onClick={() => setActiveTab(NavigationTab.RESULTS)} className="glass p-6 rounded-3xl text-left hover:bg-white/5 active:scale-95 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Analytics</p>
              <p className="font-bold text-lg">Performance</p>
            </button>
          </div>

          <section className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Database size={14} /> Global Markets
                </h3>
             </div>
             {['BTC', 'ETH', 'SOL'].map(symbol => (
               <div key={symbol} className="glass p-5 rounded-3xl flex items-center justify-between border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => {setParams({...params, asset: symbol}); setActiveTab(NavigationTab.STRATEGY)}}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-lg">{symbol[0]}</div>
                    <div>
                      <p className="font-bold">{symbol}/USD</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Alpha Vantage Feed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">$64,203.11</p>
                    <p className="text-[10px] text-emerald-400 font-black">+1.24%</p>
                  </div>
               </div>
             ))}
          </section>
        </div>
      )}

      {activeTab === NavigationTab.STRATEGY && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500 pb-20">
          <header className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tight">Strategy Builder</h2>
            <div className="flex gap-2">
              <button className="p-3 glass rounded-2xl text-zinc-400 hover:text-white transition-colors"><ListFilter size={20} /></button>
            </div>
          </header>

          <div className="space-y-4">
            <div className="glass p-7 rounded-[2.5rem] space-y-5 border-blue-500/20 bg-blue-500/[0.02]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-blue-400 tracking-[0.15em] flex items-center gap-2">
                  <Sparkles size={14} /> AI Logic Entry
                </label>
                <div className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-tighter">Gemini 3 Pro</div>
              </div>
              <textarea 
                className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all resize-none leading-relaxed"
                placeholder="Ex: Enter when the 12 EMA crosses above the 26 EMA and RSI is below 40. Exit if price gains 8% or RSI exceeds 70..."
                value={params.prompt}
                onChange={e => setParams({...params, prompt: e.target.value})}
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {['EMA Cross', 'RSI Filter', 'Bollinger Rebound', 'Breakout'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setParams({...params, prompt: params.prompt + ' ' + tag})}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-zinc-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all flex items-center gap-2"
                  >
                    <PlusCircle size={10} /> {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="glass p-6 rounded-3xl space-y-3">
                 <label className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-1.5">
                   <ShieldX size={12} /> Stop Loss
                 </label>
                 <div className="flex items-center gap-2">
                   <input type="number" step="0.1" value={params.stopLoss} onChange={e => setParams({...params, stopLoss: Number(e.target.value)})} className="bg-transparent text-2xl font-black w-full focus:outline-none" />
                   <span className="text-xs font-black text-zinc-600">%</span>
                 </div>
               </div>
               <div className="glass p-6 rounded-3xl space-y-3">
                 <label className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1.5">
                   <Target size={12} /> Take Profit
                 </label>
                 <div className="flex items-center gap-2">
                   <input type="number" step="0.1" value={params.takeProfit} onChange={e => setParams({...params, takeProfit: Number(e.target.value)})} className="bg-transparent text-2xl font-black w-full focus:outline-none" />
                   <span className="text-xs font-black text-zinc-600">%</span>
                 </div>
               </div>
            </div>

            <button 
              onClick={compileAndRun}
              disabled={isCompiling || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-4 mt-4"
            >
              {isCompiling ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
              {isCompiling ? 'Compiling Logic...' : 'Analyze & Backtest'}
            </button>
          </div>
        </div>
      )}

      {activeTab === NavigationTab.RESULTS && results && (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
          <header className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{params.asset}<span className="text-zinc-500 text-sm ml-2">USDT</span></h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Performance Dashboard</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExportCSV}
                className="p-4 glass rounded-[1.5rem] text-blue-400 hover:bg-blue-500/10 active:scale-90 transition-all"
                title="Export Results"
              >
                <Download size={22} />
              </button>
              <button onClick={() => handleRunBacktest(dataSource === 'LIVE')} className="p-4 glass rounded-[1.5rem] text-blue-400 hover:bg-blue-500/10 active:rotate-180 transition-all duration-700">
                <RefreshCw size={22} />
              </button>
            </div>
          </header>

          <div className="glass p-3 rounded-[2.5rem] overflow-hidden border-white/5 relative">
            <Chart data={historicalData} trades={results.trades} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-7 rounded-[2.5rem] flex flex-col items-center text-center gap-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Win Rate</p>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
                      strokeDasharray={2 * Math.PI * 36} 
                      strokeDashoffset={2 * Math.PI * 36 * (1 - results.winRate/100)} 
                      className="text-emerald-500 transition-all duration-1000" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-lg font-black">{results.winRate}%</span>
                </div>
             </div>
             <div className="glass p-7 rounded-[2.5rem] flex flex-col items-center text-center gap-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Net Profit</p>
                <p className={`text-3xl font-black tracking-tighter ${results.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {results.totalProfit > 0 ? '+' : ''}{results.totalProfit}%
                </p>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <div className={`h-full ${results.totalProfit >= 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} style={{ width: '65%' }}></div>
                </div>
             </div>
          </div>

          <section className="glass p-8 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-[0.15em] flex items-center gap-2">
                <LineChartIcon size={16} className="text-blue-400" /> Equity Curve
              </h3>
              <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Cumulative PnL</div>
            </div>
            <EquityChart trades={results.trades} />
          </section>

          {aiInsight && (
            <div className="glass p-7 rounded-[2.5rem] border-blue-500/20 bg-blue-500/[0.03] space-y-3">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <BrainCircuit size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Strategy Logic Decoded</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">{aiInsight}</p>
            </div>
          )}

          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
               <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Execution Logs</h3>
               <span className="text-[9px] font-black text-zinc-600 bg-white/5 px-2 py-0.5 rounded-lg">{results.trades.length} ACTIONS</span>
             </div>
             <div className="space-y-3">
               {results.trades.filter(t => t.type === 'SELL').reverse().slice(0, 10).map((t, i) => (
                 <div key={i} className="glass p-5 rounded-3xl flex items-center justify-between border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.profit! >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                          {t.profit! >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                       </div>
                       <div>
                         <p className="text-sm font-black uppercase tracking-tight">{t.exitReason?.replace('_', ' ')}</p>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.time}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black tracking-tight ${t.profit! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.profit! > 0 ? '+' : ''}{t.profit}%
                      </p>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        </div>
      )}

      {activeTab === NavigationTab.SETTINGS && (
        <div className="space-y-6 animate-in fade-in duration-700">
           <header className="px-2"><h2 className="text-3xl font-black tracking-tighter">Settings</h2></header>
           
           <div className="glass p-8 rounded-[2.5rem] space-y-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Market Data Feed API</label>
                 <div className="flex gap-3">
                    <input type="password" placeholder="Alpha Vantage Key" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                    <button className="px-6 bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">Update</button>
                 </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400"><BrainCircuit size={24} /></div>
                  <div>
                    <p className="text-base font-black">AI Quant Assistant</p>
                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Gemini 3 Pro Active</p>
                  </div>
                </div>
                <div className="w-14 h-7 bg-blue-600 rounded-full flex items-center px-1 cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full ml-auto shadow-lg"></div>
                </div>
              </div>
           </div>

           <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-5 border-dashed border-white/10">
              <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Database size={40} />
              </div>
              <div className="space-y-2">
                <p className="font-black text-xl tracking-tight">On-Device Edge Engine</p>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-[240px] mx-auto">Backtest computations run exclusively in your browser environment. Your logic stays private and secure.</p>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
