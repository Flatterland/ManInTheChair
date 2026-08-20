// ─── App HUD Coordinator & Event Controller ────────────────────────────────
let selectedIdx = null;
let currentFxIndex = 0;
const FX_MODES = [
  { name: '🎨 FX: CYBER', cls: '' },
  { name: '🟢 FX: GREEN VECTOR', cls: 'fx-green-vector' },
  { name: '🟠 FX: AMBER HUD', cls: 'fx-amber-tactical' }
];

document.addEventListener('DOMContentLoaded', () => {
  initViewport();

  // 1. Instantly load verified screens (0ms lag)
  const initialVids = YT.getImmediateResults('space', 6);
  loadScreens(initialVids);

  // 2. Search live APIs in background
  YT.searchLiveAsync('Space exploration launches', liveVids => {
    loadScreens(liveVids);
  });

  // ── Search Form ──────────────────────────────────────────────────────────
  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (!q) return;
    executeSearch(q);
  });

  // ── Category Pills ───────────────────────────────────────────────────────
  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const cat = p.dataset.cat;
      executeSearch(cat);
    });
  });

  // ── Shader FX Switcher ───────────────────────────────────────────────────
  const fxBtn = document.getElementById('btn-fx-mode');
  fxBtn.addEventListener('click', () => {
    // Remove all previous FX classes
    FX_MODES.forEach(m => { if (m.cls) document.body.classList.remove(m.cls); });
    currentFxIndex = (currentFxIndex + 1) % FX_MODES.length;
    const mode = FX_MODES[currentFxIndex];
    if (mode.cls) document.body.classList.add(mode.cls);
    fxBtn.textContent = mode.name;
    toast(`Hologram Shader: ${mode.name}`);
  });

  // ── Panel Toggles (Playlist & Mixer) ──────────────────────────────────────
  const playlistPanel = document.getElementById('playlist-panel');
  const mixerPanel = document.getElementById('mixer-panel');
  const adjPanel = document.getElementById('adj-panel');

  document.getElementById('btn-playlist').addEventListener('click', () => {
    const isShowing = playlistPanel.style.display === 'flex';
    playlistPanel.style.display = isShowing ? 'none' : 'flex';
    document.getElementById('btn-playlist').classList.toggle('active', !isShowing);
  });
  document.getElementById('playlist-close').addEventListener('click', () => {
    playlistPanel.style.display = 'none';
    document.getElementById('btn-playlist').classList.remove('active');
  });

  document.getElementById('btn-mixer').addEventListener('click', () => {
    const isShowing = mixerPanel.style.display === 'flex';
    mixerPanel.style.display = isShowing ? 'none' : 'flex';
    document.getElementById('btn-mixer').classList.toggle('active', !isShowing);
  });
  document.getElementById('mixer-close').addEventListener('click', () => {
    mixerPanel.style.display = 'none';
    document.getElementById('btn-mixer').classList.remove('active');
  });

  // ── Master Volume & Solo Mode Controls in Mixer ───────────────────────────
  const masterSlider = document.getElementById('sl-master-vol');
  const masterVolVal = document.getElementById('master-vol-val');
  masterSlider.addEventListener('input', e => {
    masterVolVal.textContent = `${e.target.value}%`;
    setMasterVolume(e.target.value);
  });

  document.getElementById('chk-solo-mode').addEventListener('change', e => {
    setSoloAudioMode(e.target.checked);
    toast(e.target.checked ? 'Solo audio mode ON' : 'Multi-audio mix mode ON');
  });

  // ── Master Mute All HUD Button ───────────────────────────────────────────
  document.getElementById('btn-mute-all').addEventListener('click', () => {
    toggleMasterMute();
  });

  // ── Camera Buttons ───────────────────────────────────────────────────────
  document.querySelectorAll('.cam-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setCameraMode(b.dataset.cam);
      toast(`CAMERA: ${b.dataset.cam.toUpperCase()}`);
    });
  });

  document.getElementById('btn-reset-cam').addEventListener('click', () => {
    resetCam();
    toast('Camera centered');
  });

  // ── Layout Buttons & 360 Spin Toggle ─────────────────────────────────────
  document.querySelectorAll('.layout-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setLayout(b.dataset.layout);
      toast(`LAYOUT: ${b.dataset.layout.toUpperCase()}`);
    });
  });

  document.getElementById('btn-spin-toggle').addEventListener('click', () => {
    toggleRingSpin();
  });

  document.getElementById('btn-reset-layout').addEventListener('click', () => {
    resetLayout();
    toast('Layout reset to defaults');
  });

  // ── Add Screen Modal (Fetches matching topic accurately) ──────────────────
  document.getElementById('btn-add').addEventListener('click', () => {
    document.getElementById('add-modal').style.display = 'flex';
    document.getElementById('modal-input').focus();
  });
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('add-modal').style.display = 'none';
  });
  document.getElementById('modal-confirm').addEventListener('click', async () => {
    const val = document.getElementById('modal-input').value.trim();
    document.getElementById('add-modal').style.display = 'none';
    document.getElementById('modal-input').value = '';
    if (!val) return;

    toast(`🔍 Deploying screen for "${val}"...`);
    const vid = await YT.fetchTopResult(val);
    if (vid) {
      addScreen(vid);
      toast(`➕ Screen #${screens.length} deployed: ${vid.title.slice(0, 24)}...`);
    }
  });
  document.getElementById('modal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('modal-confirm').click();
    if (e.key === 'Escape') document.getElementById('modal-cancel').click();
  });

  // ── Screen Spatial Adjuster Panel ─────────────────────────────────────────
  window.onFocus = (idx, s) => {
    selectedIdx = idx;
    adjPanel.style.display = 'flex';
    document.getElementById('adj-screen-label').textContent = `SCREEN #${String(idx+1).padStart(2,'0')}: ${(s.vid.title || '').slice(0, 24)}`;
    document.getElementById('sl-scale').value = s.custom.scale;
    document.getElementById('sl-x').value = s.custom.x;
    document.getElementById('sl-y').value = s.custom.y;
    document.getElementById('sl-z').value = s.custom.z;
    document.getElementById('sl-rot').value = s.custom.rot;
  };

  window.onUnfocus = () => {
    adjPanel.style.display = 'none';
    selectedIdx = null;
  };

  document.getElementById('adj-close').addEventListener('click', unfocus);

  ['scale', 'x', 'y', 'z', 'rot'].forEach(prop => {
    document.getElementById(`sl-${prop}`).addEventListener('input', e => {
      if (selectedIdx !== null) updateCustom(selectedIdx, prop, e.target.value);
    });
  });

  document.getElementById('adj-save').addEventListener('click', () => {
    saveLayout();
    toast('Layout & Audio presets saved');
  });
  document.getElementById('adj-load').addEventListener('click', () => {
    if (loadLayout()) toast('Layout restored');
    else toast('No saved layout found');
  });
  document.getElementById('adj-remove').addEventListener('click', () => {
    if (selectedIdx !== null) {
      removeScreen(selectedIdx);
      toast('Screen removed');
    }
  });
});

// ── Search Helper ────────────────────────────────────────────────────────────
function executeSearch(query) {
  glitch(280);
  toast(`📡 SCANNING FOR "${query.toUpperCase()}"...`);

  // Instant response with matching/thematic results
  const immediate = YT.getImmediateResults(query, 6);
  loadScreens(immediate);

  // Background search to enrich queue with more live items
  YT.searchLiveAsync(query, liveVids => {
    if (liveVids && liveVids.length > 0) {
      loadScreens(liveVids);
      const stats = YT.getQueueStats();
      toast(`✓ ${liveVids.length} live streams projected (${stats.remaining} queued)`);
    }
  });
}

// ── Toast Notification Helper ────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 2800);
}
