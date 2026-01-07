
import React, { useEffect, useRef } from 'react';
import { Candle, Trade } from '../types';

declare const window: any;

interface ChartProps {
  data: Candle[];
  trades: Trade[];
}

export const Chart: React.FC<ChartProps> = ({ data, trades }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current || !window.LightweightCharts) return;

    const chartOptions = {
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d4dc',
        fontSize: 10,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, labelBackgroundColor: '#2563eb' },
        horzLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, labelBackgroundColor: '#2563eb' },
      },
    };

    const chart = window.LightweightCharts.createChart(chartContainerRef.current, chartOptions);
    
    const candlestickSeries = chart.addSeries(window.LightweightCharts.CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data);

    // Simulated "Ghost Support/Resistance" (Dark Pool Activity)
    const ghostLevels = [
      { price: data[Math.floor(data.length * 0.3)].close * 1.05, title: 'DARK POOL RES' },
      { price: data[Math.floor(data.length * 0.7)].close * 0.95, title: 'DARK POOL SUP' }
    ];

    ghostLevels.forEach(lvl => {
      candlestickSeries.createPriceLine({
        price: lvl.price, color: 'rgba(147, 51, 234, 0.2)', lineWidth: 1, lineStyle: 3, axisLabelVisible: true, title: lvl.title,
      });
    });

    const markers = trades.map(t => {
      const isBuy = t.type === 'BUY';
      return {
        time: t.time.includes(' ') ? t.time : t.time, // Handle both formats
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#22c55e' : '#ef4444',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: isBuy ? `BUY @ ${t.price}` : `${t.profit}%`,
        size: isBuy ? 1.5 : 1.2,
      };
    });

    candlestickSeries.setMarkers(markers);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, trades]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full h-[350px]" />
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-white/5">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Real-time Latency: 150ms</span>
        </div>
      </div>
    </div>
  );
};
