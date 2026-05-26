/* Switzerland · Canton x Month heatmap of arrivals (log color scale).
   Rows = cantons (sorted by peak month + total volume), Cols = Jan..Dec. */
(function () {
    const svg = d3.select("#ch-month-heatmap");
    const select = d3.select("#ch-month-heatmap-year-select");
    const tooltip = d3.select("#ch-month-heatmap-tooltip");

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    d3.json("exploitable_data/ch_canton_month_intensity.json").then(byYear => {
        const years = Object.keys(byYear).sort();
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 2]);

        const W = 880, H = 700;
        svg.attr("viewBox", `0 0 ${W} ${H}`);

        const margin = { top: 40, right: 30, bottom: 50, left: 130 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
        const xScale = d3.scaleBand().domain(MONTHS).range([0, iw]).padding(0.04);
        const yLayer = g.append("g").attr("class", "rows");
        const xAxis = g.append("g").attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(xScale).tickSize(0));
        xAxis.selectAll("text").attr("font-size", 11).attr("fill", "#444");
        xAxis.select(".domain").remove();

        function update(year) {
            const data = byYear[year] || {};

            // Sort cantons by their peak month (calendar order), then by total
            const rows = Object.entries(data).map(([canton, vals]) => {
                const total = d3.sum(vals);
                const peakIdx = d3.maxIndex(vals);
                return { canton, vals, total, peakIdx };
            });
            rows.sort((a, b) => a.peakIdx - b.peakIdx || b.total - a.total);

            const yScale = d3.scaleBand()
                .domain(rows.map(r => r.canton))
                .range([0, ih])
                .padding(0.05);

            // Log color scale on global max for this year
            const maxV = d3.max(rows, r => d3.max(r.vals)) || 1;
            const minV = Math.max(1, d3.min(rows.flatMap(r => r.vals.filter(v => v > 0))) || 1);
            const color = d3.scaleSequentialLog(d3.interpolateBlues).domain([minV, maxV]);

            // Cells
            const cells = g.selectAll("rect.cell")
                .data(rows.flatMap(r => r.vals.map((v, i) => ({ canton: r.canton, month: MONTHS[i], v }))),
                      d => d.canton + "_" + d.month);

            cells.join(
                enter => enter.append("rect").attr("class", "cell")
                    .attr("x", d => xScale(d.month))
                    .attr("y", d => yScale(d.canton))
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .attr("rx", 1)
                    .attr("fill", d => d.v > 0 ? color(d.v) : "#f0f0f0")
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1);
                        tooltip.style("display", "block")
                            .html(`<div style="font-weight:700;">${d.canton}</div>
                                   <div>${d.month} ${year}: ${d.v ? d.v.toLocaleString() : "no data"} arrivals</div>`);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("left", (event.clientX + 14) + "px")
                               .style("top", (event.clientY - 36) + "px");
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("stroke", null);
                        tooltip.style("display", "none");
                    }),
                update => update.transition().duration(400)
                    .attr("x", d => xScale(d.month))
                    .attr("y", d => yScale(d.canton))
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .attr("fill", d => d.v > 0 ? color(d.v) : "#f0f0f0"),
                exit => exit.remove()
            );

            // Row labels
            yLayer.selectAll("text").remove();
            yLayer.selectAll("text")
                .data(rows)
                .join("text")
                .attr("x", -8)
                .attr("y", r => yScale(r.canton) + yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .attr("font-size", 11)
                .attr("fill", "#333")
                .text(r => r.canton);
        }

        update(select.property("value"));
        select.on("change", function () { update(this.value); });
    });
})();
