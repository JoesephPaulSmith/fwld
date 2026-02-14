import { useDashboardStore } from '@/store/dashboardStore';

export function Header() {
  const toggleDrawer = useDashboardStore((state) => state.toggleDrawer);

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
      <div className="px-4 py-3 flex items-center">
        <button
          onClick={toggleDrawer}
          className="p-2 rounded-lg hover:bg-white/20 transition-colors mr-3"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
          Great Lakes Water Level Dashboard
        </h1>
        {/* Spacer to balance the hamburger button */}
        <div className="w-10" />
      </div>
    </header>
  );
}
