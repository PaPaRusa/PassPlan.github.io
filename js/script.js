document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION GUARD ---
    const path = window.location.pathname;
    const user = JSON.parse(localStorage.getItem('planpass_user'));

    // 1. Protect Dashboard & Console (Demo)
    if (path.includes('dashboard.html') || path.includes('demo.html')) {
        if (!user) {
            // AUTH DISABLED FOR TESTING: Redirect logic commented out
            // window.location.href = 'signup.html';
            // return; // Stop execution
            console.log('Authentication guard disabled for testing purposes.');
        } else {
            // Update UI with User Name
            const userBadge = document.querySelector('.user-badge');
            if (userBadge) userBadge.textContent = user.name || 'Admin';
        }
    }

    // 2. Handle Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const company = document.getElementById('company').value;

            // Create User Object
            const newUser = {
                name: name,
                email: email,
                company: company,
                joined: new Date().toLocaleDateString()
            };

            // Save to Local Storage
            localStorage.setItem('planpass_user', JSON.stringify(newUser));

            // Show Success & Redirect
            const btn = signupForm.querySelector('button');
            btn.innerText = 'Creating Account...';
            btn.style.opacity = 0.7;

            setTimeout(() => {
                // Redirect to the page they were trying to visit, or dashboard by default
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }

    // --- GLOBAL: SCROLL REVEAL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- GLOBAL: CURSOR SPOTLIGHT ---
    const cursorSpotlight = document.getElementById('cursorSpotlight');
    if (cursorSpotlight) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorSpotlight.style.left = `${e.clientX}px`;
                cursorSpotlight.style.top = `${e.clientY}px`;
            });
        });
    }

    // --- GLOBAL: ACTIVE LINK HIGHLIGHTER ---
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentFile) {
            link.classList.add('active');
        }
    });

    // --- GLOBAL: BENTO CARD HOVER ---
    const spotlightCards = document.querySelectorAll('.spotlight');
    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%), var(--surface)`;
        });
        card.addEventListener('mouseleave', () => card.style.background = '');
    });

    // --- HERO STAT SIMULATION ---
    const statNum = document.querySelector('.stat-num');
    if (statNum) {
        setInterval(() => {
            let currentVal = parseFloat(statNum.textContent);
            let newVal = (currentVal + (Math.random() - 0.5) * 0.3).toFixed(1);
            if (newVal > 85.0 && newVal < 99.0) statNum.textContent = `${newVal}%`;
        }, 2000);
    }

    // --- UTILS: TOAST NOTIFICATIONS ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px;
            background: #1a1a1f; color: #fff; padding: 12px 24px;
            border-radius: 8px; border: 1px solid var(--border);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999;
            font-size: 13px; transform: translateY(20px); opacity: 0;
            transition: 0.3s;
        `;
        if(type === 'success') toast.style.borderLeft = '3px solid var(--success)';
        if(type === 'error') toast.style.borderLeft = '3px solid var(--error)';
        
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- DASHBOARD LOGIC ---
    const projectsTable = document.getElementById('projectsTable');
    if (projectsTable) { // Removed '&& user' check to allow viewing table without login
        const dateEl = document.getElementById('currentDate');
        if(dateEl) dateEl.innerText = new Date().toLocaleDateString();
        
        const history = JSON.parse(localStorage.getItem('planpass_history') || '[]');
        const totalScansEl = document.getElementById('totalScans');
        if(totalScansEl) totalScansEl.innerText = history.length;
        
        if (history.length > 0) {
            const avg = history.reduce((acc, curr) => acc + curr.score, 0) / history.length;
            const avgScoreEl = document.getElementById('avgScore');
            if(avgScoreEl) avgScoreEl.innerText = Math.round(avg) + '%';
            
            const issues = history.reduce((acc, curr) => acc + (curr.issuesData ? curr.issuesData.length : (curr.issuesCount || 0)), 0);
            const totalIssuesEl = document.getElementById('totalIssues');
            if(totalIssuesEl) totalIssuesEl.innerText = issues;
        }

        const tbody = projectsTable.querySelector('tbody');
        if(tbody) {
            if(history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#555; padding:20px;">No scans found. Go to Live Demo to create one.</td></tr>';
            } else {
                tbody.innerHTML = '';
                history.forEach(item => {
                    let statusClass = 'success';
                    if(item.score < 85) statusClass = 'processing';
                    if(item.score < 70) statusClass = 'error';
                    const row = `<tr><td style="font-weight:600; color:#fff;">${item.filename}</td><td style="color:#888;">${item.timestamp}</td><td><span class="status-chip ${statusClass}">${item.status}</span></td><td class="mono">${item.score}%</td><td><a href="demo.html" class="btn-mini" style="text-decoration:none;">View Report</a></td></tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    }

    // --- DEMO APP LOGIC ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone) {
        const getHistory = () => JSON.parse(localStorage.getItem('planpass_history') || '[]');
        const saveScanToHistory = (filename, data) => {
            const history = getHistory();
            const newEntry = {
                id: Date.now(),
                filename: filename,
                score: data.score,
                status: data.status,
                timestamp: new Date().toLocaleTimeString(),
                issuesData: data.issues.map(i => ({...i, comments: []}))
            };
            history.unshift(newEntry);
            localStorage.setItem('planpass_history', JSON.stringify(history));
            return newEntry.id;
        };

        const addCommentToHistory = (scanId, issueIndex, commentText) => {
            const history = getHistory();
            const scan = history.find(h => h.id == scanId);
            if(scan && scan.issuesData[issueIndex]) {
                if(!scan.issuesData[issueIndex].comments) scan.issuesData[issueIndex].comments = [];
                scan.issuesData[issueIndex].comments.push({ text: commentText, time: new Date().toLocaleTimeString() });
                localStorage.setItem('planpass_history', JSON.stringify(history));
                return true;
            }
            return false;
        };

        const treeItems = document.querySelectorAll('.tree-item');
        const appMain = document.querySelector('.app-main');

        if (treeItems.length > 0) {
            treeItems.forEach(item => {
                item.addEventListener('click', () => {
                    treeItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const text = item.textContent.trim();
                    if (text.includes('New_Upload')) resetToUpload();
                    else if (text.includes('History')) renderHistoryView();
                    else if (text.includes('Settings')) renderSettingsView();
                });
            });
        }

        function clearWorkspace() {
            const dynamic = document.getElementById('dynamic-view');
            if (dynamic) dynamic.remove();
            document.querySelectorAll('.stage').forEach(el => el.classList.remove('active'));
        }

        function resetToUpload() {
            clearWorkspace();
            document.getElementById('uploadStage').classList.add('active');
            const viewerCanvas = document.querySelector('.viewer-canvas');
            if(viewerCanvas) viewerCanvas.innerHTML = `<div class="bp-grid"><div class="bp-label" style="top: 50%; left: 50%;">Waiting for file...</div></div>`;
        }

        function renderHistoryView() {
            clearWorkspace();
            const historyData = getHistory();
            let listHtml = '';
            
            if (historyData.length === 0) {
                listHtml = `<div style="text-align:center; color:#555; padding:20px;">No scans recorded yet.</div>`;
            } else {
                historyData.forEach(item => {
                    let color = '#10b981'; 
                    let bg = 'rgba(16,185,129,0.2)';
                    if(item.score < 85) { color = '#f59e0b'; bg = 'rgba(245,158,11,0.2)'; }
                    if(item.score < 70) { color = '#f43f5e'; bg = 'rgba(244,63,94,0.2)'; }
                    const count = item.issuesData ? item.issuesData.length : (item.issuesCount || 0);
                    listHtml += `<div class="issue-card history-item" data-id="${item.id}" style="display:flex; justify-content:space-between; align-items:center; cursor: pointer; transition: background 0.2s;"><div><h4 style="margin:0;">${item.filename}</h4><p style="margin:0; font-size:11px;">${item.timestamp} • ${count} Issues</p></div><div style="background:${bg}; color:${color}; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:700;">${item.status} (${item.score}%)</div></div>`;
                });
            }

            const view = document.createElement('div');
            view.id = 'dynamic-view';
            view.className = 'stage active full-stage center-stage';
            view.innerHTML = `<div class="analysis-panel" style="width: 100%; max-width: 800px; height: auto; border: 1px solid var(--border); border-radius: 12px;"><div class="score-header" style="border:none;"><h3>Scan History (Local)</h3><p style="font-size:11px; margin:0;">Click item to view results</p></div><div class="issues-list" style="max-height: 500px; overflow-y:auto;">${listHtml}</div></div>`;
            
            view.querySelectorAll('.history-item').forEach(card => {
                card.addEventListener('click', () => {
                    const id = card.getAttribute('data-id');
                    const entry = historyData.find(e => e.id == id);
                    if (entry && entry.issuesData) {
                        const data = { score: entry.score, status: entry.status, issues: entry.issuesData };
                        const nameDisplay = document.getElementById('fileNameDisplay');
                        if (nameDisplay) nameDisplay.textContent = entry.filename;
                        if(document.getElementById('dynamic-view')) document.getElementById('dynamic-view').remove();
                        document.getElementById('resultStage').classList.add('active');
                        renderAnalysis(data, entry.id); 
                    } else { showToast("Detailed report not available.", "error"); }
                });
                card.addEventListener('mouseenter', () => card.style.background = 'rgba(255,255,255,0.05)');
                card.addEventListener('mouseleave', () => card.style.background = 'rgba(255,255,255,0.03)');
            });
            appMain.appendChild(view);
        }

        function renderSettingsView() {
            clearWorkspace();
            const view = document.createElement('div');
            view.id = 'dynamic-view';
            view.className = 'stage active full-stage center-stage';
            view.innerHTML = `<div class="analysis-panel" style="width: 100%; max-width: 600px; height: auto; border: 1px solid var(--border); border-radius: 12px;"><div class="score-header"><h3>Settings</h3></div><div style="display:flex; flex-direction:column; gap:20px; color: #ccc; font-size: 13px;"><label style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.02); border-radius:6px;"><span>Jurisdiction Auto-Detect</span><input type="checkbox" checked style="accent-color: var(--primary);"></label><button class="btn btn-primary" id="saveSettingsBtn" style="margin-top:10px;">Save Changes</button></div></div>`;
            appMain.appendChild(view);
            document.getElementById('saveSettingsBtn').addEventListener('click', () => showToast("Preferences updated successfully", "success"));
        }

        // --- FILE HANDLING ---
        ['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }));
        ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); }));

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFile(files[0]);
        });
        
        if(fileInput) fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
        });

        async function handleFile(file) {
            // PDF Preview
            const viewerCanvas = document.querySelector('.viewer-canvas');
            if(viewerCanvas && file.type === 'application/pdf') {
                viewerCanvas.innerHTML = `<iframe src="${URL.createObjectURL(file)}" width="100%" height="100%" style="border:none;"></iframe>`;
            } else if (viewerCanvas) {
                viewerCanvas.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#888;">Preview not available</div>`;
            }

            // UI Updates
            const nameDisplay = document.getElementById('fileNameDisplay');
            if (nameDisplay) nameDisplay.textContent = file.name;
            document.getElementById('uploadStage').classList.remove('active');
            document.getElementById('processStage').classList.add('active');

            // Progress Bar & Logs
            const bar = document.getElementById('progressBar');
            if(bar) { bar.style.width = "0%"; setTimeout(() => bar.style.width = "50%", 500); }
            
            const consoleOutput = document.getElementById('consoleOutput');
            if(consoleOutput) consoleOutput.innerHTML = '';
            
            const logs = [`Uploading ${file.name}...`, "Server received file...", "Analysing geometry...", "Running compliance checks..."];
            logs.forEach((log, i) => setTimeout(() => {
                const div = document.createElement('div');
                div.innerText = `> ${log}`;
                div.style.animation = "typeIn 0.2s forwards";
                if(consoleOutput) { consoleOutput.appendChild(div); consoleOutput.scrollTop = consoleOutput.scrollHeight; }
            }, i * 800));

            // Backend Call
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:8000/api/v1/scan', { method: 'POST', body: formData });
                if (!response.ok) throw new Error("Server Error");
                const data = await response.json();
                
                if(bar) bar.style.width = "100%";
                
                // SAVE TO HISTORY
                saveScanToHistory(file.name, data);
                showToast("Scan Complete", "success");

                setTimeout(() => {
                    renderAnalysis(data);
                    document.getElementById('processStage').classList.remove('active');
                    document.getElementById('resultStage').classList.add('active');
                }, 1000);

            } catch (error) {
                showToast("Backend Offline. Using simulation.", "warning");
                // Fallback Mock
                const mockData = {
                    score: 92, status: "Conditional Pass",
                    issues: [{ type: 'high', code: 'IBC 1004.5', title: 'Occupant Load', desc: 'Calculated load exceeds capacity.' }]
                };
                saveScanToHistory(file.name, mockData); // Even mock data saves to history now
                
                if(bar) bar.style.width = "100%";
                setTimeout(() => {
                    renderAnalysis(mockData);
                    document.getElementById('processStage').classList.remove('active');
                    document.getElementById('resultStage').classList.add('active');
                }, 2000);
            }
        }

        function renderAnalysis(data) {
            // ... (Same render logic as before) ...
            const scoreCircle = document.querySelector('.score-circle');
            const scoreTitle = document.querySelector('.score-header h3');
            const scoreSub = document.querySelector('.score-header p');
            const issuesList = document.querySelector('.issues-list');

            if (scoreCircle) scoreCircle.textContent = `${data.score}%`;
            if (scoreTitle) {
                scoreTitle.textContent = data.status;
                if (data.score > 85) scoreTitle.style.color = "var(--success)";
                else if (data.score > 70) scoreTitle.style.color = "var(--warning)";
                else scoreTitle.style.color = "var(--error)";
            }
            if (scoreSub) scoreSub.textContent = `${data.issues.length} Issues Detected`;

            if (issuesList) {
                issuesList.innerHTML = ''; 
                data.issues.forEach(issue => {
                    const card = document.createElement('div');
                    card.className = `issue-card ${issue.type}`;
                    if (issue.type === 'high') card.style.borderLeft = '3px solid var(--error)';
                    if (issue.type === 'medium') card.style.borderLeft = '3px solid var(--warning)';
                    if (issue.type === 'low') card.style.borderLeft = '3px solid var(--success)';
                    card.innerHTML = `<div class="issue-tag">${issue.title.toUpperCase()} • ${issue.code}</div><h4>${issue.title}</h4><p>${issue.desc}</p>`;
                    issuesList.appendChild(card);
                });
            }
        }
    }

    // --- SLIDER LOGIC ---
    const slider = document.getElementById('comparisonSlider');
    if (slider) {
        const beforeSlide = slider.querySelector('.slide-before');
        const handle = slider.querySelector('.handle');
        let isDragging = false;
        const updateSlider = (clientX) => {
            const rect = slider.getBoundingClientRect();
            let pos = ((clientX - rect.left) / rect.width) * 100;
            if (pos < 0) pos = 0; if (pos > 100) pos = 100;
            if (beforeSlide) beforeSlide.style.width = `${pos}%`;
            if (handle) handle.style.left = `${pos}%`;
        };
        slider.addEventListener('mousedown', (e) => { isDragging = true; e.preventDefault(); });
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });
        slider.addEventListener('touchstart', (e) => { isDragging = true; }, { passive: true });
        window.addEventListener('touchend', () => isDragging = false);
        window.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e.touches[0].clientX); }, { passive: false });
    }
});