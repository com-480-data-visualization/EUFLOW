const margin = {top: 20, right: 160, bottom: 50, left: 80};
const W = 800 - margin.left - margin.right;
const H = 500 - margin.top - margin.bottom;

const scatterSvg = d3.select("#scatter")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.json("data/countries_distances_vs_visitors.json").then(rawData => {
    const data = rawData
        .filter(d => d["Visitors' country of residence"] !== "Switzerland")
        .filter(d => d["distance_km"] < 3000)
        .map(d => ({
            country: d["Visitors' country of residence"],
            distance: d["distance_km"],
            arrivals: d["value"]
        }));

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.distance) * 1.00])
        .range([0, W]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.arrivals) * 1.1])
        .range([H, 0]);

    const r = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.arrivals)])
        .range([4, 28]);

    // set grid
    // scatterSvg.append("g").attr("class", "grid")
    //     .call(d3.axisLeft(y).tickSize(-W).tickFormat(""))
    //     .select(".domain").remove();

    // axes
    scatterSvg.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${H})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d} km`));

    scatterSvg.append("g").attr("class", "axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d =>
            d >= 1000000 ? `${(d/1000000).toFixed(1)}M` : `${(d/1000).toFixed(0)}K`
        ));

    // axis labels
    scatterSvg.append("text").attr("class", "axis-label")
        .attr("x", W / 2).attr("y", H + 45)
        .attr("text-anchor", "middle")
        .text("Distance from Switzerland (km)");

    scatterSvg.append("text").attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -H / 2).attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Number of Arrivals");

    // trend line
    const xMean = d3.mean(data, d => d.distance);
    const yMean = d3.mean(data, d => d.arrivals);
    const num = d3.sum(data, d => (d.distance - xMean) * (d.arrivals - yMean));
    const den = d3.sum(data, d => (d.distance - xMean) ** 2);
    const slope = num / den;
    const intercept = yMean - slope * xMean;
    const xMin = d3.min(data, d => d.distance);
    const xMax = d3.max(data, d => d.distance);

    scatterSvg.append("line")
        .attr("x1", x(xMin)).attr("y1", y(slope * xMin + intercept))
        .attr("x2", x(xMax)).attr("y2", y(slope * xMax + intercept))
        .attr("stroke", "#ff4d6d")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "6,4");

    // correlation badge
    const xStd = Math.sqrt(d3.variance(data, d => d.distance));
    const yStd = Math.sqrt(d3.variance(data, d => d.arrivals));
    const corr = (num / (data.length - 1)) / (xStd * yStd);

    // color scale
    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(data, d => d.distance)])
        .interpolator(d3.interpolateRgb("#9d8fff", "#ff6b9d"));

    const Scattertooltip = d3.select("#Scattertooltip");

    // scatter dots
    scatterSvg.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.distance))
        .attr("cy", d => y(d.arrivals))
        .attr("r", d => r(d.arrivals))
        .attr("fill", d => colorScale(d.distance))
        .attr("opacity", 0.75)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
        const tip = document.getElementById("Scattertooltip");
        tip.style.display = "block";
        tip.innerHTML = `
        <div style="font-weight:700; margin-bottom:6px;">${d.country}</div>
        <div>Distance: ${d.distance.toLocaleString()} km</div>
        <div>Arrivals: ${d.arrivals.toLocaleString()}</div>`;
        })
        .on("mousemove", function(event) {
            const tip = document.getElementById("Scattertooltip");
            const container = tip.parentElement.getBoundingClientRect();
            tip.style.left = (event.clientX - container.left + 16) + "px";
            tip.style.top = (event.clientY - container.top - 40) + "px";
        })
        .on("mouseout", function() {
            document.getElementById("Scattertooltip").style.display = "none";
        });

    // labels
    const topCountries = data.filter(d => d.arrivals > 300000 || d.country === "Ireland");
    scatterSvg.selectAll(".country-label")
        .data(topCountries)
        .join("text")
        .attr("class", "country-label")
        .attr("x", d => x(d.distance) + r(d.arrivals) + 4)
        .attr("y", d => y(d.arrivals) + 4)
        .text(d => d.country);
});
