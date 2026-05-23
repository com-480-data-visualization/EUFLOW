(function () {
    const svg = d3.select("#europe-seasonality-map");
    const MAP_W = 858, MAP_H = 720;

    // EU-27 country prefixes used to filter NUTS-2 regions
    const EU27 = new Set([
        "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR",
        "DE","EL","HU","IE","IT","LV","LT","LU","MT","NL",
        "PL","PT","RO","SK","SI","ES","SE"
    ]);

    // World-atlas ISO numeric IDs of EU-27 (so we can suppress them on the backdrop)
    const EU27_ISO = new Set([
        40,56,100,191,196,203,208,233,246,250,276,300,348,
        372,380,428,440,442,470,528,616,620,642,703,705,724,752
    ]);

    // Seasonal palette — each month gets its own color
    const monthOrder = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];

    const monthColor = {
        January:   "#8FA8C9",
        February:  "#B8C4DC",
        March:     "#CDD7A3",
        April:     "#B8D8B5",
        May:       "#8BC78B",
        June:      "#E8C896",
        July:      "#E89AA0",
        August:    "#D77F75",
        September: "#E0A875",
        October:   "#C49060",
        November:  "#A88476",
        December:  "#7B8AA8"
    };

    const NO_DATA_FILL  = "#4A4A4A";   // for EU NUTS regions with no value
    const BACKDROP_FILL = "#D2D6DB";   // non-EU countries (UK, NO, CH, etc.)
    const BG_COLOR      = "#F6F8FB";

    Promise.all([
        d3.json("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_2.geojson"),
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/most_popular_month_by_country.csv")
    ]).then(([nuts, world, csvData]) => {
        // CSV columns: index, geo, "2020 ", "2021 ", ...  (trailing spaces)
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());

        // Lookup: NUTS code -> { year -> month name }
        const monthByCode = {};
        csvData.forEach(row => {
            const code = (row.geo || "").trim();
            if (!code) return;
            monthByCode[code] = {};
            yearCols.forEach((col, i) => {
                monthByCode[code][years[i]] = (row[col] || "").trim();
            });
        });

        // NUTS-2 features in the EU-27
        const nutsFeats = nuts.features.filter(f => EU27.has(f.properties.CNTR_CODE));

        // World backdrop: keep only non-EU countries so we don't double-paint EU shapes
        const worldFeats = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10 && !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(950)
            .translate([MAP_W / 2, MAP_H / 2 + 30]);

        const path = d3.geoPath().projection(projection);

        const gBackdrop = svg.append("g").attr("class", "backdrop");
        const gNuts     = svg.append("g").attr("class", "nuts");

        gBackdrop.selectAll("path")
            .data(worldFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        // Year selector (reuses the existing dropdown element)
        const select = d3.select("#europe-month-select");
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 1]);

        const tooltip = d3.select("#europe-seasonality-tooltip");

        function update(year) {
            gNuts.selectAll("path")
                .data(nutsFeats, d => d.properties.NUTS_ID)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.35)
                .attr("fill", d => {
                    const code = d.properties.NUTS_ID;
                    const m = monthByCode[code] && monthByCode[code][year];
                    return monthColor[m] || NO_DATA_FILL;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const code = d.properties.NUTS_ID;
                    const name = d.properties.NAME_LATN || d.properties.NUTS_NAME || code;
                    const m = monthByCode[code] && monthByCode[code][year];
                    tooltip.style("display", "block")
                        .text(`${name} (${year}): ${m || "no data"}`);
                })
                .on("mousemove", function (event) {
                    const container = document.querySelector("#europe-seasonality-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - container.left + 10) + "px")
                        .style("top",  (event.clientY - container.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });

        // ---- Legend (top-left overlay, like the Eurostat reference) ----
        const legendItems = monthOrder
            .map(m => ({ label: m, color: monthColor[m] }))
            .concat([{ label: "No data", color: NO_DATA_FILL }]);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(24, 180)");

        // Background panel for readability
        legend.append("rect")
            .attr("x", -10).attr("y", -12)
            .attr("width", 200).attr("height", legendItems.length * 22 + 16)
            .attr("fill", BG_COLOR).attr("fill-opacity", 0.92)
            .attr("rx", 4);

        const item = legend.selectAll("g.item")
            .data(legendItems)
            .join("g")
            .attr("class", "item")
            .attr("transform", (d, i) => `translate(0, ${i * 22})`);

        item.append("rect")
            .attr("width", 18).attr("height", 18)
            .attr("fill", d => d.color)
            .attr("stroke", "#333").attr("stroke-width", 0.5);

        item.append("text")
            .attr("x", 26).attr("y", 13)
            .attr("font-size", "13px")
            .attr("fill", "#222")
            .text(d => d.label);
    });
})();
