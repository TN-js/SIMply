/**
 * PROJECT: VisGate
 * FILE: patient-view.js
 * DESCRIPTION: Loads the shared header and renders patient-specific D3 charts.
 */

// 1. CHART CONFIGURATION
const CHART_CONFIG = {
    margin: { top: 40, right: 30, bottom: 60, left: 60 },
    width: 800,
    height: 450
};

/**
 * CORE FUNCTION: Injects the shared header.html into the page
 */
async function loadSharedHeader() {
    try {
        const response = await fetch('header.html');
        if (!response.ok) throw new Error('Failed to fetch header');
        
        const html = await response.text();
        document.getElementById('header-placeholder').innerHTML = html;

        // Highlight the "Patient" tab since we are on the patient page
        const patientBtn = document.querySelector('#nav-patient');
        if (patientBtn) patientBtn.classList.add('active');
        
        console.log("Header loaded successfully.");
    } catch (error) {
        console.error("Header Error:", error);
    }
}

/**
 * D3 FUNCTION: Renders the Patient visualization
 */
function renderPatientChart(data) {
    const container = d3.select("#patient-visualization");
    container.selectAll("*").remove(); // Clear previous

    const innerWidth = CHART_CONFIG.width - CHART_CONFIG.margin.left - CHART_CONFIG.margin.right;
    const innerHeight = CHART_CONFIG.height - CHART_CONFIG.margin.top - CHART_CONFIG.margin.bottom;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${CHART_CONFIG.width} ${CHART_CONFIG.height}`)
        .append("g")
        .attr("transform", `translate(${CHART_CONFIG.margin.left},${CHART_CONFIG.margin.top})`);

    // --- Placeholder D3 Logic ---
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    svg.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));
    svg.append("g").call(d3.axisLeft(yScale));
    
    console.log("D3 Chart rendered.");
}

/**
 * INITIALIZATION: Runs everything in order
 */
async function init() {
    // 1. Load the UI components first
    await loadSharedHeader();

    // 2. Fetch data and render charts
    const sampleData = [{x: 1, y: 10}, {x: 5, y: 50}, {x: 10, y: 80}];
    renderPatientChart(sampleData);
}

// Fire when the DOM is ready
document.addEventListener("DOMContentLoaded", init);