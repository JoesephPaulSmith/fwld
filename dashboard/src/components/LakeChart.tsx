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

// Series colors
const COLORS = {
  monthly: '#00AAFF',
  annual: '#0000FF',
  periodOfRecord: '#FF0000',
  forecast: '#f59e0b',
  recordMax: '#dc2626',
  recordMin: '#2563eb',
  recordMean: '#16a34a',
};

interface LakeChartProps {
  lake: Lake;
  config: LakeConfig;
}

export function LakeChart({ lake, config }: LakeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const unitSystem = useDashboardStore((state) => state.unitSystem);
  const timeRange = useDashboardStore((state) => state.timeRange);
  const activeSeriesTypes = useDashboardStore((state) => state.activeSeriesTypes);
  const showForecast = useDashboardStore((state) => state.showForecast);

  const chartOption = useMemo(() => {
    const waterLevelData = getWaterLevelData(lake);
    if (!waterLevelData) return null;

    const series: echarts.SeriesOption[] = [];
    const startDate = parseMonthDate(timeRange.start);
    const endDate = parseMonthDate(timeRange.end);

    // Track the max date for x-axis (may extend beyond endDate for forecast)
    let xAxisMax = endDate;

    // Monthly averages - disconnected horizontal segments for each month
    if (activeSeriesTypes.includes('monthly')) {
      const filteredMonthly = filterMonthlyData(
        waterLevelData.series.monthly,
        timeRange
      );

      // Use null gaps to create disconnected segments
      const monthlyData: ([number, number] | { value: [number, number | null] })[] = [];

      for (let i = 0; i < filteredMonthly.length; i++) {
        const point = filteredMonthly[i];
        const date = parseMonthDate(point.date);
        const value = convertDataToUnit(point.value, unitSystem);
        const start = startOfMonth(date).getTime();
        const end = endOfMonth(date).getTime();

        monthlyData.push([start, value]);
        monthlyData.push([end, value]);
        // Add null gap after each segment (except last)
        if (i < filteredMonthly.length - 1) {
          monthlyData.push({ value: [end + 1, null] });
        }
      }

      series.push({
        name: 'Monthly Average',
        type: 'line',
        data: monthlyData,
        lineStyle: {
          color: COLORS.monthly,
          width: 2,
        },
        symbol: 'none',
        connectNulls: false,
        z: 10,
      });
    }

    // Annual averages - disconnected horizontal segments for each year
    if (activeSeriesTypes.includes('annual') && waterLevelData.series.annual) {
      const annualData: ([number, number] | { value: [number, number | null] })[] = [];
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      let segmentCount = 0;

      for (const point of waterLevelData.series.annual) {
        const year = parseInt(point.date, 10);

        // Check if year is within or overlaps the selected range
        if (year >= startYear && year <= endYear) {
          const value = convertDataToUnit(point.value, unitSystem);
          const yearStart = startOfYear(new Date(year, 0, 1));
          const yearEnd = endOfYear(new Date(year, 0, 1));

          // Clip to visible range
          const visibleStart = yearStart < startDate ? startDate : yearStart;
          const visibleEnd = yearEnd > endDate ? endDate : yearEnd;

          // Add null gap before this segment (if not first)
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
        lineStyle: {
          color: COLORS.annual,
          width: 4,
          opacity: 0.7,
        },
        symbol: 'none',
        connectNulls: false,
        z: 8,
      });
    }

    // Period of record mean - single horizontal line across entire range
    if (activeSeriesTypes.includes('period_of_record_mean') && waterLevelData.series.period_of_record_mean) {
      const mean = convertDataToUnit(waterLevelData.series.period_of_record_mean, unitSystem);

      series.push({
        name: 'Period of Record Mean',
        type: 'line',
        data: [
          [startDate.getTime(), mean],
          [endDate.getTime(), mean],
        ],
        lineStyle: {
          color: COLORS.periodOfRecord,
          width: 2,
        },
        symbol: 'none',
        z: 5,
      });
    }

    // Record max by month - disconnected segments
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

          if (segmentCount > 0) {
            recordMaxData.push({ value: [start - 1, null] });
          }
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
        lineStyle: {
          color: COLORS.recordMax,
          width: 1.5,
        },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Record min by month - disconnected segments
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

          if (segmentCount > 0) {
            recordMinData.push({ value: [start - 1, null] });
          }
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
        lineStyle: {
          color: COLORS.recordMin,
          width: 1.5,
        },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Record mean by month - disconnected segments
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

          if (segmentCount > 0) {
            recordMeanData.push({ value: [start - 1, null] });
          }
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
        lineStyle: {
          color: COLORS.recordMean,
          width: 1.5,
        },
        symbol: 'none',
        connectNulls: false,
        z: 3,
      });
    }

    // Forecast - show as floating bars (rectangles)
    if (showForecast) {
      const forecastData = getForecastData(lake);
      if (forecastData?.series.monthly_forecast) {
        // Collect forecast bar data: [startTime, endTime, low, high]
        const forecastBarData: [number, number, number, number][] = [];

        for (const point of forecastData.series.monthly_forecast) {
          const date = parseMonthDate(point.date);
          const high = convertDataToUnit(point.forecast_high, unitSystem);
          const low = convertDataToUnit(point.forecast_low, unitSystem);
          const start = startOfMonth(date).getTime();
          const end = endOfMonth(date).getTime();

          forecastBarData.push([start, end, low, high]);

          // Extend x-axis to show forecast
          if (endOfMonth(date) > xAxisMax) {
            xAxisMax = endOfMonth(date);
          }
        }

        // Custom series for floating bars
        series.push({
          name: 'Forecast Range',
          type: 'custom',
          data: forecastBarData,
          renderItem: (_params, api) => {
            const startX = api.coord([api.value(0), 0])[0];
            const endX = api.coord([api.value(1), 0])[0];
            const lowY = api.coord([0, api.value(2)])[1];
            const highY = api.coord([0, api.value(3)])[1];

            const width = endX - startX;
            const height = lowY - highY;

            return {
              type: 'rect',
              shape: {
                x: startX,
                y: highY,
                width: width,
                height: height,
              },
              style: {
                fill: COLORS.forecast,
                opacity: 0.4,
                stroke: COLORS.forecast,
                lineWidth: 1,
              },
            };
          },
          z: 12,
          encode: {
            x: [0, 1],
            y: [2, 3],
          },
        });
      }
    }

    const unitLabel = unitSystem === 'metric' ? 'm' : 'ft';

    const option: echarts.EChartsOption = {
      title: {
        text: lake.name,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1E1C18',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#999',
            width: 1,
            type: 'dashed',
          },
        },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const firstParam = params[0] as { axisValue: number };
          const date = new Date(firstParam.axisValue);
          let content = `<div style="font-weight:bold;margin-bottom:4px">${format(date, 'MMMM yyyy')}</div>`;

          // Collect all series values
          const items = params as Array<{
            seriesName: string;
            value: [number, number] | [number, number, number, number];
            color: string;
            seriesType: string;
          }>;

          // Group by series name (since each segment has 2 points)
          const seen = new Set<string>();
          for (const item of items) {
            if (!seen.has(item.seriesName)) {
              seen.add(item.seriesName);
              // Create custom marker: line segment for lines, square for forecast
              const isCustom = item.seriesType === 'custom';
              const marker = isCustom
                ? `<span style="display:inline-block;width:12px;height:12px;background:${item.color};opacity:0.6;margin-right:4px;"></span>`
                : `<span style="display:inline-block;width:16px;height:3px;background:${item.color};margin-right:4px;vertical-align:middle;"></span>`;

              // Handle forecast range (4 values) vs regular series (2 values)
              let valueText = '';
              if (isCustom && Array.isArray(item.value) && item.value.length === 4) {
                const low = item.value[2];
                const high = item.value[3];
                valueText = `${low.toFixed(2)} - ${high.toFixed(2)} ${unitLabel}`;
              } else if (item.value && typeof item.value[1] === 'number') {
                valueText = `${item.value[1].toFixed(2)} ${unitLabel}`;
              } else {
                continue;
              }

              content += `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center">`;
              content += `<span>${marker}${item.seriesName}:</span>`;
              content += `<span style="font-weight:500">${valueText}</span>`;
              content += `</div>`;
            }
          }
          return content;
        },
      },
      legend: {
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
        top: 45,
        bottom: 50,
      },
      xAxis: {
        type: 'time',
        min: startDate.getTime(),
        max: xAxisMax.getTime(),
        axisLabel: {
          formatter: (value: number) => format(new Date(value), 'MMM yyyy'),
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: getUnitLabel(unitSystem),
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: { fontSize: 11 },
        axisLabel: {
          formatter: (value: number) => value.toFixed(2),
          fontSize: 10,
        },
        scale: true,
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
        },
      ],
      series,
    };

    return option;
  }, [lake, config, unitSystem, timeRange, activeSeriesTypes, showForecast]);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (chartOption) {
      chartInstance.current.setOption(chartOption, true);
    }
  }, [chartOption]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className="w-full h-[280px] bg-white rounded-lg shadow-sm border border-gray-200"
    />
  );
}
