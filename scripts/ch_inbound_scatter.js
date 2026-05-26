/* Switzerland · Per-night vs per-trip spending scatter for trips to CH.
   X = avg spend per night ; Y = avg spend per trip ; each dot = a source country.
   Dashed diagonals show implied trip lengths (3, 5, 7, 10 nights). */
(function () {
    const svg = d3.select("#ch-inbound-scatter");
    const tooltip = d3.select("#ch-inbound-scatter-tooltip");
    const select = d3.select("#ch-inbound-scatter-year-select");

    const codeToName = {
        AT:"Austria", BE:"Belgium", DE:"Germany", ES:"Spain", FR:"France",
        HU:"Hungary", LU:"Luxembourg", NL:"Netherlands", PT:"Portugal"
    };

    const W = 880, H = 560;
    svg.attr("viewBox", `0 0 ${W} ${H}`);

    const margin = { top: 30, right: 40, bottom: 60, left: 70 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.json("exploitable_data/ch_inbound_expenditure.json").then(ch => {
        const yearKeys = Object.keys(ch.AVG_NGT.AT || ch.AVG_NGT.DE);
        select.selectAll("option").remove();
        yearKeys.forEach(yk => select.append("option").attr("value", yk).text(yk.trim()));
        const defaultKey = yearKeys[yearKeys.length - 1];
        select.property("value", defaultKey);

        // Global axes across all years for stable framing
        const allDots = [];
        Object.entries(ch.AVG_NGT).forEach(([geo, byYear]) => {
            if (geo === "EA20" || geo === "EU27_2020") return;
            Object.entries(byYear).forEach(([yk, v]) => {
                const t = ch.AVG_TRP[geo]?.[yk];
                if (v != null && t != null) allDots.push({ geo, v, t });
            });
        });

        // Data-driven axes: use the actual min/max with a small padding so dots never
        // fall on the axis line. Floors are NOT hardcoded -- values can drop below
        // the previous 60/300 floor in some years and source countries.
        const vMin = d3.min(allDots, d => d.v), vMax = d3.max(allDots, d => d.v);
        const tMin = d3.min(allDots, d => d.t), tMax = d3.max(allDots, d => d.t);
        const vPad = (vMax - vMin) * 0.08;
        const tPad = (tMax - tMin) * 0.08;
        const x = d3.scaleLinear().domain([Math.max(0, vMin - vPad), vMax + vPad]).range([0, iw]);
        const y = d3.scaleLinear().domain([Math.max(0, tMin - tPad), tMax + tPad]).range([ih, 0]);

        // Axes
        g.append("g").attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(x).ticks(7).tickFormat(d => "€" + d))
            .selectAll("text").attr("font-size", 11).attr("fill", "#444");
        g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => "€" + d))
            .selectAll("text").attr("font-size", 11).attr("fill", "#444");

        g.append("text").attr("x", iw / 2).attr("y", ih + 42)
            .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#555")
            .text("Average spending per night in Switzerland (€)");
        g.append("text").attr("transform", "rotate(-90)").attr("x", -ih / 2).attr("y", -50)
            .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#555")
            .text("Average spending per trip (€)");

        // Diagonal lines: trip = nights * night_rate, for nights = 3,5,7,10.
        // Clipped to the visible domain so they never project off-screen when
        // the axes are data-driven (i.e. don't start at zero).
        const [vLo, vHi] = x.domain();
        const [tLo, tHi] = y.domain();
        [3, 5, 7, 10].forEach(n => {
            // Visible portion of the line t = n*v
            const v1 = Math.max(vLo, tLo / n);
            const v2 = Math.min(vHi, tHi / n);
            if (v1 >= v2) return;
            g.append("line")
                .attr("x1", x(v1)).attr("y1", y(n * v1))
                .attr("x2", x(v2)).attr("y2", y(n * v2))
                .attr("stroke", "#bbb").attr("stroke-dasharray", "3 4");
            g.append("text")
                .attr("x", x(v2) - 4).attr("y", y(n * v2) - 4)
                .attr("text-anchor", "end")
                .attr("font-size", 10).attr("fill", "#999")
                .text(`${n} nights`);
        });

        const dotsLayer = g.append("g");
        const labelsLayer = g.append("g");

        function update(yearKey) {
            const rows = [];
            Object.keys(ch.AVG_NGT).forEach(geo => {
                if (geo === "EA20" || geo === "EU27_2020") return;
                const v = ch.AVG_NGT[geo]?.[yearKey];
                const t = ch.AVG_TRP[geo]?.[yearKey];
                if (v != null && t != null) rows.push({ geo, v, t });
            });

            dotsLayer.selectAll("circle").data(rows, d => d.geo)
                .join(
                    enter => enter.append("circle")
                        .attr("r", 6)
                        .attr("fill", "#D62728")
                        .attr("stroke", "#fff").attr("stroke-width", 1.5)
                        .attr("cx", d => x(d.v))
                        .attr("cy", d => y(d.t))
                        .on("mouseover", function (event, d) {
                            d3.select(this).attr("r", 8);
                            tooltip.style("display", "block").html(
                                `<div style="font-weight:700;">${codeToName[d.geo] || d.geo}</div>
                                 <div>Per night: €${d.v.toFixed(0)}</div>
                                 <div>Per trip: €${d.t.toFixed(0)}</div>
                                 <div>Implied stay: ${(d.t / d.v).toFixed(1)} nights</div>`);
                        })
                        .on("mousemove", function (event) {
                            tooltip.style("left", (event.clientX + 14) + "px")
                                   .style("top", (event.clientY - 36) + "px");
                        })
                        .on("mouseout", function () {
                            d3.select(this).attr("r", 6);
                            tooltip.style("display", "none");
                        }),
                    update => update.transition().duration(400)
                        .attr("cx", d => x(d.v)).attr("cy", d => y(d.t))
                );

            labelsLayer.selectAll("text").data(rows, d => d.geo)
                .join(
                    enter => enter.append("text")
                        .attr("font-size", 11).attr("fill", "#222")
                        .attr("x", d => x(d.v) + 9).attr("y", d => y(d.t) + 4)
                        .text(d => codeToName[d.geo] || d.geo),
                    update => update.transition().duration(400)
                        .attr("x", d => x(d.v) + 9).attr("y", d => y(d.t) + 4)
                );
        }

        update(defaultKey);
        select.on("change", function () { update(this.value); });
    });
})();
