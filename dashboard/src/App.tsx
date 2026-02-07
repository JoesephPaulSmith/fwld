import { useDataFetch } from '@/hooks/useDataFetch';
import { Header } from '@/components/Header';
import { Controls } from '@/components/Controls';
import { TimeSlider } from '@/components/TimeSlider';
import { LakeCharts } from '@/components/LakeCharts';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

function App() {
  const { isLoading, error } = useDataFetch();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

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
        <main className="flex-1">
          <Controls />
          <TimeSlider />
          <div className="max-w-7xl mx-auto px-4 py-6">
            <LakeCharts />
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}

export default App;
