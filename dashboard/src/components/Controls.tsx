import { useDashboardStore } from '@/store/dashboardStore';
import type { DataSeriesType } from '@/types';

export function Controls() {
  const lakeConfigs = useDashboardStore((state) => state.lakeConfigs);
  const toggleLakeVisibility = useDashboardStore((state) => state.toggleLakeVisibility);
  const setAllLakesVisible = useDashboardStore((state) => state.setAllLakesVisible);
  const unitSystem = useDashboardStore((state) => state.unitSystem);
  const setUnitSystem = useDashboardStore((state) => state.setUnitSystem);
  const activeSeriesTypes = useDashboardStore((state) => state.activeSeriesTypes);
  const toggleSeriesType = useDashboardStore((state) => state.toggleSeriesType);
  const showForecast = useDashboardStore((state) => state.showForecast);
  const toggleForecast = useDashboardStore((state) => state.toggleForecast);

  const seriesOptions: { id: DataSeriesType; label: string }[] = [
    { id: 'monthly', label: 'Monthly Avg' },
    { id: 'annual', label: 'Annual Avg' },
    { id: 'record_max', label: 'Record Max' },
    { id: 'record_min', label: 'Record Min' },
    { id: 'record_mean', label: 'Record Mean' },
    { id: 'period_of_record_mean', label: 'Period Mean' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Lake Toggles */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Lakes</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAllLakesVisible(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setAllLakesVisible(false)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  None
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {lakeConfigs.map((lake) => (
                <button
                  key={lake.id}
                  onClick={() => toggleLakeVisibility(lake.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    border-2 flex items-center gap-2
                    ${lake.visible
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                    }
                  `}
                  style={lake.visible ? {
                    backgroundColor: lake.color,
                    borderColor: lake.color,
                  } : undefined}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lake.color }}
                  />
                  {lake.name}
                </button>
              ))}
            </div>
          </div>

          {/* Series Types */}
          <div className="lg:border-l lg:border-gray-200 lg:pl-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Data Series</h3>
            <div className="flex flex-wrap gap-2">
              {seriesOptions.map((series) => (
                <button
                  key={series.id}
                  onClick={() => toggleSeriesType(series.id)}
                  className={`
                    px-3 py-1.5 rounded text-sm font-medium transition-all
                    ${activeSeriesTypes.includes(series.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {series.label}
                </button>
              ))}
              <button
                onClick={toggleForecast}
                className={`
                  px-3 py-1.5 rounded text-sm font-medium transition-all
                  ${showForecast
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                Forecast
              </button>
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="lg:border-l lg:border-gray-200 lg:pl-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Units</h3>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setUnitSystem('metric')}
                className={`
                  px-4 py-1.5 text-sm font-medium transition-colors
                  ${unitSystem === 'metric'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Meters
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`
                  px-4 py-1.5 text-sm font-medium transition-colors border-l border-gray-300
                  ${unitSystem === 'imperial'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Feet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
