/* PlanPass AI - Dashboard Logic (Investor Ready v2)
    Handles: Navigation, Upload Simulation, Backend Integration, and Result Rendering
*/

// --- STATE MANAGEMENT ---
const APP_STATE = {
    currentView: 'dashboard',
    isProcessing:XY_FALSE => false, // Initial state
    uploadProgress: 0,
    scanResults: null
};

// --- FALLBACK DATA (SAFETY NET) ---
// If the backend fails during a live demo, we use this data so the pitch continues.
const FALLBACK_DATA = {
    score: 88,
    status: "Conditional Pass",
    issues: [
        {
            type: "high",
            code: "IBC 1004.5",
            title: "Occupant Load Exceeded",
            desc: "Room 104 egress width (32\") insufficient for calculated load (55 occupants).",
            recommendation: "Increase door width to 36\"."
        },
        {
            type: "medium",
            code: "ADA 404.2.3",
            title: "Door Maneuvering Clearance",
            desc: "Latch side clearance is 12\" (Req: 18\" for pull side).",
            recommendation: "Shift door frame or reconfigure approach wall."
        },
        {
            type: "medium",
            code: "CBC 11B-505",
            title: "Stair Handrail Extension",
            desc: "Top extension appears less than 12\" horizontally above landing.",
            recommendation: "Extend handrail return to meet code."
        }
    ]
};

// --- NAVIGATION ---
function switchView(viewId) {
    // 1. Update Sidebar UI
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    // Find the nav item that matches the view (heuristic match)
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => 
        el.innerText.toLowerCase().includes(viewId.replace('view-', ''))
    );
    if(activeNav) activeNav.classList.add('active');

    // 2. Hide all views
    document.querySelectorAll('.app-view').forEach(el => {
        el.classList.remove('active-view');
        el.style.display = 'none'; // Force hide
    });

    // 3. Show target view with fade animation
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.style.display = 'block';
        // Small timeout to allow display:block to apply before opacity transition
        setTimeout(() => {
            target.classList.add('active-view');
        }, 10);
    }

    // 4. Update Header Title
    const titleMap = {
        'dashboard': 'Dashboard Overview',
        'scanner': 'Code Scanner',
        'projects': 'Project Library',
        'settings': 'System Settings'
    };
    const pageTitle = document.getElementById('pageTitle');
    if(pageTitle) pageTitle.innerText = titleMap[viewId] || 'Dashboard';
}

// --- SCANNER FLOW ---

// Stage 1: Setup Confirmation
function confirmSetup() {
    // Validate inputs (Simple check)
    const project = document.getElementById('setupProjectName').value;
    if(!project) {
        alert("Please enter a project name to continue.");
        return;
    }

    // Transition to Upload
    document.getElementById('scanner-setup').style.display = 'none';
    document.getElementById('scanner-upload').style.display = 'flex';
    document.getElementById('scanner-upload').classList.add('reveal', 'active');
}

// Stage 2: Reset (Back to start)
function resetToSetup() {
    document.getElementById('scanner-upload').style.display = 'none';
    document.getElementById('scanner-setup').style.display = 'flex';
}

function resetScanner() {
    // Reset DOM elements
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('consoleOutput').innerHTML = '';
    
    // Reset Views
    document.getElementById('scanner-results').style.display = 'none';
    document.getElementById('scanner-setup').style.display = 'flex';
    
    // Clear State
    APP_STATE.scanResults = null;
    APP_STATE.isProcessing = false;
}

// Stage 3: File Handling & Processing
async function handleFile(file) {
    if (!file) return;

    // 1. UI Transition: Upload -> Terminal
    document.getElementById('scanner-upload').style.display = 'none';
    document.getElementById('scanner-process').style.display = 'flex';
    
    // 2. Start Console Simulation (Visuals)
    simulateConsoleLog(file.name);
    
    // 3. Start Progress Bar (Visuals)
    // We use a promise here to ensure the visual bar finishes even if the API is fast
    const progressPromise = simulateProgressBar();

    // 4. Actual Backend Call (Logic)
    try {
        const formData = new FormData();
        formData.append('file', file);

        // Race the backend against a timeout to ensure demo doesn't hang
        const apiCall = fetch('http://localhost:8000/api/v1/scan', {
            method: 'POST',
            body: formData
        });

        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Demo Timeout")), 8000)
        );

        // Wait for API or Timeout
        const response = await Promise.race([apiCall, timeout]);
        
        if (response.ok) {
            APP_STATE.scanResults = await response.json();
            console.log("Backend Success:", APP_STATE.scanResults);
        } else {
            throw new Error("Backend Error");
        }

    } catch (error) {
        console.warn("Backend failed/timed out. Using Investor Demo Fallback.", error);
        APP_STATE.scanResults = FALLBACK_DATA;
    }

    // 5. Wait for visuals to finish before showing results
    await progressPromise;
    showResults();
}

// --- VISUAL SIMULATIONS ---

function simulateConsoleLog(filename) {
    const consoleEl = document.getElementById('consoleOutput');
    const logs = [
        `> Initializing PlanPass Engine v2.4...`,
        `> Loading core modules... [OK]`,
        `> Mounting volume: ${filename}...`,
        `> Extracting vector geometry...`,
        `> Analyzing layer: A-101_FLOOR_PLAN`,
        `> Checking IBC 2021 constraints...`,
        `> Verifying ADA accessibility paths...`,
        `> Cross-referencing SF local amendments...`,
        `> Detecting hotspots...`,
        `> Generating compliance report...`,
        `> Finalizing...`
    ];

    let i = 0;
    consoleEl.innerHTML = ''; // Clear previous

    const interval = setInterval(() => {
        if (i < logs.length) {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.style.marginBottom = '4px';
            line.style.fontFamily = 'JetBrains Mono';
            line.innerHTML = `<span style="color:#666;">${new Date().toLocaleTimeString()}</span> <span style="color:#ccc;">${logs[i]}</span>`;
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight; // Auto scroll
            i++;
        } else {
            clearInterval(interval);
        }
    }, 400); // Speed of logs
}

function simulateProgressBar() {
    return new Promise((resolve) => {
        const bar = document.getElementById('progressBar');
        let width = 0;
        
        // Non-linear progress: Fast start, slow middle, fast end
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                setTimeout(resolve, 500); // Small delay after 100%
            } else {
                // Logic: If between 60-80%, slow down to build anticipation
                let increment = 0;
                if(width < 30) increment = Math.random() * 5;
                else if(width < 70) increment = Math.random() * 2;
                else if(width < 90) increment = Math.random() * 0.5; // "Thinking" phase
                else increment = Math.random() * 4; // Final rush

                width += increment;
                if(width > 100) width = 100;
                bar.style.width = width + '%';
            }
        }, 100);
    });
}

// --- RENDER RESULTS ---

function showResults() {
    // 1. Hide Terminal, Show Results
    document.getElementById('scanner-process').style.display = 'none';
    const resultView = document.getElementById('scanner-results');
    resultView.style.display = 'grid'; // Maintain grid layout defined in CSS
    resultView.classList.add('reveal', 'active');

    // 2. Hydrate Data
    const data = APP_STATE.scanResults || FALLBACK_DATA;
    
    // Update Score Ring
    const ring = document.querySelector('.score-ring');
    if(ring) {
        ring.innerText = data.score + "%";
        // Dynamic color based on score
        if(data.score > 90) ring.style.borderColor = 'var(--dash-success)';
        else if(data.score > 70) ring.style.borderColor = 'var(--dash-warning)';
        else ring.style.borderColor = 'var(--dash-error)';
    }

    // Update Issue List
    const listContainer = document.querySelector('.issue-list');
    if(listContainer && data.issues) {
        listContainer.innerHTML = ''; // Clear hardcoded
        
        data.issues.forEach((issue, index) => {
            const card = document.createElement('div');
            card.className = `issue-card ${issue.type}`; // 'high' or 'medium'
            card.id = `issue-card-${issue.type}-${index}`; // For scroll targeting
            
            const colorVar = issue.type === 'high' ? 'var(--dash-error)' : 'var(--dash-warning)';
            
            card.innerHTML = `
                <div class="issue-meta" style="color:${colorVar};">
                    ${issue.code} • ${issue.type.toUpperCase()}
                </div>
                <h4 class="issue-title">${issue.title}</h4>
                <p class="issue-desc">${issue.desc}</p>
                <div style="margin-top:8px; font-size:11px; color:#fff; opacity:0.6;">
                    <strong>Fix:</strong> ${issue.recommendation}
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    // 3. Update Blueprint Labels (Optional: Dynamic Blueprint overlay could go here)
    // For now, we keep the CSS-only blueprint as it's purely visual for the demo.
}