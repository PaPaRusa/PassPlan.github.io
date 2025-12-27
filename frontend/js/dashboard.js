document.addEventListener('DOMContentLoaded', () => {
    
    // --- INITIALIZATION ---
    initializeDashboard();
    setupDragAndDrop();

    // State for the setup form
    let currentSetup = {
        location: "San Francisco, CA",
        code: "IBC 2021"
    };

    // Expose functions globally
    window.switchView = switchView;
    window.simulateScan = simulateScan;
    window.resetScanner = resetScanner;
    window.handleFile = handleFile;
    window.confirmSetup = confirmSetup;
    window.resetToSetup = resetToSetup;

    // --- VIEW NAVIGATION ---
    function switchView(viewName) {
        const views = document.querySelectorAll('.app-view');
        views.forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => {
                el.classList.remove('active-view');
                el.style.display = 'none';
            }, 200);
        });

        setTimeout(() => {
            const target = document.getElementById(`view-${viewName}`);
            if (target) {
                target.style.display = 'block';
                target.offsetHeight; 
                target.classList.add('active-view');
                target.style.opacity = '1';
                
                // If switching to scanner, reset to setup if it's empty state
                if (viewName === 'scanner' && document.getElementById('scanner-results').style.display === 'none') {
                    // check if we are already in upload or processing
                    if(document.getElementById('scanner-process').style.display === 'none' && 
                       document.getElementById('scanner-upload').style.display === 'none') {
                        resetToSetup();
                    }
                }
            }
        }, 200);

        // Sidebar & Breadcrumbs Logic
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const sidebarMap = { 'dashboard': 0, 'scanner': 1, 'projects': 2 };
        const navItems = document.querySelectorAll('.app-sidebar .nav-item');
        if (navItems[sidebarMap[viewName]]) navItems[sidebarMap[viewName]].classList.add('active');

        const titleMap = { 'dashboard': 'Dashboard Overview', 'scanner': 'Automated Code Scanner', 'projects': 'Project Repository' };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.innerText = titleMap[viewName] || 'Dashboard';
        
        if (viewName === 'dashboard') updateDashboardStats();
    }

    // --- SETUP LOGIC ---
    function confirmSetup() {
        const loc = document.getElementById('setupLocation').value;
        const code = document.getElementById('setupCode').value;
        const name = document.getElementById('setupProjectName').value || "Untitled_Project";
        
        currentSetup.location = loc;
        currentSetup.code = code;
        currentSetup.name = name;

        // Transition to Upload
        document.getElementById('scanner-setup').style.display = 'none';
        document.getElementById('scanner-upload').style.display = 'flex';
    }

    function resetToSetup() {
        document.getElementById('scanner-upload').style.display = 'none';
        document.getElementById('scanner-process').style.display = 'none';
        document.getElementById('scanner-results').style.display = 'none';
        document.getElementById('scanner-setup').style.display = 'flex';
    }

    // --- DASHBOARD DATA LOGIC ---
    function updateDashboardStats() {
        const history = JSON.parse(localStorage.getItem('planpass_history') || '[]');
        const activeScansEl = document.querySelector('.dash-card:nth-child(1) div');
        if (activeScansEl) activeScansEl.textContent = history.length > 0 ? history.length : '12';

        const tableBody = document.querySelector('tbody');
        if (tableBody && history.length > 0) {
            // Clear existing rows (or manage duplicates smarter, here we just clear to prevent dupes on re-render)
            tableBody.innerHTML = '';
            
            // Add static example back if needed, or just rely on history
            // Let's rely on history + 1 static
            
            // Static
            tableBody.innerHTML += `
                <tr>
                    <td style="font-weight:500;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:24px; height:24px; background:#222; border-radius:4px; display:flex; align-items:center; justify-content:center;">📄</div>
                            SFO_Highrise_Tower_v4
                        </div>
                    </td>
                    <td><span class="status-badge success">Passing (98%)</span></td>
                    <td style="color:var(--dash-text-muted);">Today, 10:23 AM</td>
                    <td style="color:#aaa;">San Francisco, CA</td>
                    <td><a href="#" style="color:var(--dash-primary); font-size:12px;">View Report</a></td>
                </tr>`;

            const recent = history.slice(0, 3);
            recent.forEach(scan => {
                const row = document.createElement('tr');
                let statusBadge = '';
                if(scan.score >= 85) statusBadge = `<span class="status-badge success">Passing (${scan.score}%)</span>`;
                else statusBadge = `<span class="status-badge warning">Issues (${scan.score}%)</span>`;

                row.innerHTML = `
                    <td style="padding:16px 0; font-weight:500;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:24px; height:24px; background:#222; border-radius:4px; display:flex; align-items:center; justify-content:center;">📄</div>
                            ${scan.filename}
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="color:var(--dash-text-muted);">${scan.timestamp || 'Just now'}</td>
                    <td style="color:#aaa;">${scan.location || 'Local Upload'}</td>
                    <td><a href="#" style="color:var(--dash-primary); font-size:12px;">View Report</a></td>
                `;
                tableBody.insertBefore(row, tableBody.firstChild);
            });
        }
    }

    // --- SCANNER LOGIC ---
    function setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;

        ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--dash-primary)';
                dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--dash-border)';
                dropZone.style.background = 'rgba(255,255,255,0.01)';
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });
    }

    function handleFile(file) {
        if (file) {
            simulateScan(file.name);
        }
    }

    function simulateScan(filename = "project_plans_v2.pdf") {
        // 1. Switch UI to Processing
        document.getElementById('scanner-upload').style.display = 'none';
        document.getElementById('scanner-process').style.display = 'flex'; // Centered Flexbox
        
        const consoleOutput = document.getElementById('consoleOutput');
        const progressBar = document.getElementById('progressBar');
        if (!consoleOutput) return;

        // Reset
        consoleOutput.innerHTML = ''; 
        if(progressBar) progressBar.style.width = '0%';

        // Dynamic Logs based on Setup
        const location = currentSetup.location;
        const code = currentSetup.code;

        const logs = [
            { text: `> Initializing PlanPass Engine v2.4...`, delay: 0 },
            { text: `> Loading Project Context: ${currentSetup.name || 'Untitled'}`, delay: 400 },
            { text: `> Uploading: ${filename}`, delay: 800 },
            { text: `> Handshake established. Secure connection active.`, delay: 1200 },
            { text: `> [AI] Reading PDF layers (Vector Analysis)...`, delay: 1800, highlight: true },
            { text: `> [AI] Detected: Floor Plan Level 1.`, delay: 2500 },
            { text: `> Identifying structural boundaries...`, delay: 3200 },
            { text: `> Found: 14 Rooms, 12 Doors, 8 Windows.`, delay: 4000 },
            { text: `> [RAG] Fetching Municipal Codes for: ${location}...`, delay: 4800, highlight: true },
            { text: `> Loading Amendment Database: ${code}...`, delay: 5200 },
            { text: `> Cross-referencing IBC Section 1004 (Occupancy)...`, delay: 6000 },
            { text: `> Verifying ADA accessibility paths...`, delay: 6800 },
            { text: `> Calculating occupancy loads...`, delay: 7500 },
            { text: `> [AI] Analysis Complete. Generating Report...`, delay: 8200, success: true }
        ];

        let totalTime = 8500; 

        logs.forEach((log) => {
            setTimeout(() => {
                const line = document.createElement('div');
                line.style.marginBottom = "6px";
                line.style.opacity = "0";
                line.style.animation = "fadeIn 0.3s forwards";
                line.style.fontFamily = "var(--font-mono)";
                line.textContent = log.text;
                
                // Styling
                if(log.highlight) line.style.color = 'var(--dash-primary)';
                if(log.success) line.style.color = 'var(--dash-success)';
                if(log.text.includes('Loading')) line.style.color = '#888';

                consoleOutput.appendChild(line);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;

                // Update Progress Bar based on time
                if(progressBar) {
                    const progress = (log.delay / totalTime) * 100;
                    progressBar.style.width = `${progress}%`;
                }

            }, log.delay);
        });

        // Final Transition
        setTimeout(() => {
            if(progressBar) progressBar.style.width = '100%';
            setTimeout(() => {
                showResults(filename);
            }, 800);
        }, totalTime);
    }

    function showResults(filename) {
        document.getElementById('scanner-process').style.display = 'none';
        document.getElementById('scanner-results').style.display = 'grid';
        
        // Update Labels based on Setup
        document.getElementById('reportCode').innerText = currentSetup.code;
        document.getElementById('reportLoc').innerText = currentSetup.location;

        // Save scan to history
        const history = JSON.parse(localStorage.getItem('planpass_history') || '[]');
        history.unshift({
            filename: filename,
            score: 88,
            timestamp: new Date().toLocaleDateString(),
            location: currentSetup.location,
            status: 'Issues Found'
        });
        localStorage.setItem('planpass_history', JSON.stringify(history));
    }

    function resetScanner() {
        document.getElementById('scanner-results').style.display = 'none';
        document.getElementById('scanner-process').style.display = 'none';
        document.getElementById('scanner-upload').style.display = 'none';
        document.getElementById('scanner-setup').style.display = 'flex'; // Go back to start
    }

    function initializeDashboard() {
        const user = JSON.parse(localStorage.getItem('planpass_user'));
        if (user && user.name) {
            document.querySelectorAll('.user-name-display').forEach(el => {
                el.textContent = user.name;
            });
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const avatar = document.querySelector('.user-avatar');
            if(avatar) avatar.textContent = initials;
        }
        updateDashboardStats();
    }
    
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(style);
    }
});