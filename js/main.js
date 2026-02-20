export async function loadSharedHeader() {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('header.html');
        const html = await response.text();
        placeholder.innerHTML = html;

        const path = window.location.pathname;
        if (path.includes('researcher.html')) {
            document.getElementById('nav-researcher')?.classList.add('active');
        } else {
            document.getElementById('nav-patient')?.classList.add('active');
        }
    } catch (e) { console.error("Header error:", e); }
}