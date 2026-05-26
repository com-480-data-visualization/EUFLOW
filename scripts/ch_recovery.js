/* Switzerland · arrivals change between any two years, by canton.
   Dual-handle range slider built with two stacked <input type="range">: one for the
   FROM year, one for the TO year. Number inputs let the user type the years directly.
   Default window 2019 to 2025 keeps the post-pandemic story as the opening view. */
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

    // Persistent chrome
    const xAxisG = g.append("g").attr("transform", `translate(0, ${ih})`);
    const zeroLine = g.append("line")
        .attr("y1", 0).attr("y2", ih)
        .attr("stroke", "#999").attr("stroke-width", 1);
    const titleHint = g.append("text").attr("x", iw / 2).attr("y", -25)
        .attr("text-anchor", "middle")
        .attr("font-size", 12).attr("fill", "#555");
    const shrankLbl = g.append("text").attr("y", -8)
        .attr("text-anchor", "end").attr("font-size", 10).attr("fill", COLOR_NEG)
        .text("shrank");
    const grewLbl = g.append("text").attr("y", -8)
        .attr("font-size", 10).attr("fill", COLOR_POS)
        .text("grew");

    d3.json("exploitable_data/ch_canton_arrivals_by_year.json").then(byCanton => {
        // Year range from the data
        const allYears = new Set();
        Object.values(byCanton).forEach(row => Object.keys(row).forEach(y => allYears.add(+y)));
        const years = [...allYears].sort((a, b) => a - b);
        const yMin = years[0], yMax = years[years.length - 1];

        // Controls
        const fromSlider = document.getElementById("ch-recovery-slider-from");
        const toSlider = document.getElementById("ch-recovery-slider-to");
        const fromInput = document.getElementById("ch-recovery-from");
        const toInput = document.getElementById("ch-recovery-to");
        const display = document.getElementById("ch-recovery-display");
        const fillEl = document.getElementById("ch-recovery-fill");
        const resetBtn = document.getElementById("ch-recovery-reset");

        // Wire bounds
        [fromSlider, toSlider, fromInput, toInput].forEach(el => {
            el.min = yMin; el.max = yMax;
        });

        // Default window: 2019 (pre-pandemic anchor) to the latest year in the data
        const DEFAULT_FROM = Math.max(yMin, 2019);
        const DEFAULT_TO = yMax;

        // Z-stack trick: whichever handle the user is currently dragging needs to sit
        // on top of the other one so the right thumb captures the pointer. We swap
        // z-index on pointerdown.
        function bringToFront(el) {
            fromSlider.style.zIndex = "1";
            toSlider.style.zIndex = "1";
            el.style.zIndex = "2";
        }
        fromSlider.addEventListener("pointerdown", () => bringToFront(fromSlider));
        toSlider.addEventListener("pointerdown", () => bringToFront(toSlider));

        function syncControls(from, to) {
            display.textContent = `${from} ~ ${to}`;
            fromSlider.value = from;
            toSlider.value = to;
            fromInput.value = from;
            toInput.value = to;
            // Update the colored fill bar between the two thumbs
            const span = yMax - yMin;
            const fromPct = ((from - yMin) / span) * 100;
            const toPct = ((to - yMin) / span) * 100;
            fillEl.style.left = fromPct + "%";
            fillEl.style.width = Math.max(0, toPct - fromPct) + "%";
        }

        function render(fromYear, toYear) {
            const sameYear = fromYear === toYear;
            const rows = [];
            Object.entries(byCanton).forEach(([canton, row]) => {
                const vA = row[String(fromYear)];
                const vB = row[String(toYear)];
                if (vA == null || vB == null || vA === 0) return;
                rows.push({
                    canton, vA, vB,
                    pct: sameYear ? 0 : (vB - vA) / vA * 100
                });
            });
            rows.sort((a, b) => b.pct - a.pct);

            const xExtent = sameYear ? [-1, 1] : d3.extent(rows, r => r.pct);
            const xPad = Math.max(2, Math.abs(xExtent[0]) * 0.05, Math.abs(xExtent[1]) * 0.05);
            const xMin = Math.min(0, xExtent[0]) - xPad;
            const xMax = Math.max(0, xExtent[1]) + xPad;
            const x = d3.scaleLinear().domain([xMin, xMax]).range([0, iw]);
            const x0 = x(0);

            const y = d3.scaleBand()
                .domain(rows.map(r => r.canton))
                .range([0, ih]).padding(0.22);

            g.selectAll("rect.bar")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("rect").attr("class", "bar").attr("rx", 2)
                        .attr("y", d => y(d.canton))
                        .attr("height", y.bandwidth())
                        .attr("x", d => d.pct >= 0 ? x0 : x(d.pct))
                        .attr("width", d => Math.abs(x(d.pct) - x0))
                        .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
                        .on("mouseover", function (event, d) {
                            d3.select(this).attr("opacity", 0.78);
                            const span = (+toYear) - (+fromYear);
                            tooltip.style("display", "block").html(
                                `<div style="font-weight:700; margin-bottom:4px;">${d.canton}</div>
                                 <div>${fromYear}: ${d.vA.toLocaleString()} arrivals</div>
                                 <div>${toYear}: ${d.vB.toLocaleString()} arrivals</div>
                                 <div style="margin-top:4px; color:${d.pct >= 0 ? '#9be8a3' : '#ffacac'}; font-weight:700;">
                                   ${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(1)}% over ${Math.abs(span)} year${Math.abs(span) === 1 ? "" : "s"}
                                 </div>`);
                        })
                        .on("mousemove", function (event) {
                            tooltip.style("left", (event.clientX + 14) + "px")
                                   .style("top", (event.clientY - 60) + "px");
                        })
                        .on("mouseout", function () {
                            d3.select(this).attr("opacity", 1);
                            tooltip.style("display", "none");
                        }),
                    update => update.transition().duration(350)
                        .attr("y", d => y(d.canton))
                        .attr("height", y.bandwidth())
                        .attr("x", d => d.pct >= 0 ? x0 : x(d.pct))
                        .attr("width", d => Math.abs(x(d.pct) - x0))
                        .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
                );

            g.selectAll("text.lbl")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("text").attr("class", "lbl")
                        .attr("x", -10).attr("dy", "0.35em")
                        .attr("text-anchor", "end")
                        .attr("font-size", 11.5).attr("fill", "#222")
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .text(d => d.canton),
                    update => update.transition().duration(350)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                );

            g.selectAll("text.pct")
                .data(rows, d => d.canton)
                .join(
                    enter => enter.append("text").attr("class", "pct")
                        .attr("dy", "0.35em").attr("font-size", 11)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
                        .attr("text-anchor", d => d.pct >= 0 ? "start" : "end")
                        .attr("x", d => d.pct >= 0 ? x(d.pct) + 6 : x(d.pct) - 6)
                        .text(d => `${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(0)}%`),
                    update => update.transition().duration(350)
                        .attr("y", d => y(d.canton) + y.bandwidth() / 2)
                        .attr("fill", d => d.pct >= 0 ? COLOR_POS : COLOR_NEG)
                        .attr("text-anchor", d => d.pct >= 0 ? "start" : "end")
                        .attr("x", d => d.pct >= 0 ? x(d.pct) + 6 : x(d.pct) - 6)
                        .text(d => `${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(0)}%`)
                );

            xAxisG.transition().duration(350)
                .call(d3.axisBottom(x).tickFormat(d => (d > 0 ? "+" : "") + d + "%").ticks(7))
                .selectAll("text").attr("font-size", 10.5).attr("fill", "#666");
            xAxisG.select(".domain").remove();
            zeroLine.transition().duration(350).attr("x1", x0).attr("x2", x0);
            shrankLbl.transition().duration(350).attr("x", x0 - 8);
            grewLbl.transition().duration(350).attr("x", x0 + 8);
            titleHint.text(sameYear
                ? `Pick two different years to see the change.`
                : `Change in annual arrivals, ${fromYear} to ${toYear} (sorted by % change)`);
        }

        function update(from, to) {
            from = Math.max(yMin, Math.min(yMax, +from));
            to   = Math.max(yMin, Math.min(yMax, +to));
            if (from > to) { const t = from; from = to; to = t; }
            syncControls(from, to);
            render(from, to);
        }

        // ---- Event wiring ---------------------------------------------------
        // FROM handle (left thumb): can't exceed the TO handle
        fromSlider.addEventListener("input", function () {
            let from = +this.value;
            let to = +toSlider.value;
            if (from > to) from = to;
            update(from, to);
        });

        // TO handle (right thumb): can't fall below the FROM handle
        toSlider.addEventListener("input", function () {
            let to = +this.value;
            let from = +fromSlider.value;
            if (to < from) to = from;
            update(from, to);
        });

        // Number-input fallbacks for explicit entry
        fromInput.addEventListener("input", function () {
            let from = +this.value;
            let to = +toInput.value;
            if (from > to) to = from;
            update(from, to);
        });

        toInput.addEventListener("input", function () {
            let to = +this.value;
            let from = +fromInput.value;
            if (to < from) from = to;
            update(from, to);
        });

        resetBtn.addEventListener("click", function () {
            update(DEFAULT_FROM, DEFAULT_TO);
        });

        // Initial render
        update(DEFAULT_FROM, DEFAULT_TO);
    });
})();
