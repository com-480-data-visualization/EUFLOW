const svg = d3.select("#europe-map");
const width = 858, height = 550;
const projection = d3.geoMercator();
const path = d3.geoPath().projection(projection);

// Country-level ISO numeric → CSV code (unchanged from before)
const isoToCode = {
    40: "AT", 56: "BE", 100: "BG", 191: "HR", 196: "CY",
    203: "CZ", 208: "DK", 233: "EE", 246: "FI", 250: "FR",
    276: "DE", 300: "EL", 348: "HU", 372: "IE", 380: "IT",
    428: "LV", 440: "LT", 442: "LU", 470: "MT", 528: "NL",
    578: "NO", 616: "PL", 620: "PT", 642: "RO", 703: "SK",
    705: "SI", 724: "ES", 752: "SE", 756: "CH", 792: "TR",
    804: "UA", 826: "UK", 352: "IS", 643: "RU",
    // Non-European countries in CSV
    76: "BR", 124: "CA", 156: "CN", 710: "ZA", 840: "US"
};

// Human-readable names for everything in the CSV
const codeToName = {
    // EU / European countries
    AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
    CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
    DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
    LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
    NO: "Norway", PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia",
    SI: "Slovenia", ES: "Spain", SE: "Sweden", CH: "Switzerland", TR: "Turkey",
    UA: "Ukraine", UK: "United Kingdom", IS: "Iceland", RU: "Russia",
    // Non-European countries
    BR: "Brazil", CA: "Canada", CN: "China", ZA: "South Africa", US: "United States",
    // Aggregates & continents (tooltip only, not on map)
    AFR: "Africa", AFR_OTH: "Africa (Other)",
    AME: "Americas", AME_C_S: "Central & South America",
    AME_C_S_OTH: "Central & South America (Other)", AME_N: "North America",
    ASI: "Asia", ASI_OTH: "Asia (Other)",
    EUR: "Europe", EUR_OTH: "Europe (Other)",
    EU27_2020: "EU27", EU27_2020_FOR: "EU27 (Foreign)",
    EFTA: "EFTA", FOR: "Foreign (Total)", DOM: "Domestic", WORLD: "World"
};

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("exploitable_data/total_nights_spent_per_dest.csv")
]).then(([world, csvData]) => {
    const countries = topojson.feature(world, world.objects.countries).features;
    const withoutAntarctica = countries.filter(d => +d.id !== 10);

    projection.fitSize([858, 550], {
        type: "FeatureCollection",
        features: withoutAntarctica
    });
    // Build yearData in the same shape as canton_annual_total_visitors.json:
    // { "2019": { "FR": 123, "DE": 456, ... }, "2020": { ... } }
    const yearCols = Object.keys(csvData[0]).filter(k => k.trim() !== "c_dest");
    const years = yearCols.map(k => k.trim());

    const visitors = {};
    years.forEach(y => {
        visitors[y] = {};
        csvData.forEach(row => {
            const code = row.c_dest.trim();
            const val = +row[yearCols[years.indexOf(y)]];
            if (code) visitors[y][code] = val;
        });
    });

    const select = d3.select("#europe-year-select");
    years.forEach(y => select.append("option").attr("value", y).text(y));
    select.property("value", years[years.length - 1]);

    const tooltip = d3.select("#europe-tooltip");
    
    function updateMap(year) {
        const yearData = visitors[year];
        const maxVal = d3.max(Object.values(yearData));
        const colorScale = d3.scaleSequential()
            .domain([0, maxVal])
            .interpolator(d3.interpolateRgb("#4575b4", "#d73027"));

        svg.selectAll("path")
            .data(countries)
            .join("path")
            .attr("fill", d => {
                const code = isoToCode[+d.id];
                const val = code && yearData[code];
                return val ? colorScale(val) : "#ffffff";
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("d", path)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.7);
                const code = isoToCode[+d.id];
                const val = code && yearData[code];
                const name = codeToName[code];
                if (!name) return;
                tooltip.style("display", "block")
                    .text(`${name}: ${val ? (val / 1e9).toFixed(2) + "B nights" : "no data"}`);
            })
            .on("mousemove", function(event) {
                const container = document.querySelector("#europe-map").getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX - container.left + 10) + "px")
                    .style("top",  (event.clientY - container.top - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const code = isoToCode[+d.id];
                const val = code && yearData[code];
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("fill", val ? colorScale(val) : "#ffffff");
                tooltip.style("display", "none");
            });
    }

    updateMap(years[years.length - 1]);
    select.on("change", function() { updateMap(this.value); });

    
});