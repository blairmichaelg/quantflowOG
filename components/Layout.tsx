
import React from 'react';
import { Home, LineChart, PieChart, Settings, FlaskConical } from 'lucide-react';
import { NavigationTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navItems = [
    { id: NavigationTab.HOME, icon: Home, label: 'Home' },
    { id: NavigationTab.STRATEGY, icon: LineChart, label: 'Strategy' },
    { id: NavigationTab.RESULTS, icon: PieChart, label: 'Results' },
    { id: NavigationTab.LABS, icon: FlaskConical, label: 'Labs' },
    { id: NavigationTab.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      <header className="px-6 py-8 flex justify-between items-center bg-gradient-to-b from-blue-900/10 to-transparent">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">QuantFlow</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Institutional Terminal</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/10">
          <span className="text-xs font-black">PRO</span>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 safe-area-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                activeTab === id ? 'text-blue-500 scale-110' : 'text-zinc-600'
              }`}
            >
              <Icon size={20} strokeWidth={activeTab === id ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
