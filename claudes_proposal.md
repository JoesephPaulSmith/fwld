# Great Lakes Dashboard - PWA Modernization Proposal

## Executive Summary

This proposal outlines a comprehensive plan to modernize the Great Lakes Dashboard from its legacy Flash/ActionScript implementation to a modern Progressive Web App (PWA). The analysis is based on three legacy components:

1. **GLHCD_Charm** - Feature-rich Adobe Flex/ActionScript dashboard
2. **GLD_HTML5** - Limited-feature HTML5/JavaScript prototype
3. **cron** - Server-side data processing scripts (Python, Shell, R)

---

## Discovered Features & Data Sources

### Lakes Covered
- Lake Superior
- Lake Michigan-Huron (treated as one hydrological unit)
- Lake St. Clair
- Lake Erie
- Lake Ontario
- Great Lakes Basin (aggregate)

### Data Categories & Variables

| Category | Variables |
|----------|-----------|
| **Water Levels** | Daily averages, Monthly lakewide averages (1918-present), Annual averages, Master gauge data (1860-present), Record max/min/mean per month, Provisional/preliminary coordinated means |
| **Forecasts** | AHPS 3-month outlook (5th/95th percentile), AHPS 6-month outlook, Monthly level forecasts, Multi-decadal forecasts |
| **Ice Coverage** | CoastWatch ice concentration (%) per lake, Great Lakes total ice |
| **Hydrological I/O** | Precipitation, Evaporation, Runoff, Net basin supply |
| **Temperatures** | Surface water temperatures |
| **Flow Rates** | Outflow data |
| **Oscillation Indices** | Climate pattern indices |
| **Paleoclimate** | Multi-centurial reconstructions (3000 BC - present) |

### Data Sources
- **NOAA/NOS** - National Ocean Service gauge data
- **CHS** - Canadian Hydrographic Service
- **USACE** - US Army Corps of Engineers coordinated water levels
- **NOAA/GLERL** - Great Lakes Environmental Research Laboratory
- **AHPS** - Advanced Hydrologic Prediction Service forecasts
- **CoastWatch** - Satellite-derived ice concentration data

---

## Legacy Feature Analysis

### GLHCD_Charm (Full-Featured ActionScript)

**Charting Features:**
- Dual time scales: Standard (1800-2105) and Multi-centurial (3000 BC - 2105 AD)
- Interactive time slider with draggable range
- Per-lake chart visibility toggles
- Multiple data series overlay with configurable layers
- Customizable series colors, opacity, stroke weight
- Axis configuration panel with range equalization
- Legend with kill-switches per series

**Data Management:**
- Load/Save inventory state (user configurations)
- Recently used series deck
- Series layer ordering (drag-and-drop reordering)
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
- Multi-centurial view
- Save/load configurations
- Screenshot export
- Series customization (colors, opacity)
- Layer management
- Presentation export
- Fullscreen mode

---

## Cron Scripts Analysis (Data Pipeline)

### Current Architecture

```
Remote Servers (cw, camel.sci.dmz.glerl.noaa.gov)
        │
        ├── rsync daily water level files (.lwm format)
        ├── rsync USACE text reports
        ├── rsync AHPS forecast files
        └── rsync CoastWatch ice data (.dat format)
        │
        ▼
Local Processing Scripts
        │
        ├── dailyParseWLPage.py → Daily/Monthly/Annual averages
        ├── dailyParseKent.py → Kent gauge processing
        ├── usaceTxtParseWLs.py → Coordinated means, historical updates
        ├── AHPSParser.py → Forecast archiving
        └── cwIce/proc.r → Ice concentration processing
        │
        ▼
Output CSV files → Deployed to dashboard server
```

### Scripts to Port to GitHub Actions

| Script | Purpose | Schedule Recommendation |
|--------|---------|------------------------|
| `getDailyWLData.sh` | Fetch daily water level data | Daily at 6 AM |
| `dailyParseWLPage.py` | Parse gauge data, compute averages | Daily at 7 AM |
| `usaceTxtParseWLs.py` | Parse USACE reports, update monthly data | Every 6 hours |
| `USACEUploadConvert.sh` | Process USACE uploads | On USACE publish |
| `AHPSParser.py` | Parse AHPS forecasts, archive 3/6 month data | Daily at 8 AM |
| `archiveProvAvgWLs.sh` | Archive provisional averages | Monthly |
| `cwIce/proc.sh` + `proc.r` | Process ice concentration data | Daily during ice season (Nov-May) |

---

## Proposed PWA Architecture

### Technology Stack

| Layer | Recommended Technology | Rationale |
|-------|----------------------|-----------|
| **Frontend Framework** | React 18+ or Vue 3 | Component-based, strong ecosystem |
| **Charting** | D3.js + Plotly or ECharts | Interactive time-series, better than Dygraph |
| **State Management** | Zustand or Pinia | Lightweight, handles complex chart state |
| **PWA Features** | Workbox | Service worker, offline support |
| **Build Tool** | Vite | Fast HMR, optimized builds |
| **Styling** | Tailwind CSS | Responsive, utility-first |
| **Data Fetching** | TanStack Query | Caching, background refresh |
| **Date Handling** | date-fns or Luxon | Lightweight, timezone support |
| **Export** | html2canvas + jsPDF | Screenshot and PDF generation |

### Backend/Data Pipeline

| Component | Recommended Approach |
|-----------|---------------------|
| **GitHub Actions** | Replace cron jobs with scheduled workflows |
| **Data Storage** | GitHub Pages + JSON/CSV files or Cloudflare R2 |
| **API (optional)** | Cloudflare Workers or Vercel Edge Functions |
| **Data Format** | Transition from CSV to JSON for better parsing |

---

## Feature Roadmap

### Phase 1: Core Dashboard (MVP)
- [ ] Multi-lake time series charts with synchronized zoom
- [ ] Water level data display (daily, monthly, annual)
- [ ] Lake visibility toggles
- [ ] Time range slider (1800-present)
- [ ] Metric/Imperial unit toggle
- [ ] Responsive design for mobile/tablet
- [ ] PWA manifest and service worker
- [ ] Offline capability with cached data

### Phase 2: Data Features
- [ ] AHPS forecasts display (3/6 month)
- [ ] Ice concentration data
- [ ] Period-of-record averages
- [ ] Record high/low overlays
- [ ] Hydrological I/O data
- [ ] Multi-centurial paleoclimate view

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

### Phase 5: GitHub Actions Data Pipeline
- [ ] Daily water level fetch workflow
- [ ] USACE data parsing workflow
- [ ] AHPS forecast processing workflow
- [ ] Ice data processing workflow
- [ ] Automated data validation
- [ ] Slack/email notifications for failures

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

## Sample GitHub Actions Workflow

```yaml
name: Daily Water Level Processing

on:
  schedule:
    - cron: '0 7 * * *'  # Daily at 7 AM UTC
  workflow_dispatch:

jobs:
  process-water-levels:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install pandas requests

      - name: Fetch and process water level data
        run: python scripts/process_water_levels.py
        env:
          DATA_SOURCE_URL: ${{ secrets.GLERL_DATA_URL }}

      - name: Commit updated data
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git commit -m "Update water level data $(date +%Y-%m-%d)" || exit 0
          git push
```

---

## Data Format Recommendations

### Current CSV Format
```csv
Time,Record Max,Record Mean,Record Min,Daily Avg,Monthly Avg,Annual Avg
01/01/2024,183.70,183.32,182.83,183.15,183.28,183.45
```

### Proposed JSON Format
```json
{
  "lake": "superior",
  "updated": "2024-01-15T07:00:00Z",
  "units": "meters_IGLD85",
  "series": {
    "daily": [
      {"date": "2024-01-01", "value": 183.15},
      {"date": "2024-01-02", "value": 183.18}
    ],
    "monthly": [
      {"date": "2024-01", "value": 183.28}
    ],
    "records": {
      "max": {"value": 183.91, "date": "1985-10"},
      "min": {"value": 182.72, "date": "1926-04"}
    }
  }
}
```

---

## Partner Organizations (Logos/Links)

| Organization | URL |
|-------------|-----|
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
| GitHub Actions pipeline | High | High |
| PWA offline support | Medium | Medium |
| Multi-centurial view | Medium | Low |
| Ice data visualization | Low | Low |

---

## Conclusion

The Great Lakes Dashboard modernization represents an opportunity to transform a valuable scientific tool into a modern, accessible, and maintainable web application. By leveraging PWA technologies and GitHub Actions, the new system will be:

- **More accessible** - Available on any device without plugins
- **More reliable** - Automated data pipelines with monitoring
- **More maintainable** - Modern codebase with CI/CD
- **More extensible** - Easy to add new data sources and visualizations

The phased approach allows for incremental delivery while maintaining feature parity with the legacy Flash application.

---

*Proposal generated by analyzing the legacy Great Lakes Dashboard codebase*
*Original developers: Joeseph Smith (CIGLR), Anne H. Clites (GLERL)*
