
import React from 'react';
import { Home, LineChart, PieChart, Settings } from 'lucide-react';
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
    { id: NavigationTab.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      <header className="px-6 py-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QuantFlow</h1>
          <p className="text-xs text-zinc-500 font-medium">STRATEGY LAB PRO</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
          <span className="text-sm font-bold">JD</span>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 safe-area-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${
                activeTab === id ? 'text-blue-500' : 'text-zinc-500'
              }`}
            >
              <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
