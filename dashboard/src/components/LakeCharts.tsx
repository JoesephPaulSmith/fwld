import { useDashboardStore } from '@/store/dashboardStore';
import { LakeChart } from './LakeChart';

export function LakeCharts() {
  const lakesData = useDashboardStore((state) => state.lakesData);
  const lakeConfigs = useDashboardStore((state) => state.lakeConfigs);

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

  return (
    <div className="space-y-4">
      {visibleConfigs.map((config) => {
        const lake = lakesData.find((l) => l.lake === config.id);
        if (!lake) return null;

        return (
          <LakeChart
            key={config.id}
            lake={lake}
            config={config}
          />
        );
      })}
    </div>
  );
}
