# Fresh Water Lakes Dashboard

I skipped writing this all out in favor of having Claude analyze the old code base first. The trimming from there.

# Project Context

When creating and working with this codebase, prioritize readability over cleverness. Organization of files and components for this codebase is critical. Ask clarifying questions before making architectural changes. 

## About This Project

My software development career started in 2012 with what evolved into the Great Lakes Dashboard Project. The final version of that dashboard in full form was built using Adobe (or Apache) Flex - for the Flash Platform - and had an incredible number of features that, at the time, could not be ported to HTML5. Assuming those features could be ported to a platform like NextJS for a Progressive Web App, this project looks to build a new version of that dashboard.

### Summary of the Fresh Water Lakes Dashboard

I would like to build a general data plotting dashboard for Fresh Water Lakes, starting with first and foremost water levels, and those of the Laurentian Great Lakes of North America - Superior, Michigan-Huron (hydrologically one as they are connected by the Straits of Mackinac), St. Clair, Erie, and Ontario. There are numerous forms of water level data both operational and research that we could plot, but I would like to focus on a limited subset of those data (*for now*). That detail is important when you reference the old code repository to figure out how to build a new dashboard system. The specifics on those data I wish to focus on are as follows:

- Start from 1918 and plot the data to present day
- These are lakewide average water levels in either feet or meters per the International Great Lakes Datum 1985. 
- There are certain temporal averages of interest that capture the seasonal cycle of lake water levels and trends across years. They are:
    - Monthly Average
    - Annual Average
    - Period of Record
- I would also like to integrate the 6 month water level forecast ranges coordinated between the United States and Canada. 
- Additionally, if somone zooms out and looks at nearly the entire period of record (say, 50 years, but this should be adjusted and different between a mobile device and desktop/laptop), it becomes easier on the eyes to view a custom form of the standard High, Low, Open, Close (HLOC) chart, where a light blue bar represents the range of the monthly lakewide average water level through a year, and couple of lines in the middle of that bar (or top or bottom edges as applicable) indicate where water levels started and finished for the year. Thus a previous year's finish line should touch or be at level with the successive year bar's starting line. A third line through the bar can represent the annual average.
- Lastly, when zoomed in at a range of less than 50 years, or even fewer, we should be able to display calendar monthly (January thru December) record statistics. These are:
    - Record low level for calendar month
    - Record high level for calendar month
    - Period of record (1918 - present) average for the calendar month 
    - Period of record all time low level
    - Period of record all time high level

### Technical Requirements

- Progressive Web Application: comfortably functional on both mobile and desktop devices

### Human Requirements

- Download of more recent lakewide monthly average data (monthly), the coordinated forecast (monthly), and records (annually)

