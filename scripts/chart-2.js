const W2 = 700, H2 = 460;
const margin2 = { top: 20, right: 140, bottom: 60, left: 80 };

const scatterSvg = d3.select("#scatter")
    .attr("width", W2 + margin2.left + margin2.right)
    .attr("height", H2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

d3.json("data/countries_distances_vs_visitors.json").then(rawData => {

    const allData = rawData
        .filter(d => d["Visitors' country of residence"] !== "Switzerland")
        .filter(d => d["distance_km"] < 3000)
        .map(d => ({
            country: d["Visitors' country of residence"],
            distance: d["distance_km"],
            arrivals: d["value"],
            year: +d["Year"]
        }));

    const years = [...new Set(allData.map(d => d.year))].sort();

    // year selecttion menu
    const select = document.createElement("select");
    select.id = "scatter-year-select";
    select.style.cssText = "position:absolute; top:10px; right:10px; z-index:10; padding:6px 10px; font-size:13px; border:1px solid #ccc; border-radius:4px; background:white; cursor:pointer;";
    years.forEach(y => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    });
    select.value = years[years.length - 1];
    document.querySelector("#scatter").parentElement.style.position = "relative";
    document.querySelector("#scatter").parentElement.appendChild(select);

    // axes
    const x_axis = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d.distance)])
        .range([0, W2]);

    const y_axis = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d.arrivals) * 1.1])
        .range([H2, 0]);

    const r = d3.scaleSqrt()
        .domain([0, d3.max(allData, d => d.arrivals)])
        .range([4, 28]);

    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(allData, d => d.distance)])
        .interpolator(d3.interpolateRgb("#9d8fff", "#ff6b9d"));

    scatterSvg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H2})`)
        .call(d3.axisBottom(x_axis).ticks(6).tickFormat(d => `${d} km`));

    scatterSvg.append("g").attr("class", "axis")
        .call(d3.axisLeft(y_axis).ticks(5).tickFormat(d =>
            d >= 1000000 ? `${(d/1000000).toFixed(1)}M` : `${(d/1000).toFixed(0)}K`
        ));

    scatterSvg.append("text").attr("class", "axis-label")
        .attr("x", W2 / 2).attr("y", H2 + 50)
        .attr("text-anchor", "middle")
        .text("Distance from Switzerland (km)");

    scatterSvg.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -H2 / 2).attr("y", -65)
        .attr("text-anchor", "middle")
        .text("Number of Arrivals");

    // trend line
    const trendLine = scatterSvg.append("g").attr("class", "trend-line");

    function drawTrendLine(data) {
        const xMean = d3.mean(data, d => d.distance);
        const yMean = d3.mean(data, d => d.arrivals);
        const num = d3.sum(data, d => (d.distance - xMean) * (d.arrivals - yMean));
        const den = d3.sum(data, d => (d.distance - xMean) ** 2);
        const slope = num / den;
        const intercept = yMean - slope * xMean;
        const xMin = d3.min(data, d => d.distance);
        const xMax = d3.max(data, d => d.distance);

        trendLine.selectAll("line").remove();
        trendLine.append("line")
            .attr("x1", x_axis(xMin)).attr("y1", y_axis(slope * xMin + intercept))
            .attr("x2", x_axis(xMax)).attr("y2", y_axis(slope * xMax + intercept))
            .attr("stroke", "#ff4d6d")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6,4");
    }

    function updateChart(year) {
        const data = allData.filter(d => d.year === year);

        drawTrendLine(data);

        // dots
        const dots = scatterSvg.selectAll(".dot")
            .data(data, d => d.country);

        dots.enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x_axis(d.distance))
            .attr("cy", d => y_axis(d.arrivals))
            .attr("r", 0)
            .attr("fill", d => colorScale(d.distance))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("opacity", 0.75)
            .on("mouseover", function(event, d) {
                const tip = document.getElementById("Scattertooltip");
                tip.style.display = "block";
                tip.innerHTML = `
                    <div style="font-weight:700; margin-bottom:6px;">${d.country}</div>
                    <div>Year: ${d.year}</div>
                    <div>Distance: ${d.distance.toLocaleString()} km</div>
                    <div>Arrivals: ${d.arrivals.toLocaleString()}</div>`;
            })
            .on("mousemove", function(event) {
                const tip = document.getElementById("Scattertooltip");
                tip.style.left = (event.clientX + 16) + "px";
                tip.style.top = (event.clientY - 40) + "px";
            })
            .on("mouseout", function() {
                document.getElementById("Scattertooltip").style.display = "none";
            })
            .transition().duration(400)
            .attr("r", d => r(d.arrivals));

        dots.transition().duration(400)
            .attr("cx", d => x_axis(d.distance))
            .attr("cy", d => y_axis(d.arrivals))
            .attr("r", d => r(d.arrivals))
            .attr("fill", d => colorScale(d.distance));

        dots.exit().transition().duration(300).attr("r", 0).remove();

        // labels
        const topCountries = data.filter(d => d.arrivals > 100000);
        const labels = scatterSvg.selectAll(".country-label")
            .data(topCountries, d => d.country);

        labels.enter()
            .append("text")
            .attr("class", "country-label")
            .attr("font-size", 10)
            .attr("fill", "#666")
            .merge(labels)
            .transition().duration(400)
            .attr("x", d => x_axis(d.distance) + r(d.arrivals) + 4)
            .attr("y", d => y_axis(d.arrivals) + 4)
            .text(d => d.country);

        labels.exit().remove();
    }

    updateChart(years[years.length - 1]);
    select.addEventListener("change", function() {
        updateChart(+this.value);
    });
});