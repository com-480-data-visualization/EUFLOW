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
    // .interpolator(d3.interpolatePurples);
    .interpolator(d3.interpolateRgb("#ffcccc", "#8b0000"));

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
});