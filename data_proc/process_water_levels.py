#!/usr/bin/env python3
"""
Great Lakes Water Level Data Processor

Processes water level data from multiple sources and outputs a unified JSON file
for the Great Lakes Dashboard PWA.

Data Sources:
- Monthly mean water level CSVs (1918-2026) for each lake
- Coordinated 6-month forecast CSV
- USACE PDF with long-term records (requires pdfplumber)

Author: Generated for Great Lakes Dashboard modernization
"""

import json
import csv
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

# Try to import pdfplumber for PDF parsing
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    print("Warning: pdfplumber not installed. PDF parsing will be skipped.")
    print("Install with: pip install pdfplumber")


# Configuration
LAKES_CONFIG = {
    'superior': {
        'id': 'superior',
        'name': 'Lake Superior',
        'csv_file': 'LakeSuperior_MonthlyMeanWaterLevels_1918to2026.csv',
        'forecast_col': 'SUP'
    },
    'michigan_huron': {
        'id': 'michigan_huron',
        'name': 'Lakes Michigan-Huron',
        'csv_file': 'LakeMichiganHuron_MonthlyMeanWaterLevels_1918to2026.csv',
        'forecast_col': 'MIH'
    },
    'st_clair': {
        'id': 'st_clair',
        'name': 'Lake St. Clair',
        'csv_file': 'LakeStClair_MonthlyMeanWaterLevels_1918to2026.csv',
        'forecast_col': 'STC'
    },
    'erie': {
        'id': 'erie',
        'name': 'Lake Erie',
        'csv_file': 'LakeErie_MonthlyMeanWaterLevels_1918to2026.csv',
        'forecast_col': 'ERI'
    },
    'ontario': {
        'id': 'ontario',
        'name': 'Lake Ontario',
        'csv_file': 'LakeOntario_MonthlyMeanWaterLevels_1918to2026.csv',
        'forecast_col': 'ONT'
    }
}

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

NO_DATA_VALUE = -9999.0


def parse_monthly_csv(filepath: Path) -> dict:
    """
    Parse a monthly water level CSV file.

    Returns dict with:
    - monthly: list of {date: "YYYY-MM", value: float}
    - annual: list of {date: "YYYY", value: float}
    """
    monthly_data = []
    annual_data = []

    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Skip comment lines (starting with #)
    data_lines = [line.strip() for line in lines if not line.startswith('#') and line.strip()]

    if not data_lines:
        return {'monthly': [], 'annual': []}

    # First non-comment line is the header
    header = [col.strip() for col in data_lines[0].split(',')]

    # Process data rows
    for line in data_lines[1:]:
        values = [v.strip() for v in line.split(',')]
        if len(values) < 13:
            continue

        year = values[0]
        monthly_values = []

        for month_idx, val_str in enumerate(values[1:13], start=1):
            try:
                value = float(val_str)
                if value != NO_DATA_VALUE:
                    date_str = f"{year}-{month_idx:02d}"
                    monthly_data.append({
                        'date': date_str,
                        'value': round(value, 2)
                    })
                    monthly_values.append(value)
            except ValueError:
                continue

        # Calculate annual average if we have all 12 months
        if len(monthly_values) == 12:
            annual_avg = sum(monthly_values) / 12
            annual_data.append({
                'date': year,
                'value': round(annual_avg, 2)
            })

    return {
        'monthly': monthly_data,
        'annual': annual_data
    }


def parse_forecast_csv(filepath: Path) -> dict:
    """
    Parse the coordinated forecast CSV file.

    Returns dict keyed by lake forecast column (SUP, MIH, etc.) with:
    - list of {date: "YYYY-MM", forecast_low: float, forecast_high: float}
    """
    forecasts = {col: {} for col in ['SUP', 'MIH', 'STC', 'ERI', 'ONT']}

    with open(filepath, 'r') as f:
        lines = f.readlines()

    # Skip comment lines
    data_lines = [line.strip() for line in lines if not line.startswith('#') and line.strip()]

    if not data_lines:
        return {col: [] for col in forecasts.keys()}

    # Parse header to find column indices
    header = [col.strip() for col in data_lines[0].split(',')]
    col_indices = {}
    for i, col in enumerate(header):
        col_indices[col] = i

    # Process data rows
    for line in data_lines[1:]:
        values = [v.strip() for v in line.split(',')]
        if len(values) < 7:
            continue

        try:
            band = values[col_indices.get('Band', 5)]
            date_str = values[col_indices.get('Date', 6)]

            # Parse date (e.g., "Feb 2026")
            date_parts = date_str.split()
            if len(date_parts) == 2:
                month_name, year = date_parts
                month_num = MONTH_NAMES.index(month_name[:3]) + 1
                date_key = f"{year}-{month_num:02d}"
            else:
                continue

            # Get values for each lake
            for lake_col in ['SUP', 'MIH', 'STC', 'ERI', 'ONT']:
                if lake_col in col_indices:
                    value = float(values[col_indices[lake_col]])

                    if date_key not in forecasts[lake_col]:
                        forecasts[lake_col][date_key] = {'values': []}
                    forecasts[lake_col][date_key]['values'].append(value)

        except (ValueError, IndexError) as e:
            continue

    # Convert to final format with min/max
    result = {}
    for lake_col, dates in forecasts.items():
        result[lake_col] = []
        for date_key, data in sorted(dates.items()):
            if data['values']:
                result[lake_col].append({
                    'date': date_key,
                    'forecast_low': round(min(data['values']), 2),
                    'forecast_high': round(max(data['values']), 2)
                })

    return result


def parse_pdf_records(filepath: Path) -> dict:
    """
    Parse the USACE PDF for long-term records using pdfplumber.

    Returns dict keyed by lake name with calendar_month_records and period_of_record data.
    """
    if not HAS_PDFPLUMBER:
        return {}

    records = {}

    # Map PDF lake names to our lake IDs
    lake_name_map = {
        'LAKE SUPERIOR': 'superior',
        'LAKES MICHIGAN-HURON': 'michigan_huron',
        'LAKE ST. CLAIR': 'st_clair',
        'LAKE ERIE': 'erie',
        'LAKE ONTARIO': 'ontario'
    }

    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                lines = text.split('\n')
                current_lake = None
                line_idx = 0

                while line_idx < len(lines):
                    line = lines[line_idx].strip()

                    # Check if this is a lake header
                    for pdf_name, lake_id in lake_name_map.items():
                        if line.startswith(pdf_name):
                            current_lake = lake_id
                            records[lake_id] = {
                                'calendar_month_records': {},
                                'period_mean': None
                            }
                            break

                    if current_lake and line.startswith('Mean'):
                        # Parse Mean row
                        values = re.findall(r'[\d.]+', line)
                        if len(values) >= 12:
                            for month_idx in range(12):
                                month_key = str(month_idx + 1)
                                if month_key not in records[current_lake]['calendar_month_records']:
                                    records[current_lake]['calendar_month_records'][month_key] = {}
                                records[current_lake]['calendar_month_records'][month_key]['mean'] = {
                                    'value': float(values[month_idx])
                                }
                            # Annual mean is usually the last value
                            if len(values) >= 13:
                                records[current_lake]['period_mean'] = float(values[12])

                    elif current_lake and line.startswith('Max'):
                        # Parse Max row and the year row that follows
                        values = re.findall(r'[\d.]+', line)
                        line_idx += 1
                        if line_idx < len(lines):
                            year_line = lines[line_idx].strip()
                            years = re.findall(r'\d{4}', year_line)

                            for month_idx in range(min(len(values), 12)):
                                month_key = str(month_idx + 1)
                                if month_key not in records[current_lake]['calendar_month_records']:
                                    records[current_lake]['calendar_month_records'][month_key] = {}
                                records[current_lake]['calendar_month_records'][month_key]['max'] = {
                                    'value': float(values[month_idx]),
                                    'year_set': int(years[month_idx]) if month_idx < len(years) else None
                                }

                    elif current_lake and line.startswith('Min'):
                        # Parse Min row and the year row that follows
                        values = re.findall(r'[\d.]+', line)
                        line_idx += 1
                        if line_idx < len(lines):
                            year_line = lines[line_idx].strip()
                            years = re.findall(r'\d{4}', year_line)

                            for month_idx in range(min(len(values), 12)):
                                month_key = str(month_idx + 1)
                                if month_key not in records[current_lake]['calendar_month_records']:
                                    records[current_lake]['calendar_month_records'][month_key] = {}
                                records[current_lake]['calendar_month_records'][month_key]['min'] = {
                                    'value': float(values[month_idx]),
                                    'year_set': int(years[month_idx]) if month_idx < len(years) else None
                                }

                    line_idx += 1

    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return {}

    return records


def build_hardcoded_records() -> dict:
    """
    Build records from the PDF data we extracted (hardcoded from the PDF content).
    This is a fallback if pdfplumber isn't available or fails.
    """
    records = {
        'superior': {
            'calendar_month_records': {
                '1': {'mean': {'value': 183.34}, 'max': {'value': 183.71, 'year_set': 2020}, 'min': {'value': 182.83, 'year_set': 1926}},
                '2': {'mean': {'value': 183.28}, 'max': {'value': 183.64, 'year_set': 2020}, 'min': {'value': 182.76, 'year_set': 1926}},
                '3': {'mean': {'value': 183.24}, 'max': {'value': 183.61, 'year_set': 1986}, 'min': {'value': 182.74, 'year_set': 1926}},
                '4': {'mean': {'value': 183.27}, 'max': {'value': 183.68, 'year_set': 1986}, 'min': {'value': 182.72, 'year_set': 1926}},
                '5': {'mean': {'value': 183.37}, 'max': {'value': 183.77, 'year_set': 2019}, 'min': {'value': 182.76, 'year_set': 1926}},
                '6': {'mean': {'value': 183.46}, 'max': {'value': 183.84, 'year_set': 2019}, 'min': {'value': 182.85, 'year_set': 1926}},
                '7': {'mean': {'value': 183.52}, 'max': {'value': 183.86, 'year_set': 2019}, 'min': {'value': 182.96, 'year_set': 1926}},
                '8': {'mean': {'value': 183.54}, 'max': {'value': 183.86, 'year_set': 2019}, 'min': {'value': 183.01, 'year_set': 2007}},
                '9': {'mean': {'value': 183.54}, 'max': {'value': 183.86, 'year_set': 2019}, 'min': {'value': 183.02, 'year_set': 2007}},
                '10': {'mean': {'value': 183.52}, 'max': {'value': 183.91, 'year_set': 1985}, 'min': {'value': 183.10, 'year_set': 1925}},
                '11': {'mean': {'value': 183.48}, 'max': {'value': 183.89, 'year_set': 1985}, 'min': {'value': 183.01, 'year_set': 1925}},
                '12': {'mean': {'value': 183.41}, 'max': {'value': 183.81, 'year_set': 1985}, 'min': {'value': 182.92, 'year_set': 1925}}
            },
            'period_mean': 183.41
        },
        'michigan_huron': {
            'calendar_month_records': {
                '1': {'mean': {'value': 176.33}, 'max': {'value': 177.26, 'year_set': 2020}, 'min': {'value': 175.57, 'year_set': 2013}},
                '2': {'mean': {'value': 176.31}, 'max': {'value': 177.24, 'year_set': 2020}, 'min': {'value': 175.59, 'year_set': 1964}},
                '3': {'mean': {'value': 176.33}, 'max': {'value': 177.22, 'year_set': 2020}, 'min': {'value': 175.58, 'year_set': 1964}},
                '4': {'mean': {'value': 176.41}, 'max': {'value': 177.29, 'year_set': 2020}, 'min': {'value': 175.61, 'year_set': 1964}},
                '5': {'mean': {'value': 176.51}, 'max': {'value': 177.37, 'year_set': 2020}, 'min': {'value': 175.74, 'year_set': 1964}},
                '6': {'mean': {'value': 176.57}, 'max': {'value': 177.44, 'year_set': 2020}, 'min': {'value': 175.76, 'year_set': 1964}},
                '7': {'mean': {'value': 176.60}, 'max': {'value': 177.45, 'year_set': 2020}, 'min': {'value': 175.78, 'year_set': 1964}},
                '8': {'mean': {'value': 176.58}, 'max': {'value': 177.42, 'year_set': 2020}, 'min': {'value': 175.77, 'year_set': 1964}},
                '9': {'mean': {'value': 176.53}, 'max': {'value': 177.38, 'year_set': 1986}, 'min': {'value': 175.76, 'year_set': 1964}},
                '10': {'mean': {'value': 176.47}, 'max': {'value': 177.50, 'year_set': 1986}, 'min': {'value': 175.70, 'year_set': 1964}},
                '11': {'mean': {'value': 176.41}, 'max': {'value': 177.38, 'year_set': 1986}, 'min': {'value': 175.65, 'year_set': 1964}},
                '12': {'mean': {'value': 176.36}, 'max': {'value': 177.26, 'year_set': 1986}, 'min': {'value': 175.61, 'year_set': 2012}}
            },
            'period_mean': 176.45
        },
        'st_clair': {
            'calendar_month_records': {
                '1': {'mean': {'value': 174.88}, 'max': {'value': 175.80, 'year_set': 2020}, 'min': {'value': 173.88, 'year_set': 1936}},
                '2': {'mean': {'value': 174.82}, 'max': {'value': 175.80, 'year_set': 1986}, 'min': {'value': 173.89, 'year_set': 1926}},
                '3': {'mean': {'value': 174.94}, 'max': {'value': 175.83, 'year_set': 2020}, 'min': {'value': 174.05, 'year_set': 1934}},
                '4': {'mean': {'value': 175.08}, 'max': {'value': 175.91, 'year_set': 2020}, 'min': {'value': 174.32, 'year_set': 1926}},
                '5': {'mean': {'value': 175.16}, 'max': {'value': 175.98, 'year_set': 2020}, 'min': {'value': 174.42, 'year_set': 1934}},
                '6': {'mean': {'value': 175.21}, 'max': {'value': 176.02, 'year_set': 2020}, 'min': {'value': 174.45, 'year_set': 1934}},
                '7': {'mean': {'value': 175.23}, 'max': {'value': 176.04, 'year_set': 2019}, 'min': {'value': 174.50, 'year_set': 1934}},
                '8': {'mean': {'value': 175.19}, 'max': {'value': 175.97, 'year_set': 2020}, 'min': {'value': 174.41, 'year_set': 1934}},
                '9': {'mean': {'value': 175.12}, 'max': {'value': 175.88, 'year_set': 2020}, 'min': {'value': 174.34, 'year_set': 1934}},
                '10': {'mean': {'value': 175.03}, 'max': {'value': 175.96, 'year_set': 1986}, 'min': {'value': 174.27, 'year_set': 1934}},
                '11': {'mean': {'value': 174.94}, 'max': {'value': 175.82, 'year_set': 1986}, 'min': {'value': 174.18, 'year_set': 1934}},
                '12': {'mean': {'value': 174.94}, 'max': {'value': 175.80, 'year_set': 1986}, 'min': {'value': 174.24, 'year_set': 1964}}
            },
            'period_mean': 175.05
        },
        'erie': {
            'calendar_month_records': {
                '1': {'mean': {'value': 174.03}, 'max': {'value': 174.86, 'year_set': 1987}, 'min': {'value': 173.21, 'year_set': 1935}},
                '2': {'mean': {'value': 174.03}, 'max': {'value': 174.90, 'year_set': 2020}, 'min': {'value': 173.18, 'year_set': 1936}},
                '3': {'mean': {'value': 174.11}, 'max': {'value': 174.95, 'year_set': 2020}, 'min': {'value': 173.20, 'year_set': 1934}},
                '4': {'mean': {'value': 174.26}, 'max': {'value': 175.05, 'year_set': 2020}, 'min': {'value': 173.38, 'year_set': 1934}},
                '5': {'mean': {'value': 174.34}, 'max': {'value': 175.08, 'year_set': 2020}, 'min': {'value': 173.44, 'year_set': 1934}},
                '6': {'mean': {'value': 174.37}, 'max': {'value': 175.14, 'year_set': 2019}, 'min': {'value': 173.45, 'year_set': 1934}},
                '7': {'mean': {'value': 174.36}, 'max': {'value': 175.13, 'year_set': 2019}, 'min': {'value': 173.45, 'year_set': 1934}},
                '8': {'mean': {'value': 174.29}, 'max': {'value': 175.02, 'year_set': 2019}, 'min': {'value': 173.43, 'year_set': 1934}},
                '9': {'mean': {'value': 174.20}, 'max': {'value': 174.87, 'year_set': 2019}, 'min': {'value': 173.38, 'year_set': 1934}},
                '10': {'mean': {'value': 174.10}, 'max': {'value': 174.94, 'year_set': 1986}, 'min': {'value': 173.30, 'year_set': 1934}},
                '11': {'mean': {'value': 174.03}, 'max': {'value': 174.85, 'year_set': 1986}, 'min': {'value': 173.20, 'year_set': 1934}},
                '12': {'mean': {'value': 174.02}, 'max': {'value': 174.89, 'year_set': 1986}, 'min': {'value': 173.19, 'year_set': 1934}}
            },
            'period_mean': 174.18
        },
        'ontario': {
            'calendar_month_records': {
                '1': {'mean': {'value': 74.58}, 'max': {'value': 75.16, 'year_set': 1946}, 'min': {'value': 73.81, 'year_set': 1935}},
                '2': {'mean': {'value': 74.62}, 'max': {'value': 75.27, 'year_set': 1952}, 'min': {'value': 73.78, 'year_set': 1936}},
                '3': {'mean': {'value': 74.69}, 'max': {'value': 75.37, 'year_set': 1952}, 'min': {'value': 73.94, 'year_set': 1935}},
                '4': {'mean': {'value': 74.89}, 'max': {'value': 75.65, 'year_set': 1973}, 'min': {'value': 74.03, 'year_set': 1935}},
                '5': {'mean': {'value': 75.03}, 'max': {'value': 75.80, 'year_set': 2017}, 'min': {'value': 74.11, 'year_set': 1935}},
                '6': {'mean': {'value': 75.06}, 'max': {'value': 75.91, 'year_set': 2019}, 'min': {'value': 74.19, 'year_set': 1935}},
                '7': {'mean': {'value': 75.01}, 'max': {'value': 75.80, 'year_set': 2019}, 'min': {'value': 74.14, 'year_set': 1934}},
                '8': {'mean': {'value': 74.90}, 'max': {'value': 75.58, 'year_set': 1947}, 'min': {'value': 74.00, 'year_set': 1934}},
                '9': {'mean': {'value': 74.75}, 'max': {'value': 75.41, 'year_set': 1947}, 'min': {'value': 73.91, 'year_set': 1934}},
                '10': {'mean': {'value': 74.62}, 'max': {'value': 75.22, 'year_set': 1945}, 'min': {'value': 73.82, 'year_set': 1934}},
                '11': {'mean': {'value': 74.54}, 'max': {'value': 75.18, 'year_set': 1945}, 'min': {'value': 73.75, 'year_set': 1934}},
                '12': {'mean': {'value': 74.53}, 'max': {'value': 75.20, 'year_set': 1945}, 'min': {'value': 73.74, 'year_set': 1934}}
            },
            'period_mean': 74.77
        }
    }
    return records


def compute_all_time_records(monthly_data: list) -> dict:
    """
    Compute all-time max, min, and average from monthly data.
    """
    if not monthly_data:
        return {}

    values_with_dates = [(d['value'], d['date']) for d in monthly_data]
    values = [v[0] for v in values_with_dates]

    max_val = max(values)
    min_val = min(values)
    avg_val = sum(values) / len(values)

    max_date = next(d for v, d in values_with_dates if v == max_val)
    min_date = next(d for v, d in values_with_dates if v == min_val)

    return {
        'max': {'value': round(max_val, 2), 'date': max_date},
        'min': {'value': round(min_val, 2), 'date': min_date},
        'avg': {'value': round(avg_val, 2)}
    }


def process_all_data(data_dir: Path) -> list:
    """
    Process all data files and build the final JSON structure.
    """
    output = []
    now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

    # Parse forecast data
    forecast_file = data_dir / 'CoordForecast.csv'
    forecasts = {}
    if forecast_file.exists():
        forecasts = parse_forecast_csv(forecast_file)

    # Try to parse PDF records, fall back to hardcoded
    pdf_file = data_dir / 'GLWL_MM_Metric.pdf'
    pdf_records = {}
    if pdf_file.exists() and HAS_PDFPLUMBER:
        pdf_records = parse_pdf_records(pdf_file)

    if not pdf_records:
        print("Using hardcoded records from PDF data")
        pdf_records = build_hardcoded_records()

    # Process each lake
    for lake_key, lake_config in LAKES_CONFIG.items():
        csv_file = data_dir / lake_config['csv_file']

        if not csv_file.exists():
            print(f"Warning: CSV file not found: {csv_file}")
            continue

        # Parse monthly CSV data
        csv_data = parse_monthly_csv(csv_file)

        # Get forecast data for this lake
        lake_forecasts = forecasts.get(lake_config['forecast_col'], [])

        # Get records for this lake
        lake_records = pdf_records.get(lake_key, {})

        # Compute all-time records from data
        all_time_records = compute_all_time_records(csv_data['monthly'])

        # Build the data structure for this lake
        lake_data = {
            'lake': lake_config['id'],
            'name': lake_config['name'],
            'updated': now,
            'data': [
                {
                    'type': 'lakewide_average_water_level',
                    'type_title': 'Lakewide Average Water Level',
                    'units': 'meters_IGLD85',
                    'series': {
                        'monthly': csv_data['monthly'],
                        'annual': csv_data['annual'],
                        'all_time_records': all_time_records,
                        'calendar_month_records': lake_records.get('calendar_month_records', {}),
                        'period_of_record_mean': lake_records.get('period_mean')
                    }
                }
            ]
        }

        # Add forecast data if available
        if lake_forecasts:
            lake_data['data'].append({
                'type': 'coordinated_forecast',
                'type_title': 'Coordinated 6-Month Forecast',
                'units': 'meters_IGLD85',
                'series': {
                    'monthly_forecast': lake_forecasts
                }
            })

        output.append(lake_data)

    return output


def main():
    """Main entry point."""
    # Determine data directory (same directory as script)
    script_dir = Path(__file__).parent
    data_dir = script_dir

    print(f"Processing data from: {data_dir}")

    # Process all data
    result = process_all_data(data_dir)

    if not result:
        print("Error: No data was processed")
        return 1

    # Write output JSON
    output_file = data_dir / 'great_lakes_water_levels.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Output written to: {output_file}")
    print(f"Processed {len(result)} lakes")

    # Print summary
    for lake in result:
        monthly_count = len(lake['data'][0]['series']['monthly'])
        annual_count = len(lake['data'][0]['series']['annual'])
        print(f"  {lake['name']}: {monthly_count} monthly records, {annual_count} annual records")

    return 0


if __name__ == '__main__':
    exit(main())
