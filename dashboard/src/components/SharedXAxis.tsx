import { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { useDashboardStore } from '@/store/dashboardStore';
import { parseMonthDate } from '@/utils/dataProcessing';
import { format } from 'date-fns';

export function SharedXAxis() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const timeRange = useDashboardStore((s) => s.timeRange);

  const option = useMemo(() => {
    const startDate = parseMonthDate(timeRange.start);
    const endDate = parseMonthDate(timeRange.end);

    return {
      grid: {
        left: 55,
        right: 20,
        top: 0,
        bottom: 50,
      },
      xAxis: {
        type: 'time' as const,
        min: startDate.getTime(),
        max: endDate.getTime(),
        axisLabel: {
          formatter: (value: number) => {
            const d = new Date(value);
            const spanYears = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 3600 * 1000);
            return spanYears > 5 ? format(d, 'yyyy') : format(d, 'MMM yyyy');
          },
          fontSize: 10,
          rotate: 35,
        },
        axisLine: { show: true },
        axisTick: { show: true },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        show: false,
      },
      series: [],
    };
  }, [timeRange]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    chartInstance.current.setOption(option, true);
  }, [option]);

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return <div ref={chartRef} className="w-full h-[65px] mb-2" />;
}
