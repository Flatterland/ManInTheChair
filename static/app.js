
// Main Application Controller & HUD Orchestrator (100% In-Browser & GitHub Pages Ready)
let isMasterMuted = true;
let activePalette = 'cyan';
let currentSelectedScreenIdx = null;

const DEFAULT_FEEDS = [
    {
        "id": "def_1",
        "author_name": "OpenAI & Robotics Research",
        "author_handle": "@OpenAI_Vision",
        "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
        "text": "Autonomous bipedal robot neural locomotion testing in real-world unstructured terrain #AI #Robotics",
        "video_url": "./static/assets/videos/neural_matrix.mp4",
        "views": "1.4M", "likes": "45.2K", "retweets": "9.8K", "category": "AI & Robotics", "timestamp": "12m ago"
    },
    {
        "id": "def_2",
        "author_name": "Orbital Watch HQ",
        "author_handle": "@OrbitalWatch",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
        "text": "Spectacular booster separation captured from the orbital recovery vessel cameras. All 33 engines nominal! 🚀",
        "video_url": "./static/assets/videos/space_nebula.mp4",
        "views": "4.2M", "likes": "140K", "retweets": "32K", "category": "Space", "timestamp": "5m ago"
    },
    {
        "id": "def_3",
        "author_name": "Neo Tokyo Signals",
        "author_handle": "@NeoTokyoGrid",
        "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
        "text": "Central sector nighttime traffic telemetry and biometric billboard scan in rain district. Sector 09 clear. #Cyberpunk",
        "video_url": "./static/assets/videos/cyber_grid.mp4",
        "views": "1.1M", "likes": "54K", "retweets": "12K", "category": "Cyberpunk", "timestamp": "8m ago"
    },
    {
        "id": "def_4",
        "author_name": "Unreal Engine 5 Showcase",
        "author_handle": "@NextGenRenders",
        "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
        "text": "Lumen dynamic global illumination and Nanite micropolygon geometry benchmark running at 4K 120FPS. 🎮",
        "video_url": "./static/assets/videos/quantum_core.mp4",
        "views": "3.1M", "likes": "125K", "retweets": "27K", "category": "Gaming", "timestamp": "15m ago"
    },
    {
        "id": "def_5",
        "author_name": "Feline Quantum Watch",
        "author_handle": "@DailyCatsX",
        "avatar": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop",
        "text": "Ninja cat calculated the jump trajectory with microsecond precision! 🐾 #CatsOfTwitter",
        "video_url": "./static/assets/videos/feline_telemetry.mp4",
        "views": "2.8M", "likes": "94K", "retweets": "18K", "category": "Cats", "timestamp": "3m ago"
    },
    {
        "id": "def_6",
        "author_name": "Golden Retrievers Online",
        "author_handle": "@GoldenVibes",
        "avatar": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop",
        "text": "Teaching the puppy how to fetch the hypersonic disc! 🐶 #Dogs",
        "video_url": "./static/assets/videos/radar_sweep.mp4",
        "views": "3.1M", "likes": "130K", "retweets": "25K", "category": "Dogs", "timestamp": "10m ago"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    setupUI();
    initHoloViewport();
    updateHoloScreens(DEFAULT_FEEDS);
    renderFeedList(DEFAULT_FEEDS);
    startVisualizerLoop();
});

function setupUI() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const renderToggleBtn = document.getElementById('btn-render-mode');
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

    // Render Mode Toggle (GPU vs CPU)
    if (renderToggleBtn) {
        renderToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const nextMode = renderMode === 'cpu' ? 'gpu' : 'cpu';
            setRenderMode(nextMode);
            showToast(`Rendering Switched: ${nextMode.toUpperCase()} ENGINE`);
        });
    }

    // Add Screen Modal Open/Close
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
            const topic = addInput ? addInput.value.trim() : 'Surveillance';
            addModal.style.display = 'none';
            if (addInput) addInput.value = '';
            
            showToast(`Deploying Screen: #${topic}...`);
            let results = [];
            if (typeof TwitterEngine !== 'undefined') {
                results = await TwitterEngine.search(topic, 1);
            }
            const item = (results && results[0]) ? results[0] : {
                author_name: `${topic} Stream`,
                author_handle: `@${topic}_feed`,
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
                text: `Dynamic screen stream allocated for #${topic}`,
                video_url: "./static/assets/videos/cyber_grid.mp4",
                views: "2.1M", likes: "60K"
            };

            addCustomScreen(item);
            renderFeedList(activeScreensData.map(s => s.item));
            showToast(`✓ Screen #${activeScreensData.length} Added to Hologram Matrix!`);
        });
    }

    // Layout & Camera Reset Controls
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

    // Screen Adjuster Slider Bindings
    setupAdjusterSliders();

    // Callbacks from 3D Viewport
    window.onScreenFocused = (item, index, custom) => {
        currentSelectedScreenIdx = index;
        updateFocusPanel(item, index, custom);
        highlightFeedCard(index);
    };

    window.onFocusReset = () => {
        const p = document.getElementById('focus-panel');
        if (p) p.style.display = 'none';
        document.querySelectorAll('.feed-card').forEach(c => c.classList.remove('active'));
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
            renderFeedList(activeScreensData.map(s => s.item));
            showToast('Screen Removed from Matrix');
        }
    });
}

async function executeSearch(query) {
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.innerText = 'SCANNING...';
    triggerGlitch(500);
    showToast(`📡 SCANNING TWITTER FOR #${query.toUpperCase()}...`);

    try {
        let results = [];
        // First try client-side direct Twitter Engine
        if (typeof TwitterEngine !== 'undefined') {
            results = await TwitterEngine.search(query, 6);
        }
        
        // Fallback to local server API if running in python mode and results empty
        if (!results || !results.length) {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&count=6`);
                const data = await res.json();
                if (data && data.results) results = data.results;
            } catch (err) {}
        }

        if (results && results.length > 0) {
            updateHoloScreens(results);
            renderFeedList(results);
            showToast(`✓ Intercepted ${results.length} Video Streams`);
            setTimeout(() => focusOnScreen(0), 250);
        } else {
            showToast(`No video feeds found for "${query}"`);
        }
    } catch (e) {
        showToast('Error connecting to Twitter video stream');
    } finally {
        if (searchBtn) searchBtn.innerText = 'SCAN';
    }
}

function renderFeedList(items) {
    const feedContainer = document.getElementById('feed-list');
    if (!feedContainer) return;
    feedContainer.innerHTML = '';

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'feed-card';
        card.innerHTML = `
            <div class="feed-header">
                <img class="feed-avatar" src="${item.avatar || ''}" alt="${item.author_name || ''}" />
                <div>
                    <div class="feed-author">${item.author_name || 'Stream'}</div>
                    <div class="feed-handle">${item.author_handle || '@Twitter'}</div>
                </div>
            </div>
            <div class="feed-snippet">${item.text || ''}</div>
            <div class="feed-meta">
                <span>👁 ${item.views || 'Live'}</span>
                <span>❤️ ${item.likes || '40K'}</span>
                <span>#0${index + 1}</span>
            </div>
        `;
        card.onclick = () => focusOnScreen(index);
        feedContainer.appendChild(card);
    });

    const activeStat = document.getElementById('stat-active-screens');
    if (activeStat) activeStat.innerText = items.length;
}

function highlightFeedCard(index) {
    document.querySelectorAll('.feed-card').forEach((c, idx) => {
        c.classList.toggle('active', idx === index);
    });
}

function updateFocusPanel(item, index, custom) {
    const panel = document.getElementById('focus-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    document.getElementById('focus-avatar').src = item.avatar || '';
    document.getElementById('focus-author').innerText = item.author_name || '';
    document.getElementById('focus-handle').innerText = item.author_handle || '';
    document.getElementById('focus-text').innerText = item.text || '';
    document.getElementById('focus-views').innerText = item.views || '';
    document.getElementById('focus-likes').innerText = item.likes || '';
    document.getElementById('focus-retweets').innerText = item.retweets || '12K';
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

function startVisualizerLoop() {
    const eqBars = document.querySelectorAll('.eq-bar');
    setInterval(() => {
        if (focusedScreenIndex !== null && !isMasterMuted) {
            eqBars.forEach(bar => {
                bar.style.height = `${Math.floor(Math.random() * 85 + 15)}%`;
            });
        } else {
            eqBars.forEach(bar => bar.style.height = '12%');
        }
    }, 90);
}
