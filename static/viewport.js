// ─── 3D Viewport, Multi-Screen Spatial Matrix & Visual FX Engine ──────────────
let screens = [];            // [{ vid:{id,title,ch}, custom:{scale,x,y,z,rot}, isMuted, volume, computedVol, screenPos }]
let focusedIdx = null;
let cameraMode = 'chair';
let layout = 'dome';
let soloAudioMode = true;    // Unmuting one screen mutes others
let masterVolume = 100;
let masterMuted = false;

// Layout Spacing & Density
let screenSpacing = 1.0;     // 0.4 to 1.8

// Visual FX state
let visualFX = {
  theme: 'cyber',            // 'cyber', 'green-vector', 'amber-tactical', 'cyan-holo', 'synthwave'
  dofEnabled: false,
  dofStrength: 6,
  scanlinesEnabled: true,
  scanlineOpacity: 0.22,
  floorGridBrightness: 1.0
};

// Spatial 3D Audio state
let spatialAudio = {
  enabled: true,
  separation: 1.0,           // 0.2 to 2.5
  singlePriority: false,     // Closest screen gets full dominance
  lastUpdate: 0
};

// UI Visibility state
let isUiHidden = false;

// Camera & 3D space state (ONLY moves when mouse button is clicked and held)
let draggingLeft = false, draggingRight = false;
let mx = 0, my = 0;
let rotX = 0, rotY = 0, tRotX = 0, tRotY = 0;
let camX = 0, camY = 0, tCamX = 0, tCamY = 0;
let camZ = 0;
let orbitAngle = 0;

// 360° Ring Spin state
let ringSpinAngle = 0;
let ringSpinEnabled = true;
let ringSpinSpeed = 0.07;

// Cinematic sequence state
let isCinematicRunning = false;
let cinematicCancelFn = null;

function initViewport() {
  const vp = document.getElementById('viewport');

  // Prevent right-click context menu for smooth panning
  window.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('mousedown', e => {
    if (e.target.closest('.top-hud,.pills-bar,.side-panel,.bottom-bar,.modal-back,#cinematic-overlay,#ui-restore-btn')) return;
    if (e.button === 0) draggingLeft = true;
    else if (e.button === 2) draggingRight = true;
    mx = e.clientX; my = e.clientY;
  });

  // ONLY rotate or pan when mouse button is actively held down (NO hover tracking)
  window.addEventListener('mousemove', e => {
    const dx = e.clientX - mx, dy = e.clientY - my;
    mx = e.clientX; my = e.clientY;

    if (draggingLeft) {
      tRotY += dx * 0.38;
      tRotX -= dy * 0.28;
      tRotX = Math.max(-75, Math.min(75, tRotX));
    } else if (draggingRight) {
      tCamX += dx * 0.85;
      tCamY += dy * 0.85;
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button === 0) draggingLeft = false;
    if (e.button === 2) draggingRight = false;
  });

  // Deep zoom (allows zooming right up to screens)
  window.addEventListener('wheel', e => {
    if (e.target.closest('.side-panel')) return;
    camZ = Math.max(-850, Math.min(680, camZ - e.deltaY * 0.75));
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
    if (e.key === '+' || e.key === '=') camZ = Math.min(680, camZ + 60);
    if (e.key === '-' || e.key === '_') camZ = Math.max(-850, camZ - 60);
    if (e.key === ' ' || e.key === 'r') resetCam();
    if (e.key === 'm') toggleMasterMute();
    if (e.key === 'h' || e.key === 'H') toggleHideUI();
    if (e.key === 'Escape') {
      if (isCinematicRunning && cinematicCancelFn) cinematicCancelFn();
      else if (isUiHidden) toggleHideUI();
      else unfocus();
    }
  });

  requestAnimationFrame(loop);
}

function loop() {
  requestAnimationFrame(loop);
  const vp = document.getElementById('viewport');
  if (!vp) return;

  // 360° Ring Spin update
  if (layout === 'ring' && ringSpinEnabled && focusedIdx === null && !draggingLeft && !isCinematicRunning) {
    ringSpinAngle = (ringSpinAngle + ringSpinSpeed) % 360;
    applyLayout();
  }

  // Camera rendering
  if (!isCinematicRunning) {
    if (cameraMode === 'orbit') {
      orbitAngle = (orbitAngle + 0.35) % 360;
      vp.style.transform = `translate3d(${camX}px,${camY}px,0) rotateX(15deg) rotateY(${orbitAngle}deg) translateZ(-60px)`;
    } else if (focusedIdx === null) {
      rotX += (tRotX - rotX) * 0.12;
      rotY += (tRotY - rotY) * 0.12;
      camX += (tCamX - camX) * 0.12;
      camY += (tCamY - camY) * 0.12;
      vp.style.transform = `translate3d(${camX}px,${camY}px,0) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${camZ}px)`;
    }
  }

  // Spatial Audio & DoF update loop
  const now = performance.now();
  if (now - spatialAudio.lastUpdate > 65 && !isCinematicRunning) {
    spatialAudio.lastUpdate = now;
    updateSpatialAudioAndDoF();
  }
}

// ── Load a set of videos onto the 3D grid ─────────────────────────────────
function loadScreens(vids) {
  screens = vids.map((v, i) => ({
    vid: v,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    isMuted: true,
    volume: 100,
    computedVol: 100,
    screenPos: { x: 0, y: 0, z: 0 }
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

    // Direct embed iframe (with 720p cap)
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
      camZ = 450;
    });

    s.el = tile;
    s.iframe = iframe;
    cluster.appendChild(tile);

    // Cap playback quality to 720p
    setTimeout(() => {
      postMessageToScreen(i, { event: 'command', func: 'setPlaybackQuality', args: ['hd720'] });
    }, 1200);
  });

  applyLayout();
  updateUILists();
  applyVisualFX();
}

// ── Dynamic 3D Layout Engine ───────────────────────────────────────────────
function applyLayout() {
  if (isCinematicRunning) return;
  const n = screens.length;
  if (n === 0) return;

  let cols = 3;
  if (n <= 2) cols = n;
  else if (n <= 4) cols = 2;
  else if (n <= 9) cols = 3;
  else if (n <= 16) cols = 4;
  else cols = 5;

  const rows = Math.ceil(n / cols);
  const scaleMod = n > 16 ? 0.72 : (n > 12 ? 0.80 : (n > 9 ? 0.84 : 1.0));

  screens.forEach((s, i) => {
    if (!s.el) return;
    const c = s.custom;
    let t = '';

    if (layout === 'dome') {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const colOffset = col - (cols - 1) / 2;
      const rowOffset = row - (rows - 1) / 2;

      const angleY = colOffset * (cols > 3 ? 18 : 25) + c.rot;
      const angleX = -rowOffset * 8;

      const xOff = colOffset * (465 * screenSpacing * scaleMod) + c.x;
      const yOff = rowOffset * (285 * screenSpacing * scaleMod) + c.y;
      const zOff = -520 - Math.abs(colOffset) * (45 * screenSpacing) - Math.abs(rowOffset) * 25 + c.z;

      s.screenPos = { x: xOff, y: yOff, z: zOff };
      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${-angleY}deg) rotateX(${angleX}deg) scale(${c.scale * scaleMod})`;

    } else if (layout === 'flat') {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const colOffset = col - (cols - 1) / 2;
      const rowOffset = row - (rows - 1) / 2;

      const xOff = colOffset * (460 * screenSpacing * scaleMod) + c.x;
      const yOff = rowOffset * (280 * screenSpacing * scaleMod) + c.y;
      const zOff = -500 + c.z;

      s.screenPos = { x: xOff, y: yOff, z: zOff };
      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${c.rot}deg) scale(${c.scale * scaleMod})`;

    } else if (layout === 'ring') {
      const baseAngle = (i / n) * 360 + ringSpinAngle + c.rot;
      const radius = Math.max(680, n * 65 * screenSpacing) + c.z;

      let yTier = 0;
      if (n > 8) {
        yTier = (i % 2 === 0 ? -130 : 130) * screenSpacing;
      }

      const rad = (baseAngle * Math.PI) / 180;
      s.screenPos = {
        x: Math.sin(rad) * radius + c.x,
        y: yTier + c.y,
        z: -Math.cos(rad) * radius
      };

      t = `rotateY(${baseAngle}deg) translateZ(${radius}px) translateY(${yTier + c.y}px) scale(${c.scale * scaleMod})`;
    }

    s.el.style.transform = t;
  });
}

// ── Spatial 3D Audio & Depth of Field Engine ────────────────────────────────
function updateSpatialAudioAndDoF() {
  if (screens.length === 0) return;

  let minDistance = Infinity;
  let closestIdx = -1;
  const distances = [];

  screens.forEach((s, idx) => {
    if (!s.screenPos) return;
    const dx = s.screenPos.x - camX;
    const dy = s.screenPos.y - camY;
    const dz = s.screenPos.z - (-camZ);
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    distances.push(dist);

    if (dist < minDistance) {
      minDistance = dist;
      closestIdx = idx;
    }
  });

  screens.forEach((s, idx) => {
    const dist = distances[idx] || 500;

    // 1. Spatial Audio Volume Calculation
    if (spatialAudio.enabled && !s.isMuted && !masterMuted) {
      let spatialFactor = 1.0;

      if (spatialAudio.singlePriority) {
        spatialFactor = idx === closestIdx ? 1.0 : Math.max(0.05, 1.0 - (dist - minDistance) / 400);
      } else {
        const normalized = (dist - minDistance) / (700 / Math.max(0.2, spatialAudio.separation));
        spatialFactor = Math.max(0.1, 1.0 / (1.0 + normalized * spatialAudio.separation * 1.5));
      }

      const effective = Math.round(((s.volume * masterVolume) / 100) * spatialFactor);
      if (effective !== s.computedVol) {
        s.computedVol = effective;
        postMessageToScreen(idx, { event: 'command', func: 'setVolume', args: [effective] });
      }
    }

    // 2. Depth of Field Blur
    if (visualFX.dofEnabled && s.el && !isCinematicRunning) {
      const isFocusedTile = idx === focusedIdx;
      if (isFocusedTile) {
        s.el.style.filter = 'none';
      } else {
        const delta = Math.abs(dist - minDistance);
        const blurPx = Math.min(visualFX.dofStrength, (delta / 450) * visualFX.dofStrength);
        s.el.style.filter = blurPx > 0.6 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
      }
    } else if (s.el && s.el.style.filter && !isCinematicRunning) {
      s.el.style.filter = 'none';
    }
  });
}

// ── Visual FX System ───────────────────────────────────────────────────────
function applyVisualFX() {
  if (isCinematicRunning) return;

  document.body.className = '';
  if (isUiHidden) document.body.classList.add('ui-hidden');

  if (visualFX.theme === 'green-vector') {
    document.body.classList.add('fx-green-vector');
  } else if (visualFX.theme === 'amber-tactical') {
    document.body.classList.add('fx-amber-tactical');
  } else if (visualFX.theme === 'cyan-holo') {
    document.body.classList.add('fx-cyan-holo');
  } else if (visualFX.theme === 'synthwave') {
    document.body.classList.add('fx-synthwave');
  }

  document.documentElement.style.setProperty(
    '--scanline-opacity',
    visualFX.scanlinesEnabled ? visualFX.scanlineOpacity : 0
  );

  const grid = document.querySelector('.floor-grid');
  if (grid) {
    grid.style.display = 'block';
    grid.style.opacity = visualFX.floorGridBrightness;
  }
}

function setVisualTheme(theme) {
  visualFX.theme = theme;
  applyVisualFX();
}

function setScreenSpacing(val) {
  screenSpacing = Math.max(0.4, Math.min(2.0, parseFloat(val)));
  applyLayout();
}

// ── Hide / Show Interface ──────────────────────────────────────────────────
function toggleHideUI() {
  isUiHidden = !isUiHidden;
  document.body.classList.toggle('ui-hidden', isUiHidden);
  const restoreBtn = document.getElementById('ui-restore-btn');
  if (restoreBtn) restoreBtn.style.display = isUiHidden ? 'flex' : 'none';
  toast(isUiHidden ? 'UI Hidden (Press [H] or ESC to restore)' : 'UI Restored');
}

// ── Audio & Volume Controls (Respects Solo Mode) ────────────────────────────
function unmuteScreen(idx) {
  const s = screens[idx];
  if (!s) return;

  if (soloAudioMode && !isCinematicRunning) {
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
  if (typeof toast === 'function' && !isCinematicRunning) toast(`🔊 Screen #${idx+1} Audio Active (${s.vid.title.slice(0, 22)}...)`);
}

// Smoothly dissolves in audio volume over durationMs to match visual opacity dissolve
function fadeAudioIn(idx, targetVol, durationMs = 2200) {
  const s = screens[idx];
  if (!s) return;
  s.isMuted = false;
  postMessageToScreen(idx, { event: 'command', func: 'unMute', args: [] });
  postMessageToScreen(idx, { event: 'command', func: 'setVolume', args: [0] });
  updateScreenAudioUI(idx);

  const startT = performance.now();
  function ramp(now) {
    if (!isCinematicRunning && s.isMuted) return;
    const elapsed = now - startT;
    const progress = Math.min(1, elapsed / durationMs);
    const curVol = Math.round(targetVol * progress);
    s.volume = curVol;
    postMessageToScreen(idx, { event: 'command', func: 'setVolume', args: [curVol] });
    if (progress < 1) requestAnimationFrame(ramp);
  }
  requestAnimationFrame(ramp);
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
  if (masterMuted) {
    screens.forEach((s, i) => muteScreen(i));
    toast('🔇 ALL SCREENS MUTED');
  } else {
    if (soloAudioMode) {
      const target = focusedIdx !== null ? focusedIdx : 0;
      screens.forEach((s, i) => {
        if (i === target) unmuteScreen(i);
        else muteScreen(i);
      });
      toast(`🔊 SOLO AUDIO ACTIVE (Screen #${target+1})`);
    } else {
      screens.forEach((s, i) => unmuteScreen(i));
      toast('🔊 MULTI-STREAM AUDIO ACTIVE');
    }
  }
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

// ── Silent Video Replacement ───────────────────────────────────────────────
function silentlyCycleScreen(idx) {
  if (!screens[idx]) return;
  const currentIds = screens.map(s => s.vid.id);
  const nextVid = YT.getNextResult(currentIds);
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

// YouTube postMessage Error Interceptor
window.addEventListener('message', e => {
  if (!e.data || typeof e.data !== 'string') return;
  let data;
  try { data = JSON.parse(e.data); } catch { return; }
  if (data.event === 'onError' || (data.info && typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info))) {
    screens.forEach((s, idx) => {
      const iframe = s.el && s.el.querySelector('iframe');
      if (iframe && iframe.contentWindow === e.source) {
        silentlyCycleScreen(idx);
      }
    });
  }
});

// ── Focus & Camera ─────────────────────────────────────────────────────────
function focusScreen(idx) {
  focusedIdx = idx;
  screens.forEach((s, i) => s.el && s.el.classList.toggle('focused', i === idx));

  const vp = document.getElementById('viewport');
  if (vp && cameraMode === 'chair') {
    const cols = screens.length <= 2 ? screens.length : (screens.length <= 9 ? 3 : 4);
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
      !e.target.closest('.side-panel,.top-hud,.pills-bar,.bottom-bar,#cinematic-overlay')) {
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
  screenSpacing = 1.0;
  screens.forEach(s => { s.custom = { scale: 1, x: 0, y: 0, z: 0, rot: 0 }; });
  applyLayout();
}

// ── Screen Management (Add / Remove) ─────────────────────────────────────────
function addScreen(vid) {
  screens.push({
    vid,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    isMuted: true,
    volume: 100,
    computedVol: 100,
    screenPos: { x: 0, y: 0, z: 0 }
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
    screenSpacing,
    visualFX,
    spatialAudio,
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
    if (data.screenSpacing) screenSpacing = data.screenSpacing;
    if (data.visualFX) Object.assign(visualFX, data.visualFX);
    if (data.spatialAudio) Object.assign(spatialAudio, data.spatialAudio);
    screens = data.screens.map(s => ({
      vid: s.vid,
      custom: s.custom,
      isMuted: true,
      volume: s.volume || 100,
      computedVol: 100,
      screenPos: { x: 0, y: 0, z: 0 }
    }));
    rebuildDOM();
    applyVisualFX();
    return true;
  } catch (e) { return false; }
}

// ── UI Synchronization ──────────────────────────────────────────────────────
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

// ── 🎬 CINEMATIC EXPERIENCES (Option 1: 10s Hero Solo Gaze -> 25-Stream Grand Constellation) ──
async function launchCinematic(optionType, topic) {
  if (isCinematicRunning) return;
  isCinematicRunning = true;

  const overlay = document.getElementById('cinematic-overlay');
  const banner = document.getElementById('cinematic-banner');
  const windupBox = document.getElementById('cinematic-windup-box');
  const windupTimer = document.getElementById('windup-timer-text');
  const windupFill = document.getElementById('windup-progress-fill');
  const vp = document.getElementById('viewport');
  const grid = document.querySelector('.floor-grid');

  // Hardcode 100% pure black void across entire page and DOM
  document.documentElement.style.background = '#000000';
  document.body.style.background = '#000000';
  document.body.style.backgroundImage = 'none';
  if (grid) grid.style.display = 'none';
  document.documentElement.classList.add('cinematic-blackout');
  document.body.classList.add('cinematic-blackout');

  const streamCount = optionType === 1 ? 25 : 15;

  if (overlay) overlay.style.display = 'flex';
  if (windupBox) windupBox.style.display = 'flex';
  if (banner) banner.textContent = `BUFFERING ${streamCount} HD STREAMS FOR "${(topic || 'TOPIC').toUpperCase()}"`;

  // Fetch 25 REAL videos matching the searched topic
  const vids = await YT.getCinematic25(topic || YT.currentQuery || 'space');
  loadScreens(vids);
  muteAllScreensQuiet();

  // ── 25 Constellation Coordinates (10s Hero Linger, then Waves from T = 10.5s to 34.5s) ──
  const baseConstellation = [
    // Hero: Solo at T = 0s
    { bx: 0,     by: 0,    bz: 0,    time: 0,     vol: 100, b: 1.0 },
    
    // Wave 1 (T = 10.5s - 11.8s): 2 Inner corners
    { bx: -330,  by: -160, bz: 0,    time: 10.5,  vol: 60,  b: 1.0 },
    { bx: 330,   by: 160,  bz: 0,    time: 11.8,  vol: 60,  b: 1.0 },
    
    // Wave 2 (T = 13.0s - 14.2s): Other 2 inner corners
    { bx: 330,   by: -160, bz: 0,    time: 13.0,  vol: 55,  b: 1.0 },
    { bx: -330,  by: 160,  bz: 0,    time: 14.2,  vol: 55,  b: 1.0 },
    
    // Wave 3 (T = 15.5s - 18.5s): 4 Cross positions (Flanks & Poles)
    { bx: -590,  by: 0,    bz: -40,  time: 15.5,  vol: 50,  b: 0.95 },
    { bx: 590,   by: 0,    bz: -40,  time: 16.5,  vol: 50,  b: 0.95 },
    { bx: 0,     by: -290, bz: -40,  time: 17.5,  vol: 48,  b: 0.95 },
    { bx: 0,     by: 290,  bz: -40,  time: 18.5,  vol: 48,  b: 0.95 },
    
    // Wave 4 (T = 19.5s - 22.5s): 4 Mid diagonals
    { bx: -580,  by: -290, bz: -80,  time: 19.5,  vol: 45,  b: 0.90 },
    { bx: 580,   by: -290, bz: -80,  time: 20.5,  vol: 45,  b: 0.90 },
    { bx: -580,  by: 290,  bz: -80,  time: 21.5,  vol: 45,  b: 0.90 },
    { bx: 580,   by: 290,  bz: -80,  time: 22.5,  vol: 45,  b: 0.90 },
    
    // Wave 5 (T = 23.5s - 28.5s): 6 Outer wings & zenith/pedestal
    { bx: -840,  by: -140, bz: -120, time: 23.5,  vol: 40,  b: 0.85 },
    { bx: 840,   by: 140,  bz: -120, time: 24.5,  vol: 40,  b: 0.85 },
    { bx: 840,   by: -140, bz: -120, time: 25.5,  vol: 40,  b: 0.85 },
    { bx: -840,  by: 140,  bz: -120, time: 26.5,  vol: 40,  b: 0.85 },
    { bx: -300,  by: -430, bz: -120, time: 27.5,  vol: 38,  b: 0.85 },
    { bx: 300,   by: 430,  bz: -120, time: 28.5,  vol: 38,  b: 0.85 },
    
    // Wave 6 (T = 29.5s - 34.5s): 6 Deep background periphery
    { bx: -820,  by: -410, bz: -180, time: 29.5,  vol: 35,  b: 0.80 },
    { bx: 820,   by: 410,  bz: -180, time: 30.5,  vol: 35,  b: 0.80 },
    { bx: -820,  by: 410,  bz: -180, time: 31.5,  vol: 35,  b: 0.80 },
    { bx: 820,   by: -410, bz: -180, time: 32.5,  vol: 35,  b: 0.80 },
    { bx: -1080, by: 0,    bz: -200, time: 33.5,  vol: 32,  b: 0.78 },
    { bx: 1080,  by: 0,    bz: -200, time: 34.5,  vol: 32,  b: 0.78 }
  ];

  const flatConstellation = [];
  baseConstellation.forEach((sec, idx) => {
    if (idx === 0) {
      flatConstellation.push({ x: 0, y: 0, z: 0, time: 0, vol: 100, b: 1.0 });
    } else {
      const jitterX = Math.round((Math.random() - 0.5) * 35);
      const jitterY = Math.round((Math.random() - 0.5) * 25);
      const jitterZ = Math.round((Math.random() - 0.5) * 20);
      flatConstellation.push({
        x: sec.bx + jitterX,
        y: sec.by + jitterY,
        z: sec.bz + jitterZ,
        time: sec.time,
        vol: sec.vol,
        b: sec.b
      });
    }
  });

  const HOLO_OPACITY = '0.88';

  // Initialize screen positions & opacity
  screens.forEach((s, idx) => {
    const pos = flatConstellation[idx] || flatConstellation[0];
    s.screenPos = { x: pos.x, y: pos.y, z: pos.z };
    if (s.el) {
      s.el.style.transform = `translate3d(${pos.x}px,${pos.y}px,${pos.z}px) rotateY(0deg) rotateX(0deg) scale(1)`;
      s.el.style.filter = `brightness(${pos.b})`;
      if (idx === 0) {
        s.el.style.opacity = HOLO_OPACITY;
        s.el.style.transition = 'opacity 1.5s ease, transform 0.4s ease';
      } else {
        s.el.style.opacity = '0';
        s.el.style.transition = 'opacity 2.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 2.2s ease';
      }
    }
  });

  let isCancelled = false;
  cinematicCancelFn = () => {
    isCancelled = true;
    isCinematicRunning = false;
    document.documentElement.classList.remove('cinematic-blackout');
    document.body.classList.remove('cinematic-blackout', 'grid-visible');
    document.documentElement.style.background = '';
    document.body.style.background = '';
    document.body.style.backgroundImage = '';
    if (grid) grid.style.display = 'block';
    if (overlay) overlay.style.display = 'none';
    if (windupBox) windupBox.style.display = 'none';
    screens.forEach(s => {
      if (s.el) {
        s.el.style.opacity = '1';
        s.el.style.filter = '';
        s.el.style.transform = '';
        s.el.style.transition = 'opacity 0.4s ease, transform 0.35s ease';
      }
    });
    resetCam();
    unfocus();
    applyVisualFX();
    applyLayout();
    toast('Cinematic exited');
  };

  // ── 5-SECOND BUFFER WINDUP COUNTDOWN ─────────────────────────────────────────
  const warmupStart = performance.now();
  const warmupDuration = 5000;

  await new Promise(resolve => {
    function tickWarmup(now) {
      if (isCancelled) return resolve();
      const elapsed = now - warmupStart;
      const remaining = Math.max(0, (warmupDuration - elapsed) / 1000);
      const pct = Math.min(100, (elapsed / warmupDuration) * 100);

      if (windupTimer) windupTimer.textContent = `${remaining.toFixed(1)}s`;
      if (windupFill) windupFill.style.width = `${pct}%`;

      if (elapsed < warmupDuration) {
        requestAnimationFrame(tickWarmup);
      } else {
        if (windupBox) windupBox.style.display = 'none';
        resolve();
      }
    }
    requestAnimationFrame(tickWarmup);
  });

  if (isCancelled) return;

  // ── OPTION 1: 10s HERO SOLO GAZE -> 25-STREAM CONSTELLATION ────────────────
  if (optionType === 1) {
    let ignitedCount = 1;

    // Start Hero video right in center, with camera up-close at camZ = 380px to fill the frame
    const heroScreen = screens[0];
    let curZ = 380;
    vp.style.transform = `translate3d(0,0,0) rotateX(0deg) rotateY(0deg) translateZ(${curZ}px)`;

    if (heroScreen && heroScreen.el) {
      heroScreen.el.style.opacity = HOLO_OPACITY;
      heroScreen.el.style.transform = 'translate3d(0px,0px,0px) rotateY(0deg) rotateX(0deg) scale(1)';
      unmuteScreen(0);
      setScreenVolume(0, 100);
    }

    const sequenceStart = performance.now();
    const lingerDuration = 10000;  // 10.0s intimate hero solo gaze!
    const zoomDuration = 45000;    // 45.0s majestic cosmic pull-back
    const totalDuration = lingerDuration + zoomDuration; // 55s total

    // Helper: Dissolves in screen and starts audio
    function dissolveScreenIn(idx, pos, targetVol) {
      const s = screens[idx];
      if (!s || !s.el || s._ignited) return;
      s._ignited = true;

      s.el.style.transition = 'opacity 2.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 2.2s ease';
      s.el.style.opacity = HOLO_OPACITY;
      s.el.style.filter = `brightness(${pos.b})`;
      s.el.style.boxShadow = '0 0 36px rgba(0,240,255,0.35), inset 0 0 18px rgba(0,240,255,0.18)';

      setTimeout(() => {
        if (s.el && isCinematicRunning) {
          s.el.style.boxShadow = '0 0 24px rgba(0,240,255,0.2), inset 0 0 12px rgba(0,240,255,0.08)';
        }
      }, 2400);

      fadeAudioIn(idx, targetVol, 2200);

      ignitedCount++;
      if (banner && isCinematicRunning) {
        banner.textContent = `UNVEILING 25-STREAM CONSTELLATION (${ignitedCount}/25 ACTIVE)`;
      }
    }

    function animateConstellation(now) {
      if (isCancelled) return;
      const elapsed = now - sequenceStart;
      const elapsedSec = elapsed / 1000;

      // ── PHASE 1: FULL-FRAME HERO SOLO GAZE (0s to 10.0s) ───────────────────
      if (elapsed <= lingerDuration) {
        const p = elapsed / lingerDuration;
        const driftPitch = Math.sin(p * Math.PI) * 1.5;
        const driftYaw = Math.sin(p * Math.PI * 0.8) * 1.5;
        curZ = 380 - p * 15; // 380 to 365
        vp.style.transform = `translate3d(0,0,0) rotateX(${driftPitch}deg) rotateY(${driftYaw}deg) translateZ(${curZ}px)`;
        if (banner && isCinematicRunning) {
          const remain = Math.max(0, (lingerDuration - elapsed) / 1000).toFixed(1);
          banner.textContent = `HERO FEED SOLO GAZE (${remain}s)...`;
        }

      // ── PHASE 2: COSMIC PULL-BACK & SEQUENTIAL SMOOTH DISSOLVES ──────────
      } else {
        const pullElapsed = elapsed - lingerDuration;
        const pullProgress = Math.min(1, pullElapsed / zoomDuration);
        const ease = 0.5 - Math.cos(pullProgress * Math.PI) / 2;

        curZ = 365 - ease * 930; // from +365 down to -565
        const tiltX = Math.sin(pullProgress * Math.PI) * 2.8;
        vp.style.transform = `translate3d(0,0,0) rotateX(${tiltX}deg) rotateY(0deg) translateZ(${curZ}px)`;
      }

      // Check and dissolve in secondary screens as their timestamp arrives
      flatConstellation.forEach((pos, idx) => {
        if (idx > 0 && elapsedSec >= pos.time) {
          dissolveScreenIn(idx, pos, pos.vol);
        }
      });

      if (elapsed < totalDuration) {
        requestAnimationFrame(animateConstellation);
      } else {
        isCinematicRunning = false;
        if (banner) banner.textContent = '25-STREAM CONSTELLATION ACTIVE';
        toast('Constellation complete: 25 Feeds Running in Cosmic Void');
      }
    }
    requestAnimationFrame(animateConstellation);

  // ── OPTION 2: 360° CYLINDRICAL VORTEX WARP ──────────────────────────────────
  } else if (optionType === 2) {
    if (banner) banner.textContent = '360° CYLINDRICAL VORTEX WARP';
    setLayout('ring');
    screens.forEach((s, idx) => {
      if (s.el) s.el.style.opacity = '1';
      unmuteScreen(idx);
      setScreenVolume(idx, 35);
    });

    let angle = 0;
    let speed = 2.8;
    let curY = 240;
    const startTime = performance.now();
    const duration = 14000;

    function animateVortex(now) {
      if (isCancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      speed = 2.8 * (1 - progress * 0.88);
      angle = (angle + speed) % 360;
      curY = 240 - progress * 240;

      vp.style.transform = `translate3d(0,${curY}px,0) rotateX(15deg) rotateY(${angle}deg) translateZ(80px)`;

      if (progress < 1) {
        requestAnimationFrame(animateVortex);
      } else {
        isCinematicRunning = false;
        if (overlay) overlay.style.display = 'none';
        toast('Vortex warp locked into orbital glide');
      }
    }
    requestAnimationFrame(animateVortex);

  // ── OPTION 3: TACTICAL MATRIX DEPLOYMENT (GRID INVASION) ────────────────────
  } else if (optionType === 3) {
    if (banner) banner.textContent = 'TACTICAL GREEN MATRIX DEPLOYMENT';
    setVisualTheme('green-vector');
    setLayout('flat');

    screens.forEach(s => { if (s.el) { s.el.style.opacity = '0'; } });

    let count = 0;
    const interval = setInterval(() => {
      if (isCancelled || count >= screens.length) {
        clearInterval(interval);
        setTimeout(() => {
          if (!isCancelled) {
            isCinematicRunning = false;
            document.documentElement.classList.remove('cinematic-blackout');
            document.body.classList.remove('cinematic-blackout');
            if (overlay) overlay.style.display = 'none';
            toast('Tactical matrix fully operational');
          }
        }, 1500);
        return;
      }
      if (screens[count] && screens[count].el) {
        screens[count].el.style.opacity = '1';
        unmuteScreen(count);
        setScreenVolume(count, 40);
        applyLayout();
      }
      count++;
    }, 280);

  // ── OPTION 4: SPOTLIGHT ACOUSTIC FLY-AROUND ────────────────────────────────
  } else if (optionType === 4) {
    if (banner) banner.textContent = 'SPOTLIGHT ACOUSTIC FLY-AROUND';
    setLayout('dome');
    screens.forEach((s, idx) => {
      if (s.el) s.el.style.opacity = '1';
      unmuteScreen(idx);
      setScreenVolume(idx, 40);
    });

    const startTime = performance.now();
    const duration = 18000;

    function animateFlyAround(now) {
      if (isCancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const t = (elapsed / 1000) * 1.1;
      const curX = Math.sin(t) * 300;
      const curY = Math.sin(t * 2) * 100;
      const curRotY = Math.cos(t) * 26;
      const curRotX = -Math.sin(t * 2) * 14;

      vp.style.transform = `translate3d(${curX}px,${curY}px,0) rotateX(${curRotX}deg) rotateY(${curRotY}deg) translateZ(140px)`;

      if (progress < 1) {
        requestAnimationFrame(animateFlyAround);
      } else {
        isCinematicRunning = false;
        document.documentElement.classList.remove('cinematic-blackout');
        document.body.classList.remove('cinematic-blackout');
        if (overlay) overlay.style.display = 'none';
        toast('Spotlight flight path complete');
      }
    }
    requestAnimationFrame(animateFlyAround);
  }
}

function muteAllScreensQuiet() {
  screens.forEach((s, idx) => {
    s.isMuted = true;
    s._ignited = false;
    postMessageToScreen(idx, { event: 'command', func: 'mute', args: [] });
    updateScreenAudioUI(idx);
  });
}

function glitch(ms = 320) {
  screens.forEach(s => {
    if (!s.el) return;
    const rx = (Math.random() - 0.5) * 35, ry = (Math.random() - 0.5) * 35;
    s.el.style.transform = `scale(1.06) translate(${rx}px,${ry}px)`;
  });
  setTimeout(applyLayout, ms);
}
