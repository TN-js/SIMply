// scripts.js

/* Layout idea:
 1. variables
 2. Functions
 3. Event listeners
 */

// 1. variables
const patientButton = document.getElementById("tab-button-patient");
const researcherButton = document.getElementById("tab-button-researcher");

const patientContent = document.querySelector(".patient-content");
const researcherContent = document.querySelector(".researcher-content");
const ACTIVE_MODE_KEY = "visgateActiveMode";

// 1.1 violin plot variables
const widthViolinPlot = 450;
const heightViolinPlot = 360;
const marginViolinPlot = { top: 20, right: 30, bottom: 40, left: 45 };

// 1.2 Line chart variables
const widthLineChart = 450;
const heightLineChart = 360;
const marginLineChart = { top: 20, right: 30, bottom: 40, left: 45 };

// 2. Functions
function showPatientOnly() {
    patientButton.style.display = "flex";

    patientContent.style.display = "flex";
    researcherContent.style.display = "none";
    localStorage.setItem(ACTIVE_MODE_KEY, "patient");
}

function renderTestViolinPlot() {
    if (!window.d3) {
        console.error("D3 did not load. The violin plot cannot render.");
        return;
    }

    const container = d3.select("#researcher-visualization");
    container.selectAll("*").remove();

    const svg = container
        .append("svg")
        .attr("width", widthViolinPlot + marginViolinPlot.left + marginViolinPlot.right)
        .attr("height", heightViolinPlot + marginViolinPlot.top + marginViolinPlot.bottom);

    const chart = svg
        .append("g")
        .attr("transform", `translate(${marginViolinPlot.left},${marginViolinPlot.top})`);

    const y = d3.scaleLinear().domain([0, 100]).range([heightViolinPlot, 0]);
    const x = d3
        .scaleBand()
        .domain(["Activity A", "Activity B", "Activity C"])
        .range([0, widthViolinPlot])
        .padding(0.2);

    chart.append("g").call(d3.axisLeft(y));
    chart
        .append("g")
        .attr("transform", `translate(0,${heightViolinPlot})`)
        .call(d3.axisBottom(x));

    const randomA = d3.randomNormal(35, 10);
    const randomB = d3.randomNormal(55, 12);
    const randomC = d3.randomNormal(75, 9);

    const dataByGroup = [
        { key: "Activity A", values: Array.from({ length: 120 }, () => Math.max(0, Math.min(100, randomA()))) },
        { key: "Activity B", values: Array.from({ length: 120 }, () => Math.max(0, Math.min(100, randomB()))) },
        { key: "Activity C", values: Array.from({ length: 120 }, () => Math.max(0, Math.min(100, randomC()))) }
    ];

    const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(50));
    const densityByGroup = dataByGroup.map((group) => ({
        key: group.key,
        density: kde(group.values)
    }));

    const maxDensity = d3.max(densityByGroup, (group) => d3.max(group.density, (point) => point[1])) || 1;
    const xNum = d3.scaleLinear().domain([-maxDensity, maxDensity]).range([0, x.bandwidth()]);

    chart
        .selectAll(".violin")
        .data(densityByGroup)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${x(d.key)},0)`)
        .append("path")
        .datum((d) => d.density)
        .attr("fill", "#3b82f6")
        .attr("opacity", 0.7)
        .attr("stroke", "#1e3a8a")
        .attr("stroke-width", 1)
        .attr(
            "d",
            d3
                .area()
                .x0((d) => xNum(-d[1]))
                .x1((d) => xNum(d[1]))
                .y((d) => y(d[0]))
                .curve(d3.curveCatmullRom)
        );
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

function showResearcherOnly() {
    researcherButton.style.display = "flex";

    researcherContent.style.display = "flex";
    patientContent.style.display = "none";
    localStorage.setItem(ACTIVE_MODE_KEY, "researcher");
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
