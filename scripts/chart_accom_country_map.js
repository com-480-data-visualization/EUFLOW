(function () {
    const svg = d3.select("#accom-country-map");
    const MAP_W = 858, MAP_H = 620;

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
        AT:"Austria", BE:"Belgium", BG:"Bulgaria", HR:"Croatia", CY:"Cyprus",
        CZ:"Czech Republic", DK:"Denmark", EE:"Estonia", FI:"Finland", FR:"France",
        DE:"Germany", EL:"Greece", HU:"Hungary", IE:"Ireland", IT:"Italy",
        LV:"Latvia", LT:"Lithuania", LU:"Luxembourg", MT:"Malta", NL:"Netherlands",
        PL:"Poland", PT:"Portugal", RO:"Romania", SK:"Slovakia", SI:"Slovenia",
        ES:"Spain", SE:"Sweden"
    };

    const aLabels = {
        'R_HOT':  'Hotel',
        'NR_RF':  'Friends & relatives',
        'NR_OWN': 'Own / family home',
        'R_OTH':  'Other rented',
        'R_CAMP': 'Camping',
        'R_HOL':  'Holiday dwelling',
        'NR_OTH': 'Other non rented'
    };
    const aColors = {
        'R_HOT':  '#1565C0',
        'NR_RF':  '#E65100',
        'NR_OWN': '#558B2F',
        'R_OTH':  '#6A1B9A',
        'R_CAMP': '#00897B',
        'R_HOL':  '#C0CA33',
        'NR_OTH': '#9E9E9E'
    };

    const NO_DATA_FILL  = "#4A4A4A";
    const BACKDROP_FILL = "#D2D6DB";
    const BG_COLOR      = "#F6F8FB";

    const aggCodes = new Set(['EA20', 'EU27_2020']);

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/most_popular_accomod_by_country.csv")
    ]).then(([world, csvData]) => {
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years    = yearCols.map(k => k.trim());

        const accByCode = {};
        csvData.forEach(row => {
            const code = (row.geo || "").trim();
            if (!code || aggCodes.has(code)) return;
            accByCode[code] = {};
            yearCols.forEach((col, i) => {
                accByCode[code][years[i]] = (row[col] || "").trim();
            });
        });

        const allCountries = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10);
        const euFeats       = allCountries.filter(d => EU27_ISO.has(+d.id));
        const backdropFeats = allCountries.filter(d => !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(820)
            .translate([MAP_W / 2, MAP_H / 2 + 20]);
        const path = d3.geoPath().projection(projection);

        svg.append("g").attr("class", "backdrop")
            .selectAll("path")
            .data(backdropFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        const gEU = svg.append("g").attr("class", "eu");

        const select = d3.select("#accom-country-year-select");
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 1]);

        const tooltip = d3.select("#accom-country-tooltip");

        function update(year) {
            gEU.selectAll("path")
                .data(euFeats, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.5)
                .transition().duration(500)
                .attr("fill", d => {
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const a = accByCode[code] && accByCode[code][year];
                    return aColors[a] || NO_DATA_FILL;
                });

            gEU.selectAll("path")
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.78);
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const name = codeToName[code] || code;
                    const a = accByCode[code] && accByCode[code][year];
                    tooltip.style("display", "block")
                        .text(`${name} (${year}): ${aLabels[a] || "no data"}`);
                })
                .on("mousemove", function (event) {
                    const c = document.querySelector("#accom-country-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - c.left + 10) + "px")
                        .style("top",  (event.clientY - c.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });

            renderLegend(year);
        }

        const legendG = svg.append("g").attr("class", "legend")
            .attr("transform", "translate(24, 60)");

        function renderLegend(year) {
            // Show only accommodation types that actually appear in the selected year
            const present = new Set();
            Object.values(accByCode).forEach(o => { if (o[year]) present.add(o[year]); });
            const items = [...present]
                .filter(k => aLabels[k])
                .map(k => ({ key: k, label: aLabels[k], color: aColors[k] }));
            items.push({ key: "no_data", label: "No data", color: NO_DATA_FILL });

            legendG.selectAll("*").remove();
            legendG.append("rect")
                .attr("x", -10).attr("y", -12)
                .attr("width", 200).attr("height", items.length * 22 + 16)
                .attr("fill", BG_COLOR).attr("fill-opacity", 0.92)
                .attr("rx", 4);

            const item = legendG.selectAll("g.item")
                .data(items)
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
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
