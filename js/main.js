/**
 * main.js
 * Universal logic for the VisGate platform.
 */

// 1. Shared Layout Initialization
async function initializeApp() {
    console.log("Initializing shared components...");
    
    // Load the shared header into the placeholder
    await loadHeader();

    // You can also initialize global features like Google Sign-In here
    // initializeGoogleSignIn();
}

async function loadHeader() {
    const placeholder = document.getElementById('header-placeholder');
    
    try {
        const response = await fetch('header.html');
        const html = await response.text();
        placeholder.innerHTML = html;

        // Determine which tab should be active
        const currentPath = window.location.pathname;

        if (currentPath.includes("researcher.html")) {
            document.getElementById("nav-researcher").classList.add("active");
        } else {
            // Default to patient if path is empty or matches patient.html
            document.getElementById("nav-patient").classList.add("active");
        }
    } catch (error) {
        console.error("Header failed to load:", error);
    }
}

loadHeader();

/**
 * Automatically detects the current page and updates the header UI
 */
function highlightActiveTab() {
    const currentPath = window.location.pathname;
    
    // Select links inside the newly injected header
    const patientLink = document.getElementById('nav-patient');
    const researcherLink = document.getElementById('nav-researcher');

    if (currentPath.includes('patient.html') && patientLink) {
        patientLink.classList.add('active');
    } else if (currentPath.includes('researcher.html') && researcherLink) {
        researcherLink.classList.add('active');
    }
}

// Start the shared initialization immediately
initializeApp();