/* figure 5: electricity access over time in selected countries (line chart) */
(function () {
  const years = d3.range(2000, 2020);
  const defaultCountries = ["Cambodia", "Kenya", "Bangladesh", "Chad"];

  // 8 colors, defined in css/style.css. A country keeps its color until it's removed.
  const colors = d3.range(1, 9).map((i) => `var(--series-${i})`);
  const worldColor = "var(--reference)";

  let dataByCountry = new Map();
  let world = [];
  let selected = []; // [{ name, color }]
  let showWorld = true;

  // Chart size.
  const width = 900;
  const height = 440;
  const margin = { top: 12, right: 150, bottom: 36, left: 44 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const svg = d3.select("#fig5-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("aria-label", "Line chart of electricity access by year, 2000–2019");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales.
  const x = d3.scaleLinear().domain([2000, 2019]).range([0, w]);
  const y = d3.scaleLinear().domain([0, 100]).range([h, 0]);

  // Gridlines and axes.
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "%"))
    .call((axis) => axis.select(".domain").remove());

  // Groups for the lines, end labels, and hover marks.
  const linesGroup = g.append("g");
  const labelsGroup = g.append("g");
  const crosshair = g.append("line")
    .attr("class", "crosshair")
    .attr("y1", 0)
    .attr("y2", h)
    .style("display", "none");
  const dotsGroup = g.append("g");

  const tooltip = d3.select("#fig5-tooltip");

  // Missing years (access = null) leave a gap in the line.
  const line = d3.line()
    .defined((d) => d.access != null)
    .x((d) => x(d.year))
    .y((d) => y(d.access));

  // Load data.
  Promise.all([
    d3.csv("data/electricity_access.csv", d3.autoType),
    d3.csv("data/electricity_access_world.csv", d3.autoType),
  ]).then(([rows, worldRows]) => {
    for (const [country, countryRows] of d3.group(rows, (d) => d.country)) {
      dataByCountry.set(country, oneValuePerYear(countryRows));
    }
    world = oneValuePerYear(worldRows);

    // Country names for the search box.
    d3.select("#fig5-country-list")
      .selectAll("option")
      .data([...dataByCountry.keys()].sort())
      .join("option")
      .attr("value", (d) => d);

    reset();
  });

  // Turn a country's rows into 20 points, one per year.
  function oneValuePerYear(rows) {
    const byYear = new Map(rows.map((d) => [d.year, d.access]));
    return years.map((year) => ({ year, access: byYear.get(year) ?? null }));
  }

  // Returns an error message, or "" if it worked.
  function addCountry(name) {
    if (!dataByCountry.has(name)) return `"${name}" isn't in the dataset.`;
    if (selected.some((s) => s.name === name)) return `${name} is already shown.`;
    if (selected.length === colors.length) return `Up to ${colors.length} countries at a time.`;

    const color = colors.find((c) => !selected.some((s) => s.color === c));
    selected.push({ name, color });
    return "";
  }

  function reset() {
    selected = [];
    defaultCountries.forEach(addCountry);
    showWorld = true;
    d3.select("#fig5-world").property("checked", true);
    d3.select("#fig5-status").text("");
    update();
  }

  function currentLines() {
    const lines = selected.map((s) => ({
      name: s.name,
      color: s.color,
      values: dataByCountry.get(s.name),
    }));
    if (showWorld) {
      lines.push({ name: "World average", color: worldColor, values: world, isWorld: true });
    }
    return lines;
  }

  // Redraw everything that depends on which countries are selected.
  function update() {
    const lines = currentLines();

    // Lines.
    linesGroup.selectAll("path")
      .data(lines, (d) => d.name)
      .join("path")
      .attr("class", (d) => (d.isWorld ? "line world" : "line"))
      .attr("stroke", (d) => d.color)
      .attr("d", (d) => line(d.values));

    // Label at the end of each line, e.g. "93% Cambodia".
    const labels = lines.map((d) => {
      const last = d.values.filter((v) => v.access != null).pop();
      return { name: d.name, access: last.access, y: y(last.access) };
    });

    // Push labels apart so they don't overlap (at least 16px), then back up if they went below the chart.
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) {
      labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 16);
    }
    const overflow = labels.length ? labels[labels.length - 1].y - h : 0;
    if (overflow > 0) labels.forEach((l) => (l.y -= overflow));

    labelsGroup.selectAll("text")
      .data(labels, (d) => d.name)
      .join("text")
      .attr("class", "end-label")
      .attr("x", w + 8)
      .attr("y", (d) => d.y)
      .attr("dy", "0.35em")
      .html("")
      .call((text) => {
        text.append("tspan").attr("class", "val").text((d) => Math.round(d.access) + "% ");
        text.append("tspan").text((d) => d.name);
      });

    // Legend chips with a × to remove each line.
    const items = d3.select("#fig5-legend")
      .selectAll("li")
      .data(lines, (d) => d.name)
      .join("li")
      .order()
      .html("");

    items.append("span")
      .attr("class", (d) => (d.isWorld ? "key dashed" : "key"))
      .style("border-top-color", (d) => d.color);

    items.append("span").text((d) => d.name);

    items.append("button")
      .attr("type", "button")
      .attr("aria-label", (d) => `Remove ${d.name}`)
      .text("×")
      .on("click", (event, d) => {
        if (d.isWorld) {
          showWorld = false;
          d3.select("#fig5-world").property("checked", false);
        } else {
          selected = selected.filter((s) => s.name !== d.name);
        }
        update();
      });

    // Data table: 2000, 2010, 2019, and the change.
    const percent = (v) => (v == null ? "—" : v.toFixed(1) + "%");

    const tableRows = lines.map((d) => {
      const start = d.values[0].access;
      const middle = d.values[10].access;
      const end = d.values[19].access;
      const change = start != null && end != null ? d3.format("+.1f")(end - start) : "—";
      return [d.name, percent(start), percent(middle), percent(end), change];
    });

    d3.select("#fig5-table-body")
      .selectAll("tr")
      .data(tableRows)
      .join("tr")
      .selectAll("td")
      .data((row) => row)
      .join("td")
      .text((d) => d);
  }

  // Controls.
  function addTypedCountry() {
    const input = d3.select("#fig5-country-input");
    const typed = input.property("value").trim();
    if (!typed) return;

    // Match any capitalization, e.g. "kenya" -> "Kenya".
    const name = [...dataByCountry.keys()].find((c) => c.toLowerCase() === typed.toLowerCase()) ?? typed;
    const error = addCountry(name);

    d3.select("#fig5-status").text(error);
    if (!error) input.property("value", "");
    update();
  }

  d3.select("#fig5-add").on("click", addTypedCountry);
  d3.select("#fig5-country-input").on("keydown", (event) => {
    if (event.key === "Enter") addTypedCountry();
  });

  d3.select("#fig5-world").on("change", (event) => {
    showWorld = event.target.checked;
    update();
  });

  d3.select("#fig5-reset").on("click", reset);

  // Hover: vertical line at the nearest year, a dot on each line, and every value in the tooltip.
  g.append("rect")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const year = Math.round(x.invert(d3.pointer(event)[0]));
      const points = currentLines()
        .map((d) => ({ ...d, access: d.values[year - 2000].access }))
        .sort((a, b) => (b.access ?? -1) - (a.access ?? -1));

      crosshair
        .style("display", null)
        .attr("x1", x(year))
        .attr("x2", x(year));

      dotsGroup.selectAll("circle")
        .data(points.filter((p) => p.access != null), (d) => d.name)
        .join("circle")
        .attr("class", "hover-dot")
        .attr("r", 4.5)
        .attr("cx", x(year))
        .attr("cy", (d) => y(d.access))
        .attr("fill", (d) => d.color);

      const text = points
        .map((p) => `${p.access == null ? "no data" : p.access.toFixed(1) + "%"}  ${p.name}`)
        .join("\n");

      tooltip
        .property("hidden", false)
        .text(`${year}\n${text}`);

      // Keep the tooltip on screen: flip to the left of the mouse near the right edge.
      const box = tooltip.node().getBoundingClientRect();
      const left = event.clientX + 12 + box.width > window.innerWidth
        ? event.clientX - 12 - box.width
        : event.clientX + 12;

      tooltip
        .style("left", left + "px")
        .style("top", event.clientY + 12 + "px");
    })
    .on("mouseleave", () => {
      crosshair.style("display", "none");
      dotsGroup.selectAll("circle").remove();
      tooltip.property("hidden", true);
    });
})();
