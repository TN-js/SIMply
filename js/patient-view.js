import { loadSharedHeader } from "./main.js";

const ACTIVITY_METRICS = {
    "W": ["step_time_cv_pct_norm", "symmetry_ratio_norm", "cadence_total_steps_min_norm", "gait_index_left_pct_norm", "GSI_pct_norm"],
    "STS": ["cycle_time_cv_pct_norm", "total_duration_sec_norm", "total_peaks_norm"],
    "TUG": ["total_duration_sec_norm", "total_peaks_norm", "cadence_total_steps_min_norm"],
    "SC": ["total_peaks_norm", "total_duration_sec_norm", "cadence_total_steps_min_norm"]
};

let globalData = []; // Declare globalData globally to ensure it is accessible throughout the script
let selectedPatientId = null; // Declare selectedPatientId globally
let selectedActivity = null; // Declare selectedActivity globally
let selectedWeek = null; // Declare selectedWeek globally

async function loadPatientData(patientId) {
    const activities = ["W", "STS", "TUG", "SC"];
    let patientData = [];

    for (const activity of activities) {
        const filePath = `data/users/${patientId}/${patientId}_${activity}.csv`;
        try {
            const activityData = await d3.csv(filePath, d => ({
                ...d,
                user_id: +d.user_id,
                week: +d.week,
                composite_score_overall: +d.composite_score_overall,
                composite_score: +d.composite_score,
                GSI_pct_norm: +d.GSI_pct_norm,
                symmetry_ratio_norm: +d.symmetry_ratio_norm,
                cadence_total_steps_min_norm: +d.cadence_total_steps_min_norm,
                step_time_cv_pct_norm: +d.step_time_cv_pct_norm,
                total_duration_sec_norm: +d.total_duration_sec_norm,
                total_peaks_norm: +d.total_peaks_norm,
                cycle_time_cv_pct_norm: +d.cycle_time_cv_pct_norm,
                gait_index_left_pct_norm: +d.gait_index_left_pct_norm
            }));
            console.log(`Loaded data for ${activity}:`, activityData);
            patientData = patientData.concat(activityData);
        } catch (error) {
            console.error(`Error loading data for ${activity} from ${filePath}:`, error);
        }
    }

    console.log(`Final patient data for ID ${patientId}:`, patientData);
    return patientData;
}

async function initPatientPage() {
    await loadSharedHeader();
    const firstPatientId = 1; // Default to the first patient
    console.log("Initializing patient page...");
    globalData = await loadPatientData(firstPatientId);
    console.log("Global data initialized:", globalData);
    setupPatientSelector();
    if (globalData.length > 0) updatePatientView(firstPatientId);
}

async function setupPatientSelector() {
    try {
        // Fetch the list of user IDs by scanning the data/users directory
        const response = await fetch("data/users/");
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        let userIds = Array.from(doc.querySelectorAll("a"))
            .map(link => link.textContent)
            .filter(name => !isNaN(name)) // Filter only numeric folder names
            .map(Number); // Convert to numbers

        // Fallback to hardcoded user IDs if no user IDs are found
        if (userIds.length === 0) {
            console.warn("No user IDs found in data/users/. Falling back to hardcoded user IDs.");
            userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }

        console.log("Extracted user IDs from data/users/ directory:", userIds); // Debugging log

        const select = d3.select("#patient-select");
        select.on("change", async function() {
            const patientId = +this.value;
            selectedPatientId = patientId; // Update selectedPatientId
            globalData = await loadPatientData(patientId);
            updatePatientView(patientId);
        });

        select.selectAll("option")
            .data(userIds)
            .enter()
            .append("option")
            .text(d => `Patient ${d}`)
            .attr("value", d => d);
    } catch (error) {
        console.error("Error fetching user IDs from data/users/ directory:", error);

        // Fallback to hardcoded user IDs in case of an error
        const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        console.warn("Using hardcoded user IDs:", userIds);

        const select = d3.select("#patient-select");
        select.on("change", async function() {
            const patientId = +this.value;
            selectedPatientId = patientId; // Update selectedPatientId
            globalData = await loadPatientData(patientId);
            updatePatientView(patientId);
        });

        select.selectAll("option")
            .data(userIds)
            .enter()
            .append("option")
            .text(d => `Patient ${d}`)
            .attr("value", d => d);
    }
}

/**
 * Updates the Top Summary Frame (Score, Week, Progress Bar)
 */
function updateSummaryHeader(weekData) {
    const score = weekData.composite_score_overall;
    const color = scoreColorScale(score);

    d3.select("#week-display").text(`Week ${weekData.week}`);
    d3.select("#score-val-big")
        .text(score.toFixed(1))
        .style("color", color);
    
    d3.select("#health-bar")
        .style("width", `${score}%`)
        .style("background-color", color);
}

function updatePatientView(patientId) {
    selectedPatientId = patientId;
    selectedActivity = null; 
    const patientData = globalData.filter(d => d.user_id === patientId);
    const sortedData = [...patientData].sort((a, b) => b.week - a.week);
    
    // Default to the latest week on initial load
    const latest = sortedData[0];
    selectedWeek = latest.week;

    d3.select("#patient-name-header").text(`Patient ${patientId}`);
    updateSummaryHeader(latest);
    renderLineChart(patientData);
    renderRadarCharts(patientData, selectedWeek);
}

function renderLineChart(patientData, targetId = "#line-chart", w = 800, h = 300) {
    const weeklyData = d3.groups(patientData, d => d.week).map(g => g[1][0]).sort((a, b) => a.week - b.week);
    const margin = {top: 40, right: 40, bottom: 60, left: 80}, width = w - margin.left - margin.right, height = h - margin.top - margin.bottom;
    
    const container = d3.select(targetId);
    container.selectAll("*").remove();
    const svg = container.append("svg").attr("width", w).attr("height", h).append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(weeklyData, d => d.week)).range([0, width]);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(weeklyData.length))
       .append("text").attr("x", width/2).attr("y", 45).attr("fill", "#64748b").style("font-size", "14px").style("font-weight", "bold").text("Week");
    
    svg.append("g").call(d3.axisLeft(y))
       .append("text").attr("transform", "rotate(-90)").attr("y", -55).attr("x", -height/2).attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "14px").style("font-weight", "bold").text("Composite Score");

    const line = d3.line().x(d => x(d.week)).y(d => y(d.composite_score_overall));
    svg.append("path").datum(weeklyData).attr("fill", "none").attr("stroke", "#3b82f6").attr("stroke-width", 3).attr("d", line);

    svg.selectAll("circle").data(weeklyData).enter().append("circle")
        .attr("cx", d => x(d.week)).attr("cy", d => y(d.composite_score_overall)).attr("r", 8)
        .attr("fill", d => d.week === selectedWeek ? "#f59e0b" : "#3b82f6")
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`Week ${d.week}: <b>${d.composite_score_overall.toFixed(1)}</b>`)
                   .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0))
        .on("click", function(event, d) {
            selectedWeek = d.week;
            
            // 1. Update visual selection on chart
            d3.selectAll("circle").attr("fill", "#3b82f6");
            d3.select(this).attr("fill", "#f59e0b");

            // 2. Update the Top Summary Frame
            updateSummaryHeader(d);

            // 3. Update Radar Charts
            renderRadarCharts(patientData, d.week);
        });
}

function renderRadarCharts(patientData, week, isEnlarged = false) {
    const currentWeekData = patientData.filter(d => d.week === week);
    const radarSize = isEnlarged ? 450 : 280;
    const targetAct = isEnlarged ? "#modal-radar-act" : "#radar-activities";
    const targetMet = isEnlarged ? "#modal-radar-met" : "#radar-metrics";

    drawRadar(targetAct, [{
        values: ["W", "STS", "TUG", "SC"].map(k => ({axis: k, value: currentWeekData.find(d => d.activity === k)?.composite_score || 0}))
    }], (d) => {
        selectedActivity = d.axis;
        renderRadarCharts(patientData, week, isEnlarged);
    }, radarSize);

    const metricsContainer = d3.select(targetMet);
    if (!selectedActivity) {
        metricsContainer.selectAll("*").remove();
        metricsContainer.append("div").style("margin-top","100px").style("color","#94a3b8").text("Select an activity on the left");
        return;
    }

    const actData = currentWeekData.find(d => d.activity === selectedActivity);
    const relevantKeys = ACTIVITY_METRICS[selectedActivity] || [];
    drawRadar(targetMet, [{
        values: relevantKeys.map(k => ({
            axis: k.replace(/_norm|_pct/g, '').replace(/_/g, ' '), 
            value: (actData ? actData[k] : 0) * 100 
        }))
    }], null, radarSize);
}

function drawRadar(containerId, data, onClick = null, size = 260) {
    const cfg = { w: size, h: size, margin: {top: 70, right: 90, bottom: 70, left: 90}, levels: 5, maxValue: 100 };
    const container = d3.select(containerId);
    container.selectAll("*").remove();

    const allAxis = data[0].values.map(i => i.axis), total = allAxis.length, radius = Math.min(cfg.w/2, cfg.h/2), angleSlice = Math.PI * 2 / total;
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, cfg.maxValue]);

    const svg = container.append("svg").attr("width", cfg.w + cfg.margin.left + cfg.margin.right).attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .append("g").attr("transform", `translate(${(cfg.w/2 + cfg.margin.left)},${(cfg.h/2 + cfg.margin.top)})`);

    for(let j=0; j<cfg.levels; j++){
        let levelFactor = radius * ((j+1)/cfg.levels);
        svg.append("circle").attr("r", levelFactor).attr("fill", "none").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "4,4");
    }

    const axis = svg.selectAll(".axis").data(allAxis).enter().append("g").attr("class", "axis");
    axis.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(cfg.maxValue * 1.25) * Math.cos(angleSlice*i - Math.PI/2))
        .attr("y", (d, i) => rScale(cfg.maxValue * 1.25) * Math.sin(angleSlice*i - Math.PI/2))
        .text(d => d).style("font-size", "12px").style("font-weight", "bold").style("fill", "#475569")
        .style("cursor", onClick ? "pointer" : "default")
        .on("click", onClick ? (event, d) => onClick({axis: d}) : null);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value || 0)) // Default to 0 if value is undefined or null
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    data.forEach((d) => {
        svg.append("path").datum(d.values).attr("d", radarLine).attr("fill", "#3b82f6").attr("fill-opacity", 0.2).attr("stroke", "#3b82f6").attr("stroke-width", 2);

        svg.selectAll(".point").data(d.values).enter().append("circle").attr("r", 5)
            .attr("cx", (p, i) => rScale(p.value || 0) * Math.cos(angleSlice*i - Math.PI/2)) // Default to 0 if value is undefined or null
            .attr("cy", (p, i) => rScale(p.value || 0) * Math.sin(angleSlice*i - Math.PI/2)) // Default to 0 if value is undefined or null
            .attr("fill", "#1d4ed8")
            .on("mouseover", (event, p) => {
                tooltip.transition().duration(100).style("opacity", 1);
                tooltip.html(`${p.axis}: <b>${p.value ? p.value.toFixed(1) : 0}</b>`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
            });
    });
}

function scoreColorScale(score) {
    if (score >= 80) {
        return "#22c55e"; // Green for high scores
    } else if (score >= 50) {
        return "#facc15"; // Yellow for medium scores
    } else {
        return "#ef4444"; // Red for low scores
    }
}


document.addEventListener("DOMContentLoaded", () => {
    initPatientPage();
    // Modal enlarge handler
    window.addEventListener('openModal', async (e) => {
        const { type } = e.detail;
        const modal = document.getElementById('chart-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContainer = document.getElementById('modal-chart-container');
        modal.style.display = 'flex';
        modalTitle.textContent = type === 'line' ? 'Weekly Progress' : 'Activity Breakdown';
        modalContainer.innerHTML = '';
        if (type === 'line') {
            renderLineChart(globalData.filter(d => d.user_id === selectedPatientId), '#modal-chart-container', 1200, 500);
        } else if (type === 'radar') {
            // Create containers for enlarged radar charts
            modalContainer.innerHTML = '<div id="modal-radar-act" style="flex:1"></div><div id="modal-radar-met" style="flex:1"></div>';
            renderRadarCharts(globalData.filter(d => d.user_id === selectedPatientId), selectedWeek, true);
        }
    });
});