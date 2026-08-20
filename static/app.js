// ─── App Controller ───────────────────────────────────────────────────────────
let selectedIdx = null;

document.addEventListener('DOMContentLoaded', () => {
  initViewport();
  loadScreens(YT.CATEGORIES.space);   // default category

  // ── search bar ──────────────────────────────────────────────────────────
  document.getElementById('search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (!q) return;
    doSearch(q);
  });

  // ── category pills ───────────────────────────────────────────────────────
  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      doSearch(p.dataset.cat);
    });
  });

  // ── layout buttons ───────────────────────────────────────────────────────
  document.querySelectorAll('.layout-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setLayout(b.dataset.layout);
      toast(`LAYOUT: ${b.dataset.layout.toUpperCase()}`);
    });
  });

  // ── camera buttons ───────────────────────────────────────────────────────
  document.querySelectorAll('.cam-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      setCameraMode(b.dataset.cam);
      toast(`CAMERA: ${b.dataset.cam.toUpperCase()}`);
    });
  });

  // ── mute all toggle ──────────────────────────────────────────────────────
  let allMuted = true;
  document.getElementById('btn-mute-all').addEventListener('click', () => {
    allMuted = !allMuted;
    screens.forEach(s => {
      const iframe = s.el && s.el.querySelector('iframe');
      if (!iframe) return;
      const url = new URL(iframe.src);
      url.searchParams.set('mute', allMuted ? '1' : '0');
      iframe.src = url.toString();
    });
    document.getElementById('btn-mute-all').textContent = allMuted ? '🔇 MUTE ALL' : '🔊 UNMUTE ALL';
    toast(allMuted ? 'All screens muted' : 'All screens unmuted');
  });

  // ── reset cam ───────────────────────────────────────────────────────────
  document.getElementById('btn-reset-cam').addEventListener('click', () => {
    resetCam();
    toast('Camera centered');
  });

  document.getElementById('btn-reset-layout').addEventListener('click', () => {
    resetLayout();
    toast('Layout reset to defaults');
  });

  // ── add screen modal ─────────────────────────────────────────────────────
  document.getElementById('btn-add').addEventListener('click', () => {
    document.getElementById('add-modal').style.display = 'flex';
    document.getElementById('modal-input').focus();
  });
  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('add-modal').style.display = 'none';
  });
  document.getElementById('modal-confirm').addEventListener('click', () => {
    const val = document.getElementById('modal-input').value.trim();
    document.getElementById('add-modal').style.display = 'none';
    document.getElementById('modal-input').value = '';
    if (!val) return;
    const results = YT.search(val, 1);
    if (results.length) {
      addScreen(results[0]);
      toast(`➕ Screen #${screens.length} added`);
    }
  });
  document.getElementById('modal-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('modal-confirm').click();
    if (e.key === 'Escape') document.getElementById('modal-cancel').click();
  });

  // ── adjuster panel ───────────────────────────────────────────────────────
  window.onFocus = (idx, s) => {
    selectedIdx = idx;
    const p = document.getElementById('adj-panel');
    p.style.display = 'flex';
    document.getElementById('adj-screen-label').textContent = `SCREEN #${String(idx+1).padStart(2,'0')}: ${s.vid.title || ''}`.slice(0, 30);
    document.getElementById('sl-scale').value = s.custom.scale;
    document.getElementById('sl-x').value = s.custom.x;
    document.getElementById('sl-y').value = s.custom.y;
    document.getElementById('sl-z').value = s.custom.z;
    document.getElementById('sl-rot').value = s.custom.rot;
  };

  window.onUnfocus = () => {
    document.getElementById('adj-panel').style.display = 'none';
    selectedIdx = null;
  };

  document.getElementById('adj-close').addEventListener('click', unfocus);

  ['scale','x','y','z','rot'].forEach(prop => {
    document.getElementById(`sl-${prop}`).addEventListener('input', e => {
      if (selectedIdx !== null) updateCustom(selectedIdx, prop, e.target.value);
    });
  });

  document.getElementById('adj-save').addEventListener('click', () => { saveLayout(); toast('Layout saved'); });
  document.getElementById('adj-load').addEventListener('click', () => {
    if (loadLayout()) toast('Layout restored'); else toast('No saved layout found');
  });
  document.getElementById('adj-remove').addEventListener('click', () => {
    if (selectedIdx !== null) { removeScreen(selectedIdx); toast('Screen removed'); }
  });
});

// ── search helper ────────────────────────────────────────────────────────────
function doSearch(q) {
  glitch(400);
  toast(`📡 LOADING "${q.toUpperCase()}"...`);
  const results = YT.search(q, 6);
  if (results.length) {
    loadScreens(results);
    setTimeout(() => toast(`✓ ${results.length} real YouTube streams loaded`), 500);
  }
}

// ── toast ────────────────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', 2800);
}
