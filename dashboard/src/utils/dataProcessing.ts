import { format, parse, isWithinInterval, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import type {
  Lake,
  LakeId,
  TimeRange,
  DataSeriesType,
  WaterLevelData,
  ForecastData,
  MonthlyDataPoint,
  UnitSystem
} from '@/types';
import { metersToFeet } from './unitConversion';

export function parseMonthDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM', new Date());
}

export function formatMonthDate(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function isDateInRange(dateStr: string, range: TimeRange): boolean {
  const date = parseMonthDate(dateStr);
  const start = startOfMonth(parseMonthDate(range.start));
  const end = endOfMonth(parseMonthDate(range.end));
  return isWithinInterval(date, { start, end });
}

export function getWaterLevelData(lake: Lake): WaterLevelData | undefined {
  return lake.data.find(
    (d): d is WaterLevelData => d.type === 'lakewide_average_water_level'
  );
}

export function getForecastData(lake: Lake): ForecastData | undefined {
  return lake.data.find(
    (d): d is ForecastData => d.type === 'coordinated_forecast'
  );
}

export function filterMonthlyData(
  data: MonthlyDataPoint[],
  timeRange: TimeRange
): MonthlyDataPoint[] {
  return data.filter((point) => isDateInRange(point.date, timeRange));
}

export function convertDataToUnit(
  value: number,
  unitSystem: UnitSystem
): number {
  return unitSystem === 'imperial' ? metersToFeet(value) : value;
}

export interface ChartDataPoint {
  date: Date;
  dateStr: string;
  [key: string]: number | Date | string | undefined;
}

export interface MonthlyChartSegment {
  lakeId: LakeId;
  lakeName: string;
  color: string;
  data: Array<{
    startDate: Date;
    endDate: Date;
    value: number;
    dateStr: string;
  }>;
}

export function prepareMonthlyChartData(
  lakes: Lake[],
  visibleLakes: LakeId[],
  timeRange: TimeRange,
  unitSystem: UnitSystem
): MonthlyChartSegment[] {
  const segments: MonthlyChartSegment[] = [];

  for (const lake of lakes) {
    if (!visibleLakes.includes(lake.lake)) continue;

    const waterLevelData = getWaterLevelData(lake);
    if (!waterLevelData) continue;

    const filteredData = filterMonthlyData(
      waterLevelData.series.monthly,
      timeRange
    );

    const segmentData = filteredData.map((point) => {
      const date = parseMonthDate(point.date);
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
        value: convertDataToUnit(point.value, unitSystem),
        dateStr: point.date,
      };
    });

    segments.push({
      lakeId: lake.lake,
      lakeName: lake.name,
      color: getLakeColor(lake.lake),
      data: segmentData,
    });
  }

  return segments;
}

export interface RecordLineData {
  month: number;
  mean: number;
  max: number;
  min: number;
}

export function prepareRecordData(
  lake: Lake,
  unitSystem: UnitSystem
): RecordLineData[] {
  const waterLevelData = getWaterLevelData(lake);
  if (!waterLevelData) return [];

  const records = waterLevelData.series.calendar_month_records;
  return Object.entries(records).map(([month, stats]) => ({
    month: parseInt(month),
    mean: convertDataToUnit(stats.mean.value, unitSystem),
    max: convertDataToUnit(stats.max.value, unitSystem),
    min: convertDataToUnit(stats.min.value, unitSystem),
  }));
}

export interface ForecastChartData {
  lakeId: LakeId;
  lakeName: string;
  color: string;
  data: Array<{
    startDate: Date;
    endDate: Date;
    low: number;
    high: number;
    dateStr: string;
  }>;
}

export function prepareForecastData(
  lakes: Lake[],
  visibleLakes: LakeId[],
  unitSystem: UnitSystem
): ForecastChartData[] {
  const forecasts: ForecastChartData[] = [];

  for (const lake of lakes) {
    if (!visibleLakes.includes(lake.lake)) continue;

    const forecastData = getForecastData(lake);
    if (!forecastData) continue;

    const data = forecastData.series.monthly_forecast.map((point) => {
      const date = parseMonthDate(point.date);
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
        low: convertDataToUnit(point.forecast_low, unitSystem),
        high: convertDataToUnit(point.forecast_high, unitSystem),
        dateStr: point.date,
      };
    });

    forecasts.push({
      lakeId: lake.lake,
      lakeName: lake.name,
      color: getLakeColor(lake.lake),
      data,
    });
  }

  return forecasts;
}

export function getLakeColor(lakeId: LakeId): string {
  const colors: Record<LakeId, string> = {
    superior: '#1e3a8a',
    michigan_huron: '#0891b2',
    st_clair: '#059669',
    erie: '#7c3aed',
    ontario: '#dc2626',
  };
  return colors[lakeId];
}

export function getTimeRangeBounds(data: MonthlyDataPoint[]): TimeRange {
  if (data.length === 0) {
    return { start: '1918-01', end: formatMonthDate(new Date()) };
  }

  const dates = data.map((d) => d.date).sort();
  return {
    start: dates[0],
    end: dates[dates.length - 1],
  };
}

export function generateMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = parseMonthDate(start);
  const endDate = parseMonthDate(end);

  while (current <= endDate) {
    months.push(formatMonthDate(current));
    current = addMonths(current, 1);
  }

  return months;
}

export function findActiveSeriesLabel(seriesType: DataSeriesType): string {
  const labels: Record<DataSeriesType, string> = {
    monthly: 'Monthly Average',
    annual: 'Annual Average',
    record_max: 'Record Maximum',
    record_min: 'Record Minimum',
    record_mean: 'Record Average',
    period_of_record_mean: 'Period of Record Average',
    forecast: 'Coordinated Forecast',
  };
  return labels[seriesType];
}
