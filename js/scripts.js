// scripts.js

/* Layout idea:
 1. Consts
 2. Functions
 3. Event listeners
 */

// 1. Consts
const patientButton = document.getElementById("tab-button-patient");
const researcherButton = document.getElementById("tab-button-researcher");

const patientContent = document.querySelector(".patient-content");
const researcherContent = document.querySelector(".researcher-content");
const ACTIVE_MODE_KEY = "visgateActiveMode";

// 2. Functions
function showPatientOnly() {
    patientButton.style.display = "flex";

    patientContent.style.display = "flex";
    researcherContent.style.display = "none";
    localStorage.setItem(ACTIVE_MODE_KEY, "patient");
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

// Restore last selected mode. Default to patient for first-time visitors.
const savedMode = localStorage.getItem(ACTIVE_MODE_KEY);
if (savedMode === "researcher") {
    showResearcherOnly();
} else {
    showPatientOnly();
}
