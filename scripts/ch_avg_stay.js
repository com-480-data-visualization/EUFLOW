/* Switzerland · Average stay length per canton (choropleth, nights/arrival). */
(function () {
    // Map area + dedicated legend strip below
    const W = 880, H_MAP = 420, H_LEGEND = 70, H = H_MAP + H_LEGEND;
    const svg = d3.select("#ch-stay-map");
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const tooltip = d3.select("#ch-stay-tooltip");
    const select = d3.select("#ch-stay-year-select");

    Promise.all([
        d3.json("data/cantons.geojson"),
        d3.json("exploitable_data/ch_canton_avg_stay.json")
    ]).then(([geo, stay]) => {

        const projection = d3.geoMercator().fitSize([W, H_MAP], geo);
        const path = d3.geoPath().projection(projection);

        const years = Object.keys(stay).sort();
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 2]);

        const gMap = svg.append("g");

        // Color scale tuned to the realistic range of avg stay in CH (1.4-3.0 nights)
        const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([1.4, 3.0]);

        // Legend lives below the map (never over the geography).
        const lgX = 20, lgY = H_MAP + 30;
        const defs = svg.append("defs");
        const lg = defs.append("linearGradient").attr("id", "ch-stay-grad");
        d3.range(0, 1.01, 0.1).forEach(t => {
            lg.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(1.4 + t * 1.6));
        });
        svg.append("rect")
            .attr("x", lgX).attr("y", lgY).attr("width", 180).attr("height", 12)
            .attr("fill", "url(#ch-stay-grad)").attr("rx", 3);
        svg.append("text")
            .attr("x", lgX).attr("y", lgY - 6)
            .attr("font-size", 11).attr("fill", "#333")
            .text("Avg nights per arrival");
        svg.append("text")
            .attr("x", lgX).attr("y", lgY + 26)
            .attr("font-size", 10.5).attr("fill", "#666")
            .text("1.4");
        svg.append("text")
            .attr("x", lgX + 180).attr("y", lgY + 26)
            .attr("text-anchor", "end")
            .attr("font-size", 10.5).attr("fill", "#666")
            .text("3.0+");

        const nameMap = {
            "Zürich": "Zurich",
            "Luzern": "Lucerne",
            "Genève": "Geneva",
        };

        function update(year) {
            const data = stay[year] || {};
            gMap.selectAll("path")
                .data(geo.features, d => d.properties.NAME)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#333")
                .attr("stroke-width", 0.5)
                .attr("fill", d => {
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 加這個
                    const v = data[name];
                    return v == null ? "#ddd" : color(v);
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 加這個
                    const v = data[name];
                    tooltip.style("display", "block")
                        .html(`<div style="font-weight:700; margin-bottom:4px;">${d.properties.NAME}</div>
                            <div>Avg stay (${year}): <strong>${v ? v.toFixed(2) : "?"}</strong> nights</div>`);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.clientX + 14) + "px")
                        .style("top", (event.clientY - 36) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });
        }

        update(select.property("value"));
        select.on("change", function () { update(this.value); });
    });
})();
