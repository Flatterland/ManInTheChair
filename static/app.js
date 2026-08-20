
// Main Application Controller & Cockpit Deck (Floating Twitter Browser + 3D Hologram Interceptor)
let currentSelectedScreenIdx = null;

document.addEventListener('DOMContentLoaded', async () => {
    setupUI();
    initHoloViewport();
    // Default initial surveillance streams
    const initialFeeds = await TwitterEngine.search('spacex', 6);
    updateHoloScreens(initialFeeds);
});

function setupUI() {
    const quickForm = document.getElementById('quick-intercept-form');
    const quickInput = document.getElementById('quick-intercept-input');
    const toggleBrowserBtn = document.getElementById('btn-toggle-browser');
    const browserPanel = document.getElementById('twitter-browser-panel');
    const browserCloseBtn = document.getElementById('btn-browser-close');
    const browserMinBtn = document.getElementById('btn-browser-minimize');
    const navUrlInput = document.getElementById('browser-url-input');
    const navGoBtn = document.getElementById('btn-nav-go');
    const navReloadBtn = document.getElementById('btn-nav-reload');
    const twitterIframe = document.getElementById('twitter-iframe');
    const grabVideoInput = document.getElementById('grab-video-url');
    const grabProjectBtn = document.getElementById('btn-grab-project');
    const targetScreenSelect = document.getElementById('target-screen-select');

    const addScreenBtn = document.getElementById('btn-add-screen');
    const addModal = document.getElementById('add-screen-modal');
    const addSubmitBtn = document.getElementById('modal-add-btn');
    const addCancelBtn = document.getElementById('modal-cancel-btn');
    const addInput = document.getElementById('modal-screen-topic');

    const saveLayoutBtn = document.getElementById('btn-save-layout');
    const loadLayoutBtn = document.getElementById('btn-load-layout');
    const resetLayoutBtn = document.getElementById('btn-reset-layout');
    const resetCamBtn = document.getElementById('btn-reset-cam');

    // Quick Intercept Form Submit
    if (quickForm) {
        quickForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = quickInput ? quickInput.value.trim() : '';
            if (val) await projectToHologram(val, 'auto');
        });
    }

    // Toggle Floating Twitter Browser
    if (toggleBrowserBtn && browserPanel) {
        toggleBrowserBtn.addEventListener('click', () => {
            const isVisible = browserPanel.style.display !== 'none';
            browserPanel.style.display = isVisible ? 'none' : 'flex';
            toggleBrowserBtn.classList.toggle('active', !isVisible);
            showToast(!isVisible ? '🌐 Twitter Browser Console Online' : 'Browser Console Minimized');
        });
    }

    if (browserCloseBtn && browserPanel) {
        browserCloseBtn.addEventListener('click', () => {
            browserPanel.style.display = 'none';
            if (toggleBrowserBtn) toggleBrowserBtn.classList.remove('active');
        });
    }

    if (browserMinBtn && browserPanel) {
        browserMinBtn.addEventListener('click', () => {
            const isMinimized = browserPanel.style.height === '40px';
            browserPanel.style.height = isMinimized ? '480px' : '40px';
        });
    }

    // Browser Navigation
    const navigateBrowser = (url) => {
        if (!url) return;
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        if (navUrlInput) navUrlInput.value = finalUrl;
        if (twitterIframe) {
            // Note: If Twitter restricts iframing via X-Frame-Options, we provide the clean bridge view
            twitterIframe.src = finalUrl;
        }
        showToast(`Loading: ${finalUrl}`);
    };

    if (navGoBtn) navGoBtn.addEventListener('click', () => navigateBrowser(navUrlInput.value));
    if (navUrlInput) navUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigateBrowser(navUrlInput.value);
    });
    if (navReloadBtn && twitterIframe) navReloadBtn.addEventListener('click', () => {
        twitterIframe.src = twitterIframe.src;
    });

    // Quick Target Pills
    document.querySelectorAll('.target-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const targetUrl = pill.dataset.url;
            navigateBrowser(targetUrl);
            if (grabVideoInput) grabVideoInput.value = targetUrl;
        });
    });

    // Grab & Project to Hologram Button
    if (grabProjectBtn) {
        grabProjectBtn.addEventListener('click', async () => {
            const grabVal = grabVideoInput ? grabVideoInput.value.trim() : '';
            const targetScreen = targetScreenSelect ? targetScreenSelect.value : 'auto';
            if (grabVal) {
                await projectToHologram(grabVal, targetScreen);
            } else {
                showToast('Please enter or select a Tweet / Video URL to project');
            }
        });
    }

    // Add Screen Modal
    if (addScreenBtn && addModal) {
        addScreenBtn.addEventListener('click', () => {
            addModal.style.display = 'flex';
            if (addInput) addInput.focus();
        });
    }
    if (addCancelBtn && addModal) {
        addCancelBtn.addEventListener('click', () => addModal.style.display = 'none');
    }
    if (addSubmitBtn && addModal) {
        addSubmitBtn.addEventListener('click', async () => {
            const val = addInput ? addInput.value.trim() : 'space';
            addModal.style.display = 'none';
            if (addInput) addInput.value = '';
            await projectToHologram(val, 'new');
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
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setLayout(btn.dataset.layout);
            showToast(`Array: ${btn.dataset.layout.replace('_', ' ').toUpperCase()}`);
        });
    });

    // Camera Mode Selectors
    document.querySelectorAll('.cam-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setCameraMode(btn.dataset.cam);
            showToast(`Camera: ${btn.dataset.cam.toUpperCase()} MODE`);
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

async function projectToHologram(inputVal, targetScreen = 'auto') {
    triggerGlitch(400);
    showToast(`⚡ Intercepting video stream from: "${inputVal}"...`);

    const results = await TwitterEngine.search(inputVal, 1);
    if (!results || !results.length) {
        showToast('Could not resolve video stream from target');
        return;
    }

    const item = results[0];

    if (targetScreen === 'new') {
        addCustomScreen(item);
        showToast(`✓ Projected to NEW Hologram Screen #${activeScreensData.length}!`);
        setTimeout(() => focusOnScreen(activeScreensData.length - 1), 300);
    } else if (targetScreen === 'auto') {
        // Project onto focused screen or next in array
        const targetIdx = focusedScreenIndex !== null ? focusedScreenIndex : (activeScreensData.length ? 0 : 'new');
        if (targetIdx === 'new') {
            addCustomScreen(item);
        } else {
            activeScreensData[targetIdx].item = item;
            renderLiveVideoScreens();
            focusOnScreen(targetIdx);
        }
        showToast(`✓ Projected Stream to Screen #${(typeof targetIdx === 'number' ? targetIdx + 1 : 1)}!`);
    } else {
        const idx = parseInt(targetScreen, 10);
        if (activeScreensData[idx]) {
            activeScreensData[idx].item = item;
            renderLiveVideoScreens();
            focusOnScreen(idx);
            showToast(`✓ Stream Injected into Screen #0${idx + 1}!`);
        } else {
            addCustomScreen(item);
            showToast(`✓ Created Screen #${activeScreensData.length} for Stream!`);
        }
    }
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
