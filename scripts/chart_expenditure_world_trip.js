(function () {
    const svg = d3.select("#expenditure-world-trip-map");
    const MAP_W = 858, MAP_H = 660;

    const ISO_TO_CODE = {
        40:"AT", 56:"BE", 100:"BG", 191:"HR", 196:"CY",
        203:"CZ", 208:"DK", 233:"EE", 246:"FI", 250:"FR",
        276:"DE", 300:"EL", 348:"HU", 372:"IE", 380:"IT",
        428:"LV", 440:"LT", 442:"LU", 470:"MT", 528:"NL",
        616:"PL", 620:"PT", 642:"RO", 703:"SK", 705:"SI",
        724:"ES", 752:"SE",
        756:"CH", 826:"UK", 578:"NO", 352:"IS", 643:"RU", 804:"UA", 792:"TR",
        76:"BR", 124:"CA", 156:"CN", 710:"ZA", 840:"US"
    };

    const codeToName = {
        AT:"Austria", BE:"Belgium", BG:"Bulgaria", HR:"Croatia", CY:"Cyprus",
        CZ:"Czech Republic", DK:"Denmark", EE:"Estonia", FI:"Finland", FR:"France",
        DE:"Germany", EL:"Greece", HU:"Hungary", IE:"Ireland", IT:"Italy",
        LV:"Latvia", LT:"Lithuania", LU:"Luxembourg", MT:"Malta", NL:"Netherlands",
        PL:"Poland", PT:"Portugal", RO:"Romania", SK:"Slovakia", SI:"Slovenia",
        ES:"Spain", SE:"Sweden",
        CH:"Switzerland", UK:"United Kingdom", NO:"Norway", IS:"Iceland",
        RU:"Russia", UA:"Ukraine", TR:"Turkey",
        BR:"Brazil", CA:"Canada", CN:"China", ZA:"South Africa", US:"United States"
    };

    const AGG = [
        { key:"WORLD",   label:"World",                  group:"Total"   },
        { key:"DOM",     label:"Domestic trips",         group:"Total"   },
        { key:"FOR",     label:"All foreign trips",      group:"Total"   },
        { key:"EUR",     label:"Europe",                 group:"Region"  },
        { key:"EUR_OTH", label:"Europe (non EU)",        group:"Region"  },
        { key:"AME",     label:"Americas",               group:"Region"  },
        { key:"AME_N",   label:"North America",          group:"Region"  },
        { key:"AME_C_S", label:"Central / South America",group:"Region"  },
        { key:"ASI",     label:"Asia",                   group:"Region"  },
        { key:"AFR",     label:"Africa",                 group:"Region"  }
    ];

    const NO_DATA_FILL = "#E4E6EB";

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.csv("exploitable_data/exp_trp_per_dest.csv")
    ]).then(([world, csvData]) => {
        const yearCols = Object.keys(csvData[0]).filter(k => /^\s*\d{4}\s*$/.test(k));
        const years    = yearCols.map(k => k.trim());

        const valByCode = {};
        csvData.forEach(row => {
            const code = (row.c_dest || "").trim();
            valByCode[code] = {};
            yearCols.forEach((col, i) => {
                valByCode[code][years[i]] = +row[col];
            });
        });

        const countries = topojson.feature(world, world.objects.countries).features
            .filter(d => +d.id !== 10);

        const MAP_AREA_H = 460;
        const AGG_AREA_Y = 480;

        const projection = d3.geoEqualEarth()
            .fitSize([MAP_W - 30, MAP_AREA_H - 10], { type:"FeatureCollection", features: countries })
            .translate([MAP_W / 2, MAP_AREA_H / 2 + 10]);
        const path = d3.geoPath().projection(projection);

        const gMap = svg.append("g").attr("class","world");
        const select = d3.select("#expenditure-world-trip-year-select");
        select.selectAll("option").remove();
        years.forEach(y => select.append("option").attr("value", y).text(y));
        select.property("value", years[years.length - 1]);

        const tooltip = d3.select("#expenditure-world-trip-tooltip");

        const aggG  = svg.append("g").attr("class","agg")
            .attr("transform", `translate(40, ${AGG_AREA_Y})`);
        const cbarG = svg.append("g").attr("class","cbar");

        function update(year) {
            const countryVals = [];
            Object.keys(valByCode).forEach(code => {
                const v = valByCode[code][year];
                if (v && isFinite(v) && code.length === 2) countryVals.push(v);
            });
            AGG.forEach(a => {
                const v = valByCode[a.key] && valByCode[a.key][year];
                if (v && isFinite(v)) countryVals.push(v);
            });

            const color = d3.scaleSequential()
                .domain([d3.min(countryVals), d3.max(countryVals)])
                .interpolator(d3.interpolateYlOrBr);

            gMap.selectAll("path")
                .data(countries, d => +d.id)
                .join("path")
                .attr("d", path)
                .attr("stroke", "#9aa0a6")
                .attr("stroke-width", 0.35)
                .transition().duration(500)
                .attr("fill", d => {
                    const code = ISO_TO_CODE[+d.id];
                    const v = code && valByCode[code] && valByCode[code][year];
                    return (v && isFinite(v)) ? color(v) : NO_DATA_FILL;
                });

            gMap.selectAll("path")
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("opacity", 0.78).attr("stroke-width", 1);
                    const code = ISO_TO_CODE[+d.id];
                    const name = codeToName[code] || (d.properties && d.properties.name) || "no data";
                    const v = code && valByCode[code] && valByCode[code][year];
                    tooltip.style("display","block").text(
                        v ? `${name} (${year}): €${v.toFixed(0)} per trip` : `${name}: no data`
                    );
                })
                .on("mousemove", function (event) {
                    const c = document.querySelector("#expenditure-world-trip-map").getBoundingClientRect();
                    tooltip
                        .style("left", (event.clientX - c.left + 10) + "px")
                        .style("top",  (event.clientY - c.top - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 1).attr("stroke-width", 0.35);
                    tooltip.style("display","none");
                });

            const aggData = AGG.map(a => ({
                ...a,
                val: valByCode[a.key] ? valByCode[a.key][year] : null
            })).filter(d => d.val && isFinite(d.val));

            aggG.selectAll("*").remove();
            aggG.append("text")
                .attr("x", 0).attr("y", -4)
                .attr("font-size", "12px").attr("fill", "#333").attr("font-weight", 600)
                .text("Aggregate destinations (regions and totals not drawn on the map)");

            const bw = 70;
            const bx = (i) => i * (bw + 12);
            const maxVal = d3.max(aggData, d => d.val);
            const barH = (v) => Math.max(4, (v / maxVal) * 70);

            aggData.forEach((d, i) => {
                const slot = aggG.append("g")
                    .attr("transform", `translate(${bx(i)}, 8)`);
                slot.append("rect")
                    .attr("x", 0).attr("y", 90 - barH(d.val))
                    .attr("width", bw).attr("height", barH(d.val))
                    .attr("fill", color(d.val))
                    .attr("stroke", "#333").attr("stroke-width", 0.4)
                    .attr("rx", 2);
                slot.append("text")
                    .attr("x", bw / 2).attr("y", 90 - barH(d.val) - 4)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10.5px").attr("fill", "#333")
                    .text("€" + d.val.toFixed(0));
                slot.append("text")
                    .attr("x", bw / 2).attr("y", 104)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px").attr("fill", "#555")
                    .text(d.label);
                slot.append("title").text(`${d.label} (${year}): €${d.val.toFixed(0)} per trip`);
            });

            drawColorBar(color, year);
        }

        function drawColorBar(scale, year) {
            cbarG.selectAll("*").remove();
            const lw = 200, lh = 10, lx = 30, ly = 30;
            const defs = cbarG.append("defs");
            const grad = defs.append("linearGradient").attr("id", "expenditure-world-trip-cbar");
            const [d0, d1] = scale.domain();
            d3.range(0, 1.0001, 0.1).forEach(t => {
                grad.append("stop")
                    .attr("offset", `${t*100}%`)
                    .attr("stop-color", scale(d0 + t * (d1 - d0)));
            });
            cbarG.append("rect")
                .attr("x", lx).attr("y", ly).attr("width", lw).attr("height", lh)
                .attr("fill", "url(#expenditure-world-trip-cbar)")
                .attr("stroke", "#666").attr("stroke-width", 0.5);
            cbarG.append("text").attr("x", lx).attr("y", ly - 4)
                .attr("font-size", "11px").attr("fill", "#333")
                .text(`Average spending per trip (€), ${year}`);
            cbarG.append("text").attr("x", lx).attr("y", ly + lh + 12)
                .attr("font-size", "11px").attr("fill", "#555")
                .text("€" + d0.toFixed(0));
            cbarG.append("text").attr("x", lx + lw).attr("y", ly + lh + 12)
                .attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#555")
                .text("€" + d1.toFixed(0));
        }

        update(years[years.length - 1]);
        select.on("change", function () { update(this.value); });
    });
})();
