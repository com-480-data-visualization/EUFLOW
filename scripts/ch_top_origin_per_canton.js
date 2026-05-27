/* Switzerland · Top foreign origin per canton (choropleth).
   Each canton is colored by the country supplying the most overnight stays in the selected year,
   with Swiss residents (domestic) excluded. Mirror of Europe's origin choropleth. */
(function () {
    // Map area is W x H_MAP. The legend lives in an additional strip below.
    const W = 880, H_MAP = 420, H_LEGEND = 70, H = H_MAP + H_LEGEND;
    const svg = d3.select("#ch-top-origin-map");
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const tooltip = d3.select("#ch-top-origin-tooltip");
    const select = d3.select("#ch-top-origin-year-select");

    // Curated palette for the most frequent origins.
    const ORIGIN_COLOR = {
        "Germany":         "#FF7F0E",
        "United States":   "#D62728",
        "France":          "#1F77B4",
        "United Kingdom":  "#E377C2",
        "Italy":           "#2CA02C",
        "Netherlands":     "#8C564B",
        "Belgium":         "#FFB347",
        "Spain":           "#9467BD",
        "Austria":         "#17BECF",
        "China":           "#FFD92F",
        "Japan":           "#A65628",
        "South Korea":     "#984EA3"
    };
    const FALLBACK = "#999999";

    Promise.all([
        d3.json("data/cantons.geojson"),
        d3.json("exploitable_data/ch_top_origin_per_canton.json")
    ]).then(([geo, topOrigin]) => {
        const projection = d3.geoMercator().fitSize([W, H_MAP], geo);
        const path = d3.geoPath().projection(projection);

        const sample = topOrigin[Object.keys(topOrigin)[0]];
        const years = Object.keys(sample).sort();
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 2]);

        const gMap = svg.append("g");
        // Legend lives in its own strip BELOW the map, never over the geography.
        const gLegend = svg.append("g").attr("transform", `translate(20, ${H_MAP + 25})`);

        const nameMap = {
            "Zürich": "Zurich",
            "Luzern": "Lucerne",
            "Genève": "Geneva",
        };

        function update(year) {
            gMap.selectAll("path")
                .data(geo.features, d => d.properties.NAME)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#333")
                .attr("stroke-width", 0.5)
                .attr("fill", d => {
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 
                    const o = topOrigin[name]?.[year];
                    return o ? (ORIGIN_COLOR[o] || FALLBACK) : FALLBACK;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 
                    const o = topOrigin[name]?.[year] || "no data";
                    tooltip.style("display", "block")
                        .html(`<div style="font-weight:700; margin-bottom:4px;">${d.properties.NAME}</div>
                            <div>Top foreign origin (${year}): <strong>${o}</strong></div>`);
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

            const present = new Set();
            geo.features.forEach(d => {
                const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 
                const o = topOrigin[name]?.[year];
                if (o) present.add(o);
            });

            const items = [...present].sort();

            gLegend.selectAll("*").remove();
            const itemW = 130;
            gLegend.append("rect")
                .attr("x", -8).attr("y", -8)
                .attr("width", items.length * itemW + 16).attr("height", 30)
                .attr("fill", "rgba(255,255,255,0.92)").attr("rx", 4);

            const g = gLegend.selectAll("g.item")
                .data(items)
                .join("g")
                .attr("class", "item")
                .attr("transform", (_, i) => `translate(${i * itemW}, 0)`);

            g.append("rect")
                .attr("width", 12).attr("height", 12)
                .attr("fill", d => ORIGIN_COLOR[d] || FALLBACK);
            g.append("text")
                .attr("x", 17).attr("y", 10)
                .attr("font-size", 11.5).attr("fill", "#222")
                .text(d => d);
        }

        update(select.property("value"));
        select.on("change", function () { update(this.value); });
    });
})();
