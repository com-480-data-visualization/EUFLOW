/* Switzerland · 2019 to 2024 arrivals recovery by canton.
   Horizontal diverging bar chart, sorted by % change.
   Green bars grew, red bars shrank. Volume context shown on hover. */
(function () {
    const svg = d3.select("#ch-recovery-chart");
    const tooltip = d3.select("#ch-recovery-tooltip");

    const W = 880, H = 720;
    svg.attr("viewBox", `0 0 ${W} ${H}`);

    const margin = { top: 50, right: 70, bottom: 36, left: 140 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const COLOR_POS = "#2E7D32";
    const COLOR_NEG = "#C62828";

    d3.json("exploitable_data/ch_canton_recovery.json").then(rec => {
        const rows = Object.entries(rec).map(([canton, v]) => ({
            canton,
            v19: v["2019"],
            v24: v["2024"],
            pct: v.pct_change
        }));
        rows.sort((a, b) => b.pct - a.pct);

        // X scale symmetric around 0, padded
        const xExtent = d3.extent(rows, r => r.pct);
        const xPad = Math.max(2, Math.abs(xExtent[0]) * 0.05, Math.abs(xExtent[1]) * 0.05);
        const xMin = Math.min(0, xExtent[0]) - xPad;
        const xMax = Math.max(0, xExtent[1]) + xPad;
        const x = d3.scaleLinear().domain([xMin, xMax]).range([0, iw]);
        const x0 = x(0); // pixel position of the zero line

        const y = d3.scaleBand()
            .domain(rows.map(r => r.canton))
            .range([0, ih])
            .padding(0.22);

        // Bars
        g.selectAll("rect.bar")
            .data(rows)
            .join("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.canton))
            .attr("height", y.bandwidth())
            .attr("x", d => d.pct >= 0 ? x0 : x(d.pct))
            .attr("width", d => Math.abs(x(d.pct) - x0))
            .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
            .attr("rx", 2)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", 0.78);
                tooltip.style("display", "block").html(
                    `<div style="font-weight:700; margin-bottom:4px;">${d.canton}</div>
                     <div>2019: ${d.v19.toLocaleString()} arrivals</div>
                     <div>2024: ${d.v24.toLocaleString()} arrivals</div>
                     <div style="margin-top:4px; color:${d.pct >= 0 ? '#9be8a3' : '#ffacac'}; font-weight:700;">
                       ${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(1)}%
                     </div>`);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.clientX + 14) + "px")
                       .style("top", (event.clientY - 60) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 1);
                tooltip.style("display", "none");
            });

        // Canton labels (always on the left, anchored to the LEFT axis, not the bar)
        g.selectAll("text.lbl")
            .data(rows)
            .join("text")
            .attr("class", "lbl")
            .attr("x", -10)
            .attr("y", d => y(d.canton) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("font-size", 11.5)
            .attr("fill", "#222")
            .text(d => d.canton);

        // Numeric labels at the end of each bar
        g.selectAll("text.pct")
            .data(rows)
            .join("text")
            .attr("class", "pct")
            .attr("y", d => y(d.canton) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("font-size", 11)
            .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
            .attr("text-anchor", d => d.pct >= 0 ? "start" : "end")
            .attr("x", d => d.pct >= 0 ? x(d.pct) + 6 : x(d.pct) - 6)
            .text(d => `${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(0)}%`);

        // Zero baseline
        g.append("line")
            .attr("x1", x0).attr("x2", x0)
            .attr("y1", 0).attr("y2", ih)
            .attr("stroke", "#999").attr("stroke-width", 1);

        // X axis
        g.append("g").attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(x).tickFormat(d => (d > 0 ? "+" : "") + d + "%").ticks(7))
            .selectAll("text").attr("font-size", 10.5).attr("fill", "#666");
        g.select(".domain").remove();

        // Title hint
        g.append("text").attr("x", iw / 2).attr("y", -25)
            .attr("text-anchor", "middle")
            .attr("font-size", 12).attr("fill", "#555")
            .text("Change in annual arrivals, 2019 -> 2024 (sorted by % change)");

        // Direction hints at the extremes
        g.append("text").attr("x", x0 - 8).attr("y", -8)
            .attr("text-anchor", "end").attr("font-size", 10).attr("fill", COLOR_NEG)
            .text("shrank");
        g.append("text").attr("x", x0 + 8).attr("y", -8)
            .attr("font-size", 10).attr("fill", COLOR_POS)
            .text("grew");
    });
})();
