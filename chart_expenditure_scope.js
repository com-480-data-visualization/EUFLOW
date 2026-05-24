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
        { key: "domestic",  file: "exploitable_data/same_country_exp_trp.csv", label: "Domestic",          color: "#4CAF50" },
        { key: "in_eu",     file: "exploitable_data/in_EU_exp_trp.csv",        label: "Within the EU",     color: "#1565C0" },
        { key: "out_eu",    file: "exploitable_data/out_EU_exp_trp.csv",       label: "Outside the EU",    color: "#E65100" }
    ];

    Promise.all(scopeMeta.map(s => d3.csv(s.file))).then(([dom, inEU, outEU]) => {
        const datasets = { domestic: dom, in_eu: inEU, out_eu: outEU };
        const yearCols = Object.keys(dom[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());
        const yearCol = yearCols[yearCols.length - 1];
        const year = years[years.length - 1];

        const geos = dom
            .map(r => (r.geo || "").trim())
            .filter(g => g && g !== "EA20" && g !== "EU27_2020");

        const data = geos.map(g => {
            const out = { geo: g };
            scopeMeta.forEach(s => {
                const row = datasets[s.key].find(r => (r.geo || "").trim() === g);
                out[s.key] = row ? +row[yearCol] : 0;
            });
            out.total = out.domestic + out.in_eu + out.out_eu;
            return out;
        });
        data.sort((a, b) => b.out_eu - a.out_eu); // sort by extra EU spending (most travel intensive on top)

        const W = 858, H = 700;
        const margin = { top: 40, right: 70, bottom: 40, left: 120 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const svg = d3.select("#expenditure-scope-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.domestic, d.in_eu, d.out_eu))]).nice()
            .range([0, iw]);
        const y = d3.scaleBand()
            .domain(data.map(d => d.geo))
            .range([0, ih])
            .padding(0.18);

        const subBand = d3.scaleBand()
            .domain(scopeMeta.map(s => s.key))
            .range([0, y.bandwidth()])
            .padding(0.12);

        scopeMeta.forEach(s => {
            g.selectAll(`rect.${s.key}`)
                .data(data)
                .join("rect")
                .attr("class", s.key)
                .attr("y", d => y(d.geo) + subBand(s.key))
                .attr("x", 0)
                .attr("height", subBand.bandwidth())
                .attr("width", d => x(d[s.key]))
                .attr("fill", s.color)
                .attr("rx", 2)
                .append("title")
                .text(d => `${codeToName[d.geo] || d.geo} — ${s.label} (${year}): €${d[s.key].toFixed(0)} per trip`);
        });

        // Y axis (country names)
        g.append("g")
            .call(d3.axisLeft(y).tickFormat(c => codeToName[c] || c).tickSize(0))
            .call(s => s.select(".domain").remove())
            .selectAll("text")
            .attr("font-size", "11.5px")
            .attr("fill", "#333");

        // X axis (euros)
        g.append("g")
            .attr("transform", `translate(0,${ih})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(v => "€" + v))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#666");

        // Legend at top
        const lg = svg.append("g").attr("transform", `translate(${margin.left}, 12)`);
        scopeMeta.forEach((s, i) => {
            const lx = i * 170;
            lg.append("rect").attr("x", lx).attr("y", 0).attr("width", 13).attr("height", 13)
                .attr("fill", s.color).attr("rx", 2);
            lg.append("text").attr("x", lx + 18).attr("y", 11)
                .attr("font-size", "12.5px").attr("fill", "#333").text(s.label);
        });

        // Year caption (top right)
        svg.append("text")
            .attr("x", W - margin.right)
            .attr("y", 22)
            .attr("text-anchor", "end")
            .attr("font-size", "12px")
            .attr("fill", "#777")
            .text(`Year: ${year}`);
    });
})();
