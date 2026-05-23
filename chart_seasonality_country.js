(function () {
    const svg = d3.select("#europe-seasonality-country-map");
    const MAP_W = 858, MAP_H = 720;

    const EU27_ISO_TO_CODE = {
        40:"AT", 56:"BE", 100:"BG", 191:"HR", 196:"CY",
        203:"CZ", 208:"DK", 233:"EE", 246:"FI", 250:"FR",
        276:"DE", 300:"EL", 348:"HU", 372:"IE", 380:"IT",
        428:"LV", 440:"LT", 442:"LU", 470:"MT", 528:"NL",
        616:"PL", 620:"PT", 642:"RO", 703:"SK", 705:"SI",
        724:"ES", 752:"SE"
    };
    const EU27_ISO = new Set(Object.keys(EU27_ISO_TO_CODE).map(Number));

    const codeToName = {
        AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
        CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
        DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
        LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
        PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
        ES: "Spain", SE: "Sweden"
    };

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

    const NO_DATA_FILL  = "#4A4A4A";
    const BACKDROP_FILL = "#D2D6DB";
    const BG_COLOR      = "#F6F8FB";

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/most_popular_month_by_country.csv")
    ]).then(([world, csvData]) => {
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());

        // Country-level rows only (2-letter geo codes)
        const monthByCode = {};
        csvData.forEach(row => {
            const code = (row.geo || "").trim();
            if (code.length === 2) {
                monthByCode[code] = {};
                yearCols.forEach((col, i) => {
                    monthByCode[code][years[i]] = (row[col] || "").trim();
                });
            }
        });

        const allCountries = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10);
        const euFeats       = allCountries.filter(d => EU27_ISO.has(+d.id));
        const backdropFeats = allCountries.filter(d => !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(950)
            .translate([MAP_W / 2, MAP_H / 2 + 30]);

        const path = d3.geoPath().projection(projection);

        const gBackdrop = svg.append("g").attr("class", "backdrop");
        const gCountry  = svg.append("g").attr("class", "country");

        gBackdrop.selectAll("path")
            .data(backdropFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        const select = d3.select("#europe-country-year-select");
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 1]);

        const tooltip = d3.select("#europe-seasonality-country-tooltip");

        function update(year) {
            gCountry.selectAll("path")
                .data(euFeats, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.5)
                .attr("fill", d => {
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const m = monthByCode[code] && monthByCode[code][year];
                    return monthColor[m] || NO_DATA_FILL;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const name = codeToName[code] || code;
                    const m = monthByCode[code] && monthByCode[code][year];
                    tooltip.style("display", "block")
                        .text(`${name} (${year}): ${m || "no data"}`);
                })
                .on("mousemove", function (event) {
                    const container = document.querySelector("#europe-seasonality-country-map").getBoundingClientRect();
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

        // ---- Legend (top-left overlay) ----
        const legendItems = monthOrder
            .map(m => ({ label: m, color: monthColor[m] }))
            .concat([{ label: "No data", color: NO_DATA_FILL }]);

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(24, 180)");

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
