import { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { useDashboardStore } from '@/store/dashboardStore';
import {
  getWaterLevelData,
  getForecastData,
  convertDataToUnit,
  parseMonthDate,
  filterMonthlyData,
} from '@/utils/dataProcessing';
import { getUnitLabel } from '@/utils/unitConversion';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths } from 'date-fns';
import type { Lake, LakeConfig } from '@/types';

interface LakeChartProps {
  lake: Lake;
  config: LakeConfig;
  height?: number;
  hideXAxis?: boolean;
  showLakeNameAsYLabel?: boolean;
  yMin?: number;
  yMax?: number;
}

export function LakeChart({ lake, config, height, hideXAxis, showLakeNameAsYLabel, yMin, yMax }: LakeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const unitSystem = useDashboardStore((state) => state.unitSystem);
  const timeRange = useDashboardStore((state) => state.timeRange);
  const activeSeriesTypes = useDashboardStore((state) => state.activeSeriesTypes);
  const showForecast = useDashboardStore((state) => state.showForecast);
  const seriesColors = useDashboardStore((state) => state.seriesColors);
  const backgroundColor = useDashboardStore((state) => state.backgroundColor);

  const chartOption = useMemo(() => {
    const waterLevelData = getWaterLevelData(lake);
    if (!waterLevelData) return null;

    const COLORS = seriesColors;
    const series: echarts.SeriesOption[] = [];
    const startDate = parseMonthDate(timeRange.start);
    const endDate = parseMonthDate(timeRange.end);

    let xAxisMax = endDate;

    // Monthly averages
    if (activeSeriesTypes.includes('monthly')) {
      const filteredMonthly = filterMonthlyData(waterLevelData.series.monthly, timeRange);
      const monthlyData: ([number, number] | { value: [number, number | null] })[] = [];

      for (let i = 0; i < filteredMonthly.length; i++) {
        const point = filteredMonthly[i];
        const date = parseMonthDate(point.date);
        const value = convertDataToUnit(point.value, unitSystem);
        const start = startOfMonth(date).getTime();
        const end = endOfMonth(date).getTime();

        monthlyData.push([start, value]);
        monthlyData.push([end, value]);
        if (i < filteredMonthly.length - 1) {
          monthlyData.push({ value: [end + 1, null] });
        }
      }

      series.push({
        name: 'Monthly Average',
        type: 'line',
        data: monthlyData,
        lineStyle: { color: COLORS.monthly, width: 2 },
        itemStyle: { color: COLORS.monthly },
        symbol: 'none',
        connectNulls: false,
        z: 10,
      });
    }

    // Annual averages
    if (activeSeriesTypes.includes('annual') && waterLevelData.series.annual) {
      const annualData: ([number, number] | { value: [number, number | null] })[] = [];
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      let segmentCount = 0;

      for (const point of waterLevelData.series.annual) {
        const year = parseInt(point.date, 10);
        if (year >= startYear && year <= endYear) {
          const value = convertDataToUnit(point.value, unitSystem);
          const yearStart = startOfYear(new Date(year, 0, 1));
          const yearEnd = endOfYear(new Date(year, 0, 1));
          const visibleStart = yearStart < startDate ? startDate : yearStart;
          const visibleEnd = yearEnd > endDate ? endDate : yearEnd;

          if (segmentCount > 0) {
            annualData.push({ value: [visibleStart.getTime() - 1, null] });
          }
          annualData.push([visibleStart.getTime(), value]);
          annualData.push([visibleEnd.getTime(), value]);
          segmentCount++;
        }
      }

      series.push({
        name: 'Annual Average',
        type: 'line',
        data: annualData,
        lineStyle: { color: COLORS.annual, width: 4, opacity: 0.7 },
        itemStyle: { color: COLORS.annual },
        symbol: 'none',
        connectNulls: false,
        z: 8,
      });
    }

    // Period of record mean
    if (activeSeriesTypes.includes('period_of_record_mean') && waterLevelData.series.period_of_record_mean) {
      const mean = convertDataToUnit(waterLevelData.series.period_of_record_mean, unitSystem);
      series.push({
        name: 'Period of Record Mean',
        type: 'line',
        data: [[startDate.getTime(), mean], [endDate.getTime(), mean]],
        lineStyle: { color: COLORS.period_of_record_mean, width: 2 },
        itemStyle: { color: COLORS.period_of_record_mean },
        symbol: 'none',
        z: 5,
      });
    }

    // Record max
    if (activeSeriesTypes.includes('record_max') && waterLevelData.series.calendar_month_records) {
      const recordMaxData: ([number, number] | { value: [number, number | null] })[] = [];
      let currentDate = startOfMonth(startDate);
      let segmentCount = 0;

      while (currentDate <= endDate) {
        const month = (currentDate.getMonth() + 1).toString();
        const record = waterLevelData.series.calendar_month_records[month];
        if (record) {
          const value = convertDataToUnit(record.max.value, unitSystem);
          const start = startOfMonth(currentDate).getTime();
          const end = endOfMonth(currentDate).getTime();
          if (segmentCount > 0) recordMaxData.push({ value: [start - 1, null] });
          recordMaxData.push([start, value]);
          recordMaxData.push([end, value]);
          segmentCount++;
        }
        currentDate = addMonths(currentDate, 1);
      }

      series.push({
        name: 'Record Maximum',
        type: 'line',
        data: recordMaxData,
        lineStyle: { color: COLORS.record_max, width: 1.5 },
        itemStyle: { color: COLORS.record_max },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Record min
    if (activeSeriesTypes.includes('record_min') && waterLevelData.series.calendar_month_records) {
      const recordMinData: ([number, number] | { value: [number, number | null] })[] = [];
      let currentDate = startOfMonth(startDate);
      let segmentCount = 0;

      while (currentDate <= endDate) {
        const month = (currentDate.getMonth() + 1).toString();
        const record = waterLevelData.series.calendar_month_records[month];
        if (record) {
          const value = convertDataToUnit(record.min.value, unitSystem);
          const start = startOfMonth(currentDate).getTime();
          const end = endOfMonth(currentDate).getTime();
          if (segmentCount > 0) recordMinData.push({ value: [start - 1, null] });
          recordMinData.push([start, value]);
          recordMinData.push([end, value]);
          segmentCount++;
        }
        currentDate = addMonths(currentDate, 1);
      }

      series.push({
        name: 'Record Minimum',
        type: 'line',
        data: recordMinData,
        lineStyle: { color: COLORS.record_min, width: 1.5 },
        itemStyle: { color: COLORS.record_min },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Record mean
    if (activeSeriesTypes.includes('record_mean') && waterLevelData.series.calendar_month_records) {
      const recordMeanData: ([number, number] | { value: [number, number | null] })[] = [];
      let currentDate = startOfMonth(startDate);
      let segmentCount = 0;

      while (currentDate <= endDate) {
        const month = (currentDate.getMonth() + 1).toString();
        const record = waterLevelData.series.calendar_month_records[month];
        if (record) {
          const value = convertDataToUnit(record.mean.value, unitSystem);
          const start = startOfMonth(currentDate).getTime();
          const end = endOfMonth(currentDate).getTime();
          if (segmentCount > 0) recordMeanData.push({ value: [start - 1, null] });
          recordMeanData.push([start, value]);
          recordMeanData.push([end, value]);
          segmentCount++;
        }
        currentDate = addMonths(currentDate, 1);
      }

      series.push({
        name: 'Record Mean',
        type: 'line',
        data: recordMeanData,
        lineStyle: { color: COLORS.record_mean, width: 1.5 },
        itemStyle: { color: COLORS.record_mean },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Forecast
    if (showForecast) {
      const forecastData = getForecastData(lake);
      if (forecastData?.series.monthly_forecast) {
        const forecastBarData: [number, number, number, number][] = [];

        for (const point of forecastData.series.monthly_forecast) {
          const date = parseMonthDate(point.date);
          const high = convertDataToUnit(point.forecast_high, unitSystem);
          const low = convertDataToUnit(point.forecast_low, unitSystem);
          const start = startOfMonth(date).getTime();
          const end = endOfMonth(date).getTime();
          forecastBarData.push([start, end, low, high]);
          if (endOfMonth(date) > xAxisMax) xAxisMax = endOfMonth(date);
        }

        series.push({
          name: 'Forecast Range',
          type: 'custom',
          data: forecastBarData,
          renderItem: (_params, api) => {
            const startX = api.coord([api.value(0), 0])[0];
            const endX = api.coord([api.value(1), 0])[0];
            const lowY = api.coord([0, api.value(2)])[1];
            const highY = api.coord([0, api.value(3)])[1];
            return {
              type: 'rect',
              shape: { x: startX, y: highY, width: endX - startX, height: lowY - highY },
              style: { fill: COLORS.forecast, opacity: 0.4, stroke: COLORS.forecast, lineWidth: 1 },
            };
          },
          itemStyle: { color: COLORS.forecast },
          z: 12,
          encode: { x: [0, 1], y: [2, 3] },
        });
      }
    }

    const unitLabel = unitSystem === 'metric' ? 'm' : 'ft';

    const option: echarts.EChartsOption = {
      title: hideXAxis ? undefined : {
        text: lake.name,
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#1E1C18' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: '#999', width: 1, type: 'dashed' },
        },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const firstParam = params[0] as { axisValue: number };
          const date = new Date(firstParam.axisValue);
          let content = `<div style="font-weight:bold;margin-bottom:4px">${format(date, 'MMMM yyyy')}</div>`;
          const items = params as Array<{
            seriesName: string;
            value: [number, number] | [number, number, number, number];
            color: string;
            seriesType: string;
          }>;
          const seen = new Set<string>();
          for (const item of items) {
            if (!seen.has(item.seriesName)) {
              seen.add(item.seriesName);
              const isCustom = item.seriesType === 'custom';
              const marker = isCustom
                ? `<span style="display:inline-block;width:12px;height:12px;background:${item.color};opacity:0.6;margin-right:4px;"></span>`
                : `<span style="display:inline-block;width:16px;height:3px;background:${item.color};margin-right:4px;vertical-align:middle;"></span>`;
              let valueText = '';
              if (isCustom && Array.isArray(item.value) && item.value.length === 4) {
                valueText = `${item.value[2].toFixed(2)} - ${item.value[3].toFixed(2)} ${unitLabel}`;
              } else if (item.value && typeof item.value[1] === 'number') {
                valueText = `${item.value[1].toFixed(2)} ${unitLabel}`;
              } else {
                continue;
              }
              content += `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center">`;
              content += `<span>${marker}${item.seriesName}:</span>`;
              content += `<span style="font-weight:500">${valueText}</span></div>`;
            }
          }
          return content;
        },
      },
      legend: hideXAxis ? { show: false } : {
        data: series.map((s) => s.name as string),
        bottom: 0,
        textStyle: { fontSize: 10 },
        icon: 'rect',
        itemWidth: 16,
        itemHeight: 3,
      },
      grid: {
        left: 55,
        right: 20,
        top: hideXAxis ? 10 : 45,
        bottom: hideXAxis ? 5 : 70,
      },
      xAxis: {
        type: 'time',
        min: startDate.getTime(),
        max: xAxisMax.getTime(),
        show: !hideXAxis,
        axisLabel: {
          formatter: (value: number) => {
            const d = new Date(value);
            const spanYears = (xAxisMax.getTime() - startDate.getTime()) / (365.25 * 24 * 3600 * 1000);
            return spanYears > 5 ? format(d, 'yyyy') : format(d, 'MMM yyyy');
          },
          fontSize: 10,
          rotate: 35,
        },
      },
      yAxis: {
        type: 'value',
        name: showLakeNameAsYLabel ? lake.name.replace(/^Lakes?\s+/, '') : (hideXAxis ? '' : getUnitLabel(unitSystem)),
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: { fontSize: showLakeNameAsYLabel ? 12 : 11, fontWeight: showLakeNameAsYLabel ? 'bold' as const : 'normal' as const },
        axisLabel: {
          formatter: (value: number) => value.toFixed(2),
          fontSize: 10,
        },
        min: yMin,
        max: yMax,
        scale: yMin === undefined,
      },
      dataZoom: [],
      series,
    };

    return option;
  }, [lake, config, unitSystem, timeRange, activeSeriesTypes, showForecast, seriesColors, hideXAxis, showLakeNameAsYLabel, yMin, yMax]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    if (chartOption) {
      chartInstance.current.setOption(chartOption, true);
    }
  }, [chartOption]);

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

  // Resize when height changes
  useEffect(() => {
    chartInstance.current?.resize();
  }, [height]);

  return (
    <div
      ref={chartRef}
      className="w-full shadow-sm border border-gray-200"
      style={{
        height: height ? `${height}px` : '320px',
        backgroundColor,
      }}
    />
  );
}
