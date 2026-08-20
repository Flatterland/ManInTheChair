
// Main Application Controller & HUD Orchestrator (Live Real-Time Streaming Video)
let currentSelectedScreenIdx = null;

document.addEventListener('DOMContentLoaded', async () => {
    setupUI();
    initHoloViewport();
    // Initialize with real SpaceX & Space video streams
    await executeSearch('spacex');
});

function setupUI() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const addScreenBtn = document.getElementById('btn-add-screen');
    const addModal = document.getElementById('add-screen-modal');
    const addSubmitBtn = document.getElementById('modal-add-btn');
    const addCancelBtn = document.getElementById('modal-cancel-btn');
    const addInput = document.getElementById('modal-screen-topic');
    const saveLayoutBtn = document.getElementById('btn-save-layout');
    const loadLayoutBtn = document.getElementById('btn-load-layout');
    const resetLayoutBtn = document.getElementById('btn-reset-layout');
    const resetCamBtn = document.getElementById('btn-reset-cam');

    // Search Submit
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput ? searchInput.value.trim() : '';
            if (query) await executeSearch(query);
        });
    }

    // Trending Pills
    document.querySelectorAll('.trend-pill').forEach(pill => {
        pill.addEventListener('click', async (e) => {
            e.preventDefault();
            document.querySelectorAll('.trend-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const topic = pill.dataset.topic;
            if (searchInput) searchInput.value = topic;
            await executeSearch(topic);
        });
    });

    // Add Screen Modal
    if (addScreenBtn && addModal) {
        addScreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addModal.style.display = 'flex';
            if (addInput) addInput.focus();
        });
    }

    if (addCancelBtn && addModal) {
        addCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addModal.style.display = 'none';
        });
    }

    if (addSubmitBtn && addModal) {
        addSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const inputVal = addInput ? addInput.value.trim() : 'space';
            addModal.style.display = 'none';
            if (addInput) addInput.value = '';
            
            showToast(`Deploying Screen: "${inputVal}"...`);
            const matched = await TwitterEngine.search(inputVal, 1);
            if (matched && matched.length > 0) {
                addCustomScreen(matched[0]);
                showToast(`✓ Screen #${activeScreensData.length} Added to 3D Matrix!`);
            }
        });
    }

    // Layout & Camera Controls
    if (saveLayoutBtn) saveLayoutBtn.addEventListener('click', () => saveLayout());
    if (loadLayoutBtn) loadLayoutBtn.addEventListener('click', () => loadSavedLayout());
    if (resetLayoutBtn) resetLayoutBtn.addEventListener('click', () => resetLayout());
    if (resetCamBtn) resetCamBtn.addEventListener('click', () => {
        resetCamera();
        showToast('Camera Centered in Cockpit POV');
    });

    // Layout Pickers
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const layout = btn.dataset.layout;
            setLayout(layout);
            showToast(`Array: ${layout.replace('_', ' ').toUpperCase()}`);
        });
    });

    // Camera Mode Selectors
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.cam;
            setCameraMode(mode);
            showToast(`Camera: ${mode.toUpperCase()} MODE`);
        });
    });

    // Screen Adjuster Sliders
    setupAdjusterSliders();

    // Callbacks from 3D Viewport
    window.onScreenFocused = (item, index, custom) => {
        currentSelectedScreenIdx = index;
        updateFocusPanel(item, index, custom);
    };

    window.onFocusReset = () => {
        const p = document.getElementById('focus-panel');
        if (p) p.style.display = 'none';
    };

    const closeFocusBtn = document.getElementById('close-focus-btn');
    if (closeFocusBtn) closeFocusBtn.addEventListener('click', () => resetFocus());
}

function setupAdjusterSliders() {
    const scaleSlider = document.getElementById('slider-scale');
    const posXSlider = document.getElementById('slider-pos-x');
    const posYSlider = document.getElementById('slider-pos-y');
    const posZSlider = document.getElementById('slider-pos-z');
    const rotYSlider = document.getElementById('slider-rot-y');
    const removeBtn = document.getElementById('btn-remove-screen');

    if (scaleSlider) scaleSlider.addEventListener('input', (e) => {
        if (currentSelectedScreenIdx !== null) updateScreenCustom(currentSelectedScreenIdx, 'scale', e.target.value);
    });
    if (posXSlider) posXSlider.addEventListener('input', (e) => {
        if (currentSelectedScreenIdx !== null) updateScreenCustom(currentSelectedScreenIdx, 'x', e.target.value);
    });
    if (posYSlider) posYSlider.addEventListener('input', (e) => {
        if (currentSelectedScreenIdx !== null) updateScreenCustom(currentSelectedScreenIdx, 'y', e.target.value);
    });
    if (posZSlider) posZSlider.addEventListener('input', (e) => {
        if (currentSelectedScreenIdx !== null) updateScreenCustom(currentSelectedScreenIdx, 'z', e.target.value);
    });
    if (rotYSlider) rotYSlider.addEventListener('input', (e) => {
        if (currentSelectedScreenIdx !== null) updateScreenCustom(currentSelectedScreenIdx, 'rotY', e.target.value);
    });

    if (removeBtn) removeBtn.addEventListener('click', () => {
        if (currentSelectedScreenIdx !== null) {
            removeScreen(currentSelectedScreenIdx);
            showToast('Screen Removed from Matrix');
        }
    });
}

async function executeSearch(query) {
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.innerText = 'SCANNING...';
    triggerGlitch(500);
    showToast(`📡 SCANNING LIVE REPOSITORIES FOR: "${query.toUpperCase()}"...`);

    try {
        const results = await TwitterEngine.search(query, 6);
        if (results && results.length > 0) {
            updateHoloScreens(results);
            const statScreens = document.getElementById('stat-active-screens');
            if (statScreens) statScreens.innerText = results.length;
            showToast(`✓ Intercepted ${results.length} Real Videos for "${query.toUpperCase()}"`);
            setTimeout(() => focusOnScreen(0), 350);
        } else {
            showToast(`No live videos found for "${query}"`);
        }
    } catch (e) {
        showToast('Error querying video streams');
    } finally {
        if (searchBtn) searchBtn.innerText = 'SCAN';
    }
}

function updateFocusPanel(item, index, custom) {
    const panel = document.getElementById('focus-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    document.getElementById('focus-screen-num').innerText = `SCREEN #0${index + 1}`;

    if (custom) {
        document.getElementById('slider-scale').value = custom.scale || 1.0;
        document.getElementById('slider-pos-x').value = custom.x || 0;
        document.getElementById('slider-pos-y').value = custom.y || 0;
        document.getElementById('slider-pos-z').value = custom.z || 0;
        document.getElementById('slider-rot-y').value = custom.rotY || 0;
    }
}

function showToast(msg) {
    const toast = document.getElementById('holo-toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.style.display = 'none', 3000);
}
