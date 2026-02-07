# Great Lakes Dashboard - PWA Modernization Proposal

## Executive Summary

This proposal outlines a comprehensive plan to modernize the Great Lakes Dashboard from its legacy Flash/ActionScript implementation to a modern Progressive Web App (PWA). The analysis is based on three legacy components:

1. **GLHCD_Charm** - Feature-rich Adobe Flex/ActionScript dashboard
2. **GLD_HTML5** - Limited-feature HTML5/JavaScript prototype
3. **cron** - Server-side data processing scripts (Python, Shell, R)

---

### Lakes To Be Covered in the PWA
- Lake Superior
- Lake Michigan-Huron (treated as one hydrological unit)
- Lake St. Clair
- Lake Erie
- Lake Ontario

### Target Data Categories & Variables

| Category | Variables |
|----------|-----------|
| **Water Levels** | Monthly lakewide averages (1918-present), Annual averages, Record max/min/mean per month, Period of Record (1918 - present) max/min/mean |
| **Forecasts** | Coordinated Monthly level forecasts |

As these are all averages, these should be plotted as solid horizontal lines spanning their time range. The monthly average
should span from the beginning to the end of a month, and not be connected to either the previous or next month. The annual average should span from the beginning to the end of a year, and not be connected to either the previous or next year. The only horizontal lines that should not be interrupted represent the period of record mean, min, and max, though if you want you can cut that off at the end of 1917 and before.

### Data Sources
- Coordinating Committee for Great Lakes Basic Hydraulic and Hydrologic Data

---

## Legacy Feature Analysis - Selected Features

### GLHCD_Charm (Full-Featured ActionScript)

**Charting Features:**
- Interactive time slider with draggable range
- Per-lake chart visibility toggles
- Multiple data series overlay with configurable layers
- Customizable series colors, opacity, stroke weight
- Axis configuration panel with range equalization
- Legend with kill-switches per series

**Data Management:**
- Load/Save inventory state (user configurations)
- Recently used series deck
- Series layer ordering (drag-and-drop reordering; which series appear on top of each other)
- Invert series layers
- Clear all series

**Export Features:**
- Screenshot capture (PNG)
- Presentation-style image export (customizable titles, centered logos)
- Data download (individual files and ZIP archive)

**UI Features:**
- Fullscreen mode
- Metric/Imperial unit toggle
- Collapsible data menu
- Contextual help system (6 help panels)
- Quick start tutorial prompt
- Contact and About panels
- Partner logo links (NOAA, USACE, GLERL, CIGLR, GLRI, GLC)

### GLD_HTML5 (Limited HTML5 Version)

**Implemented:**
- Dygraph-based charting
- Two view modes: By Variable, By Basin
- jQuery UI slider for time range
- Lake selection checkboxes
- Metric/Imperial toggle
- Hierarchical accordion data menu
- Settings menu (timespan, contacts, about, help)
- IE compatibility patches

**Missing from HTML5:**
- Save/load configurations
- Screenshot export
- Series customization (colors, opacity)
- Layer management
- Presentation export
- Fullscreen mode

---

## Proposed PWA Architecture

### Technology Stack

| Layer | Recommended Technology | Rationale |
|-------|----------------------|-----------|
| **Frontend Framework** | React 18+ | Component-based, strong ecosystem |
| **Charting** | D3.js + ECharts | Interactive time-series, better than Dygraph |
| **State Management** | Zustand | Lightweight, handles complex chart state |
| **PWA Features** | Workbox | Service worker, offline support |
| **Build Tool** | Vite | Fast HMR, optimized builds |
| **Styling** | Tailwind CSS | Responsive, utility-first |
| **Data Fetching** | TanStack Query | Caching, background refresh |
| **Date Handling** | date-fns or Luxon | Lightweight, timezone support |
| **Export** | html2canvas + jsPDF | Screenshot and PDF generation |

### Backend/Data Pipeline

| Component | Recommended Approach |
|-----------|---------------------|
| **Data Storage** | GitHub Pages + JSON/CSV files (should be able to hold the data JSON in the app itself; manual monthly updates will keep it up-to-date) |
| **Data Format** | Transition from CSV to JSON for better parsing |

---

## Feature Roadmap

### Phase 1: Core Dashboard (MVP)
- [ ] Multi-lake time series charts with synchronized zoom
- [ ] Water level data display (monthly, annual, period-of-record average)
- [ ] Lake visibility toggles
- [ ] Time range slider (1918-present)
- [ ] Metric/Imperial unit toggle
- [ ] Responsive design for mobile/tablet
- [ ] PWA manifest and service worker
- [ ] Offline capability with cached data

### Phase 2: Data Features
- [ ] Period-of-record averages
- [ ] Record high/low overlays

### Phase 3: Interactivity
- [ ] Series customization (colors, opacity, stroke)
- [ ] Layer ordering with drag-and-drop
- [ ] Save/load user configurations (localStorage + export)
- [ ] Recently used series quick-access
- [ ] Hierarchical data menu

### Phase 4: Export & Sharing
- [ ] Screenshot export (PNG)
- [ ] Presentation mode export
- [ ] Data download (CSV, JSON)
- [ ] Shareable URLs with embedded state
- [ ] Print-optimized styles

---

## Improvements Over Legacy Versions

### User Experience
1. **Mobile-first responsive design** - Works on phones/tablets (legacy was desktop-only)
2. **Faster load times** - No Flash plugin, optimized bundles
3. **Offline access** - Service worker caches recent data
4. **Touch gestures** - Pinch-to-zoom on charts, swipe navigation
5. **Accessibility** - WCAG 2.1 compliant, screen reader support
6. **Dark mode** - Optional theme switching

### Technical
1. **No plugin dependencies** - Pure web standards
2. **SEO-friendly** - Server-rendered metadata
3. **Modern APIs** - Web Share API, Fullscreen API, File System Access
4. **Real-time updates** - Background data refresh via service worker
5. **Error boundaries** - Graceful degradation on failures

### Data Pipeline
1. **Version control** - Git history for all data processing code
2. **CI/CD integration** - Automated testing before deployment
3. **Monitoring** - GitHub Actions provides run history and alerts
4. **Reproducibility** - Docker containers for R scripts
5. **Documentation** - Workflow files are self-documenting

---

## Data Format Recommendations

### Current CSV Format
```csv
Time,Record Max,Record Mean,Record Min,Daily Avg,Monthly Avg,Annual Avg
01/01/2024,183.70,183.32,182.83,183.15,183.28,183.45
```

### Proposed JSON Format

See @great_lakes_water_levels.json for the proposed JSON format of the data to serve this app.

---

## Partner Organizations (Logos/Links)

These may be included in an information box describing the source of the data and contributors to the dashboard project in years past.

| Organization | URL |
|-------------|-----|
| Coordinating Committee on Great Lakes Basic Hydraulic and Hydrologic Data (CCGLBHHD) | https://www.greatlakescc.org/en/home/ | 
| NOAA | https://www.noaa.gov |
| USACE Detroit District | https://www.lre.usace.army.mil |
| GLERL | https://www.glerl.noaa.gov |
| CIGLR | https://ciglr.seas.umich.edu |
| GLRI | https://glri.us |
| Great Lakes Commission | https://www.glc.org |

---

## Estimated Component Breakdown

| Component | Complexity | Priority |
|-----------|-----------|----------|
| Chart rendering engine | High | Critical |
| Time slider control | Medium | Critical |
| Data fetching layer | Medium | Critical |
| Lake toggle controls | Low | High |
| Unit conversion | Low | High |
| Data menu hierarchy | Medium | High |
| Series customization | Medium | Medium |
| Export functionality | Medium | Medium |
| Configuration save/load | Medium | Medium |
| PWA offline support | Medium | Medium |

---

### Human Requirements

- Download of more recent lakewide monthly average data (monthly), the coordinated forecast (monthly), and records (annually). Run a python script to process them into the great_lakes_water_levels.json data file on a montly basis.

## Conclusion

The Great Lakes Dashboard modernization represents an opportunity to transform a valuable scientific tool into a modern, accessible, and maintainable web application. By leveraging PWA technologies and GitHub Actions, the new system will be:

- **More accessible** - Available on any device without plugins
- **More reliable** - Automated data pipelines with monitoring
- **More maintainable** - Modern codebase with CI/CD
- **More extensible** - Easy to add new data sources and visualizations

The phased approach allows for incremental delivery while maintaining feature parity with the legacy Flash application.

---

*Proposal generated by analyzing the legacy Great Lakes Dashboard codebase*
*Original developers: Joeseph Smith (CIGLR)*
