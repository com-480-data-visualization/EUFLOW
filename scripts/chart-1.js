const svg = d3.select("#map");
const projection = d3.geoMercator();
const path = d3.geoPath().projection(projection);

const W1 = 900, H1 = 480;
const legendWidth = 180, legendHeight = 12;
const legendX = W1 - legendWidth - 30;
const legendY = H1 - 55;

Promise.all([
    d3.json("data/cantons.geojson"),
    d3.json("data/canton_annual_total_eu_visitors.json")
]).then(([geoData, visitors]) => {

    projection.fitSize([W1, H1], geoData);

    const years = Object.keys(visitors).sort();
    const select = d3.select("#year-select");
    years.forEach(y => select.append("option").attr("value", y).text(y));
    select.property("value", years[years.length - 1]);

    const tooltip = d3.select("#tooltip");
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

    linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#bedff9");
    linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#0008ff");

    svg.append("rect")
        .attr("id", "legend-rect")
        .attr("x", legendX)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("rx", 4)
        .style("fill", "url(#legend-gradient)");

    const legendAxisGroup = svg.append("g")
        .attr("id", "legend-axis")
        .attr("transform", `translate(${legendX}, ${legendY + legendHeight})`);

    svg.append("text")
        .attr("x", legendX)
        .attr("y", legendY - 8)
        .attr("fill", "#333")
        .attr("font-size", 12)
        .attr("font-family", "sans-serif")
        .text("Visitors");

    function updateMap(year) {
        const yearData = visitors[year];
    
    const cantonValues = Object.entries(yearData)
        .filter(([name, _]) => name !== "Switzerland")
        .map(([_, val]) => val)
        .filter(v => v > 0);
    
    const maxVal = d3.max(cantonValues);

    const colorScale = d3.scaleSqrt()
        .domain([0, maxVal])
        .range(["#bedff9", "#080fe1"]);

        // Cantons
        svg.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("fill", d => {
                const val = yearData[d.properties.NAME];
                return val ? colorScale(val) : "#ccc";
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("d", path)
            .on("mouseover", function(event, d) {
    d3.select(this).attr("opacity", 0.7);
    const val = yearData[d.properties.NAME];
    tooltip.style("display", "block")
        .html(`<div style="font-weight:700; margin-bottom:6px;">${d.properties.NAME}</div>
               <div>Visitors: ${val ? val.toLocaleString() : "no data"}</div>`);
})
            .on("mousemove", function(event) {
    tooltip
        .style("left", (event.clientX + 16) + "px")
        .style("top", (event.clientY - 40) + "px");
})
            .on("mouseout", function(event, d) {
                const val = yearData[d.properties.NAME];
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("fill", val ? colorScale(val) : "#ccc");
                tooltip.style("display", "none");
            });

        const legendScale = d3.scaleLinear()
            .domain([0, maxVal])
            .range([0, legendWidth]);

        legendAxisGroup.call(
            d3.axisBottom(legendScale)
                .tickValues([0, maxVal / 4, maxVal / 2, (maxVal * 3) / 4, maxVal])
                .tickFormat(d => {
                    if (d === 0) return "0";
                    if (d >= 1_000_000) return (d / 1_000_000).toFixed(1) + "M";
                    if (d >= 1_000)     return (d / 1_000).toFixed(0) + "K";
                    return d;
                })
        ).call(g => g.selectAll(".domain").remove());
    }

    updateMap(years[years.length - 1]);
    select.on("change", function() { updateMap(this.value); });
});