document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SCROLL REVEAL (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 2. MOUSE SPOTLIGHT (Cursor Glow)
    const spotlight = document.getElementById('cursorSpotlight');
    document.addEventListener('mousemove', (e) => {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
        
        // Spotlight effect on Bento Cards
        document.querySelectorAll('.spotlight').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%), var(--surface)`;
        });
    });

    // 3. COMPARISON SLIDER (Drag Logic)
    const slider = document.getElementById('comparisonSlider');
    const beforeSlide = slider.querySelector('.slide-before');
    const handle = slider.querySelector('.handle');
    let isDragging = false;

    const updateSlider = (x) => {
        const rect = slider.getBoundingClientRect();
        let pos = ((x - rect.left) / rect.width) * 100;
        
        // Clamp values between 0 and 100
        if (pos < 0) pos = 0;
        if (pos > 100) pos = 100;

        beforeSlide.style.width = `${pos}%`;
        handle.style.left = `${pos}%`;
    };

    // Mouse Events
    slider.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    slider.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    });

    // Touch Events (Mobile)
    slider.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchend', () => isDragging = false);
    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateSlider(e.touches[0].clientX);
    });

    // 4. DYNAMIC STATS COUNTER (Hero Section)
    const statNum = document.querySelector('.stat-num');
    if(statNum) {
        let base = 88.0;
        setInterval(() => {
            // Simulate small AI fluctuations
            const change = (Math.random() - 0.5) * 0.2;
            base = Math.max(85, Math.min(99, base + change));
            statNum.textContent = base.toFixed(1) + '%';
        }, 1000);
    }
});