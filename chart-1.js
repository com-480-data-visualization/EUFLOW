const svg = d3.select("#map");
const projection = d3.geoMercator();
const path = d3.geoPath().projection(projection);

Promise.all([
d3.json("data/cantons.geojson"),
d3.json("data/canton_annual_total_visitors.json")
]).then(([geoData, visitors]) => {

projection.fitSize([900, 600], geoData);

const years = Object.keys(visitors).sort();
const select = d3.select("#year-select");
years.forEach(y => select.append("option").attr("value", y).text(y));
select.property("value", years[years.length - 1]);

const tooltip = d3.select("#tooltip");

function updateMap(year) {
    const yearData = visitors[year];
    const maxVal = d3.max(Object.values(yearData));
    const colorScale = d3.scaleSequential()
    .domain([0, maxVal])
    // .interpolator(d3.interpolateBlues);
    .interpolator(d3.interpolateRgb("#bedff9", "#0008ff"));

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
            .text(`${d.properties.NAME}: ${val ? val.toLocaleString() : "no data"}`);
    })
    .on("mousemove", function(event) {
    const container = document.querySelector("#map").getBoundingClientRect();
    tooltip.style("left", (event.clientX - container.left + 10) + "px")
            .style("top",  (event.clientY - container.top - 28) + "px");
    })
    .on("mouseout", function(event, d) {
        const val = yearData[d.properties.NAME];
        d3.select(this).attr("opacity", 1)
                    .attr("fill", val ? colorScale(val) : "#ccc");
        tooltip.style("display", "none");
    });
}

updateMap(years[years.length - 1]);

select.on("change", function() {
    updateMap(this.value); });


const minValue = d3.min(data, d => +d.value);
const maxValue = d3.max(data, d => +d.value);
const legendWidth = 180;
const legendHeight = 12;
const legendX = 40;
const legendY = H - 40;
const defs = svg.append("defs");

const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

linearGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#dbeafe");

linearGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#1d4ed8");

svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .attr("rx", 6);

const legendScale = d3.scaleLinear()
    .domain([
        minValue,
        maxValue
    ])
    .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2s"));

svg.append("g")
    .attr(
        "transform",
        `translate(${legendX}, ${legendY + legendHeight})`
    )
    .call(legendAxis)
    .call(g => g.select(".domain").remove());

svg.append("text")
    .attr("x", legendX)
    .attr("y", legendY - 10)
    .attr("fill", "#333")
    .attr("font-size", 13)
    .attr("font-family", "sans-serif")
    .text("Visitors");

});