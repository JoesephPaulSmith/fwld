import { useDashboardStore } from '@/store/dashboardStore';

export function Header() {
  const lakesData = useDashboardStore((state) => state.lakesData);

  const dataUpdated = lakesData?.[0]?.updated
    ? new Date(lakesData[0].updated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Great Lakes Water Level Dashboard
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Historical and forecast water levels for the Great Lakes Basin
            </p>
          </div>
          {dataUpdated && (
            <div className="text-sm text-blue-200">
              <span className="hidden sm:inline">Data updated: </span>
              <span className="font-medium text-white">{dataUpdated}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
