(function () {
    const codeToName = {
        AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
        CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
        DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
        LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
        PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
        ES: "Spain", SE: "Sweden"
    };

    Promise.all([
        d3.csv("exploitable_data/exp_ngt.csv"),
        d3.csv("exploitable_data/exp_trp.csv")
    ]).then(([ngtData, trpData]) => {
        const yearCols = Object.keys(ngtData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());
        const yearCol = yearCols[yearCols.length - 1];
        const year = years[years.length - 1];

        // Build paired dataset for the latest year
        const data = ngtData
            .map(row => {
                const code = (row.geo || "").trim();
                if (!code || code === "EA20" || code === "EU27_2020") return null;
                const trpRow = trpData.find(r => (r.geo || "").trim() === code);
                if (!trpRow) return null;
                const ngt = +row[yearCol];
                const trp = +trpRow[yearCol];
                if (!isFinite(ngt) || !isFinite(trp) || ngt <= 0 || trp <= 0) return null;
                return { code, name: codeToName[code] || code, ngt, trp, nights: trp / ngt };
            })
            .filter(Boolean);

        const W = 858, H = 540;
        const margin = { top: 30, right: 30, bottom: 50, left: 70 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const svg = d3.select("#expenditure-scatter-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.ngt) * 1.08]).nice()
            .range([0, iw]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.trp) * 1.08]).nice()
            .range([ih, 0]);

        // Diagonal "implied trip length" guide lines (4, 7, 10, 14 nights)
        const guideNights = [4, 7, 10, 14];
        const guides = g.append("g").attr("class", "guides");
        guideNights.forEach(n => {
            const xEnd = x.domain()[1];
            const yEnd = n * xEnd;
            // Trim line to the bounding box
            const yMax = y.domain()[1];
            const cutX = Math.min(xEnd, yMax / n);
            const cutY = cutX * n;
            guides.append("line")
                .attr("x1", x(0)).attr("y1", y(0))
                .attr("x2", x(cutX)).attr("y2", y(cutY))
                .attr("stroke", "#cbd2db")
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 1);
            guides.append("text")
                .attr("x", x(cutX) - 4)
                .attr("y", y(cutY) + 12)
                .attr("text-anchor", "end")
                .attr("font-size", "10.5px")
                .attr("fill", "#9aa0a6")
                .text(`${n} nights`);
        });

        // X axis
        g.append("g")
            .attr("transform", `translate(0,${ih})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(v => "€" + v))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#555");
        g.append("text")
            .attr("x", iw).attr("y", ih + 38)
            .attr("text-anchor", "end").attr("font-size", "12px").attr("fill", "#333")
            .text("Average spending per night");

        // Y axis
        g.append("g")
            .call(d3.axisLeft(y).ticks(6).tickFormat(v => "€" + v))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#555");
        g.append("text")
            .attr("x", -10).attr("y", -10)
            .attr("font-size", "12px").attr("fill", "#333")
            .text("Average spending per trip");

        // Dots
        const dots = g.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => x(d.ngt))
            .attr("cy", d => y(d.trp))
            .attr("r", 6)
            .attr("fill", "#1565C0")
            .attr("fill-opacity", 0.78)
            .attr("stroke", "#0c4a8a")
            .attr("stroke-width", 0.8);

        // Smart label placement
        g.selectAll("text.lbl")
            .data(data)
            .join("text")
            .attr("class", "lbl")
            .attr("x", d => x(d.ngt) + 9)
            .attr("y", d => y(d.trp) + 4)
            .attr("font-size", "11px")
            .attr("fill", "#222")
            .text(d => d.name);

        // Tooltip on hover
        const tooltip = d3.select("#expenditure-scatter-tooltip");
        dots.on("mouseover", function (event, d) {
                d3.select(this).attr("r", 9).attr("fill", "#0c4a8a");
                tooltip.style("display", "block")
                    .html(`<strong>${d.name}</strong> (${year})<br>` +
                          `€${d.ngt.toFixed(0)} per night<br>` +
                          `€${d.trp.toFixed(0)} per trip<br>` +
                          `<span style="color:#777">≈ ${d.nights.toFixed(1)} nights per trip</span>`);
            })
            .on("mousemove", function (event) {
                const c = document.querySelector("#expenditure-scatter-chart").getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX - c.left + 12) + "px")
                    .style("top",  (event.clientY - c.top + 12) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 6).attr("fill", "#1565C0");
                tooltip.style("display", "none");
            });

        svg.append("text")
            .attr("x", W - margin.right)
            .attr("y", 18)
            .attr("text-anchor", "end")
            .attr("font-size", "12px")
            .attr("fill", "#777")
            .text(`Year: ${year}`);
    });
})();
