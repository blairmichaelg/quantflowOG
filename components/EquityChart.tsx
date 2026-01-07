
import React, { useEffect, useRef } from 'react';
import { Trade } from '../types';

declare const window: any;

interface EquityChartProps {
  trades: Trade[];
}

export const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

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
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    };

    const chart = window.LightweightCharts.createChart(chartContainerRef.current, chartOptions);
    
    // Baseline series is perfect for showing growth relative to a zero-line
    const baselineSeries = chart.addSeries(window.LightweightCharts.BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: 'rgba(34, 197, 94, 1)',
      topFillColor1: 'rgba(34, 197, 94, 0.2)',
      topFillColor2: 'rgba(34, 197, 94, 0.0)',
      bottomLineColor: 'rgba(239, 68, 68, 1)',
      bottomFillColor1: 'rgba(239, 68, 68, 0.0)',
      bottomFillColor2: 'rgba(239, 68, 68, 0.2)',
      lineWidth: 2,
      crosshairMarkerVisible: true,
    });

    // Prepare cumulative data
    let cumulative = 0;
    const sellTrades = trades.filter(t => t.type === 'SELL').sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    const equityData = sellTrades.map(t => {
      cumulative += (t.profit || 0);
      return {
        time: t.time.split(' ')[0], // Ensure just date for daily scale consistency
        value: Number(cumulative.toFixed(2))
      };
    });

    if (equityData.length > 0) {
      baselineSeries.setData(equityData);
      chart.timeScale().fitContent();
    }

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
  }, [trades]);

  return (
    <div className="w-full h-[180px]" ref={chartContainerRef} />
  );
};
