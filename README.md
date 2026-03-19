# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Amine Youssef  | 324253 |
| Lia Lee        | 423066 |
| Hsiangtien Kuo | 414354 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

## Dataset
The datasets used in this milestone include travel, flights, and economic indicator data.
Additional datasets may be added during further milestones to enrich the scope and improve analytical depth.

#### 🧳 Travel Data
[Visitors from European Countries to Switzerland (in hotel sector)](https://www.pxweb.bfs.admin.ch/pxweb/en/px-x-1003020000_102/-/px-x-1003020000_102.px/): provided by the Federal Statistical Office (FSO)  
[Trips of EU residents](https://ec.europa.eu/eurostat/data/database?node_code=tin00193): provided by Eurostat  

#### ✈️ Airports and Flights Data
<a href="https://openflights.org/data">Airports</a>
<a href="https://github.com/jpatokal/openflights" style="text-decoration:none !important; color:inherit !important;"><code>GitHub</code></a>: provided by OpenFlights  
[Flights](https://www.opdi.aero/flight-list-data.html): provided by Open Performance Data Initiative (OPDI) in collaboration with OpenSky Network (OSN)  

#### 🪙 GDP Data
[Purchasing Power adjusted GDP per capita](https://ec.europa.eu/eurostat/databrowser/view/sdg_10_10/default/table?lang=en): provided by Eurostat  


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
Several previous projects and organizations have already explored and analyzed European tourism data. One of the previous group projects, [EuropeTourism](https://github.com/com-480-data-visualization/EuropeTourism?tab=readme-ov-file), analyzed and visualized the peak and off-peak tourism seasons across European countries through monthly data analysis.

In addition, the [EU Transition Pathways Platform](https://transition-pathways.europa.eu/), an official website from the European Union, provided numerous analyses of European tourism trends and prospects. UN Tourism, a specialized agency of the United Nations, provides various detailed analyses of tourism, such as [European Union Tourism Trends](https://www.untourism.int/). Furthermore, The [European Travel Commission](https://etc-corporate.org/) provides report focusing on major themes influencing tourism, including travel price sensitivity, tourism value, and potential risks. In addition, it evaluates travel sentiment and market performance across different source markets, and concludes with an economic outlook for the sector.

### 🆕 Why is your approach original?
We will integrate multiple tourism and related travel datasets to analyze not only tourism patterns themselves but also factors influencing travel behavior. In addition to seasonality, we will further explore factors such as transportation modes, travel distance, and economic conditions, as well as whether proximity to Switzerland and GDP levels affect travel frequency to Switzerland.

### 💡 What source of inspiration do you take?
Relevant flight visualized information can also be obtained from websites such as the [OpenSky Network](https://map.opensky-network.org/), which provides real-time air traffic data including aircraft position, callsign, aircraft type, altitude, and flight routes collected from ADS-B receivers worldwide. The data are visualized on an interactive thematic map where each aircraft is represented by a symbol at its current location, with colors encoding flight information, and additional details are displayed in a table for filtering and searching.


## Milestone 2 (17th April, 5pm)

**10% of the final grade**


## Milestone 3 (29th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

