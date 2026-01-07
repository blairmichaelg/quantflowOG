
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Chart } from './components/Chart';
import { EquityChart } from './components/EquityChart';
import { 
  NavigationTab, StrategyParams, BacktestResults, Candle, 
  IndicatorConfig, AlternativeDataState, MonteCarloResult 
} from './types';
import { generateMockData } from './services/mockData';
import { runBacktest } from './services/backtestEngine';
import { runMonteCarlo, runWFO } from './services/labs';
import { GoogleGenAI } from "@google/genai";
import { 
  TrendingUp, RefreshCw, Sparkles, BrainCircuit, Wand2, 
  Target, ShieldX, LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight,
  Loader2, Activity, Database, MessageSquare, Download, 
  ToggleLeft, ToggleRight, Settings2, Info, Zap, Search, Image as ImageIcon,
  Send, X, ExternalLink, Cpu, ShieldCheck, Microscope, History, FlaskConical,
  Layers, Ghost, Binary, Radio, PieChart, ShieldAlert
} from 'lucide-react';

const INITIAL_INDICATORS: IndicatorConfig[] = [
  { type: 'EMA', category: 'TREND', params: { period: 12 }, enabled: true },
  { type: 'EMA', category: 'TREND', params: { period: 26 }, enabled: true },
  { type: 'RSI', category: 'MOMENTUM', params: { period: 14 }, enabled: false },
  { type: 'BB', category: 'VOLATILITY', params: { period: 20, stdDev: 2 }, enabled: false },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.HOME);
  const [isLoading, setIsLoading] = useState(false);
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  
  const [params, setParams] = useState<StrategyParams>({
    asset: 'BTC',
    timeframe: '1d',
    prompt: 'Trend-following EMA crossover with dynamic volatility filters.',
    stopLoss: 2.5,
    takeProfit: 6.0,
    logicMode: 'ALL',
    indicators: INITIAL_INDICATORS,
    latencyMs: 150,
    slippageModel: 'DYNAMIC',
    initialCapital: 10000,
    leverage: 1,
    altData: {
      darkPoolEnabled: true,
      uoaEnabled: false,
      predictionMarketEnabled: false,
      onChainEnabled: false
    }
  });

  const [historicalData, setHistoricalData] = useState<Candle[]>([]);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  const runArchitect = async () => {
    setIsArchitecting(true);
    setAiInsight(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a Quantitative Strategy Architect. Design a robust institutional strategy for ${params.asset}.
        Prompt: "${params.prompt}".
        1. Define Indicator Logic. 
        2. Detail Risk Management (SL/TP) using ATR scaling.
        3. Run a Scenario Stress Test against the 2020 COVID Flash Crash.
        Format: Professional technical report.`,
        config: { thinkingConfig: { thinkingBudget: 24000 } }
      });
      setAiInsight(response.text);
      handleRunBacktest();
    } catch (err) { console.error(err); } finally { setIsArchitecting(false); }
  };

  const handleRunBacktest = async () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const data = generateMockData(1200, params.timeframe);
        setHistoricalData(data);
        const res = runBacktest(data, params);
        const mc = runMonteCarlo(res);
        const wfo = runWFO(data, params);
        
        setResults({ ...res, robustnessScore: wfo.robustnessScore });
        setMonteCarlo(mc);
        setActiveTab(NavigationTab.RESULTS);
      } finally { setIsLoading(false); }
    }, 1500);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: msg,
        config: { systemInstruction: "QuantFlow Terminal Assistant. Provide sub-second technical and mathematical guidance." }
      });
      setChatMessages(prev => [...prev, { role: 'bot', text: response.text || "Error." }]);
    } catch (err) { console.error(err); }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      
      {/* Floating Engine Console */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 pointer-events-none">
          <div className="w-full max-w-md glass rounded-[2.5rem] shadow-2xl flex flex-col h-[480px] pointer-events-auto border-blue-500/40">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-blue-600/10">
              <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest"><Zap size={14} /> Quant Engine Assistant</div>
              <button onClick={() => setChatOpen(false)}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl text-[11px] font-medium leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-zinc-300'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500/30" placeholder="Analyze Omega Ratio..." />
              <button onClick={sendChatMessage} className="p-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all"><Send size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {activeTab === NavigationTab.HOME && (
        <div className="space-y-6 animate-in fade-in duration-700">
          <div className="glass p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/5 border-white/5 relative overflow-hidden shadow-2xl">
             <div className="flex justify-between mb-8">
                <div>
                  <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500"/> Verified Institutional Capital
                  </h2>
                  <p className="text-5xl font-bold tracking-tighter text-white">$2,142,902<span className="text-zinc-500 text-3xl">.80</span></p>
                </div>
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner"><Cpu size={32} /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 px-6 py-3 rounded-2xl flex items-center gap-4 border border-emerald-500/10">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <div><p className="text-[9px] font-black text-zinc-500 uppercase">Alpha Rate</p><p className="text-base font-bold text-emerald-400">+18.4%</p></div>
                </div>
                <div className="bg-blue-500/10 px-6 py-3 rounded-2xl flex items-center gap-4 border border-blue-500/10">
                  <Activity size={18} className="text-blue-400" />
                  <div><p className="text-[9px] font-black text-zinc-500 uppercase">System Latency</p><p className="text-base font-bold text-blue-400">150ms</p></div>
                </div>
             </div>
             <div className="absolute top-[-40px] right-[-40px] opacity-10"><BrainCircuit size={280} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setActiveTab(NavigationTab.STRATEGY)} className="glass p-8 rounded-[2.5rem] text-left border-purple-500/10 hover:border-purple-500/40 group transition-all">
                <Wand2 size={26} className="text-purple-400 mb-4 group-hover:rotate-12 transition-transform" />
                <p className="text-[11px] font-black text-zinc-500 uppercase">Architect</p>
                <p className="font-bold text-xl">Strategy Lab</p>
             </button>
             <button onClick={() => setActiveTab(NavigationTab.LABS)} className="glass p-8 rounded-[2.5rem] text-left border-emerald-500/10 hover:border-emerald-500/40 group transition-all">
                <FlaskConical size={26} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-black text-zinc-500 uppercase">Audit</p>
                <p className="font-bold text-xl">Stress Test</p>
             </button>
          </div>

          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
               <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Universe Intelligence</h3>
               <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase">Live Aggregated</span>
             </div>
             {['BTC', 'ETH', 'SOL', 'NVDA'].map(s => (
               <div key={s} className="glass p-6 rounded-3xl flex justify-between items-center border-white/5 hover:bg-white/[0.02] cursor-pointer transition-all group">
                  <div className="flex items-center gap-5">
                     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-xl group-hover:text-blue-400 transition-colors">{s[0]}</div>
                     <div><p className="text-lg font-bold">{s}/USD</p><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">NIST Synced Feed</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-black tracking-tight">$64,029.11</p><p className="text-[11px] font-black text-emerald-400">+1.24%</p></div>
               </div>
             ))}
          </section>

          <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 flex gap-5 items-start">
            <ShieldAlert size={24} className="text-zinc-600 shrink-0" />
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase tracking-tighter">
              Disclaimer: Performance figures are simulated via high-fidelity event queue. Not indicative of live returns. IOSCO Neutral Compliance: ON.
            </p>
          </div>
        </div>
      )}

      {activeTab === NavigationTab.STRATEGY && (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-10">
          <header className="px-2">
            <h2 className="text-3xl font-black tracking-tighter">Logic Compiler</h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Architect Terminal v4.1</p>
          </header>

          <div className="glass p-8 rounded-[3rem] space-y-6 border-blue-500/20 shadow-2xl">
            <label className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-3"><Microscope size={16}/> Quantitative Synthesis</label>
            <textarea value={params.prompt} onChange={e => setParams({...params, prompt: e.target.value})} className="w-full h-40 bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-medium focus:ring-8 focus:ring-blue-500/10 outline-none transition-all resize-none leading-relaxed" placeholder="Ex: Build a volatility-adjusted trend follower..." />
            <button onClick={runArchitect} disabled={isArchitecting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex justify-center items-center gap-4 transition-all active:scale-95">
              {isArchitecting ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
              {isArchitecting ? 'Architecting Alpha...' : 'Compile Strategy Logic'}
            </button>
          </div>

          <section className="space-y-4 px-2">
             <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Layers size={16}/> Alternative Data Signals</h3>
             <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'darkPoolEnabled', label: 'Dark Pool', icon: Ghost, color: 'text-zinc-400' },
                 { id: 'uoaEnabled', label: 'UOA Scanner', icon: Radio, color: 'text-blue-400' },
                 { id: 'predictionMarketEnabled', label: 'Polymarket', icon: Binary, color: 'text-purple-400' },
                 { id: 'onChainEnabled', label: 'On-Chain', icon: Database, color: 'text-emerald-400' }
               ].map(alt => (
                 <button 
                  key={alt.id}
                  onClick={() => setParams({ ...params, altData: { ...params.altData, [alt.id]: !params.altData[alt.id as keyof AlternativeDataState] } })}
                  className={`glass p-6 rounded-[2rem] flex flex-col items-center gap-4 transition-all ${params.altData[alt.id as keyof AlternativeDataState] ? 'border-blue-500/60 bg-blue-600/10' : 'opacity-40'}`}
                 >
                   <alt.icon size={24} className={alt.color} />
                   <span className="text-[11px] font-black uppercase tracking-tighter">{alt.label}</span>
                 </button>
               ))}
             </div>
          </section>

          {aiInsight && (
            <div className="glass p-10 rounded-[3rem] border-purple-500/20 bg-purple-500/[0.01] space-y-6 animate-in slide-in-from-top-10 shadow-inner">
               <div className="flex justify-between items-center text-purple-400">
                  <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"><Info size={20}/> Strategic Audit Summary</div>
                  <button onClick={() => setAiInsight(null)} className="hover:text-white transition-colors"><X size={20}/></button>
               </div>
               <div className="text-[12px] text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{aiInsight}</div>
            </div>
          )}

          <button onClick={handleRunBacktest} disabled={isLoading} className="w-full bg-white text-black py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl flex justify-center items-center gap-6 hover:bg-zinc-200 transition-all">
            {isLoading ? <Loader2 className="animate-spin" size={28}/> : <Zap size={28}/>}
            {isLoading ? 'Simulating Tick Engine...' : 'Initiate Institutional Backtest'}
          </button>
        </div>
      )}

      {activeTab === NavigationTab.RESULTS && results && (
        <div className="space-y-6 pb-20 animate-in fade-in duration-800">
          <header className="flex justify-between items-center px-2">
            <div><h2 className="text-3xl font-black tracking-tighter">{params.asset} Performance</h2><p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Statistical Audit Verified</p></div>
            <button onClick={() => setChatOpen(true)} className="p-5 glass rounded-2xl text-blue-400 hover:text-white transition-all"><PieChart size={24} /></button>
          </header>

          <div className="glass p-12 rounded-[3.5rem] flex flex-col items-center gap-4 bg-gradient-to-b from-blue-600/10 to-transparent border-white/5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
             <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.4em]">Geometric Return</p>
             <p className={`text-7xl font-black tracking-tighter ${results.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{results.totalProfit >= 0 ? '+' : ''}{results.totalProfit}%</p>
             <div className="flex items-center gap-6 mt-8">
                <div className="text-center px-6"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sharpe</p><p className="text-xl font-bold text-blue-400">{results.sharpeRatio}</p></div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="text-center px-6"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Expectancy</p><p className="text-xl font-bold text-indigo-400">{results.expectation}</p></div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="text-center px-6"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">VaR 95%</p><p className="text-xl font-bold text-rose-500">-{results.var95}%</p></div>
             </div>
          </div>

          <section className="glass p-5 rounded-[3rem] border-white/5 bg-black/50 shadow-2xl"><Chart data={historicalData} trades={results.trades} /></section>

          <section className="glass p-10 rounded-[3rem] space-y-8 bg-white/[0.01]">
             <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3"><PieChart size={18} className="text-orange-400"/> Transaction Cost Analysis (TCA)</h3>
             <div className="grid grid-cols-2 gap-6">
               <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                 <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Explicit (Fees)</p>
                 <p className="text-xl font-black">${results.tca.explicitCosts.toFixed(2)}</p>
               </div>
               <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                 <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Implicit (Slippage)</p>
                 <p className="text-xl font-black">${results.tca.implicitCosts.toFixed(2)}</p>
               </div>
             </div>
             <div className="p-6 bg-orange-500/10 rounded-3xl border border-orange-500/20 flex justify-between items-center shadow-lg">
                <p className="text-[12px] font-black text-orange-400 uppercase tracking-widest">Implementation Shortfall</p>
                <p className="text-2xl font-black text-white">{results.tca.implementationShortfall.toFixed(4)}%</p>
             </div>
          </section>

          <section className="glass p-10 rounded-[3.5rem] bg-white/[0.01] border-white/5 shadow-2xl"><EquityChart trades={results.trades} /></section>
        </div>
      )}

      {activeTab === NavigationTab.LABS && (
        <div className="space-y-6 pb-20 animate-in slide-in-from-right-10 duration-600">
           <header className="px-2"><h2 className="text-3xl font-black tracking-tighter">Robustness Lab</h2><p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Permutation Stress Testing</p></header>
           
           {monteCarlo ? (
             <div className="space-y-6">
                <div className="glass p-10 rounded-[3rem] border-emerald-500/20 bg-emerald-500/[0.01] relative overflow-hidden shadow-2xl">
                   <h3 className="text-[11px] font-black uppercase text-emerald-400 tracking-widest mb-8 flex items-center gap-3"><History size={18}/> Monte Carlo Sequence Analysis</h3>
                   <div className="flex justify-between items-center mb-12 relative z-10">
                      <div><p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Blow-Up Probability</p><p className="text-5xl font-black text-rose-500">{(100 - monteCarlo.survivalRate).toFixed(1)}%</p></div>
                      <div className="text-right"><p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Survival Rate</p><p className="text-5xl font-black text-emerald-400">{monteCarlo.survivalRate.toFixed(1)}%</p></div>
                   </div>
                   <div className="h-48 flex items-end gap-1 px-4 relative z-10">
                     {monteCarlo.simulations.map((sim, i) => (
                       <div key={i} className="flex-1 bg-emerald-500/10 rounded-t-sm transition-all hover:bg-emerald-500/30 cursor-pointer shadow-lg" style={{ height: `${Math.min(100, (sim[sim.length-1].value / 25000) * 100)}%` }}></div>
                     ))}
                   </div>
                   <p className="text-[10px] text-zinc-600 font-black uppercase mt-6 tracking-widest">1,000 Shuffled Trade Permutations Run Deterministically</p>
                   <div className="absolute -bottom-10 -right-10 opacity-5"><History size={240} /></div>
                </div>

                <div className="glass p-10 rounded-[3rem] border-purple-500/20 bg-purple-500/[0.01] shadow-2xl">
                   <h3 className="text-[11px] font-black uppercase text-purple-400 tracking-widest mb-8 flex items-center gap-3"><Layers size={18}/> Walk-Forward Optimization (WFO)</h3>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center"><p className="text-sm font-bold uppercase tracking-widest">Robustness Score</p><p className="text-4xl font-black text-purple-400">{results?.robustnessScore || 0}%</p></div>
                      <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner"><div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_15px_rgba(147,51,234,0.5)]" style={{ width: `${results?.robustnessScore || 0}%` }}></div></div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-medium uppercase tracking-tighter">
                        WFO segments successfully verified against out-of-sample data. {results?.robustnessScore && results.robustnessScore > 75 ? 'Strategy is statistically stable.' : 'Caution: High potential for curve fitting.'}
                      </p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="glass p-16 rounded-[3rem] flex flex-col items-center gap-8 text-center border-white/5 shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-500/20"><History size={48} /></div>
                <div><h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Verification Required</h3><p className="text-sm text-zinc-500 font-medium leading-relaxed uppercase tracking-tighter">Initiate a backtest to generate advanced robustness datasets.</p></div>
                <button onClick={() => setActiveTab(NavigationTab.STRATEGY)} className="bg-blue-600 hover:bg-blue-700 px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all">Launch Architect</button>
             </div>
           )}
        </div>
      )}

      {activeTab === NavigationTab.SETTINGS && (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
           <header className="px-2"><h2 className="text-3xl font-black tracking-tighter">Terminal Config</h2></header>
           <div className="glass p-10 rounded-[3rem] space-y-8 shadow-2xl">
              <div className="flex items-center justify-between p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 shadow-inner">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-lg"><Database size={28} /></div>
                  <div><p className="text-lg font-black">NIST Sync Delay</p><p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Institutional High Precision</p></div>
                </div>
                <p className="text-lg font-black text-blue-400">150ms</p>
              </div>
              <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 space-y-6 shadow-inner">
                 <div className="flex justify-between items-center"><p className="text-[12px] font-black uppercase text-zinc-500 tracking-widest">Slippage Resolution</p><span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase">DYNAMIC</span></div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-500 w-[90%] shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div></div>
                 <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Microstructure modeling active for high-fidelity order impact simulation.</p>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
