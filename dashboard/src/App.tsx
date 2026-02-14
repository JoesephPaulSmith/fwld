import { useDataFetch } from '@/hooks/useDataFetch';
import { Header } from '@/components/Header';
import { Drawer } from '@/components/Drawer';
import { TimeSlider } from '@/components/TimeSlider';
import { LakeCharts } from '@/components/LakeCharts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

function App() {
  const { isLoading, error } = useDataFetch();

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header />
      <Drawer />

      {isLoading ? (
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      ) : error ? (
        <main className="flex-1 flex items-center justify-center">
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Mobile: TimeSlider on top */}
          <div className="md:hidden">
            <TimeSlider />
          </div>

          {/* Charts area */}
          <div id="chart-area" className="flex-1 min-h-0 px-2 py-2 md:px-4">
            <LakeCharts />
          </div>

          {/* Desktop: TimeSlider below charts */}
          <div className="hidden md:block shrink-0">
            <TimeSlider />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
