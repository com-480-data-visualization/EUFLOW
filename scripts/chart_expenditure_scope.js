(function () {
    const codeToName = {
        AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
        CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
        DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
        LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
        PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
        ES: "Spain", SE: "Sweden"
    };

    const scopeMeta = [
        { key: "domestic", file: "exploitable_data/same_country_exp_trp.csv", label: "Domestic",       color: "#4CAF50" },
        { key: "in_eu",    file: "exploitable_data/in_EU_exp_trp.csv",        label: "Within the EU",  color: "#1565C0" },
        { key: "out_eu",   file: "exploitable_data/out_EU_exp_trp.csv",       label: "Outside the EU", color: "#E65100" }
    ];

    Promise.all(scopeMeta.map(s => d3.csv(s.file))).then(([dom, inEU, outEU]) => {
        const datasets = { domestic: dom, in_eu: inEU, out_eu: outEU };
        const yearCols = Object.keys(dom[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years    = yearCols.map(k => k.trim());

        const geos = dom
            .map(r => (r.geo || "").trim())
            .filter(g => g && g !== "EA20" && g !== "EU27_2020");

        // Precompute the country dataset for every year so changes are instant
        const dataByYear = {};
        yearCols.forEach((col, i) => {
            const year = years[i];
            const arr = geos.map(g => {
                const out = { geo: g };
                scopeMeta.forEach(s => {
                    const row = datasets[s.key].find(r => (r.geo || "").trim() === g);
                    out[s.key] = row ? +row[col] : 0;
                });
                return out;
            });
            dataByYear[year] = arr;
        });

        // Use the all-year extent so axes stay stable across year changes
        const allMax = d3.max(
            years.flatMap(y => dataByYear[y].flatMap(d => [d.domestic, d.in_eu, d.out_eu]))
        );

        const W = 858, H = 700;
        const margin = { top: 40, right: 70, bottom: 40, left: 120 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const svg = d3.select("#expenditure-scope-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, allMax]).nice().range([0, iw]);

        // Y band rebuilt per year because sort order depends on out_eu spending
        let y, subBand;

        // Axes containers (redrawn per year for the y axis, x stays fixed)
        const xAxisG = g.append("g").attr("transform", `translate(0,${ih})`);
        const yAxisG = g.append("g");

        xAxisG.call(d3.axisBottom(x).ticks(6).tickFormat(v => "€" + v))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#666");

        // Bar layer
        const barLayer = g.append("g").attr("class", "bars");

        // Legend at top
        const lg = svg.append("g").attr("transform", `translate(${margin.left}, 12)`);
        scopeMeta.forEach((s, i) => {
            const lx = i * 170;
            lg.append("rect").attr("x", lx).attr("y", 0).attr("width", 13).attr("height", 13)
                .attr("fill", s.color).attr("rx", 2);
            lg.append("text").attr("x", lx + 18).attr("y", 11)
                .attr("font-size", "12.5px").attr("fill", "#333").text(s.label);
        });

        // Year selector
        const select = d3.select("#expenditure-scope-year-select");
        select.selectAll("option").remove();
        years.forEach(yr => select.append("option").attr("value", yr).text(yr));
        select.property("value", years[years.length - 1]);

        function update(year) {
            const data = dataByYear[year].slice().sort((a, b) => b.out_eu - a.out_eu);

            y = d3.scaleBand().domain(data.map(d => d.geo)).range([0, ih]).padding(0.18);
            subBand = d3.scaleBand().domain(scopeMeta.map(s => s.key)).range([0, y.bandwidth()]).padding(0.12);

            yAxisG.transition().duration(550)
                .call(d3.axisLeft(y).tickFormat(c => codeToName[c] || c).tickSize(0))
                .call(s => s.select(".domain").remove())
                .selection().selectAll("text")
                .attr("font-size", "11.5px").attr("fill", "#333");

            scopeMeta.forEach(s => {
                const sel = barLayer.selectAll(`rect.${s.key}`)
                    .data(data, d => d.geo);
                sel.join(
                    enter => enter.append("rect")
                        .attr("class", s.key)
                        .attr("x", 0)
                        .attr("y", d => y(d.geo) + subBand(s.key))
                        .attr("height", subBand.bandwidth())
                        .attr("fill", s.color)
                        .attr("rx", 2)
                        .attr("width", 0)
                        .call(e => e.append("title")),
                    update => update,
                    exit => exit.remove()
                )
                .each(function (d) {
                    d3.select(this).select("title")
                        .text(`${codeToName[d.geo] || d.geo} — ${s.label} (${year}): €${d[s.key].toFixed(0)} per trip`);
                })
                .transition().duration(550)
                .attr("y", d => y(d.geo) + subBand(s.key))
                .attr("height", subBand.bandwidth())
                .attr("width", d => x(d[s.key]));
            });
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
