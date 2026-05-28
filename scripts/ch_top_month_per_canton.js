/* Switzerland · Top month per canton (choropleth).
   Each canton is colored by the calendar month with the highest arrivals in the selected year. */
(function () {
    // Map area + dedicated legend strip below
    const W = 880, H_MAP = 420, H_LEGEND = 70, H = H_MAP + H_LEGEND;
    const svg = d3.select("#ch-top-month-map");
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    const tooltip = d3.select("#ch-top-month-tooltip");
    const select = d3.select("#ch-top-month-year-select");

    // Distinct color for every month - keeps the legend self-contained.
    const MONTH_COLOR = {
        "January": "#1f78b4", "February": "#a6cee3",
        "March":   "#33a02c", "April":    "#b2df8a",
        "May":     "#fdbf6f", "June":     "#ff7f00",
        "July":    "#e31a1c", "August":   "#fb9a99",
        "September":"#cab2d6","October":  "#6a3d9a",
        "November":"#b15928", "December": "#5a3a1a"
    };
    const FALLBACK = "#cccccc";

    Promise.all([
        d3.json("data/cantons.geojson"),
        d3.json("exploitable_data/ch_top_month_per_canton.json")
    ]).then(([geo, topMonth]) => {
        const projection = d3.geoMercator().fitSize([W, H_MAP], geo);
        const path = d3.geoPath().projection(projection);

        // Year selector - populated from the canton with the most data
        const sample = topMonth[Object.keys(topMonth)[0]];
        const years = Object.keys(sample).sort();
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 3]); // default to year-1 to avoid partial-2026 data

        const gMap = svg.append("g");
        // Legend strip BELOW the map, never over the geography.
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
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 加這個
                    const m = topMonth[name]?.[year];
                    return m ? (MONTH_COLOR[m] || FALLBACK) : FALLBACK;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 加這個
                    const m = topMonth[name]?.[year] || "no data";
                    tooltip.style("display", "block")
                        .html(`<div style="font-weight:700; margin-bottom:4px;">${d.properties.NAME}</div>
                            <div>Peak month (${year}): <strong>${m}</strong></div>`);
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

            // Legend 部分也要用 mapping
            const present = new Set();
            geo.features.forEach(d => {
                const name = nameMap[d.properties.NAME] || d.properties.NAME; // ← 加這個
                const m = topMonth[name]?.[year];
                if (m) present.add(m);
            });

            const order = ["January","February","March","April","May","June",
                           "July","August","September","October","November","December"];
            const items = order.filter(m => present.has(m));

            gLegend.selectAll("*").remove();
            gLegend.append("rect")
                .attr("x", -8).attr("y", -8)
                .attr("width", items.length * 78 + 16).attr("height", 30)
                .attr("fill", "rgba(255,255,255,0.92)").attr("rx", 4);

            const g = gLegend.selectAll("g.item")
                .data(items)
                .join("g")
                .attr("class", "item")
                .attr("transform", (_, i) => `translate(${i * 78}, 0)`);

            g.append("rect")
                .attr("width", 12).attr("height", 12)
                .attr("fill", d => MONTH_COLOR[d]);
            g.append("text")
                .attr("x", 17).attr("y", 10)
                .attr("font-size", 11.5).attr("fill", "#222")
                .text(d => d);
        }

        update(select.property("value"));
        select.on("change", function () { update(this.value); });
    });
})();
