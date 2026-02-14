import { useMemo } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { LakeChart } from './LakeChart';
import { SharedXAxis } from './SharedXAxis';
import {
  getWaterLevelData,
  getForecastData,
  convertDataToUnit,
  filterMonthlyData,
} from '@/utils/dataProcessing';
import { getUnitLabel } from '@/utils/unitConversion';
import type { Lake } from '@/types';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { parseMonthDate } from '@/utils/dataProcessing';

interface UseMediaQueryResult {
  isDesktop: boolean;
}

import React from 'react';

function useIsDesktop(): boolean {
  const mql = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
  const [isDesktop, setIsDesktop] = React.useState(mql?.matches ?? true);

  React.useEffect(() => {
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mql]);

  return isDesktop;
}

function useWindowHeight(): number {
  const [height, setHeight] = React.useState(window.innerHeight);

  React.useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    // Also listen for fullscreenchange since it may not fire resize immediately
    document.addEventListener('fullscreenchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onResize);
    };
  }, []);

  return height;
}

function computeLakeMinMax(
  lake: Lake,
  unitSystem: 'metric' | 'imperial',
  timeRange: { start: string; end: string },
  activeSeriesTypes: string[],
  showForecast: boolean,
): { min: number; max: number } | null {
  const waterLevelData = getWaterLevelData(lake);
  if (!waterLevelData) return null;

  let allValues: number[] = [];

  // Monthly
  if (activeSeriesTypes.includes('monthly')) {
    const filtered = filterMonthlyData(waterLevelData.series.monthly, timeRange);
    allValues.push(...filtered.map((p) => convertDataToUnit(p.value, unitSystem)));
  }

  // Annual
  if (activeSeriesTypes.includes('annual') && waterLevelData.series.annual) {
    const startYear = parseMonthDate(timeRange.start).getFullYear();
    const endYear = parseMonthDate(timeRange.end).getFullYear();
    for (const point of waterLevelData.series.annual) {
      const year = parseInt(point.date, 10);
      if (year >= startYear && year <= endYear) {
        allValues.push(convertDataToUnit(point.value, unitSystem));
      }
    }
  }

  // Period of record mean
  if (activeSeriesTypes.includes('period_of_record_mean') && waterLevelData.series.period_of_record_mean) {
    allValues.push(convertDataToUnit(waterLevelData.series.period_of_record_mean, unitSystem));
  }

  // Record max/min/mean
  if (waterLevelData.series.calendar_month_records) {
    const startDate = parseMonthDate(timeRange.start);
    const endDate = parseMonthDate(timeRange.end);
    let currentDate = startOfMonth(startDate);

    while (currentDate <= endDate) {
      const month = (currentDate.getMonth() + 1).toString();
      const record = waterLevelData.series.calendar_month_records[month];
      if (record) {
        if (activeSeriesTypes.includes('record_max')) allValues.push(convertDataToUnit(record.max.value, unitSystem));
        if (activeSeriesTypes.includes('record_min')) allValues.push(convertDataToUnit(record.min.value, unitSystem));
        if (activeSeriesTypes.includes('record_mean')) allValues.push(convertDataToUnit(record.mean.value, unitSystem));
      }
      currentDate = addMonths(currentDate, 1);
    }
  }

  // Forecast
  if (showForecast) {
    const forecastData = getForecastData(lake);
    if (forecastData?.series.monthly_forecast) {
      for (const point of forecastData.series.monthly_forecast) {
        allValues.push(convertDataToUnit(point.forecast_low, unitSystem));
        allValues.push(convertDataToUnit(point.forecast_high, unitSystem));
      }
    }
  }

  if (allValues.length === 0) return null;

  return {
    min: Math.min(...allValues),
    max: Math.max(...allValues),
  };
}

export function LakeCharts() {
  const lakesData = useDashboardStore((state) => state.lakesData);
  const lakeConfigs = useDashboardStore((state) => state.lakeConfigs);
  const unitSystem = useDashboardStore((state) => state.unitSystem);
  const timeRange = useDashboardStore((state) => state.timeRange);
  const activeSeriesTypes = useDashboardStore((state) => state.activeSeriesTypes);
  const showForecast = useDashboardStore((state) => state.showForecast);
  const verticalRange = useDashboardStore((state) => state.verticalRange);
  const isDesktop = useIsDesktop();
  const windowHeight = useWindowHeight();

  if (!lakesData) {
    return (
      <div className="text-center py-10 text-gray-500">
        No data available
      </div>
    );
  }

  const visibleConfigs = lakeConfigs.filter((c) => c.visible);

  if (visibleConfigs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Select at least one lake to display
      </div>
    );
  }

  // Compute unified vertical scale
  const lakeMinMaxes = useMemo(() => {
    const results: { lakeId: string; min: number; max: number }[] = [];
    for (const config of visibleConfigs) {
      const lake = lakesData.find((l) => l.lake === config.id);
      if (!lake) continue;
      const minMax = computeLakeMinMax(lake, unitSystem, timeRange, activeSeriesTypes, showForecast);
      if (minMax) results.push({ lakeId: config.id, ...minMax });
    }
    return results;
  }, [lakesData, visibleConfigs, unitSystem, timeRange, activeSeriesTypes, showForecast]);

  // Determine the uniform range
  const uniformRange = useMemo(() => {
    if (verticalRange !== null) return verticalRange;
    if (lakeMinMaxes.length === 0) return null;
    return Math.max(...lakeMinMaxes.map((mm) => mm.max - mm.min));
  }, [lakeMinMaxes, verticalRange]);

  // Compute per-lake yMin/yMax to achieve uniform range
  const lakeScales = useMemo(() => {
    if (uniformRange === null) return {};
    const scales: Record<string, { yMin: number; yMax: number }> = {};
    for (const mm of lakeMinMaxes) {
      const currentRange = mm.max - mm.min;
      const padding = (uniformRange - currentRange) / 2;
      scales[mm.lakeId] = {
        yMin: mm.min - padding,
        yMax: mm.max + padding,
      };
    }
    return scales;
  }, [lakeMinMaxes, uniformRange]);

  // Compute chart height for desktop: fill available viewport reactively
  // Header ~52px, TimeSlider ~100px, SharedXAxis ~65px + 8px margin, some padding
  const chartCount = visibleConfigs.length;
  const desktopChartHeight = isDesktop
    ? Math.max(80, Math.floor((windowHeight - 52 - 100 - 73 - 16) / chartCount))
    : 280;

  const unitLabel = getUnitLabel(unitSystem);

  if (isDesktop) {
    return (
      <div className="flex">
        {/* Primary Y-axis label */}
        <div className="flex items-center justify-center w-8 shrink-0">
          <span
            className="text-xs text-gray-600 font-medium whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Surface water elevation ({unitSystem === 'metric' ? 'meters' : 'feet'}: IGLD-85)
          </span>
        </div>

        {/* Charts column */}
        <div className="flex-1 min-w-0">
          {visibleConfigs.map((config) => {
            const lake = lakesData.find((l) => l.lake === config.id);
            if (!lake) return null;
            const scale = lakeScales[config.id];

            return (
              <LakeChart
                key={config.id}
                lake={lake}
                config={config}
                height={desktopChartHeight}
                hideXAxis={true}
                showLakeNameAsYLabel={true}
                yMin={scale?.yMin}
                yMax={scale?.yMax}
              />
            );
          })}
          <SharedXAxis />
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="space-y-4">
      {visibleConfigs.map((config) => {
        const lake = lakesData.find((l) => l.lake === config.id);
        if (!lake) return null;
        const scale = lakeScales[config.id];

        return (
          <LakeChart
            key={config.id}
            lake={lake}
            config={config}
            yMin={scale?.yMin}
            yMax={scale?.yMax}
          />
        );
      })}
    </div>
  );
}
