// ─── 3D Viewport, Multi-Screen Layout & Audio Matrix Engine ───────────────────
let screens = [];            // [{ vid:{id,title,ch}, custom:{scale,x,y,z,rot}, isMuted, volume }]
let focusedIdx = null;
let cameraMode = 'chair';
let layout = 'dome';
let soloAudioMode = true;    // Unmuting one screen mutes others
let masterVolume = 100;
let masterMuted = false;

// Camera & 3D space state
let draggingLeft = false, draggingRight = false;
let mx = 0, my = 0;
let rotX = 0, rotY = 0, tRotX = 0, tRotY = 0;
let camX = 0, camY = 0, tCamX = 0, tCamY = 0;
let camZ = 0;
let orbitAngle = 0;

// 360° Ring Spin animation state
let ringSpinAngle = 0;
let ringSpinEnabled = true;
let ringSpinSpeed = 0.07;

function initViewport() {
  const vp = document.getElementById('viewport');

  // Prevent right-click context menu for smooth panning
  window.addEventListener('contextmenu', e => {
    e.preventDefault();
  });

  window.addEventListener('mousedown', e => {
    if (e.target.closest('.top-hud,.pills-bar,.side-panel,.bottom-bar,.modal-back')) return;
    if (e.button === 0) {
      draggingLeft = true;
    } else if (e.button === 2) {
      draggingRight = true;
    }
    mx = e.clientX; my = e.clientY;
  });

  window.addEventListener('mousemove', e => {
    const dx = e.clientX - mx, dy = e.clientY - my;
    mx = e.clientX; my = e.clientY;

    if (draggingLeft) {
      // Rotate / Orbit
      tRotY += dx * 0.38;
      tRotX -= dy * 0.28;
      tRotX = Math.max(-75, Math.min(75, tRotX));
    } else if (draggingRight) {
      // Pan Camera X/Y
      tCamX += dx * 0.85;
      tCamY += dy * 0.85;
    } else if (cameraMode === 'chair' && focusedIdx === null) {
      // Subtle head tracking
      tRotY = (e.clientX / window.innerWidth - 0.5) * 2 * 16;
      tRotX = -(e.clientY / window.innerHeight - 0.5) * 2 * 11;
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button === 0) draggingLeft = false;
    if (e.button === 2) draggingRight = false;
  });

  // Deep zoom (allows zooming right up to screens)
  window.addEventListener('wheel', e => {
    if (e.target.closest('.side-panel')) return;
    camZ = Math.max(-800, Math.min(620, camZ - e.deltaY * 0.75));
  }, { passive: true });

  // 6-DOF Keyboard Controls
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft'  || e.key === 'a') tRotY -= 7;
    if (e.key === 'ArrowRight' || e.key === 'd') tRotY += 7;
    if (e.key === 'ArrowUp'   || e.key === 'w') tRotX += 6;
    if (e.key === 'ArrowDown'  || e.key === 's') tRotX -= 6;
    if (e.key === 'q') tCamX -= 30;
    if (e.key === 'e') tCamX += 30;
    if (e.key === '+' || e.key === '=') camZ = Math.min(620, camZ + 60);
    if (e.key === '-' || e.key === '_') camZ = Math.max(-800, camZ - 60);
    if (e.key === ' ' || e.key === 'r') resetCam();
    if (e.key === 'm') toggleMasterMute();
    if (e.key === 'f' && focusedIdx !== null) focusScreen(focusedIdx);
  });

  requestAnimationFrame(loop);
}

function loop() {
  requestAnimationFrame(loop);
  const vp = document.getElementById('viewport');
  if (!vp) return;

  // 360° Ring Spin update
  if (layout === 'ring' && ringSpinEnabled && focusedIdx === null && !draggingLeft) {
    ringSpinAngle = (ringSpinAngle + ringSpinSpeed) % 360;
    applyLayout();
  }

  if (cameraMode === 'orbit') {
    orbitAngle = (orbitAngle + 0.35) % 360;
    vp.style.transform = `translate3d(${camX}px,${camY}px,0) rotateX(15deg) rotateY(${orbitAngle}deg) translateZ(-60px)`;
  } else if (focusedIdx === null) {
    rotX += (tRotX - rotX) * 0.08;
    rotY += (tRotY - rotY) * 0.08;
    camX += (tCamX - camX) * 0.1;
    camY += (tCamY - camY) * 0.1;
    vp.style.transform = `translate3d(${camX}px,${camY}px,0) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${camZ}px)`;
  }
}

// ── Load a set of videos onto the 3D grid ─────────────────────────────────
function loadScreens(vids) {
  screens = vids.map((v, i) => ({
    vid: v,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    isMuted: true,
    volume: 100
  }));

  rebuildDOM();
  updateUILists();
}

// ── Rebuild all DOM screen tiles ──────────────────────────────────────────
function rebuildDOM() {
  const cluster = document.getElementById('screens-cluster');
  if (!cluster) return;
  cluster.innerHTML = '';

  screens.forEach((s, i) => {
    const tile = document.createElement('div');
    tile.className = 'holo-screen';
    tile.dataset.idx = i;
    tile.id = `holo-screen-${i}`;

    // Top overlay badge row
    const topBar = document.createElement('div');
    topBar.className = 'screen-top-bar';

    const badge = document.createElement('div');
    badge.className = 'screen-badge';
    badge.textContent = `#${String(i+1).padStart(2,'0')} · ${(s.vid.ch || 'YouTube').slice(0, 16)}`;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'screen-btn-group';

    const audioPill = document.createElement('button');
    audioPill.className = `screen-audio-btn ${s.isMuted ? 'muted' : 'unmuted'}`;
    audioPill.title = s.isMuted ? 'Click to Unmute' : 'Muted';
    audioPill.innerHTML = s.isMuted ? '🔇' : '🔊';
    audioPill.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleScreenMute(i);
    });

    const swapBtn = document.createElement('button');
    swapBtn.className = 'screen-action-btn';
    swapBtn.title = 'Swap with next in search queue';
    swapBtn.innerHTML = '↻';
    swapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleScreen(i);
    });

    const focusBtn = document.createElement('button');
    focusBtn.className = 'screen-action-btn';
    focusBtn.title = 'Focus / Super Zoom';
    focusBtn.innerHTML = '🔍';
    focusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      focusScreen(i);
    });

    btnGroup.appendChild(audioPill);
    btnGroup.appendChild(swapBtn);
    btnGroup.appendChild(focusBtn);

    topBar.appendChild(badge);
    topBar.appendChild(btnGroup);

    // Title ticker bar
    const titleBar = document.createElement('div');
    titleBar.className = 'screen-title-bar';
    titleBar.textContent = s.vid.title || 'Live YouTube Feed';

    // Direct embed iframe
    const iframe = document.createElement('iframe');
    iframe.src = YT.embedUrl(s.vid.id, s.isMuted);
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = s.vid.title || '';

    tile.appendChild(topBar);
    tile.appendChild(iframe);
    tile.appendChild(titleBar);

    // Click handler: focus screen AND click-to-unmute
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.screen-audio-btn, .screen-action-btn')) return;
      focusScreen(i);
      if (s.isMuted) {
        unmuteScreen(i);
      }
    });

    // Double click: super zoom close-up
    tile.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      focusScreen(i);
      camZ = 420;
    });

    s.el = tile;
    s.iframe = iframe;
    cluster.appendChild(tile);
  });

  applyLayout();
  updateUILists();
}

// ── Dynamic 3D Layout Engine (Adaptive columns & rows — NO stacking) ───────
function applyLayout() {
  const n = screens.length;
  if (n === 0) return;

  // Determine optimal columns & rows adaptively
  let cols = 3;
  if (n <= 2) cols = n;
  else if (n <= 6) cols = 3;
  else if (n <= 8) cols = 4;
  else if (n <= 12) cols = 4;
  else cols = 5;

  const rows = Math.ceil(n / cols);
  const scaleMod = n > 8 ? 0.88 : (n > 12 ? 0.76 : 1.0);

  screens.forEach((s, i) => {
    if (!s.el) return;
    const c = s.custom;
    let t = '';

    if (layout === 'dome') {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const colOffset = col - (cols - 1) / 2;
      const rowOffset = row - (rows - 1) / 2;

      const angleY = colOffset * (cols > 3 ? 20 : 26) + c.rot;
      const angleX = -rowOffset * 10;

      const xOff = colOffset * (465 * scaleMod) + c.x;
      const yOff = rowOffset * (285 * scaleMod) + c.y;
      const zOff = -520 - Math.abs(colOffset) * 45 - Math.abs(rowOffset) * 25 + c.z;

      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${-angleY}deg) rotateX(${angleX}deg) scale(${c.scale * scaleMod})`;

    } else if (layout === 'flat') {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const colOffset = col - (cols - 1) / 2;
      const rowOffset = row - (rows - 1) / 2;

      const xOff = colOffset * (460 * scaleMod) + c.x;
      const yOff = rowOffset * (280 * scaleMod) + c.y;
      const zOff = -500 + c.z;

      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${c.rot}deg) scale(${c.scale * scaleMod})`;

    } else if (layout === 'ring') {
      const baseAngle = (i / n) * 360 + ringSpinAngle + c.rot;
      const radius = Math.max(680, n * 75) + c.z;

      // Tier multiple rows if large count
      let yTier = 0;
      if (n > 8) {
        const tier = i % 2 === 0 ? -120 : 120;
        yTier = tier;
      }

      t = `rotateY(${baseAngle}deg) translateZ(${radius}px) translateY(${yTier + c.y}px) scale(${c.scale * scaleMod})`;
    }

    s.el.style.transform = t;
  });
}

// ── Silent Video Replacement ───────────────────────────────────────────────
function silentlyCycleScreen(idx) {
  if (!screens[idx]) return;
  const currentIds = screens.map(s => s.vid.id);
  const nextVid = YT.getNextResult(currentIds);
  console.log(`[MitC] Silently replacing Screen #${idx+1} with: "${nextVid.title}" (${nextVid.id})`);
  replaceScreenVideo(idx, nextVid);
}

function cycleScreen(idx) {
  if (!screens[idx]) return;
  const currentIds = screens.map(s => s.vid.id);
  const nextVid = YT.getNextResult(currentIds);
  replaceScreenVideo(idx, nextVid);
  if (typeof toast === 'function') toast(`↻ Screen #${idx+1} swapped: ${nextVid.title.slice(0, 24)}...`);
}

function replaceScreenVideo(idx, newVid) {
  const s = screens[idx];
  if (!s || !s.el) return;
  s.vid = newVid;

  const badge = s.el.querySelector('.screen-badge');
  if (badge) badge.textContent = `#${String(idx+1).padStart(2,'0')} · ${(newVid.ch || 'YouTube').slice(0, 16)}`;
  const titleBar = s.el.querySelector('.screen-title-bar');
  if (titleBar) titleBar.textContent = newVid.title || 'YouTube Feed';

  const iframe = s.el.querySelector('iframe');
  if (iframe) {
    iframe.src = YT.embedUrl(newVid.id, s.isMuted);
  }

  updateUILists();
}

// ── YouTube postMessage Error Interceptor (Auto-cycles on error) ────────────
window.addEventListener('message', e => {
  if (!e.data || typeof e.data !== 'string') return;
  let data;
  try { data = JSON.parse(e.data); } catch { return; }
  if (data.event === 'onError' || (data.info && typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info))) {
    screens.forEach((s, idx) => {
      const iframe = s.el && s.el.querySelector('iframe');
      if (iframe && iframe.contentWindow === e.source) {
        console.warn(`[MitC] Intercepted video error on Screen #${idx+1} — silently cycling`);
        silentlyCycleScreen(idx);
      }
    });
  }
});

// ── Audio & Volume Mixer Controls ───────────────────────────────────────────
function unmuteScreen(idx) {
  const s = screens[idx];
  if (!s) return;

  if (soloAudioMode) {
    screens.forEach((other, oIdx) => {
      if (oIdx !== idx) muteScreen(oIdx);
    });
  }

  s.isMuted = false;
  const effective = Math.round((s.volume * masterVolume) / 100);
  postMessageToScreen(idx, { event: 'command', func: 'unMute', args: [] });
  postMessageToScreen(idx, { event: 'command', func: 'setVolume', args: [effective] });

  updateScreenAudioUI(idx);
  updateUILists();
  if (typeof toast === 'function') toast(`🔊 Screen #${idx+1} Audio Active (${s.vid.title.slice(0, 22)}...)`);
}

function muteScreen(idx) {
  const s = screens[idx];
  if (!s) return;
  s.isMuted = true;
  postMessageToScreen(idx, { event: 'command', func: 'mute', args: [] });
  updateScreenAudioUI(idx);
  updateUILists();
}

function toggleScreenMute(idx) {
  const s = screens[idx];
  if (!s) return;
  if (s.isMuted) unmuteScreen(idx);
  else muteScreen(idx);
}

function setScreenVolume(idx, vol) {
  const s = screens[idx];
  if (!s) return;
  s.volume = Math.max(0, Math.min(100, parseInt(vol, 10)));
  const effective = Math.round((s.volume * masterVolume) / 100);
  if (!s.isMuted) {
    postMessageToScreen(idx, { event: 'command', func: 'setVolume', args: [effective] });
  }
  updateUILists();
}

function setMasterVolume(vol) {
  masterVolume = Math.max(0, Math.min(100, parseInt(vol, 10)));
  screens.forEach((s, i) => {
    if (!s.isMuted) {
      const effective = Math.round((s.volume * masterVolume) / 100);
      postMessageToScreen(i, { event: 'command', func: 'setVolume', args: [effective] });
    }
  });
  updateUILists();
}

function toggleMasterMute() {
  masterMuted = !masterMuted;
  screens.forEach((s, i) => {
    if (masterMuted) muteScreen(i);
    else if (i === 0 || i === focusedIdx) unmuteScreen(i);
  });
  if (typeof toast === 'function') toast(masterMuted ? '🔇 ALL SCREENS MUTED' : '🔊 AUDIO UNMUTED');
  updateUILists();
}

function setSoloAudioMode(enable) {
  soloAudioMode = enable;
  if (soloAudioMode && focusedIdx !== null) {
    unmuteScreen(focusedIdx);
  }
}

function updateScreenAudioUI(idx) {
  const s = screens[idx];
  if (!s || !s.el) return;
  const audioBtn = s.el.querySelector('.screen-audio-btn');
  if (audioBtn) {
    audioBtn.className = `screen-audio-btn ${s.isMuted ? 'muted' : 'unmuted'}`;
    audioBtn.innerHTML = s.isMuted ? '🔇' : '🔊';
    audioBtn.title = s.isMuted ? 'Click to Unmute' : 'Muted';
  }
}

function postMessageToScreen(idx, data) {
  const s = screens[idx];
  if (!s || !s.el) return;
  const iframe = s.el.querySelector('iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    } catch (e) {}
  }
}

// ── Focus & Camera ─────────────────────────────────────────────────────────
function focusScreen(idx) {
  focusedIdx = idx;
  screens.forEach((s, i) => s.el && s.el.classList.toggle('focused', i === idx));

  const vp = document.getElementById('viewport');
  if (vp && cameraMode === 'chair') {
    const cols = screens.length <= 2 ? screens.length : (screens.length <= 8 ? 4 : 5);
    const col = idx % cols;
    const colOffset = col - (cols - 1) / 2;
    const angleY = colOffset * 22;
    vp.style.transform = `translate3d(0,0,0) rotateX(0deg) rotateY(${-angleY}deg) translateZ(280px)`;
  }

  if (window.onFocus) window.onFocus(idx, screens[idx]);
  updateUILists();
}

function unfocus() {
  focusedIdx = null;
  screens.forEach(s => s.el && s.el.classList.remove('focused'));
  resetCam();
  if (window.onUnfocus) window.onUnfocus();
  updateUILists();
}

window.addEventListener('click', e => {
  if (focusedIdx !== null &&
      !e.target.closest('.holo-screen') &&
      !e.target.closest('.side-panel,.top-hud,.pills-bar,.bottom-bar')) {
    unfocus();
  }
});

function resetCam() {
  tRotX = 0; tRotY = 0; rotX = 0; rotY = 0;
  tCamX = 0; tCamY = 0; camX = 0; camY = 0;
  camZ = 0;
  const vp = document.getElementById('viewport');
  if (vp) vp.style.transform = 'translate3d(0,0,0) rotateX(0deg) rotateY(0deg) translateZ(0px)';
}

function setCameraMode(m) {
  cameraMode = m;
  if (m === 'tactical') {
    const vp = document.getElementById('viewport');
    if (vp) vp.style.transform = 'translate3d(0,100px,0) rotateX(32deg) rotateY(0deg) translateZ(-160px)';
  } else {
    resetCam();
  }
}

function setLayout(l) {
  layout = l;
  applyLayout();
}

function toggleRingSpin() {
  ringSpinEnabled = !ringSpinEnabled;
  if (typeof toast === 'function') toast(ringSpinEnabled ? '🔄 360° Carousel Spin ON' : '⏸ 360° Carousel Spin PAUSED');
}

function resetLayout() {
  screens.forEach(s => { s.custom = { scale: 1, x: 0, y: 0, z: 0, rot: 0 }; });
  applyLayout();
}

// ── Screen Management (Add / Remove) ─────────────────────────────────────────
function addScreen(vid) {
  screens.push({
    vid,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    isMuted: true,
    volume: 100
  });
  rebuildDOM();
}

function removeScreen(idx) {
  screens.splice(idx, 1);
  unfocus();
  rebuildDOM();
}

function updateCustom(idx, prop, val) {
  if (!screens[idx]) return;
  screens[idx].custom[prop] = parseFloat(val);
  applyLayout();
}

// ── Layout Persistence ─────────────────────────────────────────────────────
function saveLayout() {
  const data = {
    layout,
    screens: screens.map(s => ({ vid: s.vid, custom: s.custom, volume: s.volume }))
  };
  localStorage.setItem('mitc_layout', JSON.stringify(data));
}

function loadLayout() {
  const raw = localStorage.getItem('mitc_layout');
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    layout = data.layout || 'dome';
    screens = data.screens.map(s => ({
      vid: s.vid,
      custom: s.custom,
      isMuted: true,
      volume: s.volume || 100
    }));
    rebuildDOM();
    return true;
  } catch (e) { return false; }
}

// ── UI Synchronization (Playlist list & Volume Mixer sync) ──────────────────
function updateUILists() {
  const statEl = document.getElementById('stat-count');
  if (statEl) statEl.textContent = screens.length;

  const playlistContainer = document.getElementById('playlist-list');
  if (playlistContainer) {
    playlistContainer.innerHTML = '';
    screens.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = `playlist-item ${idx === focusedIdx ? 'active' : ''}`;

      item.innerHTML = `
        <div class="pl-num">#${String(idx+1).padStart(2,'0')}</div>
        <div class="pl-info">
          <div class="pl-title" title="${s.vid.title || ''}">${s.vid.title || 'YouTube Stream'}</div>
          <div class="pl-ch">${s.vid.ch || 'YouTube'}</div>
        </div>
        <div class="pl-actions">
          <button class="pl-btn audio-btn ${s.isMuted ? 'muted' : 'unmuted'}" title="${s.isMuted ? 'Unmute' : 'Mute'}">
            ${s.isMuted ? '🔇' : '🔊'}
          </button>
          <button class="pl-btn focus-btn" title="Focus in 3D">🎯</button>
          <button class="pl-btn swap-btn" title="Next in Queue">↻</button>
          <button class="pl-btn del-btn" title="Remove">✕</button>
        </div>
      `;

      item.querySelector('.audio-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleScreenMute(idx);
      });
      item.querySelector('.focus-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        focusScreen(idx);
      });
      item.querySelector('.swap-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        cycleScreen(idx);
      });
      item.querySelector('.del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeScreen(idx);
      });
      item.addEventListener('click', () => {
        focusScreen(idx);
        if (s.isMuted) unmuteScreen(idx);
      });

      playlistContainer.appendChild(item);
    });

    const queueStats = YT.getQueueStats();
    const queueInfo = document.getElementById('playlist-queue-info');
    if (queueInfo) {
      queueInfo.textContent = `Queue: ${queueStats.remaining} more live results buffered for "${YT.currentQuery || 'topic'}"`;
    }
  }

  const mixerStrips = document.getElementById('mixer-strips');
  if (mixerStrips) {
    mixerStrips.innerHTML = '';
    screens.forEach((s, idx) => {
      const strip = document.createElement('div');
      strip.className = `mixer-strip ${s.isMuted ? 'muted' : 'active'}`;

      strip.innerHTML = `
        <div class="strip-header">
          <span class="strip-badge">#${String(idx+1).padStart(2,'0')}</span>
          <span class="strip-title" title="${s.vid.title || ''}">${s.vid.title || 'Screen'}</span>
        </div>
        <div class="strip-fader-row">
          <input type="range" class="strip-slider" min="0" max="100" value="${s.volume}" />
          <span class="strip-vol-num">${s.volume}%</span>
        </div>
        <div class="strip-btns">
          <button class="strip-mute-btn ${s.isMuted ? 'is-muted' : ''}">
            ${s.isMuted ? 'MUTE' : 'LIVE'}
          </button>
          <button class="strip-solo-btn ${idx === focusedIdx && !s.isMuted ? 'is-solo' : ''}">
            SOLO
          </button>
        </div>
      `;

      const slider = strip.querySelector('.strip-slider');
      const numSpan = strip.querySelector('.strip-vol-num');
      slider.addEventListener('input', (e) => {
        numSpan.textContent = `${e.target.value}%`;
        setScreenVolume(idx, e.target.value);
      });

      strip.querySelector('.strip-mute-btn').addEventListener('click', () => {
        toggleScreenMute(idx);
      });

      strip.querySelector('.strip-solo-btn').addEventListener('click', () => {
        focusScreen(idx);
        unmuteScreen(idx);
      });

      mixerStrips.appendChild(strip);
    });
  }

  const muteAllBtn = document.getElementById('btn-mute-all');
  if (muteAllBtn) {
    const anyUnmuted = screens.some(s => !s.isMuted);
    muteAllBtn.innerHTML = anyUnmuted ? '🔊 AUDIO ON' : '🔇 MUTE ALL';
    muteAllBtn.classList.toggle('active', anyUnmuted);
  }
}

function glitch(ms = 350) {
  screens.forEach(s => {
    if (!s.el) return;
    const rx = (Math.random() - 0.5) * 35, ry = (Math.random() - 0.5) * 35;
    s.el.style.transform = `scale(1.06) translate(${rx}px,${ry}px)`;
  });
  setTimeout(applyLayout, ms);
}
