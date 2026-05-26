(function () {
    const svg = d3.select("#nights-nuts-country-map");
    const MAP_W = 858, MAP_H = 720;

    const EU27_CODES = new Set([
        "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR",
        "DE","EL","HU","IE","IT","LV","LT","LU","MT","NL",
        "PL","PT","RO","SK","SI","ES","SE"
    ]);

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

    const BACKDROP_FILL = "#D2D6DB";
    const NO_DATA_FILL  = "#E0E0E0";
    const DIM_FILL      = "#dfe3ea";

    Promise.all([
        d3.json("https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_2.geojson"),
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/nights_per_geo_per_month_per_year.csv")
    ]).then(([nuts, world, csv]) => {
        // Aggregate to nights per (geo, year), summed across months
        const nights = {};   // nights[geo][year]
        const yearSet = new Set();
        csv.forEach(row => {
            const geo  = (row.geo || "").trim();
            const year = (row.year || "").trim();
            const v    = +row.nights;
            if (!geo || !year || !isFinite(v)) return;
            yearSet.add(year);
            if (!nights[geo]) nights[geo] = {};
            nights[geo][year] = (nights[geo][year] || 0) + v;
        });
        const years = [...yearSet].sort();

        // NUTS-2 features in the EU-27
        const nutsFeats = nuts.features.filter(f => EU27_CODES.has(f.properties.CNTR_CODE));

        // World backdrop (non-EU countries in gray)
        const worldFeats = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10 && !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(950)
            .translate([MAP_W / 2, MAP_H / 2 + 30]);
        const path = d3.geoPath().projection(projection);

        svg.append("g").attr("class","backdrop")
            .selectAll("path")
            .data(worldFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        const gLayer = svg.append("g").attr("class","layer");
        const cbarG  = svg.append("g").attr("class","cbar");

        // Year selector
        const ySelect = d3.select("#nights-nuts-country-year-select");
        ySelect.selectAll("option").remove();
        years.forEach(y => ySelect.append("option").attr("value", y).text(y));
        ySelect.property("value", years[years.length - 1]);

        // Country selector
        const cSelect = d3.select("#nights-nuts-country-country-select");
        cSelect.selectAll("option").remove();
        cSelect.append("option").attr("value", "ALL").text("All EU-27 countries");
        [...EU27_CODES].sort((a,b) => (codeToName[a] || a).localeCompare(codeToName[b] || b))
            .forEach(c => cSelect.append("option").attr("value", c).text(codeToName[c] || c));
        cSelect.property("value", "ALL");

        const tooltip = d3.select("#nights-nuts-country-tooltip");

        function update() {
            const year    = ySelect.property("value");
            const country = cSelect.property("value");

            // Decide which features participate in the color scale
            const scaleFeats = country === "ALL"
                ? nutsFeats
                : nutsFeats.filter(f => f.properties.CNTR_CODE === country);

            const vals = [];
            scaleFeats.forEach(f => {
                const code = f.properties.NUTS_ID;
                const v = nights[code] && nights[code][year];
                if (v && isFinite(v) && v > 0) vals.push(v);
            });

            const color = (vals.length > 1)
                ? d3.scaleSequentialLog()
                    .domain([d3.min(vals), d3.max(vals)])
                    .interpolator(d3.interpolateInferno)
                : d3.scaleSequential()
                    .domain([0, vals[0] || 1])
                    .interpolator(d3.interpolateInferno);

            gLayer.selectAll("path")
                .data(nutsFeats, d => d.properties.NUTS_ID)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.3)
                .transition().duration(500)
                .attr("fill", d => {
                    const code = d.properties.NUTS_ID;
                    const v = nights[code] && nights[code][year];
                    const inFocus = country === "ALL" || d.properties.CNTR_CODE === country;
                    if (!inFocus) return DIM_FILL;
                    return (v && v > 0) ? color(v) : NO_DATA_FILL;
                });

            gLayer.selectAll("path")
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("stroke-width", 1).attr("stroke", "#000");
                    const code = d.properties.NUTS_ID;
                    const name = d.properties.NAME_LATN || d.properties.NUTS_NAME || code;
                    const cName = codeToName[d.properties.CNTR_CODE] || d.properties.CNTR_CODE;
                    const v = nights[code] && nights[code][year];
                    tooltip.style("display", "block").text(
                        v && v > 0
                            ? `${name}, ${cName} (${year}): ${fmtNights(v)}`
                            : `${name}, ${cName} (${year}): no data`
                    );
                })
                .on("mousemove", function (event) {
                    const c = document.querySelector("#nights-nuts-country-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - c.left + 10) + "px")
                        .style("top",  (event.clientY - c.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke-width", 0.3).attr("stroke", "#222");
                    tooltip.style("display", "none");
                });

            drawColorBar(color, year, country);
        }

        function fmtNights(v) {
            if (v >= 1e9) return (v / 1e9).toFixed(2) + "B nights";
            if (v >= 1e6) return (v / 1e6).toFixed(2) + "M nights";
            if (v >= 1e3) return (v / 1e3).toFixed(1) + "k nights";
            return v.toFixed(0) + " nights";
        }

        function drawColorBar(scale, year, country) {
            cbarG.selectAll("*").remove();
            const lw = 220, lh = 12, lx = 24, ly = 640;

            const defs = cbarG.append("defs");
            const grad = defs.append("linearGradient").attr("id", "nights-nuts-country-cbar");
            const [d0, d1] = scale.domain();
            d3.range(0, 1.0001, 0.1).forEach(t => {
                const v = (scale.interpolate || scale.domain)
                    ? Math.exp(Math.log(d0) + t * (Math.log(Math.max(d1, d0 * 1.0001)) - Math.log(d0)))
                    : (d0 + t * (d1 - d0));
                grad.append("stop")
                    .attr("offset", `${t*100}%`)
                    .attr("stop-color", scale(v));
            });
            cbarG.append("rect")
                .attr("x", lx).attr("y", ly).attr("width", lw).attr("height", lh)
                .attr("fill", "url(#nights-nuts-country-cbar)")
                .attr("stroke", "#666").attr("stroke-width", 0.5);
            const label = country === "ALL"
                ? `Total nights, ${year} (log scale, all EU-27 regions)`
                : `Total nights, ${year} (log scale, ${codeToName[country]} regions only)`;
            cbarG.append("text")
                .attr("x", lx).attr("y", ly - 5)
                .attr("font-size", "11px").attr("fill", "#333")
                .text(label);
            cbarG.append("text")
                .attr("x", lx).attr("y", ly + lh + 13)
                .attr("font-size", "11px").attr("fill", "#555")
                .text(fmtNights(d0));
            cbarG.append("text")
                .attr("x", lx + lw).attr("y", ly + lh + 13)
                .attr("text-anchor", "end")
                .attr("font-size", "11px").attr("fill", "#555")
                .text(fmtNights(d1));
        }

        update();
        ySelect.on("change", update);
        cSelect.on("change", update);
    });
})();
