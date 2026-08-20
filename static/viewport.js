// ─── 3D CSS Holographic Viewport Engine ──────────────────────────────────────
let screens = [];            // [{ vid:{id,title,ch}, custom:{scale,x,y,z,rot} }]
let focusedIdx = null;
let cameraMode = 'chair';
let layout = 'dome';
let dragging = false, mx = 0, my = 0;
let rotX = 0, rotY = 0, tRotX = 0, tRotY = 0, camZ = 0;
let orbitAngle = 0;

function initViewport() {
  const vp = document.getElementById('viewport');

  window.addEventListener('mousedown', e => {
    if (e.target.closest('.top-hud,.pills-bar,.right-panel,.bottom-bar,.modal-back')) return;
    dragging = true; mx = e.clientX; my = e.clientY;
  });
  window.addEventListener('mousemove', e => {
    if (dragging) {
      const dx = e.clientX - mx, dy = e.clientY - my;
      mx = e.clientX; my = e.clientY;
      tRotY += dx * 0.36; tRotX -= dy * 0.26;
      tRotX = Math.max(-65, Math.min(65, tRotX));
    } else if (cameraMode === 'chair' && focusedIdx === null) {
      tRotY = (e.clientX / window.innerWidth - 0.5) * 2 * 14;
      tRotX = -(e.clientY / window.innerHeight - 0.5) * 2 * 10;
    }
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('wheel', e => {
    if (e.target.closest('.right-panel')) return;
    camZ = Math.max(-450, Math.min(320, camZ - e.deltaY * 0.5));
  }, { passive: true });
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft'  || e.key === 'a') tRotY -= 7;
    if (e.key === 'ArrowRight' || e.key === 'd') tRotY += 7;
    if (e.key === 'ArrowUp'   || e.key === 'w') tRotX += 5;
    if (e.key === 'ArrowDown'  || e.key === 's') tRotX -= 5;
    if (e.key === ' ' || e.key === 'r') resetCam();
  });

  requestAnimationFrame(loop);
}

function loop() {
  requestAnimationFrame(loop);
  const vp = document.getElementById('viewport');
  if (!vp) return;

  if (cameraMode === 'orbit') {
    orbitAngle = (orbitAngle + 0.3) % 360;
    vp.style.transform = `rotateX(14deg) rotateY(${orbitAngle}deg) translateZ(-80px)`;
  } else if (focusedIdx === null) {
    rotX += (tRotX - rotX) * 0.08;
    rotY += (tRotY - rotY) * 0.08;
    vp.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${camZ}px)`;
  }
}

// ── load a set of videos onto the 3D grid ─────────────────────────────────
function loadScreens(vids) {
  screens = vids.map((v, i) => ({ vid: v, custom: { scale:1, x:0, y:0, z:0, rot:0 } }));
  rebuildDOM();
  updateStat();
}

// ── rebuild all DOM screen tiles ──────────────────────────────────────────
function rebuildDOM() {
  const cluster = document.getElementById('screens-cluster');
  if (!cluster) return;
  cluster.innerHTML = '';

  screens.forEach((s, i) => {
    const tile = document.createElement('div');
    tile.className = 'holo-screen';
    tile.dataset.idx = i;

    const badge = document.createElement('div');
    badge.className = 'screen-badge';
    badge.textContent = `#${String(i+1).padStart(2,'0')} · ${s.vid.ch || 'YouTube'}`;

    const live = document.createElement('div');
    live.className = 'live-dot';
    live.textContent = '● LIVE';

    const iframe = document.createElement('iframe');
    iframe.src = YT.embedUrl(s.vid.id);
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = s.vid.title || '';

    tile.appendChild(iframe);
    tile.appendChild(badge);
    tile.appendChild(live);

    tile.addEventListener('click', e => {
      if (!tile.classList.contains('focused')) {
        e.stopPropagation();
        focusScreen(i);
      }
    });

    s.el = tile;
    cluster.appendChild(tile);
  });

  applyLayout();
}

// ── apply 3D layout positions ──────────────────────────────────────────────
function applyLayout() {
  const n = screens.length;
  screens.forEach((s, i) => {
    if (!s.el) return;
    const c = s.custom;
    let t = '';

    if (layout === 'dome') {
      const cols = 3, col = i % cols, row = Math.floor(i / cols);
      const angles = [-28, 0, 28];
      const a = (angles[col] || 0) + c.rot;
      const xOff = (col - 1) * 460 + c.x;
      const yOff = (row === 0 ? -140 : 160) + c.y;
      const zOff = (col === 1 ? -500 : -545) + c.z;
      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${-a}deg) scale(${c.scale})`;

    } else if (layout === 'flat') {
      const cols = 3, col = i % cols, row = Math.floor(i / cols);
      const xOff = (col - 1) * 455 + c.x;
      const yOff = (row === 0 ? -140 : 160) + c.y;
      t = `translate3d(${xOff}px,${yOff}px,${-490 + c.z}px) rotateY(${c.rot}deg) scale(${c.scale})`;

    } else if (layout === 'ring') {
      const a = (i / n) * 360 + c.rot;
      t = `rotateY(${a}deg) translateZ(${680 + c.z}px) translateY(${c.y}px) scale(${c.scale})`;
    }

    s.el.style.transform = t;
  });
}

// ── focus / unfocus ────────────────────────────────────────────────────────
function focusScreen(idx) {
  focusedIdx = idx;
  screens.forEach((s, i) => s.el && s.el.classList.toggle('focused', i === idx));

  // Lean camera toward focused tile
  const vp = document.getElementById('viewport');
  if (vp && cameraMode === 'chair') {
    const col = idx % 3;
    const angles = [-28, 0, 28];
    const r = -(angles[col] || 0);
    vp.style.transform = `rotateX(0deg) rotateY(${r}deg) translateZ(180px)`;
  }

  if (window.onFocus) window.onFocus(idx, screens[idx]);
}

function unfocus() {
  focusedIdx = null;
  screens.forEach(s => s.el && s.el.classList.remove('focused'));
  resetCam();
  if (window.onUnfocus) window.onUnfocus();
}

window.addEventListener('click', e => {
  if (focusedIdx !== null &&
      !e.target.closest('.holo-screen') &&
      !e.target.closest('.right-panel')) {
    unfocus();
  }
});

// ── camera helpers ─────────────────────────────────────────────────────────
function resetCam() {
  tRotX = 0; tRotY = 0; rotX = 0; rotY = 0; camZ = 0;
  const vp = document.getElementById('viewport');
  if (vp) vp.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
}

function setCameraMode(m) {
  cameraMode = m;
  if (m === 'tactical') {
    const vp = document.getElementById('viewport');
    if (vp) vp.style.transform = 'rotateX(30deg) rotateY(0deg) translateY(90px) translateZ(-160px)';
  } else {
    resetCam();
  }
}

// ── layout helpers ─────────────────────────────────────────────────────────
function setLayout(l) { layout = l; applyLayout(); }

function resetLayout() {
  screens.forEach(s => { s.custom = { scale:1, x:0, y:0, z:0, rot:0 }; });
  applyLayout();
}

// ── add / remove / update individual screen ────────────────────────────────
function addScreen(vid) {
  screens.push({ vid, custom: { scale:1, x:0, y:0, z:0, rot:0 } });
  rebuildDOM();
  updateStat();
}

function removeScreen(idx) {
  screens.splice(idx, 1);
  unfocus();
  rebuildDOM();
  updateStat();
}

function replaceScreen(idx, vid) {
  if (!screens[idx]) return;
  screens[idx].vid = vid;
  // swap iframe src without full rebuild
  const iframe = screens[idx].el && screens[idx].el.querySelector('iframe');
  if (iframe) iframe.src = YT.embedUrl(vid.id);
  const badge = screens[idx].el && screens[idx].el.querySelector('.screen-badge');
  if (badge) badge.textContent = `#${String(idx+1).padStart(2,'0')} · ${vid.ch || 'YouTube'}`;
}

function updateCustom(idx, prop, val) {
  if (!screens[idx]) return;
  screens[idx].custom[prop] = parseFloat(val);
  applyLayout();
}

// ── layout persistence ─────────────────────────────────────────────────────
function saveLayout() {
  const data = { layout, screens: screens.map(s => ({ vid: s.vid, custom: s.custom })) };
  localStorage.setItem('mitc_layout', JSON.stringify(data));
}

function loadLayout() {
  const raw = localStorage.getItem('mitc_layout');
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    layout = data.layout || 'dome';
    screens = data.screens.map(s => ({ vid: s.vid, custom: s.custom }));
    rebuildDOM();
    updateStat();
    return true;
  } catch { return false; }
}

// ── stat counter ───────────────────────────────────────────────────────────
function updateStat() {
  const el = document.getElementById('stat-count');
  if (el) el.textContent = screens.length;
}

function glitch(ms = 500) {
  screens.forEach(s => {
    if (!s.el) return;
    const rx = (Math.random() - 0.5) * 35, ry = (Math.random() - 0.5) * 35;
    s.el.style.transform = `scale(1.06) translate(${rx}px,${ry}px)`;
  });
  setTimeout(applyLayout, ms);
}
