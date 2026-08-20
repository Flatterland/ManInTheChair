// ─── App HUD Coordinator & Event Controller ────────────────────────────────
let selectedIdx = null;

document.addEventListener('DOMContentLoaded', () => {
  initViewport();

  // 1. Instantly load 9 verified screens on startup (0ms lag)
  const initialVids = YT.getImmediateResults('space', 9);
  loadScreens(initialVids);

  // 2. Search live APIs in background for 9+ items
  YT.searchLiveAsync('Space exploration launches', liveVids => {
    loadScreens(liveVids);
  }, 9);

  // ── Search Form (Searches & Deploys 9 Screens) ───────────────────────────
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

  // ── UI Hide / Restore Controls ───────────────────────────────────────────
  document.getElementById('btn-hide-ui').addEventListener('click', toggleHideUI);
  document.getElementById('ui-restore-btn').addEventListener('click', toggleHideUI);

  // ── Panel Toggles (Visual FX, Playlist, Mixer) ───────────────────────────
  const vfxPanel = document.getElementById('visual-fx-panel');
  const playlistPanel = document.getElementById('playlist-panel');
  const mixerPanel = document.getElementById('mixer-panel');
  const adjPanel = document.getElementById('adj-panel');

  document.getElementById('btn-visual-fx').addEventListener('click', () => {
    const isShowing = vfxPanel.style.display === 'flex';
    vfxPanel.style.display = isShowing ? 'none' : 'flex';
    document.getElementById('btn-visual-fx').classList.toggle('active', !isShowing);
  });
  document.getElementById('visual-fx-close').addEventListener('click', () => {
    vfxPanel.style.display = 'none';
    document.getElementById('btn-visual-fx').classList.remove('active');
  });

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

  // ── Visual FX Panel Controls ─────────────────────────────────────────────
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setVisualTheme(btn.dataset.theme);
      toast(`Theme: ${btn.textContent}`);
    });
  });

  const spacingSlider = document.getElementById('sl-screen-spacing');
  const spacingVal = document.getElementById('spacing-val');
  spacingSlider.addEventListener('input', e => {
    spacingVal.textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
    setScreenSpacing(e.target.value);
  });

  document.getElementById('chk-dof-enable').addEventListener('change', e => {
    visualFX.dofEnabled = e.target.checked;
    applyVisualFX();
    toast(e.target.checked ? 'Depth of Field Blur ON' : 'Depth of Field OFF');
  });
  document.getElementById('sl-dof-strength').addEventListener('input', e => {
    visualFX.dofStrength = parseInt(e.target.value, 10);
  });

  document.getElementById('chk-scanlines-enable').addEventListener('change', e => {
    visualFX.scanlinesEnabled = e.target.checked;
    applyVisualFX();
  });
  document.getElementById('sl-scanlines-opacity').addEventListener('input', e => {
    visualFX.scanlineOpacity = parseFloat(e.target.value);
    applyVisualFX();
  });
  document.getElementById('sl-floor-brightness').addEventListener('input', e => {
    visualFX.floorGridBrightness = parseFloat(e.target.value);
    applyVisualFX();
  });

  // ── Master Volume & Spatial Audio Controls in Mixer ───────────────────────
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

  document.getElementById('chk-spatial-enable').addEventListener('change', e => {
    spatialAudio.enabled = e.target.checked;
    toast(e.target.checked ? '3D Spatial Audio ON' : '3D Spatial Audio OFF');
  });
  document.getElementById('sl-spatial-sep').addEventListener('input', e => {
    spatialAudio.separation = parseFloat(e.target.value);
  });
  document.getElementById('chk-single-priority').addEventListener('change', e => {
    spatialAudio.singlePriority = e.target.checked;
    toast(e.target.checked ? 'Single Video Priority Audio ON' : 'Single Video Priority Audio OFF');
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
    document.getElementById('sl-screen-spacing').value = '1.0';
    document.getElementById('spacing-val').textContent = '1.0x';
    toast('Layout & Spacing reset to defaults');
  });

  // ── Add Screen Modal ─────────────────────────────────────────────────────
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

  // ── Cinematic Sequences Modal & Launchers ─────────────────────────────────
  const cinematicModal = document.getElementById('cinematic-modal');
  document.getElementById('btn-cinematic').addEventListener('click', () => {
    cinematicModal.style.display = 'flex';
    document.getElementById('cinematic-input').focus();
  });
  document.getElementById('cinematic-cancel').addEventListener('click', () => {
    cinematicModal.style.display = 'none';
  });
  document.getElementById('btn-cinematic-exit').addEventListener('click', () => {
    if (cinematicCancelFn) cinematicCancelFn();
  });

  document.querySelectorAll('.cin-opt-card').forEach(card => {
    card.addEventListener('click', () => {
      const opt = parseInt(card.dataset.opt, 10);
      const customTopic = document.getElementById('cinematic-input').value.trim();
      cinematicModal.style.display = 'none';
      document.getElementById('cinematic-input').value = '';
      launchCinematic(opt, customTopic);
    });
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
    toast('Layout, FX & Audio presets saved');
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

// ── Search Helper (Deploys 9 Screens) ────────────────────────────────────────
function executeSearch(query) {
  glitch(280);
  toast(`📡 SCANNING FOR "${query.toUpperCase()}"...`);

  // Instant response with 9 matching/thematic results
  const immediate = YT.getImmediateResults(query, 9);
  loadScreens(immediate);

  // Background search to enrich queue with 9+ live items
  YT.searchLiveAsync(query, liveVids => {
    if (liveVids && liveVids.length > 0) {
      loadScreens(liveVids);
      const stats = YT.getQueueStats();
      toast(`✓ ${liveVids.length} live streams projected (${stats.remaining} queued)`);
    }
  }, 9);
}

// ── Toast Notification Helper ────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 2800);
}
