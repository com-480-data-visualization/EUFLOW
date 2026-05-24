(function () {
    const svg = d3.select("#expenditure-per-night-map");
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
        AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
        CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
        DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
        LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
        PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
        ES: "Spain", SE: "Sweden"
    };

    const BACKDROP_FILL = "#D2D6DB";
    const NO_DATA_FILL  = "#4A4A4A";

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/exp_ngt.csv")
    ]).then(([world, csvData]) => {
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());

        const spendByCode = {};
        csvData.forEach(row => {
            const code = (row.geo || "").trim();
            if (code === "EA20" || code === "EU27_2020") return;
            spendByCode[code] = {};
            yearCols.forEach((col, i) => {
                spendByCode[code][years[i]] = +row[col];
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
            .translate([MAP_W / 2, MAP_H / 2 + 30]);
        const path = d3.geoPath().projection(projection);

        svg.append("g")
            .selectAll("path")
            .data(backdropFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        const gEU = svg.append("g");

        const select = d3.select("#expenditure-per-night-year-select");
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 1]);

        const tooltip = d3.select("#expenditure-per-night-tooltip");

        function update(year) {
            const vals = Object.values(spendByCode).map(o => o[year]).filter(v => v && isFinite(v));
            const color = d3.scaleSequential()
                .domain([d3.min(vals), d3.max(vals)])
                .interpolator(d3.interpolateBuPu);

            gEU.selectAll("path")
                .data(euFeats, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.5)
                .transition().duration(500)
                .attr("fill", d => {
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const v = spendByCode[code] && spendByCode[code][year];
                    return (v && isFinite(v)) ? color(v) : NO_DATA_FILL;
                });

            gEU.selectAll("path")
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.78);
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const v = spendByCode[code] && spendByCode[code][year];
                    tooltip.style("display", "block")
                        .text(`${codeToName[code] || code} (${year}): ${v ? "€" + v.toFixed(1) + " per night" : "no data"}`);
                })
                .on("mousemove", function (event) {
                    const c = document.querySelector("#expenditure-per-night-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - c.left + 10) + "px")
                        .style("top",  (event.clientY - c.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });

            drawLegend(color);
        }

        let legendG = svg.select("g.cbar");
        if (legendG.empty()) legendG = svg.append("g").attr("class", "cbar");

        function drawLegend(scale) {
            legendG.selectAll("*").remove();
            const lw = 190, lh = 10, lx = 24, ly = 560;
            const defs = legendG.append("defs");
            const grad = defs.append("linearGradient").attr("id", "expenditure-night-cbar");
            const [d0, d1] = scale.domain();
            d3.range(0, 1.0001, 0.1).forEach(t => {
                grad.append("stop")
                    .attr("offset", `${t*100}%`)
                    .attr("stop-color", scale(d0 + t * (d1 - d0)));
            });
            legendG.append("rect")
                .attr("x", lx).attr("y", ly).attr("width", lw).attr("height", lh)
                .attr("fill", "url(#expenditure-night-cbar)")
                .attr("stroke", "#666").attr("stroke-width", 0.5);
            legendG.append("text").attr("x", lx).attr("y", ly - 4)
                .attr("font-size", "11px").attr("fill", "#333")
                .text("Average spending per night (€)");
            legendG.append("text").attr("x", lx).attr("y", ly + lh + 12)
                .attr("font-size", "11px").attr("fill", "#555")
                .text("€" + d0.toFixed(0));
            legendG.append("text").attr("x", lx + lw).attr("y", ly + lh + 12)
                .attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#555")
                .text("€" + d1.toFixed(0));
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
