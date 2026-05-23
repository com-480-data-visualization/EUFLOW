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

    d3.csv("exploitable_data/total_per_country_per_month.csv").then(raw => {
        // Country-level rows only (2-letter geo codes)
        const countries = raw.filter(r => (r.geo || "").trim().length === 2);

        // For each month, find the country with the highest total
        const data = months.map(m => {
            let topCode = null, topVal = -1;
            countries.forEach(r => {
                const v = +r[m];
                if (v > topVal) { topVal = v; topCode = r.geo.trim(); }
            });
            return { month: m, country: topCode, total: topVal };
        });

        const W = 858, H = 460;
        const margin = { top: 20, right: 220, bottom: 30, left: 100 };
        const iw = W - margin.left - margin.right;
        const ih = H - margin.top - margin.bottom;

        const svg = d3.select("#top-country-month-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)]).nice()
            .range([0, iw]);
        const y = d3.scaleBand()
            .domain(months)
            .range([0, ih])
            .padding(0.18);

        // Bars
        g.selectAll("rect.bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.month))
            .attr("width", d => x(d.total))
            .attr("height", y.bandwidth())
            .attr("fill", d => colors[d.country] || "#777")
            .attr("rx", 3);

        // Country + value label to the right of each bar
        g.selectAll("text.lbl")
            .data(data)
            .join("text")
            .attr("class", "lbl")
            .attr("x", d => x(d.total) + 8)
            .attr("y", d => y(d.month) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("font-size", "12.5px")
            .attr("fill", "#222")
            .text(d => `${N[d.country] || d.country} — ${(d.total / 1e9).toFixed(2)}B nights`);

        // Month axis (left)
        g.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(s => s.select(".domain").remove())
            .selectAll("text")
            .attr("font-size", "12.5px")
            .attr("fill", "#333");

        // X axis (nights, in billions)
        g.append("g")
            .attr("transform", `translate(0, ${ih})`)
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(v => (v / 1e9).toFixed(1) + "B"))
            .selectAll("text")
            .attr("font-size", "11px")
            .attr("fill", "#666");
    });
})();
