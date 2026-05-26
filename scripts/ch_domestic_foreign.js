/* Switzerland · Domestic vs foreign nights per canton (100% stacked horizontal bars).
   Sorted by foreign share, descending. */
(function () {
    const svg = d3.select("#ch-dom-for-chart");
    const select = d3.select("#ch-dom-for-year-select");
    const tooltip = d3.select("#ch-dom-for-tooltip");

    const COLOR_DOM = "#E65100"; // Swiss residents
    const COLOR_FOR = "#1565C0"; // foreign visitors

    d3.json("exploitable_data/ch_canton_domestic_foreign.json").then(byYear => {
        const years = Object.keys(byYear).sort();
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 2]);

        const W = 880, H = 700;
        svg.attr("viewBox", `0 0 ${W} ${H}`);

        const margin = { top: 40, right: 30, bottom: 30, left: 140 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Static legend
        const lg = svg.append("g").attr("transform", `translate(${margin.left}, 12)`);
        lg.append("rect").attr("x", 0).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", COLOR_DOM);
        lg.append("text").attr("x", 17).attr("y", 11).attr("font-size", 12).attr("fill", "#333")
            .text("Swiss residents");
        lg.append("rect").attr("x", 140).attr("y", 0).attr("width", 12).attr("height", 12).attr("fill", COLOR_FOR);
        lg.append("text").attr("x", 157).attr("y", 11).attr("font-size", 12).attr("fill", "#333")
            .text("Foreign visitors");

        // X axis (0..100%)
        const x = d3.scaleLinear().domain([0, 1]).range([0, iw]);
        const xAxis = g.append("g").attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));
        xAxis.selectAll("text").attr("font-size", 11);
        xAxis.select(".domain").remove();

        function update(year) {
            const rows = Object.entries(byYear[year] || {}).map(([canton, v]) => ({
                canton,
                domestic: v.domestic,
                foreign: v.foreign,
                total: v.total,
                foreignShare: v.foreign / v.total
            }));
            rows.sort((a, b) => b.foreignShare - a.foreignShare);

            const y = d3.scaleBand()
                .domain(rows.map(r => r.canton))
                .range([0, ih]).padding(0.18);

            // Domestic bars (left)
            g.selectAll("rect.dom")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("rect").attr("class", "dom")
                        .attr("x", 0)
                        .attr("fill", COLOR_DOM)
                        .attr("y", d => y(d.canton))
                        .attr("width", d => x(1 - d.foreignShare))
                        .attr("height", y.bandwidth()),
                    update => update.transition().duration(400)
                        .attr("y", d => y(d.canton))
                        .attr("width", d => x(1 - d.foreignShare))
                        .attr("height", y.bandwidth())
                );

            // Foreign bars (stacked right)
            g.selectAll("rect.for")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("rect").attr("class", "for")
                        .attr("fill", COLOR_FOR)
                        .attr("x", d => x(1 - d.foreignShare))
                        .attr("y", d => y(d.canton))
                        .attr("width", d => x(d.foreignShare))
                        .attr("height", y.bandwidth())
                        .on("mouseover", function (event, d) {
                            tooltip.style("display", "block").html(
                                `<div style="font-weight:700; margin-bottom:4px;">${d.canton}</div>
                                 <div>Foreign: ${(d.foreignShare * 100).toFixed(1)}% (${(d.foreign / 1e6).toFixed(2)}M nights)</div>
                                 <div>Domestic: ${(100 - d.foreignShare * 100).toFixed(1)}% (${(d.domestic / 1e6).toFixed(2)}M nights)</div>`);
                        })
                        .on("mousemove", function (event) {
                            tooltip.style("left", (event.clientX + 14) + "px")
                                   .style("top", (event.clientY - 36) + "px");
                        })
                        .on("mouseout", function () { tooltip.style("display", "none"); }),
                    update => update.transition().duration(400)
                        .attr("x", d => x(1 - d.foreignShare))
                        .attr("y", d => y(d.canton))
                        .attr("width", d => x(d.foreignShare))
                        .attr("height", y.bandwidth())
                );

            // Canton row labels
            g.selectAll("text.lbl")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("text").attr("class", "lbl")
                        .attr("x", -10)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .attr("dy", "0.35em").attr("text-anchor", "end")
                        .attr("font-size", 11).attr("fill", "#333")
                        .text(d => d.canton),
                    update => update.transition().duration(400)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                );

            // Percentage labels INSIDE the foreign bar where it's wide enough
            g.selectAll("text.pct")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("text").attr("class", "pct")
                        .attr("dy", "0.35em")
                        .attr("font-size", 10.5)
                        .attr("fill", "#fff")
                        .attr("text-anchor", "end")
                        .attr("x", d => x(1) - 4)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .text(d => d.foreignShare > 0.18 ? `${(d.foreignShare * 100).toFixed(0)}%` : ""),
                    update => update.transition().duration(400)
                        .attr("x", d => x(1) - 4)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .text(d => d.foreignShare > 0.18 ? `${(d.foreignShare * 100).toFixed(0)}%` : "")
                );
        }

        update(select.property("value"));
        select.on("change", function () { update(this.value); });
    });
})();
