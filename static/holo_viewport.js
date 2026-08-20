
// Universal 3D Holographic Viewport Engine with Real Full-Motion Video Streams
let currentVideos = [];
let activeScreensData = [];
let focusedScreenIndex = null;
let cameraMode = 'chair';
let currentLayout = 'curved_dome';
let holoColorCss = '#00f0ff';

let viewportEl = null;
let screensCluster = null;
let isDragging = false;
let startMouseX = 0, startMouseY = 0;
let camRotX = 0, camRotY = 0, camPosZ = 0;
let targetRotX = 0, targetRotY = 0;
let orbitAngle = 0;

function initHoloViewport() {
    console.log('[VIEWPORT] Initializing 3D Holographic Matrix Engine with Live Video Streams...');

    viewportEl = document.getElementById('css3d-viewport');
    screensCluster = document.getElementById('screens-cluster');

    setupCameraControls();
    requestAnimationFrame(renderLoop);

    // Global unlock listener on first user click to satisfy browser autoplay audio rules
    document.addEventListener('click', unlockAllVideos, { once: true });
}

function unlockAllVideos() {
    activeScreensData.forEach(sd => {
        if (sd.videoEl && sd.videoEl.paused) {
            sd.videoEl.play().catch(() => {});
        }
    });
}

function setupCameraControls() {
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('.top-hud') || e.target.closest('.right-focus-panel') || 
            e.target.closest('.bottom-cockpit-hud') || e.target.closest('.modal-backdrop') || 
            e.target.closest('.trending-bar')) {
            return;
        }
        isDragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - startMouseX;
            const dy = e.clientY - startMouseY;
            startMouseX = e.clientX;
            startMouseY = e.clientY;

            targetRotY += dx * 0.35;
            targetRotX -= dy * 0.25;
            targetRotX = Math.max(-60, Math.min(60, targetRotX));
        } else if (cameraMode === 'chair' && focusedScreenIndex === null) {
            const normX = (e.clientX / window.innerWidth - 0.5) * 2;
            const normY = (e.clientY / window.innerHeight - 0.5) * 2;
            targetRotY = normX * 12;
            targetRotX = -normY * 9;
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
        if (e.target.closest('.right-focus-panel')) return;
        camPosZ -= e.deltaY * 0.5;
        camPosZ = Math.max(-400, Math.min(300, camPosZ));
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowLeft' || e.key === 'a') targetRotY -= 6;
        if (e.key === 'ArrowRight' || e.key === 'd') targetRotY += 6;
        if (e.key === 'ArrowUp' || e.key === 'w') targetRotX += 4;
        if (e.key === 'ArrowDown' || e.key === 's') targetRotX -= 4;
        if (e.key === ' ' || e.key === 'r') resetCamera();
    });
}

function resetCamera() {
    targetRotX = 0;
    targetRotY = 0;
    camRotX = 0;
    camRotY = 0;
    camPosZ = 0;
    cameraMode = 'chair';
    focusedScreenIndex = null;
    if (viewportEl) viewportEl.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
}

function renderLoop() {
    requestAnimationFrame(renderLoop);

    if (cameraMode === 'chair' && focusedScreenIndex === null) {
        camRotX += (targetRotX - camRotX) * 0.08;
        camRotY += (targetRotY - camRotY) * 0.08;
        if (viewportEl) {
            viewportEl.style.transform = `rotateX(${camRotX}deg) rotateY(${camRotY}deg) translateZ(${camPosZ}px)`;
        }
    } else if (cameraMode === 'orbit') {
        orbitAngle = (orbitAngle + 0.35) % 360;
        if (viewportEl) {
            viewportEl.style.transform = `rotateX(12deg) rotateY(${orbitAngle}deg) translateZ(-100px)`;
        }
    }
}

// -------------------------------------------------------------
// Live Real Video 3D Screen Hydration
// -------------------------------------------------------------
function updateHoloScreens(items) {
    if (!items || items.length === 0) return;

    currentVideos = items;
    activeScreensData = items.map((item, index) => ({
        item: item,
        index: index,
        custom: { scale: 1.0, x: 0, y: 0, z: 0, rotY: 0 }
    }));

    renderLiveVideoScreens();
}

function renderLiveVideoScreens() {
    if (!screensCluster) screensCluster = document.getElementById('screens-cluster');
    if (!screensCluster) return;

    screensCluster.innerHTML = '';
    activeScreensData.forEach((screenData, index) => {
        const item = screenData.item;
        const screen = document.createElement('div');
        screen.className = 'holo-screen-3d';
        screen.dataset.index = index;

        // Real Autoplaying HTML5 Video Tag
        const video = document.createElement('video');
        video.className = 'screen-video-el';
        video.muted = true;
        video.defaultMuted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'auto');
        video.src = item.video_url;

        video.onerror = () => {
            console.warn('[VIEWPORT] Stream fallback for index', index);
            video.src = TwitterEngine.FALLBACK_BANK[index % TwitterEngine.FALLBACK_BANK.length].video_url;
            video.play().catch(() => {});
        };

        video.play().catch(e => console.log('Autoplay standby:', e));
        screenData.videoEl = video;

        // HUD Badges & Caption Overlay
        const tagBadge = document.createElement('div');
        tagBadge.className = 'screen-tag-badge';
        tagBadge.innerText = `FEED #0${index + 1}: ${item.author_handle || '@LiveFeed'}`;

        const liveBadge = document.createElement('div');
        liveBadge.className = 'screen-live-badge';
        liveBadge.innerHTML = `<span style="font-size:8px;">●</span> LIVE`;

        const captionBar = document.createElement('div');
        captionBar.className = 'screen-caption-bar';
        captionBar.innerHTML = `
            <div class="screen-caption-title">${item.text || ''}</div>
            <div class="screen-caption-meta">👁 ${item.views || '1.8M'}   ❤️ ${item.likes || '45K'}</div>
        `;

        screen.appendChild(video);
        screen.appendChild(tagBadge);
        screen.appendChild(liveBadge);
        screen.appendChild(captionBar);

        screen.addEventListener('click', (e) => {
            e.stopPropagation();
            focusOnScreen(index);
        });

        screenData.domEl = screen;
        screensCluster.appendChild(screen);
    });

    applyLayout(currentLayout);
}

function applyLayout(layout) {
    currentLayout = layout;
    const total = activeScreensData.length;
    if (!total) return;

    activeScreensData.forEach((screenData, index) => {
        if (!screenData.domEl) return;
        const c = screenData.custom;

        let baseTransform = '';
        if (layout === 'curved_dome') {
            const cols = 3;
            const col = index % cols;
            const row = Math.floor(index / cols);

            const angles = [-26, 0, 26];
            const angle = (angles[col] || 0) + c.rotY;
            const yOffset = (row === 0 ? -120 : 130) + c.y;
            const zDist = (col === 1 ? -480 : -520) + c.z;
            const xOffset = (col - 1) * 410 + c.x;

            baseTransform = `translate3d(${xOffset}px, ${yOffset}px, ${zDist}px) rotateY(${-angle}deg) scale(${c.scale})`;

        } else if (layout === 'flat_matrix') {
            const cols = 3;
            const col = index % cols;
            const row = Math.floor(index / cols);

            const xOffset = (col - 1) * 400 + c.x;
            const yOffset = (row === 0 ? -120 : 130) + c.y;
            const zDist = -450 + c.z;

            baseTransform = `translate3d(${xOffset}px, ${yOffset}px, ${zDist}px) rotateY(${c.rotY}deg) scale(${c.scale})`;

        } else if (layout === 'cylinder_ring') {
            const angle = (index / total) * 360 + c.rotY;
            baseTransform = `rotateY(${angle}deg) translateZ(${620 + c.z}px) translateY(${c.y}px) scale(${c.scale})`;
        }

        screenData.domEl.style.transform = baseTransform;
    });
}

function addCustomScreen(item) {
    activeScreensData.push({
        item: item,
        index: activeScreensData.length,
        custom: { scale: 1.0, x: 0, y: 0, z: 0, rotY: 0 }
    });
    currentVideos.push(item);
    renderLiveVideoScreens();
}

function removeScreen(index) {
    if (activeScreensData.length <= 1) return;
    activeScreensData.splice(index, 1);
    currentVideos.splice(index, 1);
    activeScreensData.forEach((s, idx) => s.index = idx);
    renderLiveVideoScreens();
    resetFocus();
}

function updateScreenCustom(index, prop, value) {
    const s = activeScreensData[index];
    if (s) {
        s.custom[prop] = parseFloat(value);
        applyLayout(currentLayout);
    }
}

function saveLayout() {
    const saved = {
        layout: currentLayout,
        screens: activeScreensData.map(s => ({
            item: s.item,
            custom: s.custom
        }))
    };
    localStorage.setItem('holo_saved_layout', JSON.stringify(saved));
    showToast('✓ Custom 3D Hologram Layout Saved!');
}

function loadSavedLayout() {
    const data = localStorage.getItem('holo_saved_layout');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            currentLayout = parsed.layout || 'curved_dome';
            activeScreensData = parsed.screens.map((s, idx) => ({
                item: s.item,
                index: idx,
                custom: s.custom || { scale: 1.0, x: 0, y: 0, z: 0, rotY: 0 }
            }));
            currentVideos = activeScreensData.map(s => s.item);
            renderLiveVideoScreens();
            showToast('✓ Restored Saved Layout Configuration');
        } catch (e) {
            console.error('Failed to load saved layout:', e);
        }
    } else {
        showToast('No saved layout found. Saving current...');
        saveLayout();
    }
}

function resetLayout() {
    activeScreensData.forEach(s => {
        s.custom = { scale: 1.0, x: 0, y: 0, z: 0, rotY: 0 };
    });
    currentLayout = 'curved_dome';
    applyLayout(currentLayout);
    showToast('Layout Reset to Curved Dome Default');
}

function focusOnScreen(index) {
    focusedScreenIndex = index;
    const s = activeScreensData[index];
    if (!s) return;

    activeScreensData.forEach((sd, idx) => {
        if (sd.videoEl) {
            sd.videoEl.muted = (idx !== index);
            if (idx === index && sd.videoEl.paused) sd.videoEl.play().catch(() => {});
        }
        if (sd.domEl) sd.domEl.classList.toggle('focused', idx === index);
    });

    if (window.onScreenFocused) {
        window.onScreenFocused(s.item, index, s.custom);
    }

    if (cameraMode === 'chair' && viewportEl) {
        const cols = 3;
        const col = index % cols;
        const angles = [-26, 0, 26];
        const rotY = -(angles[col] || 0);
        viewportEl.style.transform = `rotateX(0deg) rotateY(${rotY}deg) translateZ(160px)`;
    }
}

function resetFocus() {
    focusedScreenIndex = null;
    activeScreensData.forEach(sd => {
        if (sd.domEl) sd.domEl.classList.remove('focused');
        if (sd.videoEl) sd.videoEl.muted = true;
    });
    if (cameraMode === 'chair' && viewportEl) {
        viewportEl.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    }
    if (window.onFocusReset) {
        window.onFocusReset();
    }
}

function setCameraMode(mode) {
    cameraMode = mode;
    focusedScreenIndex = null;
    activeScreensData.forEach(sd => {
        if (sd.domEl) sd.domEl.classList.remove('focused');
    });

    if (mode === 'chair') {
        if (viewportEl) viewportEl.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    } else if (mode === 'tactical') {
        if (viewportEl) viewportEl.style.transform = `rotateX(28deg) rotateY(0deg) translateY(100px) translateZ(-150px)`;
    } else if (mode === 'free') {
        if (viewportEl) viewportEl.style.transform = `rotateX(15deg) rotateY(20deg) translateZ(-50px)`;
    }
}

function setLayout(layout) {
    applyLayout(layout);
}

function triggerGlitch(durationMs = 600) {
    activeScreensData.forEach(s => {
        if (s.domEl) {
            const rx = (Math.random() - 0.5) * 40;
            const ry = (Math.random() - 0.5) * 40;
            s.domEl.style.transform = `scale(1.08) translate(${rx}px, ${ry}px)`;
        }
    });
    setTimeout(() => {
        applyLayout(currentLayout);
    }, durationMs);
}
