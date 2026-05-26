(function () {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

    const N = {
        AT:'Austria', BE:'Belgium', BG:'Bulgaria', HR:'Croatia', CY:'Cyprus',
        CZ:'Czech Republic', DK:'Denmark', EE:'Estonia', FI:'Finland', FR:'France',
        DE:'Germany', EL:'Greece', HU:'Hungary', IE:'Ireland', IT:'Italy',
        LV:'Latvia', LT:'Lithuania', LU:'Luxembourg', MT:'Malta', NL:'Netherlands',
        PL:'Poland', PT:'Portugal', RO:'Romania', SK:'Slovakia', SI:'Slovenia',
        ES:'Spain', SE:'Sweden'
    };

    const colors = {
        FR:'#0055A4', ES:'#AA151B', IT:'#009246', DE:'#222222',
        PL:'#DC143C', NL:'#FF7F2A', AT:'#ED2939', EL:'#0D5EAF',
        PT:'#006600', FI:'#003580', CZ:'#11457E', HR:'#171796',
        SE:'#FFCC00', RO:'#002B7F', DK:'#C8102E', HU:'#477050',
        IE:'#169B62', BE:'#FAE042', SK:'#0B4EA2',
        BG:'#00966E', EE:'#0072CE', SI:'#005DA4', LV:'#9E3039',
        LT:'#006A44', CY:'#D57800', MT:'#CF142B', LU:'#00A1DE'
    };

    d3.csv("exploitable_data/nights_per_geo_per_month_per_year.csv").then(raw => {
        // Keep country-level rows only (2-letter geo)
        const countryRows = raw.filter(r => (r.geo || "").trim().length === 2);

        // Build a lookup: byYear[year][month] = array of {geo, nights}
        const byYear = {};
        countryRows.forEach(row => {
            const geo   = row.geo.trim();
            const year  = (row.year || "").trim();
            const month = (row.month || "").trim();
            const v     = +row.nights;
            if (!byYear[year]) byYear[year] = {};
            if (!byYear[year][month]) byYear[year][month] = [];
            byYear[year][month].push({ geo, nights: v });
        });

        const years = Object.keys(byYear).sort();

        // Precompute per-year top dataset and the global maximum total for stable x scale
        const dataByYear = {};
        let globalMax = 0;
        years.forEach(year => {
            const arr = months.map(m => {
                const rows = byYear[year][m] || [];
                let topCode = null, topVal = -1;
                rows.forEach(r => {
                    if (r.nights > topVal) { topVal = r.nights; topCode = r.geo; }
                });
                if (topVal > globalMax) globalMax = topVal;
                return { month: m, country: topCode, total: topVal };
            });
            dataByYear[year] = arr;
        });

        const W = 858, H = 460;
        const margin = { top: 20, right: 250, bottom: 30, left: 100 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const svg = d3.select("#top-country-month-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, globalMax]).nice()
            .range([0, iw]);
        const y = d3.scaleBand()
            .domain(months)
            .range([0, ih])
            .padding(0.18);

        // Month axis (left, static)
        g.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(s => s.select(".domain").remove())
            .selectAll("text")
            .attr("font-size", "12.5px")
            .attr("fill", "#333");

        // X axis (nights, in billions, static)
        const xAxisG = g.append("g")
            .attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(v => (v / 1e9).toFixed(2) + "B"));
        xAxisG.selectAll("text").attr("font-size", "11px").attr("fill", "#666");

        const barLayer = g.append("g").attr("class", "bars");
        const lblLayer = g.append("g").attr("class", "labels");

        // Year selector
        const select = d3.select("#top-country-month-year-select");
        select.selectAll("option").remove();
        years.forEach(yr => select.append("option").attr("value", yr).text(yr));
        select.property("value", years[years.length - 1]);

        function update(year) {
            const data = dataByYear[year];

            const bars = barLayer.selectAll("rect.bar").data(data, d => d.month);
            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("y", d => y(d.month))
                .attr("height", y.bandwidth())
                .attr("rx", 3)
                .attr("width", 0)
                .attr("fill", d => colors[d.country] || "#777")
                .merge(bars)
                .transition().duration(500)
                .attr("fill", d => colors[d.country] || "#777")
                .attr("width", d => x(d.total));

            const lbls = lblLayer.selectAll("text.lbl").data(data, d => d.month);
            lbls.enter()
                .append("text")
                .attr("class", "lbl")
                .attr("x", d => x(d.total) + 8)
                .attr("y", d => y(d.month) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("font-size", "12.5px")
                .attr("fill", "#222")
                .merge(lbls)
                .transition().duration(500)
                .attr("x", d => x(d.total) + 8)
                .text(d => d.country
                    ? `${N[d.country] || d.country} — ${(d.total / 1e9).toFixed(2)}B nights`
                    : "no data");
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
