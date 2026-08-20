
// Universal Dual-Engine 3D Holographic Viewport (GPU Three.js WebGL + CPU CSS 3D)
let renderMode = localStorage.getItem('holo_render_mode') || 'cpu';

let currentVideos = [];
let activeScreensData = [];
let focusedScreenIndex = null;
let cameraMode = 'chair';
let currentLayout = 'curved_dome';
let holoColorHex = 0x00f0ff;
let holoColorCss = '#00f0ff';

let viewportEl = null;
let screensCluster = null;
let isDragging = false;
let startMouseX = 0, startMouseY = 0;
let camRotX = 0, camRotY = 0, camPosZ = 0;
let targetRotX = 0, targetRotY = 0;
let orbitAngle = 0;

let threeScene, threeCamera, threeRenderer, threeScreensGroup, threeParticles;
let clock = new THREE.Clock();

function initHoloViewport() {
    console.log('[VIEWPORT] Initializing Holo Viewport in mode:', renderMode);

    viewportEl = document.getElementById('css3d-viewport');
    screensCluster = document.getElementById('screens-cluster');

    setupCameraControls();

    if (typeof THREE !== 'undefined') {
        try {
            initThreeJsGpu();
        } catch (e) {
            console.warn('[VIEWPORT] WebGL GPU fallback to CPU:', e);
            renderMode = 'cpu';
        }
    }

    setRenderMode(renderMode);
    requestAnimationFrame(renderLoop);

    // Global click listener to unlock audio & video playback
    document.addEventListener('click', unlockMediaPlayback, { once: true });
}

function unlockMediaPlayback() {
    activeScreensData.forEach(sd => {
        if (sd.videoEl && sd.videoEl.paused) {
            sd.videoEl.play().catch(() => {});
        }
    });
}

function setRenderMode(mode) {
    renderMode = mode;
    localStorage.setItem('holo_render_mode', mode);

    const canvas = document.getElementById('webgl-canvas');
    const cssVp = document.getElementById('css3d-viewport');
    const toggleBtn = document.getElementById('btn-render-mode');

    if (mode === 'gpu' && typeof THREE !== 'undefined' && threeRenderer) {
        if (canvas) canvas.style.display = 'block';
        if (cssVp) cssVp.style.display = 'none';
        if (toggleBtn) toggleBtn.innerHTML = '⚡ GPU (WebGL)';
    } else {
        if (canvas) canvas.style.display = 'none';
        if (cssVp) cssVp.style.display = 'flex';
        if (toggleBtn) toggleBtn.innerHTML = '💻 CPU (CSS 3D)';
    }

    if (activeScreensData.length > 0) {
        const items = activeScreensData.map(s => s.item);
        updateHoloScreens(items);
    }
}

function setupCameraControls() {
    window.addEventListener('mousedown', (e) => {
        if (e.target.closest('.top-hud') || e.target.closest('.left-feed-panel') || 
            e.target.closest('.right-focus-panel') || e.target.closest('.bottom-cockpit-hud') || 
            e.target.closest('.modal-backdrop') || e.target.closest('.trending-bar')) {
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
        if (e.target.closest('.left-feed-panel') || e.target.closest('.right-focus-panel')) return;
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
    if (threeCamera) threeCamera.position.set(0, 1.25, 0.3);
}

function renderLoop() {
    requestAnimationFrame(renderLoop);

    if (renderMode === 'cpu') {
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
    } else if (renderMode === 'gpu' && threeRenderer) {
        const elapsedTime = clock.getElapsedTime();
        if (threeParticles) threeParticles.rotation.y = elapsedTime * 0.02;
        if (cameraMode === 'orbit') {
            const r = 5.2;
            const a = elapsedTime * 0.25;
            threeCamera.position.set(Math.sin(a) * r, 2.2, Math.cos(a) * r);
            threeCamera.lookAt(0, 1.25, 0);
        }
        threeRenderer.render(threeScene, threeCamera);
    }
}

function updateHoloScreens(videoItems) {
    if (!videoItems || videoItems.length === 0) return;

    currentVideos = videoItems;
    activeScreensData = videoItems.map((item, index) => ({
        item: item,
        index: index,
        custom: { scale: 1.0, x: 0, y: 0, z: 0, rotY: 0 }
    }));

    if (renderMode === 'cpu') {
        renderCss3dScreens();
    } else {
        renderGpuScreens();
    }
}

function renderCss3dScreens() {
    if (!screensCluster) screensCluster = document.getElementById('screens-cluster');
    if (!screensCluster) return;

    screensCluster.innerHTML = '';
    activeScreensData.forEach((screenData, index) => {
        const item = screenData.item;
        const screen = document.createElement('div');
        screen.className = 'holo-screen-3d';
        screen.dataset.index = index;

        // Guaranteed Video Playback Attributes (without crossOrigin block)
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

        // Error fallback
        video.onerror = () => {
            console.warn('[VIEWPORT] Stream fallback for index', index);
            if (typeof TwitterEngine !== 'undefined') {
                video.src = TwitterEngine.LOCAL_VIDEO_POOL[index % TwitterEngine.LOCAL_VIDEO_POOL.length];
                video.play().catch(() => {});
            }
        };

        video.play().catch(e => {
            console.log('Video autoplay waiting for gesture:', e);
        });

        screenData.videoEl = video;

        const tagBadge = document.createElement('div');
        tagBadge.className = 'screen-tag-badge';
        tagBadge.innerText = `FEED #0${index + 1}: ${item.author_handle || '@Twitter'}`;

        const liveBadge = document.createElement('div');
        liveBadge.className = 'screen-live-badge';
        liveBadge.innerHTML = `<span style="font-size:8px;">●</span> LIVE`;

        const captionBar = document.createElement('div');
        captionBar.className = 'screen-caption-bar';
        captionBar.innerHTML = `
            <div class="screen-caption-title">${item.text || ''}</div>
            <div class="screen-caption-meta">👁 ${item.views || '1.4M'}   ❤️ ${item.likes || '42K'}</div>
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
    renderCss3dScreens();
}

function removeScreen(index) {
    if (activeScreensData.length <= 1) return;
    activeScreensData.splice(index, 1);
    currentVideos.splice(index, 1);
    activeScreensData.forEach((s, idx) => s.index = idx);
    renderCss3dScreens();
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
            renderCss3dScreens();
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

    if (cameraMode === 'chair' && renderMode === 'cpu' && viewportEl) {
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

function setHoloColor(hexColor) {
    const hex = '#' + hexColor.toString(16).padStart(6, '0');
    holoColorCss = hex;
    holoColorHex = hexColor;
    document.querySelectorAll('.holo-screen-3d').forEach(s => {
        s.style.borderColor = hex;
        s.style.boxShadow = `0 0 30px ${hex}40, inset 0 0 20px ${hex}20`;
    });
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

function initThreeJsGpu() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
    threeCamera.position.set(0, 1.25, 0.3);

    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);

    const gridHelper = new THREE.GridHelper(30, 30, 0x00f0ff, 0x0a1c38);
    gridHelper.position.y = -0.5;
    threeScene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    threeScene.add(ambientLight);

    threeScreensGroup = new THREE.Group();
    threeScene.add(threeScreensGroup);
}

function renderGpuScreens() {
    if (!threeScreensGroup) return;
    while (threeScreensGroup.children.length > 0) {
        threeScreensGroup.remove(threeScreensGroup.children[0]);
    }

    activeScreensData.forEach((screenData, index) => {
        const item = screenData.item;
        const video = document.createElement('video');
        video.src = item.video_url;
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.play().catch(() => {});

        const tex = new THREE.VideoTexture(video);
        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.05), mat);

        const radius = 3.4;
        const cols = 3;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const angles = [-0.5, 0, 0.5];
        const angle = angles[col] || 0;

        mesh.position.set(Math.sin(angle) * radius, 1.35 + (row === 0 ? 0.6 : -0.6), -Math.cos(angle) * radius);
        mesh.lookAt(0, 1.25, 0.3);

        threeScreensGroup.add(mesh);
    });
}
