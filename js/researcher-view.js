/**
 * VisGate - Researcher View Logic
 */

// 1. Shared Layout Initialization
async function loadSharedHeader() {
    try {
        const response = await fetch('header.html');
        const html = await response.text();
        document.getElementById('header-placeholder').innerHTML = html;

        // Highlight the Researcher tab
        const resBtn = document.querySelector('#nav-researcher');
        if (resBtn) resBtn.classList.add('active');
    } catch (error) {
        console.error("Error loading header:", error);
    }
}

// 2. Violin Plot Logic (Extracted from your original script)
function renderTestViolinPlot() {
    if (!window.d3) {
        console.error("D3 did not load.");
        return;
    }

    const container = d3.select("#researcher-visualization");
    container.selectAll("*").remove();

    let activities = ["Walking", "Sit-to-stand", "Timed-up-go", "Stair climbing"];
    const panelData = [
        { metricName: 'Cadence', metricMax: 180 },
        { metricName: 'Metric 2', metricMax: 100 },
        { metricName: 'Metric 3', metricMax: 100 },
        { metricName: 'Metric 4', metricMax: 100 }
    ];

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
        const totalWidth = Math.max(1, cardRect.width || 300); // Fallback width
        const totalHeight = Math.max(1, cardRect.height || 400); // Fallback height
        
        const margin = {
            top: totalHeight * 0.10,
            right: totalWidth * 0.05,
            bottom: totalHeight * 0.2,
            left: totalWidth * 0.2
        };
        const plotWidth = totalWidth - margin.left - margin.right;
        const plotHeight = totalHeight - margin.top - margin.bottom;

        const svg = card
            .append("svg")
            .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const chart = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3.scaleLinear().domain([0, d.metricMax]).range([plotHeight, 0]);
        const x = d3.scaleBand().domain(activities).range([0, plotWidth]).padding(0.2);

        chart.append("g").call(d3.axisLeft(y).ticks(4));
        chart.append("g")
            .attr("transform", `translate(0,${plotHeight})`)
            .call(d3.axisBottom(x));

        // Labels
        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -plotHeight / 2)
            .attr("y", -margin.left * 0.62)
            .attr("text-anchor", "middle")
            .attr("fill", "#1e3a8a")
            .style("font-size", `${Math.max(8, Math.round(totalHeight * 0.1))}px`)
            .text(d.metricName);

        // KDE Logic
        const activityFactors = { Walking: 0.3, "Sit-to-stand": 0.45, "Timed-up-go": 0.6, "Stair climbing": 0.75 };
        const spread = Math.max(0.8, d.metricMax * 0.08);
        const kde = kernelDensityEstimator(kernelEpanechnikov(d.metricMax * 0.1), y.ticks(50));
        
        const dataByGroup = activities.map((activity, idx) => {
            const mean = d.metricMax * activityFactors[activity] + (i % 2 === 0 ? idx * 0.2 : idx * 0.4);
            const random = d3.randomNormal(mean, spread);
            const values = Array.from({ length: 120 }, () => Math.max(0, Math.min(d.metricMax, random())));
            return { key: activity, density: kde(values) };
        });

        const maxDensity = d3.max(dataByGroup, (group) => d3.max(group.density, (point) => point[1])) || 1;
        const xNum = d3.scaleLinear().domain([-maxDensity, maxDensity]).range([0, x.bandwidth()]);

        chart.selectAll(".violin")
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
            .attr("d", d3.area()
                .x0(point => xNum(-point[1]))
                .x1(point => xNum(point[1]))
                .y(point => y(point[0]))
                .curve(d3.curveCatmullRom)
            );
    });
}

// Helpers for KDE
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}
function kernelEpanechnikov(k) {
    return v => Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
}

// 3. MAIN INITIALIZATION
async function init() {
    await loadSharedHeader();
    renderTestViolinPlot();
}

document.addEventListener("DOMContentLoaded", init);