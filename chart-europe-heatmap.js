const svg = d3.select("#europe-map");
const width = 900, height = 550;  // matches viewBox
const projection = d3.geoMercator()
    .center([15, 54])
    .scale(700)
    .translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

const isoToCode = {
    40: "AT", 56: "BE", 100: "BG", 191: "HR", 196: "CY",
    203: "CZ", 208: "DK", 233: "EE", 246: "FI", 250: "FR",
    276: "DE", 300: "EL", 348: "HU", 372: "IE", 380: "IT",
    428: "LV", 440: "LT", 442: "LU", 470: "MT", 528: "NL",
    578: "NO", 616: "PL", 620: "PT", 642: "RO", 703: "SK",
    705: "SI", 724: "ES", 752: "SE", 756: "CH", 792: "TR",
    804: "UA", 826: "UK", 352: "IS", 643: "RU"
};

const codeToName = {
    AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
    CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
    DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
    LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
    NO: "Norway", PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia",
    SI: "Slovenia", ES: "Spain", SE: "Sweden", CH: "Switzerland", TR: "Turkey",
    UA: "Ukraine", UK: "United Kingdom", IS: "Iceland", RU: "Russia"
};

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("exploitable_data/total_nights_spent_per_dest.csv")
]).then(([world, csvData]) => {
    const countries = topojson.feature(world, world.objects.countries).features;

    const dataByCode = {};
    csvData.forEach(row => { dataByCode[row.c_dest.trim()] = row; });

    const yearCols = Object.keys(csvData[0]).filter(k => k.trim() !== "c_dest");
    const years = yearCols.map(k => k.trim());

    const select = d3.select("#europe-year-select");
    years.forEach(y => select.append("option").attr("value", y).text(y));
    select.property("value", years[years.length - 1]);

    const tooltip = d3.select("#europe-tooltip");

    function updateMap(year) {
        const yearCol = yearCols[years.indexOf(year)];
        const maxVal = d3.max(
            Object.values(isoToCode),
            code => +(dataByCode[code]?.[yearCol]) || 0
        );
        const colorScale = d3.scaleSequential()
            .domain([0, maxVal])
            .interpolator(d3.interpolateRgb("#eaf4fb", "#0a2d5e"));

        svg.selectAll("path")
            .data(countries)
            .join("path")
            .attr("fill", d => {
                const code = isoToCode[+d.id];
                const row = code && dataByCode[code];
                const val = row ? +row[yearCol] : null;
                return val ? colorScale(val) : "#ddd";
            })
            .attr("stroke", "#aaa")
            .attr("stroke-width", 0.4)
            .attr("d", path)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.7);
                const code = isoToCode[+d.id];
                const row = code && dataByCode[code];
                const val = row ? +row[yearCol] : null;
                const name = codeToName[code] || null;
                if (!name) return;
                tooltip.style("display", "block")
                    .text(`${name}: ${val ? (val / 1e9).toFixed(2) + "B nights" : "no data"}`);
            })
            .on("mousemove", function(event) {
                const container = document.querySelector("#europe-map").getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX - container.left + 10) + "px")
                    .style("top", (event.clientY - container.top - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const code = isoToCode[+d.id];
                const row = code && dataByCode[code];
                const val = row ? +row[yearCol] : null;
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("fill", val ? colorScale(+row[yearCol]) : "#ddd");
                tooltip.style("display", "none");
            });
    }

    updateMap(years[years.length - 1]);
    select.on("change", function() { updateMap(this.value); });
});
