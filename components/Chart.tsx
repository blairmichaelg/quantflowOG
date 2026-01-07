
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
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563eb',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2563eb',
        },
      },
      handleScroll: true,
      handleScale: true,
    };

    const chart = window.LightweightCharts.createChart(chartContainerRef.current, chartOptions);
    
    const candlestickSeries = chart.addSeries(window.LightweightCharts.CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data);

    // Clear previous price lines
    priceLinesRef.current.forEach(line => candlestickSeries.removePriceLine(line));
    priceLinesRef.current = [];

    // Map trades to markers and add distinct Entry visual indicators
    const markers = trades.map(t => {
      const isBuy = t.type === 'BUY';
      
      if (isBuy && t.price) {
        // 1. Horizontal entry price anchor line
        const priceLine = candlestickSeries.createPriceLine({
          price: t.price,
          color: 'rgba(34, 197, 94, 0.6)',
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `ENTRY $${t.price.toLocaleString()}`,
        });
        priceLinesRef.current.push(priceLine);

        // 2. Vertical time marker (using a marker at the top to highlight the candle)
        // Note: Lightweight charts doesn't have a native 'vertical line' tool, 
        // but we use a 'pin' shape to anchor exactly to the entry time.
        return {
          time: t.time,
          position: 'belowBar',
          color: '#22c55e',
          shape: 'arrowUp',
          text: `BUY @ ${t.price}`,
          size: 1.5,
        };
      } else {
        // Marker for Sell Exit (Indicator, Stop Loss, or Take Profit)
        const isSL = t.exitReason === 'STOP_LOSS';
        const isTP = t.exitReason === 'TAKE_PROFIT';
        
        let color = '#f59e0b'; // Default orange/amber for indicator signal
        let text = 'SIGNAL';
        
        if (isTP) {
          color = '#22c55e'; // Green
          text = 'TP';
        } else if (isSL) {
          color = '#ef4444'; // Red
          text = 'SL';
        }

        return {
          time: t.time,
          position: 'aboveBar',
          color: color,
          shape: 'arrowDown',
          text: `${text} (${t.profit}%)`,
          size: 1.2,
        };
      }
    });

    if (candlestickSeries && typeof candlestickSeries.setMarkers === 'function') {
      candlestickSeries.setMarkers(markers);
    }

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
      {/* Legend overlay for cleaner professional look */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Entry Precision: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
