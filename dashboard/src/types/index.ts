export type LakeId = 'superior' | 'michigan_huron' | 'st_clair' | 'erie' | 'ontario';

export interface MonthlyDataPoint {
  date: string; // YYYY-MM format
  value: number;
}

export interface AnnualDataPoint {
  date: string; // YYYY format
  value: number;
}

export interface RecordStats {
  mean: { value: number };
  max: { value: number; year_set: number };
  min: { value: number; year_set: number };
}

export interface ForecastDataPoint {
  date: string; // YYYY-MM format
  forecast_low: number;
  forecast_high: number;
}

export interface WaterLevelSeries {
  monthly: MonthlyDataPoint[];
  annual: AnnualDataPoint[];
  calendar_month_records: Record<string, RecordStats>;
  period_of_record_mean: number;
}

export interface ForecastSeries {
  monthly_forecast: ForecastDataPoint[];
}

export interface WaterLevelData {
  type: 'lakewide_average_water_level';
  type_title: string;
  units: string;
  series: WaterLevelSeries;
}

export interface ForecastData {
  type: 'coordinated_forecast';
  type_title: string;
  units: string;
  series: ForecastSeries;
}

export type LakeDataEntry = WaterLevelData | ForecastData;

export interface Lake {
  lake: LakeId;
  name: string;
  updated: string;
  data: LakeDataEntry[];
}

export type GreatLakesData = Lake[];

export type UnitSystem = 'metric' | 'imperial';

export interface TimeRange {
  start: string; // YYYY-MM format
  end: string;   // YYYY-MM format
}

export type DataSeriesType =
  | 'monthly'
  | 'annual'
  | 'record_max'
  | 'record_min'
  | 'record_mean'
  | 'period_of_record_mean'
  | 'forecast';

export interface LakeConfig {
  id: LakeId;
  name: string;
  color: string;
  visible: boolean;
}

export const LAKE_CONFIGS: LakeConfig[] = [
  { id: 'superior', name: 'Lake Superior', color: '#1e3a8a', visible: true },
  { id: 'michigan_huron', name: 'Lake Michigan-Huron', color: '#0891b2', visible: true },
  { id: 'st_clair', name: 'Lake St. Clair', color: '#059669', visible: false },
  { id: 'erie', name: 'Lake Erie', color: '#7c3aed', visible: true },
  { id: 'ontario', name: 'Lake Ontario', color: '#dc2626', visible: true },
];
