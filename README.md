# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Amine Youssef  | 324253 |
| Lia Lee        | 423066 |
| Hsiangtien Kuo | 414354 |

[Milestone 1](#milestone-1-20th-march-5pm) • [Milestone 2](#milestone-2-17th-april-5pm) • [Milestone 3](#milestone-3-29th-may-5pm)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

## Dataset
The datasets used in this milestone include travel, flights, and economic indicator data.
Additional datasets may be added during further milestones to enrich the scope and improve analytical depth.

#### 🧳 Travel Data
[Visitors from European Countries to Switzerland (in hotel sector)](https://www.pxweb.bfs.admin.ch/pxweb/en/px-x-1003020000_102/-/px-x-1003020000_102.px/): the datasets are provided by the Federal Statistical Office (FSO), including annual and monthly data (in hotel sector) on tourist arrivals and overnight stays in Switzerland, categorized by visitors’ country of residence and Swiss cantons    
[EU residents’ tourism behavior](https://ec.europa.eu/eurostat/data/database?node_code=tin00193): the datasets are provided by Eurostat, including information on tourism, trip characteristics (purpose, duration, and destination), nights spent, and tourism expenditure of EU residents   

#### ✈️ Airports and Flights Data
<a href="https://openflights.org/data">Airports</a>
<a href="https://github.com/jpatokal/openflights" style="text-decoration:none !important; color:inherit !important;"><code>GitHub</code></a>: the datasets are provided by OpenFlights, including airports, airlines, and routes data    
[Flights](https://www.opdi.aero/flight-list-data.html): the datasets are provided by Open Performance Data Initiative (OPDI) in collaboration with OpenSky Network (OSN), including monthly flight data (from Jan 2022 to Jan 2026) such as flight IDs, ICAO operators, departure and arrival airports, as well as first and last seen times of each flight  

#### 🪙 GDP Data
[Purchasing Power adjusted GDP per capita](https://ec.europa.eu/eurostat/databrowser/view/sdg_10_10/default/table?lang=en): the datasets are provided by Eurostat, including GDP data (measured in purchasing power standards (PPS)) of European countries from 2015 to 2024    


## Problematic

### 🎨 What am I trying to show with my visualization?
<p style="text-align: justify;">
Millions of people travel throughout Europe each year, making tourism a significant economic and cultural activity. However, travel patterns vary widely depending on destination popularity, seasonality, transportation options, and travel spending. This project aims to visualize tourism flows, seasonal patterns, transportation options, and travel expenditures across various destinations in order to better understand how Europeans travel within Europe.

We address the following questions:
1. Where do Europeans travel, and which destinations are the most popular?
2. When do Europeans travel, and how do seasonal patterns differ across destinations?
3. How do Europeans travel, and what transport modes shape tourism flows?
4. How much do travelers spend, and how does spending relate to trip duration or destination type?

In addition to the broader European analysis, we will focus on Switzerland to investigate whether the frequency of travel to Switzerland is influenced by economic and geographic factors. We specifically investigate whether visitors to Switzerland are more likely to come from nations that are geographically closer to Switzerland or from nations with greater GDP levels.

### 📝 Think of an overview for the project, your motivation, and the target audience.
<p style="text-align: justify;">
Our motivation for this project comes from our own experience as international students currently living in Switzerland. Since we all come from different countries and are personally interested in traveling across Europe, we became curious about the larger patterns behind tourism in Europe and how Switzerland fits into these trends.

The target audience for this project includes students and young travelers planning trips in Europe, tourism organizations and policymakers interested in understanding regional travel behavior, and researchers studying mobility and tourism trends. By presenting the data through clear and interactive visualizations, our project aims to make complex tourism statistics easier to understand and more engaging for a broad audience.



## Exploratory Data Analysis


Before starting the actual analysis, we had to spend some time cleaning the Eurostat tourism datasets because, in their raw form, they are not very easy to work with. The files contain several dimensions grouped into a single column, while the yearly observations are spread across many separate columns. 

To make the data usable, we first split the encoded column into separate variables: the country of residence (`geo`) and, depending on the dataset, the destination country, accommodation type, or trip characteristic. Then, we converted the year columns into numeric values so that calculations and visualizations could be done properly. We also removed columns that were not directly useful for the analysis, such as frequency and unit indicators, and filtered missing values to avoid inconsistencies across countries and years.

Once the data was cleaned, the first thing we looked at was its general structure. A simple descriptive analysis already shows that tourism behavior is very uneven across Europe. Some countries appear repeatedly with much higher values than others, whether in terms of expenditure, number of trips, or nights spent.

All of these preprocessing steps, summary statistics, and visualizations can be found in the `exploratory_data_analysis.ipynb` file.
## Related work

### 📚 What others have already done with the data?
Some projects and organizations have explored and analyzed European tourism data. A previous group project, [EuropeTourism](https://github.com/com-480-data-visualization/EuropeTourism?tab=readme-ov-file), analyzed and visualized the peak and off-peak tourism seasons across European countries through monthly data analysis. In addition, the [EU Transition Pathways Platform](https://transition-pathways.europa.eu/), an official website from the European Union, provided numerous analyses of European tourism trends and prospects. UN Tourism, a specialized agency of the United Nations, provides various detailed analyses of tourism, such as [European Union Tourism Trends](https://www.untourism.int/). Furthermore, The [European Travel Commission](https://etc-corporate.org/) publishes report focusing on key trends influencing tourism, including travel price sensitivity, tourism value, and potential risks. In addition, it evaluates travel sentiment and market performance across different source markets, and concludes with an economic outlook for the sector.

### 🆕 Why is your approach original?
We will integrate multiple tourism and related travel datasets to analyze not only tourism patterns themselves but also factors influencing travel behavior. In addition to seasonality, we will further explore factors such as transportation modes, travel distance, and economic conditions, as well as whether proximity to Switzerland and GDP levels affect travel frequency to Switzerland.

### 💡 What source of inspiration do you take?
Relevant flight visualized information can also be obtained from websites such as the [OpenSky Network](https://map.opensky-network.org/), which provides real-time air traffic data including aircraft position, callsign, aircraft type, altitude, and flight routes collected from ADS-B receivers worldwide. The data are visualized on an interactive thematic map where each aircraft is represented by a symbol at its current location, with colors encoding flight information, and additional details are displayed in a table for filtering and searching.


## Milestone 2 (17th April, 5pm)

**10% of the final grade**

📑 The Milestone 2 report: [Milestone 2](./Milestone2.pdf)  
🔗 The Functional project prototype: [EUFLOW](https://com-480-data-visualization.github.io/EUFLOW/)

## Milestone 3 (29th May, 5pm)

**80% of the final grade**

📑 Process book: [MS3 Process book.pdf](https://github.com/com-480-data-visualization/EUFLOW/blob/44be2107e3cb8622e871c10e21d7c5cc9483ba8a/Milestone%203/MS3_Process_book.pdf)
🔗 Live site: [EUFLOW](https://com-480-data-visualization.github.io/EUFLOW/)
🎥 Screencast: [EUFlow](https://youtu.be/7Zl47GV22Go)

### What this is

EUFlow is a scrollable, four-act data story about how Europeans travel inside their own continent, with a country-scale deep dive into Switzerland and a closing synthesis page. Every chart loads its data directly from static files in the repo and renders client-side in the browser. No backend, no build step.

### Intended usage

The site is meant to be read top to bottom, page by page, in this order:

1. **Home** (`index.html`) opens the story with a one-sentence puzzle and a four-card chapter map. Each card deep-links into the corresponding chapter on the Europe page; two larger cards lead to the Switzerland deep-dive and the Findings synthesis.
2. **Europe** (`europe.html`) is four chapters: *Where* Europe travels (5 beats including a side-by-side origin comparison), *How* Europe travels (4 beats on transport, stay length, and accommodation), *When* Europe travels (3 beats including paired country-vs-region seasonality), and *How much* it costs (4 beats including paired per-trip vs per-night spending).
3. **Switzerland** (`switzerland.html`) is five chapters at country scale: *Where* in Switzerland, *When* Switzerland fills up, *How* visitors stay (with an interactive dual-handle year slider for the 2005-2025 window), *How much* they spend, and *Why* they come.
4. **Findings** (`findings.html`) closes with three validated findings, the limitations we ran into, the data sources, and the team.

Every chart has hover tooltips with exact values. Year selectors, month selectors, and country pickers are placed top-right on the relevant frames.

### Technical setup

The site is static. It does require a local HTTP server because the chart scripts use `fetch` to load JSON and CSV files.

**Dependencies (all loaded from CDN, nothing to install for the site itself):**
- D3.js 7.8.5
- TopoJSON 3
- Plotly (used only for the destination-trends line chart on the Europe page)

**To regenerate the Switzerland preprocessed data:**
- Python 3 (standard library only)

**Run locally:**
```bash
git clone https://github.com/com-480-data-visualization/EUFLOW.git
cd EUFLOW

# (optional) regenerate Switzerland preprocessed files
python3 preprocess_fso_for_switzerland.py

# serve any way you like
python3 -m http.server 8000
# or:  npx http-server -p 8000
# or:  npx serve

# open
open http://localhost:8000/
```

Opening the HTML files directly from the file system (`file://...`) will not work because of browser CORS rules on local fetches.

### Repository structure

```
.
├── index.html                          home: hero + story preamble + chapter map + About
├── europe.html                         the 4-chapter Europe story
├── switzerland.html                    the 5-chapter Switzerland deep dive
├── findings.html                       synthesis: findings + limitations + sources
├── style.css                           single stylesheet, organized by feature
│
├── scripts/
│   ├── script.js                       navbar + animated stat counters
│   ├── chart-1.js .. chart-4.js        legacy Switzerland canton/distance/GDP charts
│   ├── chart-europe-heatmap.js         Europe nights choropleth
│   ├── chart_origin_choropleth.js          top origin by destination (with domestic)
│   ├── chart_origin_choropleth_excl_same.js   top foreign origin only
│   ├── chart_accom_stacked.js              continent-wide accommodation mix
│   ├── chart_accom_country_map.js          accommodation by country
│   ├── chart_seasonality_country.js        top month by country
│   ├── chart_seasonality.js                top month by NUTS 2 region
│   ├── chart_seasonality_nights_heatmap.js intensity by region/month
│   ├── chart_seasonality_top.js            top destination each month
│   ├── chart_expenditure_choropleth.js     per-trip spending by origin
│   ├── chart_expenditure_per_night.js      per-night spending by origin
│   ├── chart_expenditure_world.js          per-night spending by destination
│   ├── chart_expenditure_world_trip.js     per-trip spending by destination
│   ├── chart_expenditure_scope.js          domestic vs intra-EU vs outside-EU
│   ├── chart_expenditure_scatter.js        per-night vs per-trip scatter
│   ├── chart_nights_nuts_country.js        NUTS 2 nights, by country focus
│   ├── ch_top_month_per_canton.js          Switzerland: top month per canton
│   ├── ch_canton_month_heatmap.js          Switzerland: canton x month
│   ├── ch_top_origin_per_canton.js         Switzerland: top foreign origin per canton
│   ├── ch_domestic_foreign.js              Switzerland: domestic vs foreign mix
│   ├── ch_avg_stay.js                      Switzerland: average stay length per canton
│   ├── ch_recovery.js                      Switzerland: dual-handle year-window slider
│   ├── ch_inbound_per_night.js             Switzerland: per-night spending to CH
│   └── ch_inbound_scatter.js               Switzerland: per-trip vs per-night to CH
│
├── data/
│   ├── cleaned_arnraw.csv              Eurostat tour_dem_tttr cleaned
│   ├── cleaned_extotw.csv              Eurostat tour_dem_extotw cleaned (CH dest rows kept)
│   ├── cleaned_*.csv                   other Eurostat tables (ttw, tnws, tnac, tnw, ttws, nin2m)
│   ├── cantons.geojson                 Swiss canton geometry
│   ├── canton_annual_total_visitors.json     FSO arrivals per canton per year (all origins)
│   ├── canton_annual_total_eu_visitors.json  FSO arrivals per canton per year (EU origins)
│   ├── countries_distance.json         km from Bern to each country capital
│   ├── countries_distances_vs_visitors.json  combined distance + visitors
│   ├── eu_gdp_and_to_ch_df_merged.json GDP per capita + visits to CH
│   ├── ppp_adj_gdp_per_capita.csv      Eurostat sdg_10_10
│   └── px-x-1003020000_102_*.json      FSO PXweb 5-D cube (raw input to preprocessing)
│   └── swissBOUNDARIES3D_1_5_TLM_KANTONSGEBIET.dbf      Swiss Cantons geometry data (source: Federal Office of Topography swisstopo)
│   └── swissBOUNDARIES3D_1_5_TLM_KANTONSGEBIET.shp      Swiss Cantons geometry data (source: Federal Office of Topography swisstopo)
│   └── swissBOUNDARIES3D_1_5_TLM_KANTONSGEBIET.shx      Swiss Cantons geometry data (source: Federal Office of Topography swisstopo)
│
├── exploitable_data/
│   ├── most_popular_*.csv              Eurostat tables in long/tidy format
│   ├── percentage_accomad_per_year.csv
│   ├── total_nights_spent*.csv
│   ├── exp_ngt*.csv, exp_trp*.csv      expenditure data, several scopes
│   ├── nights_per_geo_per_month_per_year.csv
│   ├── in_EU_exp_trp.csv, out_EU_exp_trp.csv, same_country_exp_trp.csv
│   ├── ch_top_month_per_canton.json    Switzerland preprocessed (top month)
│   ├── ch_canton_month_intensity.json  Switzerland preprocessed (canton x month grid)
│   ├── ch_top_origin_per_canton.json   Switzerland preprocessed (top foreign origin)
│   ├── ch_canton_domestic_foreign.json Switzerland preprocessed (domestic vs foreign)
│   ├── ch_canton_avg_stay.json         Switzerland preprocessed (avg stay length)
│   ├── ch_canton_arrivals_by_year.json Switzerland preprocessed (arrivals 2005-2025)
│   └── ch_inbound_expenditure.json     Switzerland preprocessed (inbound spending)
│
├── images/                             hero backgrounds and thumbnails
├── exploratory_data_analysis.ipynb     Milestone 1 EDA + Eurostat cleaning pipeline
├── preprocess_fso_for_switzerland.py   FSO cube preprocessor (one-shot)
├── other_files/                        earlier sketches, intermediate scripts
├── Milestone2.pdf
└── README.md
```

### Data pipeline

Two preprocessing steps produce the static files that the browser loads at runtime.

**1. Eurostat tables → `exploitable_data/*.csv`**

Source: Eurostat tables `tour_dem_tttr`, `tour_dem_ttw`, `tour_dem_tnws`, `tour_dem_tnac`, `tour_dem_extotw`, `tour_dem_tnw`, `tour_occ_nim`, `tour_occ_nin2c`, `tour_occ_nin2m`, `sdg_10_10`.

Cleaning is performed in [exploratory_data_analysis.ipynb](./exploratory_data_analysis.ipynb): dimension-encoded columns are split into separate variables (`geo`, `c_dest`, `purpose`, `duration`, `accommod`, etc.), wide year-columns are kept (the charts iterate over them), `EU27_2020` and `EA20` aggregate rows are kept where useful, missing values are normalized.

**2. FSO PXweb cube → `exploitable_data/ch_*.json`**

Source: `data/px-x-1003020000_102_20260317-180818.json`, a 5-dimensional JSON-stat cube with axes `Jahr (Year) x Monat (Month) x Kanton (Canton) x Herkunftsland (Visitor's country of residence) x Indikator (Arrivals/Overnight stays)`. Roughly 1.2M cells.

The script [preprocess_fso_for_switzerland.py](./preprocess_fso_for_switzerland.py) decodes the cube and writes six compact derived files:

- `ch_top_month_per_canton.json` ........ `{canton: {year: peak_month}}`
- `ch_canton_month_intensity.json` ...... `{year: {canton: [m1..m12 arrivals]}}`
- `ch_top_origin_per_canton.json` ....... `{canton: {year: top_foreign_origin}}`, Swiss residents excluded
- `ch_canton_domestic_foreign.json` ..... `{year: {canton: {domestic, foreign, total}}}`
- `ch_canton_avg_stay.json` ............. `{year: {canton: nights/arrivals}}`
- `ch_canton_arrivals_by_year.json` ..... `{canton: {year: arrivals}}`, full 2005-2025 series

The Switzerland inbound expenditure subset (`ch_inbound_expenditure.json`) is extracted in a one-off step from `data/cleaned_extotw.csv` filtered to `c_dest = CH`. See the inline Python at the top of the file.

Re-run preprocessing:
```bash
python3 preprocess_fso_for_switzerland.py
```
The script is idempotent and uses only the standard library.

### Browser support

Modern Chromium, Firefox, and Safari. All chart scripts use ES2020 (optional chaining and nullish coalescing). IE and pre-2020 browsers will not work.

### Credits

**Team**
- Amine Youssef (324253)
- Lia Lee (423066)
- Hsiangtien Kuo (414354)

**Data sources**
- Eurostat: tourism (`tour_dem_*`, `tour_occ_*`), GDP (`sdg_10_10`)
- Swiss Federal Statistical Office: PXweb cube `px-x-1003020000_102`
- GISCO: NUTS 2 geometry (2021, 20M resolution)
- world-atlas: country TopoJSON (110m resolution)
- Federal Office of Topography swisstopo: swissBOUNDARIES3D data

**Visual stack**
- D3.js 7.8.5
- Plotly (Europe destination-trends chart only)
- TopoJSON 3
- All via CDN, no npm install required for the site itself

**Course**
- COM-480 Data Visualization, EPFL, Spring 2026

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

