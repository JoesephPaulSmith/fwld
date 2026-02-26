import { useState, useCallback } from 'react';
import { useDashboardStore, DEFAULT_SERIES_COLORS } from '@/store/dashboardStore';
import type { DataSeriesType } from '@/types';
import { toPng } from 'html-to-image';

const PARTNERS = [
  { name: 'CCGLBHHD', url: 'https://www.greatlakescc.org/en/home/', full: 'Coordinating Committee on Great Lakes Basic Hydraulic and Hydrologic Data' },
  { name: 'NOAA', url: 'https://www.noaa.gov' },
  { name: 'USACE', url: 'https://www.lre.usace.army.mil' },
  { name: 'GLERL', url: 'https://www.glerl.noaa.gov' },
  { name: 'CIGLR', url: 'https://ciglr.seas.umich.edu' },
  { name: 'GLRI', url: 'https://glri.us' },
  { name: 'Great Lakes Commission', url: 'https://www.glc.org' },
];

const SERIES_OPTIONS: { id: DataSeriesType; label: string }[] = [
  { id: 'monthly', label: 'Monthly Average' },
  { id: 'annual', label: 'Annual Average' },
  { id: 'record_max', label: 'Record Maximum' },
  { id: 'record_min', label: 'Record Minimum' },
  { id: 'record_mean', label: 'Record Average' },
  { id: 'period_of_record_mean', label: 'Period of Record Average' },
];

// Generate year-month options
function generateYearMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let y = now.getFullYear(); y >= 1918; y--) {
    const maxMonth = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = maxMonth; m >= 0; m--) {
      const val = `${y}-${String(m + 1).padStart(2, '0')}`;
      options.push({ value: val, label: `${months[m]} ${y}` });
    }
  }
  return options;
}

const YEAR_MONTH_OPTIONS = generateYearMonthOptions();

function AccordionSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-700/50 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Drawer() {
  const isDrawerOpen = useDashboardStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useDashboardStore((s) => s.setDrawerOpen);

  // Data series
  const activeSeriesTypes = useDashboardStore((s) => s.activeSeriesTypes);
  const toggleSeriesType = useDashboardStore((s) => s.toggleSeriesType);
  const showForecast = useDashboardStore((s) => s.showForecast);
  const toggleForecast = useDashboardStore((s) => s.toggleForecast);
  const seriesColors = useDashboardStore((s) => s.seriesColors);
  const setSeriesColor = useDashboardStore((s) => s.setSeriesColor);

  // Lakes
  const lakeConfigs = useDashboardStore((s) => s.lakeConfigs);
  const toggleLakeVisibility = useDashboardStore((s) => s.toggleLakeVisibility);
  const setAllLakesVisible = useDashboardStore((s) => s.setAllLakesVisible);

  // Units
  const unitSystem = useDashboardStore((s) => s.unitSystem);
  const setUnitSystem = useDashboardStore((s) => s.setUnitSystem);

  // Time range
  const timeRange = useDashboardStore((s) => s.timeRange);
  const setTimeRange = useDashboardStore((s) => s.setTimeRange);

  // Vertical scale
  const verticalRange = useDashboardStore((s) => s.verticalRange);
  const setVerticalRange = useDashboardStore((s) => s.setVerticalRange);

  // Appearance
  const backgroundColor = useDashboardStore((s) => s.backgroundColor);
  const setBackgroundColor = useDashboardStore((s) => s.setBackgroundColor);
  const resetColors = useDashboardStore((s) => s.resetColors);

  // Fullscreen
  const isFullscreen = useDashboardStore((s) => s.isFullscreen);
  const setFullscreen = useDashboardStore((s) => s.setFullscreen);

  const [verticalInput, setVerticalInput] = useState(verticalRange?.toString() ?? '');
  const [showAbout, setShowAbout] = useState(false);

  const handleVerticalRangeChange = useCallback((value: string) => {
    setVerticalInput(value);
    const num = parseFloat(value);
    if (value === '' || isNaN(num)) {
      setVerticalRange(null);
    } else if (num > 0) {
      setVerticalRange(num);
    }
  }, [setVerticalRange]);

  const handleScreenshot = useCallback(async () => {
    const el = document.getElementById('chart-area');
    if (!el) return;
    try {
      const dataUrl = await toPng(el);
      const link = document.createElement('a');
      link.download = 'great-lakes-dashboard.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Screenshot failed:', e);
    }
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, [setFullscreen]);

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gray-800 text-gray-100 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-lg font-bold">Legend &amp; Menu</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 1. Data Series */}
        <AccordionSection title="Data Series" defaultOpen={true}>
          <div className="space-y-2">
            {SERIES_OPTIONS.map((series) => (
              <label key={series.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeSeriesTypes.includes(series.id)}
                  onChange={() => toggleSeriesType(series.id)}
                  className="rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700"
                />
                <input
                  type="color"
                  value={seriesColors[series.id] || DEFAULT_SERIES_COLORS[series.id]}
                  onChange={(e) => setSeriesColor(series.id, e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent"
                  title={`${series.label} color`}
                />
                <span className="text-sm">{series.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={toggleForecast}
                className="rounded border-gray-500 text-amber-500 focus:ring-amber-500 bg-gray-700"
              />
              <input
                type="color"
                value={seriesColors['forecast'] || DEFAULT_SERIES_COLORS['forecast']}
                onChange={(e) => setSeriesColor('forecast', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent"
                title="Forecast color"
              />
              <span className="text-sm">Forecast Range</span>
            </label>
          </div>
        </AccordionSection>

        {/* 2. Selected Lakes */}
        <AccordionSection title="Selected Lakes" defaultOpen={true}>
          <div className="space-y-2">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setAllLakesVisible(true)} className="text-xs text-blue-400 hover:text-blue-300">All</button>
              <span className="text-gray-500">|</span>
              <button onClick={() => setAllLakesVisible(false)} className="text-xs text-blue-400 hover:text-blue-300">None</button>
            </div>
            {lakeConfigs.map((lake) => (
              <label key={lake.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lake.visible}
                  onChange={() => toggleLakeVisibility(lake.id)}
                  className="rounded border-gray-500 focus:ring-blue-500 bg-gray-700"
                />
                <span className="text-sm">{lake.name}</span>
              </label>
            ))}
          </div>
        </AccordionSection>

        {/* 3. Units */}
        <AccordionSection title="Units">
          <div className="flex gap-2">
            <button
              onClick={() => setUnitSystem('metric')}
              className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
                unitSystem === 'metric' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Meters
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`flex-1 py-2 text-sm rounded font-medium transition-colors ${
                unitSystem === 'imperial' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Feet
            </button>
          </div>
        </AccordionSection>

        {/* 4. Selected Time Span */}
        <AccordionSection title="Selected Time Span">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start</label>
              <select
                value={timeRange.start}
                onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-100"
              >
                {YEAR_MONTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">End</label>
              <select
                value={timeRange.end}
                onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-100"
              >
                {YEAR_MONTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'All', months: null },
                { label: '50y', months: 600 },
                { label: '20y', months: 240 },
                { label: '10y', months: 120 },
                { label: '5y', months: 60 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const now = new Date();
                    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    const start = preset.months === null
                      ? '1918-01'
                      : (() => {
                          const d = new Date(now.getFullYear(), now.getMonth() - preset.months, 1);
                          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        })();
                    setTimeRange({ start, end });
                  }}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </AccordionSection>

        {/* 5. Vertical Scale */}
        <AccordionSection title="Vertical Scale">
          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              Set the range (max - min) for all plots. Leave empty for auto.
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={verticalInput}
                onChange={(e) => handleVerticalRangeChange(e.target.value)}
                placeholder="Auto"
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500"
              />
              <span className="text-xs text-gray-400">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
            </div>
            {verticalRange !== null && (
              <button
                onClick={() => { handleVerticalRangeChange(''); }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Reset to auto
              </button>
            )}
          </div>
        </AccordionSection>

        {/* 6. Miscellaneous */}
        <AccordionSection title="Miscellaneous">
          <div className="space-y-4">
            {/* Fullscreen */}
            <button
              onClick={handleFullscreenToggle}
              className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                )}
              </svg>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>

            {/* Screenshot */}
            <button
              onClick={handleScreenshot}
              className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Screenshot
            </button>

            {/* Background color */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Background Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-600 bg-transparent"
                />
                <span className="text-sm text-gray-300 flex-1">{backgroundColor}</span>
                <button
                  onClick={resetColors}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Reset defaults
                </button>
              </div>
            </div>

            {/* About */}
            <button
              onClick={() => setShowAbout(true)}
              className="w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              About
            </button>
          </div>
        </AccordionSection>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">About</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-2">Great Lakes Water Level Dashboard</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This dashboard displays historical and forecast lakewide average water level data for the
                  North American Laurentian Great Lakes Basin. Data are sourced from the Coordinating Committee on
                  Great Lakes Basic Hydraulic and Hydrologic Data (CCGLBHHD) and represents
                  monthly lakewide averages from 1918 to present.
                </p>
                <br />
                <a 
                  href="https://www.glerl.noaa.gov/data/wlevels/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  <span>
                    General information on the development of these water level data
                    can be found on the NOAA Great Lakes Environmental Research Laboratory's
                    water levels webpage
                  </span>
                </a><br />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-2">Data Sources &amp; Partners</h3>
                <div className="space-y-2">
                  {PARTNERS.map((p) => (
                    <a
                      key={p.name}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      <span>{p.full || p.name}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  <a 
                    href="https://jpTheSmithe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    <span>Original dashboard development by Joeseph Smith</span>
                  </a><br />
                  <a
                    href="https://doi.org/10.1016/j.envsoft.2015.12.005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    <span>View Paper</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
