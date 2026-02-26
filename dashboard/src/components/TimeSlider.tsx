import { useMemo, useCallback } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { getWaterLevelData, getForecastData } from '@/utils/dataProcessing';
import { format, parse, differenceInMonths, addMonths } from 'date-fns';

const MIN_DATE = '1918-01';

function parseDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM', new Date());
}

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function TimeSlider() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const setTimeRange = useDashboardStore((state) => state.setTimeRange);
  const lakesData = useDashboardStore((state) => state.lakesData);

  const MAX_DATE = useMemo(() => {
    let maxDateStr = new Date().toISOString().slice(0, 7);
    if (lakesData) {
      for (const lake of lakesData) {
        const waterLevelData = getWaterLevelData(lake);
        if (waterLevelData?.series.monthly.length) {
          const last = waterLevelData.series.monthly.at(-1)!.date;
          if (last > maxDateStr) maxDateStr = last;
        }
        const forecastData = getForecastData(lake);
        if (forecastData?.series.monthly_forecast.length) {
          const last = forecastData.series.monthly_forecast.at(-1)!.date;
          if (last > maxDateStr) maxDateStr = last;
        }
      }
    }
    return formatDate(addMonths(parseDate(maxDateStr), 1));
  }, [lakesData]);

  const totalMonths = useMemo(() => {
    return differenceInMonths(parseDate(MAX_DATE), parseDate(MIN_DATE));
  }, [MAX_DATE]);

  const startValue = useMemo(() => {
    return differenceInMonths(parseDate(timeRange.start), parseDate(MIN_DATE));
  }, [timeRange.start]);

  const endValue = useMemo(() => {
    return differenceInMonths(parseDate(timeRange.end), parseDate(MIN_DATE));
  }, [timeRange.end]);

  const handleStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const months = parseInt(e.target.value);
    const newStart = formatDate(addMonths(parseDate(MIN_DATE), months));
    if (months < endValue) {
      setTimeRange({ ...timeRange, start: newStart });
    }
  }, [endValue, setTimeRange, timeRange]);

  const handleEndChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const months = parseInt(e.target.value);
    const newEnd = formatDate(addMonths(parseDate(MIN_DATE), months));
    if (months > startValue) {
      setTimeRange({ ...timeRange, end: newEnd });
    }
  }, [startValue, setTimeRange, timeRange]);

  const today = new Date().toISOString().slice(0, 7);
  const presetRanges = [
    { label: 'All Time', start: MIN_DATE, end: today },
    { label: 'Last 50 Years', start: formatDate(addMonths(parseDate(today), -600)), end: today },
    { label: 'Last 20 Years', start: formatDate(addMonths(parseDate(today), -240)), end: today },
    { label: 'Last 10 Years', start: formatDate(addMonths(parseDate(today), -120)), end: today },
    { label: 'Last 5 Years', start: formatDate(addMonths(parseDate(today), -60)), end: today },
  ];

  const formatDisplayDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return format(date, 'MMM yyyy');
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 md:border-t md:border-t-blue-200/60 px-4 pt-2 pb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Time Range</h3>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{formatDisplayDate(timeRange.start)}</span>
                <span className="mx-2">to</span>
                <span className="font-medium">{formatDisplayDate(timeRange.end)}</span>
              </div>
            </div>

            <div className="relative h-8 flex items-center">
              {/* Track background */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-full" />

              {/* Selected range */}
              <div
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{
                  left: `${(startValue / totalMonths) * 100}%`,
                  width: `${((endValue - startValue) / totalMonths) * 100}%`,
                }}
              />

              {/* Start slider */}
              <input
                type="range"
                min={0}
                max={totalMonths}
                value={startValue}
                onChange={handleStartChange}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-600
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-blue-600
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:cursor-pointer"
              />

              {/* End slider */}
              <input
                type="range"
                min={0}
                max={totalMonths}
                value={endValue}
                onChange={handleEndChange}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-600
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-blue-600
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            {/* Year markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1918</span>
              <span>1950</span>
              <span>1980</span>
              <span>2000</span>
              <span>Now</span>
            </div>
          </div>

          {/* Preset buttons - mobile only (available in drawer on desktop) */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-1 md:hidden">
            {presetRanges.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setTimeRange({ start: preset.start, end: preset.end })}
                className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
