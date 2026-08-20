// ─── App HUD Coordinator & Event Controller ────────────────────────────────
let selectedIdx = null;

document.addEventListener('DOMContentLoaded', async () => {
  initViewport();

  // Load initial space exploration streams dynamically
  doSearch('Space exploration launches');

  // ── Search Form ──────────────────────────────────────────────────────────
  document.getElementById('search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (!q) return;
    doSearch(q);
  });

  // ── Category Pills ───────────────────────────────────────────────────────
  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      doSearch(p.dataset.cat);
    });
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

  // ── Layout Buttons ───────────────────────────────────────────────────────
  document.querySelectorAll('.layout-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setLayout(b.dataset.layout);
      toast(`LAYOUT: ${b.dataset.layout.toUpperCase()}`);
    });
  });

  document.getElementById('btn-reset-layout').addEventListener('click', () => {
    resetLayout();
    toast('Layout reset to defaults');
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
    toast(`📡 Searching for "${val}"...`);
    const results = await YT.search(val, 1);
    if (results.length) {
      addScreen(results[0]);
      toast(`➕ Screen #${screens.length} added: ${results[0].title.slice(0, 20)}...`);
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
async function doSearch(query) {
  glitch(350);
  toast(`📡 SCANNING YOUTUBE FOR "${query.toUpperCase()}"...`);
  const results = await YT.search(query, 6);
  if (results && results.length > 0) {
    loadScreens(results);
    setTimeout(() => {
      const stats = YT.getQueueStats();
      toast(`✓ ${results.length} live streams projected (${stats.remaining} queued)`);
    }, 600);
  }
}

// ── Toast Notification Helper ────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 2800);
}
