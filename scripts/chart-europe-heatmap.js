const svg = d3.select("#europe-map");
const projection = d3.geoMercator();
const path = d3.geoPath().projection(projection);

// Country-level ISO numeric → CSV code
const isoToCode = {
    40: "AT", 56: "BE", 100: "BG", 191: "HR", 196: "CY",
    203: "CZ", 208: "DK", 233: "EE", 246: "FI", 250: "FR",
    276: "DE", 300: "EL", 348: "HU", 372: "IE", 380: "IT",
    428: "LV", 440: "LT", 442: "LU", 470: "MT", 528: "NL",
    578: "NO", 616: "PL", 620: "PT", 642: "RO", 703: "SK",
    705: "SI", 724: "ES", 752: "SE", 756: "CH", 792: "TR",
    804: "UA", 826: "UK", 352: "IS", 643: "RU",
    76: "BR", 124: "CA", 156: "CN", 710: "ZA", 840: "US"
};

const codeToName = {
    AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
    CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
    DE: "Germany", EL: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
    LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
    NO: "Norway", PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia",
    SI: "Slovenia", ES: "Spain", SE: "Sweden", CH: "Switzerland", TR: "Turkey",
    UA: "Ukraine", UK: "United Kingdom", IS: "Iceland", RU: "Russia",
    BR: "Brazil", CA: "Canada", CN: "China", ZA: "South Africa", US: "United States"
};

// 2024 population in millions (Eurostat / WB) — for per-capita mode
const POP_M = {
    AT: 9.2,  BE: 11.8, BG: 6.4,  HR: 3.9,  CY: 0.9,
    CZ: 10.9, DK: 5.9,  EE: 1.4,  FI: 5.6,  FR: 68.4,
    DE: 84.5, EL: 10.4, HU: 9.6,  IE: 5.3,  IT: 59.0,
    LV: 1.9,  LT: 2.9,  LU: 0.7,  MT: 0.6,  NL: 17.9,
    NO: 5.5,  PL: 36.7, PT: 10.6, RO: 19.0, SK: 5.4,
    SI: 2.1,  ES: 48.6, SE: 10.6, CH: 8.9,  TR: 85.0,
    UA: 33.4, UK: 67.0, IS: 0.4,  RU: 144.0,
    BR: 217.0, CA: 41.0, CN: 1410.0, ZA: 60.0, US: 333.0
};

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("exploitable_data/total_nights_spent_per_dest.csv")
]).then(([world, csvData]) => {
    const countries = topojson.feature(world, world.objects.countries).features;
    const withoutAntarctica = countries.filter(d => +d.id !== 10);

    projection.fitSize([858, 550], {
        type: "FeatureCollection",
        features: withoutAntarctica
    });

    const yearCols = Object.keys(csvData[0]).filter(k => k.trim() !== "c_dest");
    const years = yearCols.map(k => k.trim());

    // Total nights per year per code
    const visitors = {};
    years.forEach((y, i) => {
        visitors[y] = {};
        csvData.forEach(row => {
            const code = row.c_dest.trim();
            const val = +row[yearCols[i]];
            if (code) visitors[y][code] = val;
        });
    });

    const select = d3.select("#europe-year-select");
    years.forEach(y => select.append("option").attr("value", y).text(y));
    select.property("value", years[years.length - 1]);

    // Per-capita toggle
    const toggleHost = select.node().parentNode;
    const toggle = d3.select(toggleHost).append("label").attr("style",
        "position:absolute; top:12px; right:130px; z-index:10; font-size:12px; " +
        "background:white; padding:6px 10px; border:1px solid #ccc; border-radius:4px; cursor:pointer; " +
        "display:flex; align-items:center; gap:6px;"
    );
    toggle.append("input").attr("type", "checkbox").attr("id", "europe-percapita");
    toggle.append("span").text("Per capita");

    const tooltip = d3.select("#europe-tooltip");

    function valueFor(code, year, perCapita) {
        const raw = visitors[year] && visitors[year][code];
        if (!raw) return null;
        if (!perCapita) return raw;
        const pop = POP_M[code];
        return pop ? raw / (pop * 1e6) : null; // nights per person
    }

    function updateMap(year) {
        const perCapita = d3.select("#europe-percapita").property("checked");

        // Restrict scale to codes that are actually painted on the map —
        // aggregates like WORLD, EUR, EU27_2020, FOR, DOM otherwise dominate
        // the log domain and flatten the country-to-country variation.
        const drawnCodes = new Set(Object.values(isoToCode));
        const vals = [];
        drawnCodes.forEach(code => {
            const v = valueFor(code, year, perCapita);
            if (v && v > 0) vals.push(v);
        });

        const colorScale = d3.scaleSequentialLog()
            .domain([d3.min(vals), d3.max(vals)])
            .interpolator(d3.interpolateYlOrRd);

        svg.selectAll("path")
            .data(countries)
            .join("path")
            .attr("fill", d => {
                const code = isoToCode[+d.id];
                const v = valueFor(code, year, perCapita);
                return v && v > 0 ? colorScale(v) : "#ffffff";
            })
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("d", path)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.7);
                const code = isoToCode[+d.id];
                const name = codeToName[code];
                if (!name) return;
                const raw = visitors[year] && visitors[year][code];
                if (!raw) {
                    tooltip.style("display", "block").text(`${name}: no data`);
                    return;
                }
                const pc = perCapita && POP_M[code] ? raw / (POP_M[code] * 1e6) : null;
                tooltip.style("display", "block").html(
                    perCapita && pc
                        ? `${name}<br>${pc.toFixed(1)} nights / person<br><span style="color:#777">total: ${(raw/1e9).toFixed(2)}B</span>`
                        : `${name}: ${(raw/1e9).toFixed(2)}B nights`
                );
            })
            .on("mousemove", function(event) {
                const container = document.querySelector("#europe-map").getBoundingClientRect();
                tooltip
                    .style("left", (event.clientX - container.left + 10) + "px")
                    .style("top",  (event.clientY - container.top - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const code = isoToCode[+d.id];
                const v = valueFor(code, year, perCapita);
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("fill", v && v > 0 ? colorScale(v) : "#ffffff");
                tooltip.style("display", "none");
            });

        drawLegend(colorScale, perCapita);
    }

    // Color-bar legend
    let legendG = svg.select("g.color-legend");
    if (legendG.empty()) legendG = svg.append("g").attr("class", "color-legend");

    function drawLegend(scale, perCapita) {
        legendG.selectAll("*").remove();
        const lw = 180, lh = 10;
        const lx = 20, ly = 510;

        const defs = legendG.append("defs");
        const grad = defs.append("linearGradient").attr("id", "europe-cbar");
        const stops = d3.range(0, 1.0001, 0.1);
        const [d0, d1] = scale.domain();
        stops.forEach(t => {
            const v = Math.exp(Math.log(d0) + t * (Math.log(d1) - Math.log(d0)));
            grad.append("stop")
                .attr("offset", `${t*100}%`)
                .attr("stop-color", scale(v));
        });
        legendG.append("rect")
            .attr("x", lx).attr("y", ly)
            .attr("width", lw).attr("height", lh)
            .attr("fill", "url(#europe-cbar)")
            .attr("stroke", "#666").attr("stroke-width", 0.5);

        const fmt = perCapita ? v => v.toFixed(1) : v => (v / 1e9).toFixed(1) + "B";
        legendG.append("text")
            .attr("x", lx).attr("y", ly - 4)
            .attr("font-size", "11px").attr("fill", "#333")
            .text(perCapita ? "Nights per person (log)" : "Total nights (log)");
        legendG.append("text")
            .attr("x", lx).attr("y", ly + lh + 12)
            .attr("font-size", "11px").attr("fill", "#555")
            .text(fmt(d0));
        legendG.append("text")
            .attr("x", lx + lw).attr("y", ly + lh + 12)
            .attr("text-anchor", "end")
            .attr("font-size", "11px").attr("fill", "#555")
            .text(fmt(d1));
    }

    updateMap(years[years.length - 1]);
    select.on("change", function() { updateMap(this.value); });
    d3.select("#europe-percapita").on("change", function() {
        updateMap(select.property("value"));
    });
});
