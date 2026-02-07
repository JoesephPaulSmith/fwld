const PARTNERS = [
  {
    name: 'Coordinating Committee on Great Lakes Basic Hydraulic and Hydrologic Data',
    shortName: 'CCGLBHHD',
    url: 'https://www.greatlakescc.org/en/home/',
  },
  { name: 'NOAA', url: 'https://www.noaa.gov' },
  { name: 'USACE Detroit District', url: 'https://www.lre.usace.army.mil' },
  { name: 'GLERL', url: 'https://www.glerl.noaa.gov' },
  { name: 'CIGLR', url: 'https://ciglr.seas.umich.edu' },
  { name: 'GLRI', url: 'https://glri.us' },
  { name: 'Great Lakes Commission', url: 'https://www.glc.org' },
];

export function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">About This Dashboard</h3>
            <p className="text-sm leading-relaxed">
              This dashboard provides historical and forecast water level data for the
              Great Lakes Basin. Data is sourced from the Coordinating Committee on
              Great Lakes Basic Hydraulic and Hydrologic Data (CCGLBHHD) and represents
              monthly lakewide averages from 1918 to present.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Partner Organizations</h3>
            <div className="flex flex-wrap gap-2">
              {PARTNERS.map((partner) => (
                <a
                  key={partner.name}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                >
                  {partner.shortName || partner.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>
            Great Lakes Water Level Dashboard &middot; Data provided by CCGLBHHD
          </p>
          <p className="mt-1">
            Original development by Joeseph Smith (CIGLR)
          </p>
        </div>
      </div>
    </footer>
  );
}
