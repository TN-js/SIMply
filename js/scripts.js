// scripts.js

// Data
let cadenceDataset = {
    "Walking": [100, 105, 110, 115, 120],
    "Sit-to-stand": [50, 55, 60, 65, 70],
    "Timed-up-go": [30, 35, 40, 45, 50],
    "Stair climbing": [80, 85, 90, 95, 100]
}

// 1. variables
const patientButton = document.getElementById("tab-button-patient");
const researcherButton = document.getElementById("tab-button-researcher");

const patientContent = document.querySelector(".patient-content");
const researcherContent = document.querySelector(".researcher-content");
const ACTIVE_MODE_KEY = "visgateActiveMode";

// 1.2 Line chart variables
const widthLineChart = 450;
const heightLineChart = 360;
const marginLineChart = { top: 20, right: 30, bottom: 40, left: 45 };

// 2. Functions
function showPatientOnly() {
  patientButton.classList.add("active");
  researcherButton.classList.remove("active");
  patientContent.style.display = "flex";
  researcherContent.style.display = "none";
  localStorage.setItem(ACTIVE_MODE_KEY, "patient");
}

function showResearcherOnly() {
  researcherButton.classList.add("active");
  patientButton.classList.remove("active");
  researcherContent.style.display = "flex";
  patientContent.style.display = "none";
  localStorage.setItem(ACTIVE_MODE_KEY, "researcher");
}

function renderTestViolinPlot() {
    if (!window.d3) {
        console.error("D3 did not load. The violin plot cannot render.");
        return;
    }

    const container = d3.select("#researcher-visualization");
    container.selectAll("*").remove();

    let activities = ["Walking", "Sit-to-stand", "Timed-up-go", "Stair climbing"];

    const panelData = [{
        metricName: 'Cadence',
        metricMax: 180
    }, {
        metricName: 'Metric 2',
        metricMax: 100
    }, {
        metricName: 'Metric 3',
        metricMax: 100
    }, {
        metricName: 'Metric 4',
        metricMax: 100
    }];

    container.classed("violin-grid", true);

    const cards = container
        .selectAll(".violin-card")
        .data(panelData)
        .enter()
        .append("div")
        .attr("class", "violin-card");

    cards.each(function(d, i) {
        const card = d3.select(this);
        const cardRect = this.getBoundingClientRect();
        const totalWidth = Math.max(1, cardRect.width);
        const totalHeight = Math.max(1, cardRect.height);
        const margin = {
            top: totalHeight * 0.10,
            right: totalWidth * 0.05,
            bottom: totalHeight * 0.2,
            left: totalWidth * 0.2
        };
        const plotWidth = Math.max(1, totalWidth - margin.left - margin.right);
        const plotHeight = Math.max(1, totalHeight - margin.top - margin.bottom);

        const svg = card
            .append("svg")
            .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
            .attr("preserveAspectRatio", "none");

        const chart = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3.scaleLinear().domain([0, d.metricMax]).range([plotHeight, 0]);
        const x = d3
            .scaleBand()
            .domain(activities)
            .range([0, plotWidth])
            .padding(0.2);

        chart.append("g").call(d3.axisLeft(y).ticks(4));
        chart
            .append("g")
            .attr("transform", `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x));
        chart
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -plotHeight / 2)
            .attr("y", -margin.left * 0.62)
            .attr("text-anchor", "middle")
            .attr("fill", "#1e3a8a")
            .style("font-size", `${Math.max(8, Math.round(totalHeight * 0.1))}px`)
            .text(d.metricName);

        const activityFactors = {
            Walking: 0.3,
            "Sit-to-stand": 0.45,
            "Timed-up-go": 0.6,
            "Stair climbing": 0.75
        };
        const spread = Math.max(0.8, d.metricMax * 0.08);
        const kde = kernelDensityEstimator(kernelEpanechnikov(d.metricMax * 0.1), y.ticks(50));
        const dataByGroup = activities.map((activity, idx) => {
            const mean = d.metricMax * activityFactors[activity] + (i % 2 === 0 ? idx * 0.2 : idx * 0.4);
            const random = d3.randomNormal(mean, spread);
            const values = Array.from(
                { length: 120 },
                () => Math.max(0, Math.min(d.metricMax, random()))
            );
            return { key: activity, density: kde(values) };
        });

        const maxDensity = d3.max(dataByGroup, (group) => d3.max(group.density, (point) => point[1])) || 1;
        const xNum = d3.scaleLinear().domain([-maxDensity, maxDensity]).range([0, x.bandwidth()]);

        chart
            .selectAll(".violin")
            .data(dataByGroup)
            .enter()
            .append("g")
            .attr("transform", (group) => `translate(${x(group.key)},0)`)
            .append("path")
            .datum((group) => group.density)
            .attr("fill", "#3b82f6")
            .attr("opacity", 0.7)
            .attr("stroke", "#1e3a8a")
            .attr("stroke-width", 1)
            .attr(
                "d",
                d3
                    .area()
                    .x0((point) => xNum(-point[1]))
                    .x1((point) => xNum(point[1]))
                    .y((point) => y(point[0]))
                    .curve(d3.curveCatmullRom)
            );

        chart
            .selectAll(".tick text")
            .style("font-size", `${Math.max(8, Math.round(totalHeight * 0.08))}px`);
    });
}

function renderTestLineChart() {
    if (!window.d3) {
        console.error("D3 did not load. The violin plot cannot render.");
        return;
    }

    const container = d3.select("#patient-visualization");
    container.selectAll("*").remove();

    const svg = container
        .append("svg")
        .attr("width", widthLineChart + marginLineChart.left + marginLineChart.right)
        .attr("height", heightLineChart + marginLineChart.top + marginLineChart.bottom);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${marginLineChart.left},${marginLineChart.top})`);

    const y = d3
        .scaleLinear()
        .range([heightLineChart, 0]);
    const x = d3
        .scaleLinear()
        .range([0, widthLineChart])

    const dataset = [
        {session:1, value:-4},
        {session:2, value:-4},
        {session:3, value:-3},
        {session:4, value:-3},
        {session:5, value:-2},
        {session:6, value:-2},
        {session:7, value:-1},
        {session:8, value:-1},
        {session:9, value:-1},
        {session:10, value:-0}
    ]; // todo: Replace const dataset with real data

    x.domain(d3.extent(dataset, d => d.session))
    y.domain([d3.min(dataset, d => d.value), 0])

    chart.append("g").call(d3.axisLeft(y));
    chart
        .append("g")
        .attr("transform", `translate(0,${heightLineChart})`)
        .call(d3.axisBottom(x));

    const line = d3.line()
        .x(d=>x(d.session))
        .y(d=>y(d.value))
    
    chart.append("path")
        .datum(dataset)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1)
        .attr("d", line)

    chart.selectAll("myCircles")
        .data(dataset)
        .enter()
        .append("circle") // enter append
            .attr("class", "session-value")
            .attr("r", "3") // radius
            .attr("cx", function(d) { return x(d.session) })   // center x passing through your xScale
            .attr("cy", function(d) { return y(d.value)})   // center y through your yScale
    // todo: Add highlighting of points and add data windows
}


// 2 functions needed for kernel density estimate
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
    };
}
function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

// 3. Event listeners
patientButton.addEventListener("click", showPatientOnly);
researcherButton.addEventListener("click", showResearcherOnly);
renderTestViolinPlot();
renderTestLineChart();

// Restore last selected mode. Default to patient for first-time visitors.
const savedMode = localStorage.getItem(ACTIVE_MODE_KEY);
if (savedMode === "researcher") {
    showResearcherOnly();
} else {
    showPatientOnly();
}
