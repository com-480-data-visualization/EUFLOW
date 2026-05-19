d3.json("data/eu_gdp_and_to_ch_df_merged.json").then(raw => {
    const YEARS = [2020, 2021, 2022, 2023, 2024];

    const filtered = raw.filter(d =>
        YEARS.includes(+d["Year"]) &&
        d["Visitors' country of residence"] !== "Switzerland" &&
        d["gdp_pps"] != null
    );

    const avgGdp = d3.rollup(filtered,
        v => d3.mean(v, d => +d["gdp_pps"]),
        d => d["Visitors' country of residence"]
    );

    const allCountries = [...avgGdp.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(d => d[0]);

    const byCountry = d3.group(filtered, d => d["Visitors' country of residence"]);

    const color = d3.scaleOrdinal()
        .domain(allCountries)
        .range(d3.schemeTableau10.concat(d3.schemePastel1).concat(d3.schemeSet3));

    const margin = {top: 20, right: 120, bottom: 40, left: 70};
    const W = 820 - margin.left - margin.right;
    const H = 420 - margin.top - margin.bottom;

    const svg = d3.select("#gdp-svg")
        .attr("width", 800)
        .attr("height", H + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([2020, 2024]).range([0, W]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => +d["gdp_pps"]) * 1.1])
        .range([H, 0]);

    g.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H})`)
        .call(d3.axisBottom(x).tickValues(YEARS).tickFormat(d3.format("d")));

    g.append("g").attr("class", "axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d/1000).toFixed(0)}K`));

    g.append("text")
        .attr("x", W/2).attr("y", H + 36)
        .attr("text-anchor", "middle")
        .attr("fill", "#000").attr("font-size", 16)
        .text("Year");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -H/2).attr("y", -52)
        .attr("text-anchor", "middle")
        .attr("fill", "#000").attr("font-size", 16)
        .text("GDP per capita (PPS)");

    const lineGen = d3.line()
        .x(d => x(+d["Year"]))
        .y(d => y(+d["gdp_pps"]))
        .curve(d3.curveMonotoneX);

    const tooltip = document.getElementById("gdp-tooltip");
    let showAll = false;
    let topN = 10;

    function draw(countries) {
        const lines = g.selectAll(".gdp-line").data(countries, d => d);
        lines.enter().append("path").attr("class", "gdp-line")
            .attr("fill", "none").attr("stroke", d => color(d))
            .attr("stroke-width", 2.5).attr("opacity", 0)
            .attr("d", d => lineGen((byCountry.get(d)||[]).filter(r => YEARS.includes(+r["Year"])).sort((a,b) => +a["Year"] - +b["Year"])))
            .transition().duration(500).attr("opacity", 1);
        lines.transition().duration(500).attr("opacity", 1)
            .attr("d", d => lineGen((byCountry.get(d)||[]).filter(r => YEARS.includes(+r["Year"])).sort((a,b) => +a["Year"] - +b["Year"])));
        lines.exit().transition().duration(300).attr("opacity", 0).remove();

        const allPts = countries.flatMap(c =>
            (byCountry.get(c)||[]).filter(r => YEARS.includes(+r["Year"])).map(r => ({...r, country: c}))
        );
        const dots = g.selectAll(".gdp-dot").data(allPts, d => d.country + d["Year"]);
        dots.enter().append("circle").attr("class", "gdp-dot")
            .attr("cx", d => x(+d["Year"])).attr("cy", d => y(+d["gdp_pps"]))
            .attr("r", 4).attr("fill", d => color(d.country))
            .attr("stroke", "#fff").attr("stroke-width", 1.5).attr("opacity", 0)
            .on("mouseover", (event, d) => {
                tooltip.style.display = "block";
                tooltip.innerHTML = `<div style="color:#a0cfff;margin-bottom:4px;">${d.country}</div><div>Year: ${d["Year"]}</div><div>GDP: ${(+d["gdp_pps"]).toLocaleString()} PPS</div>`;
            })
            .on("mousemove", event => {
                tooltip.style.left = (event.clientX + 14) + "px";
                tooltip.style.top = (event.clientY - 36) + "px";
            })
            .on("mouseout", () => tooltip.style.display = "none")
            .transition().duration(500).attr("opacity", 1);
        dots.transition().duration(500).attr("cx", d => x(+d["Year"])).attr("cy", d => y(+d["gdp_pps"])).attr("opacity", 1);
        dots.exit().transition().duration(300).attr("opacity", 0).remove();

        const labelData = countries.map(c => {
            const pts = (byCountry.get(c)||[]).filter(r => +r["Year"] === 2024);
            return pts.length ? {country: c, val: +pts[0]["gdp_pps"]} : null;
        }).filter(Boolean);
    }

    const slider = document.getElementById("top-slider");
    const rankFrom = document.getElementById("rank-from");
    const rankTo = document.getElementById("rank-to");
    slider.max = allCountries.length;
    rankFrom.max = allCountries.length;
    rankTo.max = allCountries.length;

    function syncControls(from, to) {
        slider.value = to;
        document.getElementById("slider-display").textContent = `${from} ~ ${to}`;
        rankFrom.value = from;
        rankTo.value = to;
    }

    function updateChart(from, to) {
        showAll = false;
        document.getElementById("btn-all").classList.remove("active");
        draw(allCountries.slice(from - 1, to));
    }

    slider.addEventListener("input", function() {
        const to = +this.value;
        syncControls(1, to);
        updateChart(1, to);
    });

    rankFrom.addEventListener("input", function() {
        const from = +this.value;
        const to = +rankTo.value;
        syncControls(from, to);
        updateChart(from, to);
    });

    rankTo.addEventListener("input", function() {
        const to = +this.value;
        const from = +rankFrom.value;
        syncControls(from, to);
        updateChart(from, to);
    });

    document.getElementById("btn-all").addEventListener("click", function() {
        showAll = !showAll;
        this.classList.toggle("active", showAll);
        if (showAll) draw(allCountries);
        else updateChart(+rankFrom.value, +rankTo.value);
    });

    syncControls(1, 10);
    updateChart(1, 10);
});



let gdpPage = 0;
const gdpTotal = 3; // 你有 3 個 dots

function gdpGoTo(index) {
    gdpPage = index;
    document.getElementById("gdp-slides").style.transform = `translateX(-${gdpPage * 820}px)`;
    
    document.getElementById("btn-prev").style.display = gdpPage === 0 ? "none" : "block";
    document.getElementById("btn-next").style.display = gdpPage === gdpTotal - 1 ? "none" : "block";
    document.getElementById("gdp-controls").style.display = gdpPage === 0 ? "flex" : "none";

    // 更新 dots
    document.querySelectorAll(".gdp-nav-dot").forEach((dot, i) => {
        dot.style.background = i === gdpPage ? "black" : "#ccc";
    });
}

document.getElementById("btn-next").addEventListener("click", () => gdpGoTo(gdpPage + 1));
document.getElementById("btn-prev").addEventListener("click", () => gdpGoTo(gdpPage - 1));

document.querySelectorAll(".gdp-nav-dot").forEach(dot => {
    dot.addEventListener("click", () => gdpGoTo(+dot.dataset.index));
});

gdpGoTo(0);