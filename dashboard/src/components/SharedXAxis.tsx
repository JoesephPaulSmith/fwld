import { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { useDashboardStore } from '@/store/dashboardStore';
import { parseMonthDate, getForecastData } from '@/utils/dataProcessing';
import { format, endOfMonth } from 'date-fns';

export function SharedXAxis() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const timeRange = useDashboardStore((s) => s.timeRange);
  const showForecast = useDashboardStore((s) => s.showForecast);
  const lakesData = useDashboardStore((s) => s.lakesData);
  const lakeConfigs = useDashboardStore((s) => s.lakeConfigs);

  const option = useMemo(() => {
    const startDate = parseMonthDate(timeRange.start);
    let xAxisMax = parseMonthDate(timeRange.end);

    // Extend x-axis to cover forecast range, matching LakeChart behavior
    if (showForecast && lakesData) {
      const visibleIds = lakeConfigs.filter((c) => c.visible).map((c) => c.id);
      for (const lake of lakesData) {
        if (!visibleIds.includes(lake.lake)) continue;
        const forecastData = getForecastData(lake);
        if (forecastData?.series.monthly_forecast) {
          for (const point of forecastData.series.monthly_forecast) {
            const end = endOfMonth(parseMonthDate(point.date));
            if (end > xAxisMax) xAxisMax = end;
          }
        }
      }
    }

    return {
      grid: {
        left: 65,
        right: 20,
        top: 0,
        bottom: 50,
      },
      xAxis: {
        type: 'time' as const,
        min: startDate.getTime(),
        max: xAxisMax.getTime(),
        axisLabel: {
          formatter: (value: number) => {
            const d = new Date(value);
            const spanYears = (xAxisMax.getTime() - startDate.getTime()) / (365.25 * 24 * 3600 * 1000);
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
        axisLabel: {
          formatter: () => '000.00',
          fontSize: 10,
          color: 'transparent',
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [],
    };
  }, [timeRange, showForecast, lakesData, lakeConfigs]);

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
