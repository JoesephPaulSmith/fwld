import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import type { GreatLakesData } from '@/types';

const DATA_URL = './great_lakes_water_levels.json';

export function useDataFetch() {
  const setLakesData = useDashboardStore((state) => state.setLakesData);
  const setLoading = useDashboardStore((state) => state.setLoading);
  const setError = useDashboardStore((state) => state.setError);
  const lakesData = useDashboardStore((state) => state.lakesData);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const error = useDashboardStore((state) => state.error);

  useEffect(() => {
    async function fetchData() {
      if (lakesData) return;

      setLoading(true);
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GreatLakesData = await response.json();
        setLakesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    }

    fetchData();
  }, [lakesData, setLakesData, setLoading, setError]);

  return { lakesData, isLoading, error };
}
