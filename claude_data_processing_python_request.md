# Data Processing Script Request

Please take the following data files:

@LakeSuperior_MonthlyMeanWaterLevels_1918to2026.csv
@LakeMichiganHuron_MonthlyMeanWaterLevels_1918to2026.csv
@LakeStClair_MonthlyMeanWaterLevels_1918to2026.csv
@LakeErie_MonthlyMeanWaterLevels_1918to2026.csv
@LakeOntario_MonthlyMeanWaterLevels_1918to2026.csv
@CoordForecast.csv
@records/*
@GLWL_MM_English.pdf
@GLWL_MM_Metric.pdf

... and, considering what you analyzed before, create a python script that produces a JSON file formatted like the proposal below. Heirarchy should be Lake (Superior, Michigan-Huron, etc.), then data type (monthly lakewide average, annual... etc.) to enable expandability possibly in the future.

The *1918to2026.csv files have several lines of pound sign denoted metadata header, followed by the main data header labelling years and calendar months, and then the numerical data in the following rows. 

CoordForecast.csv has the lakes by columns and an indicated percentile under the 'band' column, which is followed by the month and year for the forecast. All I care about from these is the forecast high and forecast low monthly lakewide average water level for each lake. Thus for each month forecasted and for each lake, get the three values attributed to them and compute their max and min to form the floating bar plot.

GLWL_MM_Metric.pdf has the metric all time records and calendar month records. Utilize a python module to open them up for reading. pdfplumber might be the best fit. The columns are the calendar months and annual average. The rows have a sequence: the lake, a past year's monthly average water levels (in this case 2024), the calendar month means for the period of record, the calendar month record maximums, followed by the years that they were set in another row, then lastly the calendar month record minimums, followed by the years that they were set in another row. That row sequence repeats for Lakes Superior, Michigan-Huron, St. Clair, Erie, and Ontario.


### Proposed JSON Format (no data are real or accurate here, this is just an example)
```json
[
    {
        "lake": "superior",
        "updated": "2024-01-15T07:00:00Z",
        "data": [
            {
                "type": "lakewide_average_water_level",
                "type_title": "Lakewide Average Water Level",
                "units": "meters_IGLD85",
                "series": {
                    "monthly": [
                        {"date": "2024-01", "value": 183.28}
                    ],
                    "annual": [
                        {"date": "2024", "value": 183.30}
                    ],
                    "all_time_records": {
                        "max": {"value": 183.91, "date": "1985-10"},
                        "min": {"value": 182.72, "date": "1926-04"},
                        "avg": {"value": 183.00}
                    },
                    "calendar_month_records": {
                        "1": {
                            "min": {
                                "value": 184.50,
                                "year_set": 1999
                            },
                            "max": {
                                "value": 187.99,
                                "year_set": 2000
                            },
                            "mean": {
                                "value": 185.80
                            }
                        },
                        "2": {
                            "min": {
                                "value": 184.50,
                                "year_set": 1999
                            },
                            "max": {
                                "value": 187.99,
                                "year_set": 2000
                            },
                            "mean": {
                                "value": 185.80
                            }
                        },
                    }
                }
            }
        ]
    },
    ...
]
```
