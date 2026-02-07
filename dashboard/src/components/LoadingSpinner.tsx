export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>
      <p className="text-gray-600 font-medium">Loading water level data...</p>
    </div>
  );
}
