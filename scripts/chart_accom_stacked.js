(function () {
    const aLabels = {
        'R_HOT':   'Hotel',
        'NR_RF':   'Rented (furnished)',
        'NR_OWN':  'Own / Family',
        'NR_OTH':  'Other non-rented',
        'R_OTH':   'Other rented',
        'R_CAMP':  'Camping',
        'R_HOL':   'Holiday dwelling',
        'R_OUS':   'Other / unspecified'
    };
    const aColors = {
        'R_HOT':   '#1565C0',
        'NR_RF':   '#E65100',
        'NR_OWN':  '#558B2F',
        'NR_OTH':  '#8E24AA',
        'R_OTH':   '#6A1B9A',
        'R_CAMP':  '#00897B',
        'R_HOL':   '#C0CA33',
        'R_OUS':   '#9E9E9E'
    };

    const W = 858, H = 460;
    const margin = { top: 20, right: 170, bottom: 40, left: 50 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;

    d3.csv("exploitable_data/percentage_accomad_per_year.csv").then(raw => {
        const yearCols = Object.keys(raw[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => +k.trim());

        // Long-form rows by year, keeping the labels we know
        const known = raw.filter(r => aLabels[r.accommod]);

        // Build series array suitable for d3.stack
        const data = years.map((yr, i) => {
            const obj = { year: yr };
            known.forEach(r => { obj[r.accommod] = +r[yearCols[i]] || 0; });
            return obj;
        });

        const keys = known.map(r => r.accommod);
        const stack = d3.stack().keys(keys).offset(d3.stackOffsetExpand); // 0–1 normalized
        const series = stack(data);

        const svg = d3.select("#accom-stacked-chart")
            .attr("viewBox", `0 0 ${W} ${H}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, iw]);
        const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

        const area = d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveMonotoneX);

        g.selectAll("path.layer")
            .data(series)
            .join("path")
            .attr("class", "layer")
            .attr("d", area)
            .attr("fill", d => aColors[d.key])
            .attr("opacity", 0.92)
            .append("title")
            .text(d => aLabels[d.key]);

        // X axis — show every 2nd year
        g.append("g")
            .attr("transform", `translate(0,${ih})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(years.length / 2))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#555");

        // Y axis as percentages
        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
            .selectAll("text").attr("font-size", "11px").attr("fill", "#555");

        // Right-side direct labels at last year, positioned at the middle of each band
        const lastYear = years[years.length - 1];
        const labelData = series.map(layer => {
            const last = layer[layer.length - 1];
            return { key: layer.key, mid: (last[0] + last[1]) / 2, val: last[1] - last[0] };
        });

        g.selectAll("text.lbl")
            .data(labelData)
            .join("text")
            .attr("class", "lbl")
            .attr("x", iw + 8)
            .attr("y", d => y(d.mid))
            .attr("dy", "0.35em")
            .attr("font-size", "12px")
            .attr("fill", d => aColors[d.key])
            .text(d => `${aLabels[d.key]} — ${(d.val * 100).toFixed(0)}%`);
    });
})();
