import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LakeId,
  UnitSystem,
  TimeRange,
  DataSeriesType,
  GreatLakesData,
  LakeConfig
} from '@/types';
import { LAKE_CONFIGS } from '@/types';

interface DashboardState {
  // Data
  lakesData: GreatLakesData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Lake visibility
  lakeConfigs: LakeConfig[];

  // Units
  unitSystem: UnitSystem;

  // Time range (YYYY-MM format)
  timeRange: TimeRange;

  // Active data series
  activeSeriesTypes: DataSeriesType[];

  // UI state
  isFullscreen: boolean;
  showForecast: boolean;

  // Actions
  setLakesData: (data: GreatLakesData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleLakeVisibility: (lakeId: LakeId) => void;
  setAllLakesVisible: (visible: boolean) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setTimeRange: (range: TimeRange) => void;
  toggleSeriesType: (seriesType: DataSeriesType) => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleForecast: () => void;
  resetToDefaults: () => void;
}

// Default to past 5 years
const now = new Date();
const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), 1);
const DEFAULT_TIME_RANGE: TimeRange = {
  start: fiveYearsAgo.toISOString().slice(0, 7),
  end: now.toISOString().slice(0, 7),
};

const DEFAULT_SERIES_TYPES: DataSeriesType[] = ['monthly', 'annual', 'period_of_record_mean'];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Initial state
      lakesData: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      lakeConfigs: LAKE_CONFIGS,
      unitSystem: 'metric',
      timeRange: DEFAULT_TIME_RANGE,
      activeSeriesTypes: DEFAULT_SERIES_TYPES,
      isFullscreen: false,
      showForecast: true,

      // Actions
      setLakesData: (data) => set({
        lakesData: data,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      toggleLakeVisibility: (lakeId) => set((state) => ({
        lakeConfigs: state.lakeConfigs.map((config) =>
          config.id === lakeId ? { ...config, visible: !config.visible } : config
        ),
      })),

      setAllLakesVisible: (visible) => set((state) => ({
        lakeConfigs: state.lakeConfigs.map((config) => ({ ...config, visible })),
      })),

      setUnitSystem: (system) => set({ unitSystem: system }),

      setTimeRange: (range) => set({ timeRange: range }),

      toggleSeriesType: (seriesType) => set((state) => {
        const isActive = state.activeSeriesTypes.includes(seriesType);
        if (isActive) {
          // Don't allow removing the last series type
          if (state.activeSeriesTypes.length === 1) return state;
          return {
            activeSeriesTypes: state.activeSeriesTypes.filter((t) => t !== seriesType),
          };
        }
        return {
          activeSeriesTypes: [...state.activeSeriesTypes, seriesType],
        };
      }),

      setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

      toggleForecast: () => set((state) => ({ showForecast: !state.showForecast })),

      resetToDefaults: () => set({
        lakeConfigs: LAKE_CONFIGS,
        unitSystem: 'metric',
        timeRange: DEFAULT_TIME_RANGE,
        activeSeriesTypes: DEFAULT_SERIES_TYPES,
        showForecast: true,
      }),
    }),
    {
      name: 'great-lakes-dashboard',
      version: 2, // Bump to reset persisted state with new defaults
      partialize: (state) => ({
        lakeConfigs: state.lakeConfigs,
        unitSystem: state.unitSystem,
        timeRange: state.timeRange,
        activeSeriesTypes: state.activeSeriesTypes,
        showForecast: state.showForecast,
      }),
    }
  )
);
