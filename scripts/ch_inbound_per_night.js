/* Switzerland · Per-night spending on trips to CH, by source country.
   Europe choropleth: each EU country colored by how much its residents spend per night
   when visiting Switzerland (averaged across all trip purposes and stay lengths). */
(function () {
    const svg = d3.select("#ch-inbound-night-map");
    const tooltip = d3.select("#ch-inbound-night-tooltip");
    const select = d3.select("#ch-inbound-night-year-select");
    const MAP_W = 880, MAP_H = 560;

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
    const NO_DATA_FILL  = "#5f6470";

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.json("exploitable_data/ch_inbound_expenditure.json")
    ]).then(([world, ch]) => {
        const yearKeys = Object.keys(ch.AVG_NGT.AT || ch.AVG_NGT.DE);
        // Some keys may have a trailing space (legacy header); normalize the picker labels
        const yearLabels = yearKeys.map(y => y.trim());

        select.selectAll("option").remove();
        yearLabels.forEach((yLabel, i) => select.append("option").attr("value", yearKeys[i]).text(yLabel));
        const defaultKey = yearKeys[yearKeys.length - 1];
        select.property("value", defaultKey);

        const allCountries = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10);
        const euFeats       = allCountries.filter(d => EU27_ISO.has(+d.id));
        const backdropFeats = allCountries.filter(d => !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(720)
            .translate([MAP_W / 2, MAP_H / 2 + 20]);
        const path = d3.geoPath().projection(projection);

        svg.append("g").selectAll("path").data(backdropFeats).join("path")
            .attr("d", path).attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6").attr("stroke-width", 0.4);

        const gEU = svg.append("g");

        // Single color scale across all years for visual stability
        const allVals = [];
        Object.entries(ch.AVG_NGT).forEach(([geo, byYear]) => {
            if (geo === "EA20" || geo === "EU27_2020") return;
            Object.values(byYear).forEach(v => { if (v != null) allVals.push(v); });
        });
        const color = d3.scaleSequential(d3.interpolateBlues)
            .domain([d3.min(allVals), d3.max(allVals)]);

        // Legend
        const lgX = 20, lgY = MAP_H - 60;
        const defs = svg.append("defs");
        const lg = defs.append("linearGradient").attr("id", "ch-night-grad");
        d3.range(0, 1.01, 0.1).forEach(t => {
            lg.append("stop").attr("offset", `${t * 100}%`)
                .attr("stop-color", color(d3.min(allVals) + t * (d3.max(allVals) - d3.min(allVals))));
        });
        svg.append("rect").attr("x", lgX).attr("y", lgY).attr("width", 200).attr("height", 12)
            .attr("fill", "url(#ch-night-grad)").attr("rx", 3);
        svg.append("text").attr("x", lgX).attr("y", lgY - 6)
            .attr("font-size", 11).attr("fill", "#333")
            .text("Avg spend per night in CH (€)");
        svg.append("text").attr("x", lgX).attr("y", lgY + 26)
            .attr("font-size", 10.5).attr("fill", "#666")
            .text(`€${d3.min(allVals).toFixed(0)}`);
        svg.append("text").attr("x", lgX + 200).attr("y", lgY + 26)
            .attr("text-anchor", "end").attr("font-size", 10.5).attr("fill", "#666")
            .text(`€${d3.max(allVals).toFixed(0)}`);

        function update(yearKey) {
            const yearLabel = yearKey.trim();
            gEU.selectAll("path")
                .data(euFeats, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222").attr("stroke-width", 0.5)
                .attr("fill", d => {
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const v = ch.AVG_NGT[code]?.[yearKey];
                    return (v != null) ? color(v) : NO_DATA_FILL;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const name = codeToName[code] || code;
                    const v = ch.AVG_NGT[code]?.[yearKey];
                    const t = ch.AVG_TRP[code]?.[yearKey];
                    tooltip.style("display", "block").html(
                        `<div style="font-weight:700;">${name}</div>
                         <div>Per night in CH (${yearLabel}): <strong>${v != null ? "€" + v.toFixed(0) : "no data"}</strong></div>
                         ${t != null ? `<div>Per trip: €${t.toFixed(0)}</div>` : ""}`);
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", (event.clientX + 14) + "px")
                           .style("top", (event.clientY - 36) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });
        }

        update(defaultKey);
        select.on("change", function () { update(this.value); });
    });
})();
