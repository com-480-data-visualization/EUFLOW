d3.json("data/eu_gdp_and_to_ch_df_merged.json").then(raw => {
    const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const filtered = raw.filter(d =>
        YEARS.includes(+d["Year"]) &&
        d["Visitors' country of residence"] !== "Switzerland" &&
        d["OBS_VALUE"] != null &&
        d["value"] != null &&
        +d["OBS_VALUE"] > 0 &&
        +d["value"] > 0
    );

    const avgGdp = d3.rollup(
        filtered,
        v => d3.mean(v, d => +d["OBS_VALUE"]),
        d => d["Visitors' country of residence"]
    );

    const allCountries = [...avgGdp.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(d => d[0]);

    const byCountry = d3.group(
        filtered,
        d => d["Visitors' country of residence"]
    );

    const color = d3.scaleOrdinal()
        .domain(allCountries)
        .range(
            d3.schemeTableau10
                .concat(d3.schemePastel1)
                .concat(d3.schemeSet3)
        );

    const margin = {
        top: 20,
        right: 120,
        bottom: 70,
        left: 150
    };

    const W = 920 - margin.left - margin.right;
    const H = 540 - margin.top - margin.bottom;

    const svg = d3.select("#gdp-svg-2")
        .attr("width", W + margin.left + margin.right)
        .attr("height", H + margin.top + margin.bottom);

    svg.selectAll("*").remove();

    const g = svg.append("g")
        .attr(
            "transform",
            `translate(${margin.left},${margin.top})`
        );

    const x = d3.scaleLog()
        .domain([
            10000,
            d3.max(filtered, d => +d["OBS_VALUE"]) * 1.05
        ])
        .range([0, W]);

    const y = d3.scaleLog()
        .domain([
            1000,
            d3.max(filtered, d => +d["value"]) * 1.05
        ])
        .range([H, 0]);

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${H})`)
        .call(
            d3.axisBottom(x)
                .ticks(8, "~s")
        );

    g.append("g")
        .attr("class", "axis")
        .call(
            d3.axisLeft(y)
                .ticks(6, "~s")
        );
      
    g.append("text")
        .attr("x", W / 2)
        .attr("y", H + 52)
        .attr("text-anchor", "middle")
        .attr("fill", "#000")
        .attr("font-size", 16)
        .text("GDP per capita (PPP) (in log scale)");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -H / 2)
        .attr("y", -64)
        .attr("text-anchor", "middle")
        .attr("fill", "#000")
        .attr("font-size", 16)
        .text("Visitors to Switzerland (in log scale)");

    const lineGen = d3.line()
        .x(d => x(+d["OBS_VALUE"]))
        .y(d => y(+d["value"]))
        .curve(d3.curveMonotoneX);

    const tooltip = document.getElementById("gdp-tooltip-4");

    let showAll = false;

    function draw(countries) {
        const lineData = countries.map(c => ({
            country: c,
            values: (byCountry.get(c) || [])
                .filter(r =>
                    YEARS.includes(+r["Year"])
                )
                .sort((a, b) =>
                    +a["Year"] - +b["Year"]
                )
        }));

        const lines = g.selectAll(".gdp-line")
            .data(lineData, d => d.country);

        lines.enter()
            .append("path")
            .attr("class", d =>
                `gdp-line line-${d.country.replace(/\s+/g, "-")}`
            )
            .attr("fill", "none")
            .attr("stroke", d => color(d.country))
            .attr("stroke-width", 2.5)
            .attr("opacity", 0.35)
            .attr("d", d => lineGen(d.values))

            .on("mouseover", function(event, d) {
                d3.selectAll(".gdp-line")
                    .transition()
                    .duration(150)
                    .attr("opacity", 0.06);

                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("opacity", 1)
                    .attr("stroke-width", 4);
            })

            .on("mouseout", function() {

                d3.selectAll(".gdp-line")
                    .transition()
                    .duration(150)
                    .attr("opacity", 0.35)
                    .attr("stroke-width", 2.5);
            })

            .transition()
            .duration(600)
            .attr("opacity", 0.35);

        lines.transition()
            .duration(600)
            .attr("d", d => lineGen(d.values));

        lines.exit()
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .remove();

        const allPts = lineData.flatMap(d =>
            d.values.map(v => ({
                ...v,
                country: d.country
            }))
        );

        const dots = g.selectAll(".gdp-dot")
            .data(
                allPts,
                d => d.country + d["Year"]
            );

        dots.enter()
            .append("circle")
            .attr("class", "gdp-dot")
            .attr("cx", d =>
                x(+d["OBS_VALUE"])
            )
            .attr("cy", d =>
                y(+d["value"])
            )
            .attr("r", 4)
            .attr("fill", d =>
                color(d.country)
            )
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.85)

            .on("mouseover", (event, d) => {

                tooltip.style.display = "block";

                tooltip.innerHTML = `
                    <div style="color:#a0cfff; margin-bottom:6px; font-size:14px;">
                        ${d.country}
                    </div>

                    <div>
                        Year:
                        ${d["Year"]}
                    </div>

                    <div>
                        GDP:
                        ${(+d["OBS_VALUE"])
                            .toLocaleString()} PPP
                    </div>

                    <div>
                        Visitors:
                        ${(+d["value"])
                            .toLocaleString()}
                    </div>
                `;
                d3.selectAll(".gdp-line")
                    .attr("opacity", 0.05);
                d3.selectAll(".gdp-dot")
                    .attr("opacity", 0.08);
                d3.selectAll(
                    `.line-${d.country.replace(/\s+/g, "-")}`
                )
                    .attr("opacity", 1)
                    .attr("stroke-width", 4);
                d3.select(event.target)
                    .attr("r", 7)
                    .attr("opacity", 1);
            })

            .on("mousemove", event => {
                tooltip.style.left =
                    (event.clientX + 16) + "px";
                tooltip.style.top =
                    (event.clientY - 36) + "px";
            })

            .on("mouseout", event => {
                tooltip.style.display = "none";
                d3.selectAll(".gdp-line")
                    .attr("opacity", 0.35)
                    .attr("stroke-width", 2.5);

                d3.selectAll(".gdp-dot")
                    .attr("opacity", 0.85);

                d3.select(event.target)
                    .attr("r", 4);
            })

            .transition()
            .duration(600)
            .attr("opacity", 0.85);

        dots.transition()
            .duration(600)
            .attr("cx", d =>
                x(+d["OBS_VALUE"])
            )
            .attr("cy", d =>
                y(+d["value"])
            );

        dots.exit()
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .remove();

        const labelData = lineData.map(d => {
            const last =
                d.values[d.values.length - 1];
            return {
                country: d.country,
                x: +last["OBS_VALUE"],
                y: +last["value"]
            };
        });

        const labels = g.selectAll(".end-label").data(labelData, d => d.country);

        labels.enter()
            .append("text")
            .attr("class", "end-label")
            .attr("x", d => x(d.x) + 8)
            .attr("y", d => y(d.y) + 4)
            .attr("font-size", 11)
            .attr("fill", d => color(d.country))
            .text(d => d.country);

        labels.transition()
            .duration(600)
            .attr("x", d => x(d.x) + 8)
            .attr("y", d => y(d.y) + 4);
        labels.exit().remove();
    }

    const slider = document.getElementById("top-slider-4");
    const rankFrom = document.getElementById("rank-from-4");
    const rankTo = document.getElementById("rank-to-4");
    slider.max = allCountries.length;
    rankFrom.max = allCountries.length;
    rankTo.max = allCountries.length;

    function syncControls(from, to) {
        document.getElementById("slider-display-4").textContent = `${from} ~ ${to}`;

        rankFrom.value = from;
        rankTo.value = to;
        slider.value = to;
        const min = 1;
        const max = allCountries.length;
        const fromPercent = ((from - min) / (max - min)) * 100;
        const toPercent = ((to - min) / (max - min)) * 100;

        slider.style.background =
            `linear-gradient(
                to right,
                #e8e8e8 0%,
                #e8e8e8 ${fromPercent}%,
                #111 ${fromPercent}%,
                #111 ${toPercent}%,
                #e8e8e8 ${toPercent}%,
                #e8e8e8 100%
            )`;
    }

    function updateChart(from, to) {
        showAll = false;
        document.getElementById("btn-all-4").classList.remove("active");
        draw(allCountries.slice(from - 1, to));
    }

    slider.addEventListener("input", function() {
        const to = +this.value;
        const from = +rankFrom.value;
        syncControls(from, to);
        updateChart(from, to);
    });

    rankFrom.addEventListener("input", function() {
        let from = +this.value;
        let to = +rankTo.value;
        if (from > to) {
            from = to;
            this.value = from;
        }
        syncControls(from, to);
        updateChart(from, to);
    });

    rankTo.addEventListener("input", function() {
        let to = +this.value;
        let from = +rankFrom.value;
        if (to < from) {
            to = from;
            this.value = to;
        }
        syncControls(from, to);
        updateChart(from, to);
    });

    document.getElementById("btn-all-4")
        .addEventListener("click", function() {
        showAll = !showAll;
        this.classList.toggle("active", showAll);

        if (showAll) {
            draw(allCountries);
            syncControls(1, allCountries.length);
        } else { updateChart(+rankFrom.value, +rankTo.value); }
    });

    syncControls(1, 10);
    updateChart(1, 10);
});