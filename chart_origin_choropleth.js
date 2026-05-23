(function () {
    const svg = d3.select("#origin-choropleth-map");
    const MAP_W = 858, MAP_H = 600;

    const EU27_ISO_TO_CODE = {
        40:"AT", 56:"BE", 100:"BG", 191:"HR", 196:"CY",
        203:"CZ", 208:"DK", 233:"EE", 246:"FI", 250:"FR",
        276:"DE", 300:"EL", 348:"HU", 372:"IE", 380:"IT",
        428:"LV", 440:"LT", 442:"LU", 470:"MT", 528:"NL",
        616:"PL", 620:"PT", 642:"RO", 703:"SK", 705:"SI",
        724:"ES", 752:"SE"
    };
    const EU27_ISO = new Set(Object.keys(EU27_ISO_TO_CODE).map(Number));

    const N = window._EU_NAMES || {};

    // Curated palette for ~12 most common origin countries; rest get a fallback color
    const originColor = {
        FR:'#1F77B4', DE:'#FF7F0E', ES:'#D62728', IT:'#2CA02C', AT:'#9467BD',
        NL:'#8C564B', UK:'#E377C2', EL:'#7F7F7F', BG:'#BCBD22', HR:'#17BECF',
        PL:'#FFD92F', BE:'#FFB347', SE:'#4C72B0', DK:'#55A868', FI:'#8172B2',
        PT:'#937860', RO:'#DA8BC3', CZ:'#8C8C8C', HU:'#CCB974', IE:'#64B5CD'
    };
    const FALLBACK_COLOR = "#B0B0B0";
    const NO_DATA_FILL  = "#4A4A4A";
    const BACKDROP_FILL = "#D2D6DB";
    const BG_COLOR      = "#F6F8FB";

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/most_popular_country_of_origin_by_destination.csv")
    ]).then(([world, csvData]) => {
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years = yearCols.map(k => k.trim());
        const recentYears = years.filter(y => +y >= 2010); // keep dropdown reasonable

        const originByDest = {};
        csvData.forEach(row => {
            const code = (row.geo || "").trim();
            if (!code) return;
            originByDest[code] = {};
            yearCols.forEach((col, i) => {
                originByDest[code][years[i]] = (row[col] || "").trim();
            });
        });

        const allCountries = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10);
        const euFeats       = allCountries.filter(d => EU27_ISO.has(+d.id));
        const backdropFeats = allCountries.filter(d => !EU27_ISO.has(+d.id));

        const projection = d3.geoConicConformal()
            .rotate([-10, 0])
            .parallels([35, 65])
            .center([0, 52])
            .scale(820)
            .translate([MAP_W / 2, MAP_H / 2 + 20]);
        const path = d3.geoPath().projection(projection);

        const gBackdrop = svg.append("g").attr("class", "backdrop");
        const gEU       = svg.append("g").attr("class", "eu");

        gBackdrop.selectAll("path")
            .data(backdropFeats)
            .join("path")
            .attr("d", path)
            .attr("fill", BACKDROP_FILL)
            .attr("stroke", "#9aa0a6")
            .attr("stroke-width", 0.4);

        const select = d3.select("#origin-choropleth-year-select");
        select.selectAll("option").remove();
        recentYears.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", recentYears[recentYears.length - 1]);

        const tooltip = d3.select("#origin-choropleth-tooltip");

        function update(year) {
            gEU.selectAll("path")
                .data(euFeats, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#222")
                .attr("stroke-width", 0.5)
                .attr("fill", d => {
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const origin = originByDest[code] && originByDest[code][year];
                    if (!origin) return NO_DATA_FILL;
                    return originColor[origin] || FALLBACK_COLOR;
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.75);
                    const code = EU27_ISO_TO_CODE[+d.id];
                    const destName = N[code] || code;
                    const origin = originByDest[code] && originByDest[code][year];
                    const originName = N[origin] || origin || "no data";
                    tooltip.style("display", "block")
                        .text(`${destName} (${year}) — top origin: ${originName}`);
                })
                .on("mousemove", function (event) {
                    const container = document.querySelector("#origin-choropleth-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - container.left + 10) + "px")
                        .style("top",  (event.clientY - container.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1);
                    tooltip.style("display", "none");
                });

            // Rebuild legend with only origins that actually appear this year
            const presentOrigins = new Set();
            euFeats.forEach(d => {
                const code = EU27_ISO_TO_CODE[+d.id];
                const origin = originByDest[code] && originByDest[code][year];
                if (origin) presentOrigins.add(origin);
            });
            renderLegend([...presentOrigins].sort());
        }

        const legendG = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(24, 60)");

        function renderLegend(origins) {
            legendG.selectAll("*").remove();
            legendG.append("rect")
                .attr("x", -10).attr("y", -12)
                .attr("width", 175).attr("height", origins.length * 22 + 16)
                .attr("fill", BG_COLOR).attr("fill-opacity", 0.92)
                .attr("rx", 4);

            const item = legendG.selectAll("g.item")
                .data(origins)
                .join("g")
                .attr("class", "item")
                .attr("transform", (d, i) => `translate(0, ${i * 22})`);

            item.append("rect")
                .attr("width", 18).attr("height", 18)
                .attr("fill", d => originColor[d] || FALLBACK_COLOR)
                .attr("stroke", "#333").attr("stroke-width", 0.5);

            item.append("text")
                .attr("x", 26).attr("y", 13)
                .attr("font-size", "13px")
                .attr("fill", "#222")
                .text(d => N[d] || d);
        }

        update(recentYears[recentYears.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
