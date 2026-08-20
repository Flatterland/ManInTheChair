// ─── 3D Viewport, YouTube Player & Audio Matrix Engine ───────────────────────
let screens = [];            // [{ vid:{id,title,ch,thumb}, custom:{scale,x,y,z,rot}, player, isMuted, volume, errorCount }]
let focusedIdx = null;
let cameraMode = 'chair';
let layout = 'dome';
let soloAudioMode = true;    // Unmuting one screen mutes others
let masterVolume = 100;
let masterMuted = false;

let dragging = false, mx = 0, my = 0;
let rotX = 0, rotY = 0, tRotX = 0, tRotY = 0, camZ = 0;
let orbitAngle = 0;
let ytApiReady = false;

// YouTube Iframe API callback
window.onYouTubeIframeAPIReady = function() {
  ytApiReady = true;
  console.log('[MitC] YouTube IFrame API ready.');
  // Initialize any pending screens
  screens.forEach((s, idx) => {
    if (!s.player && s.vid && s.vid.id) {
      initPlayerForScreen(idx);
    }
  });
};

function initViewport() {
  const vp = document.getElementById('viewport');

  window.addEventListener('mousedown', e => {
    if (e.target.closest('.top-hud,.pills-bar,.right-panel,.bottom-bar,.modal-back,#playlist-panel,#mixer-panel')) return;
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
    if (e.target.closest('.right-panel,#playlist-panel,#mixer-panel')) return;
    camZ = Math.max(-480, Math.min(350, camZ - e.deltaY * 0.5));
  }, { passive: true });
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft'  || e.key === 'a') tRotY -= 7;
    if (e.key === 'ArrowRight' || e.key === 'd') tRotY += 7;
    if (e.key === 'ArrowUp'   || e.key === 'w') tRotX += 5;
    if (e.key === 'ArrowDown'  || e.key === 's') tRotX -= 5;
    if (e.key === ' ' || e.key === 'r') resetCam();
    if (e.key === 'm') toggleMasterMute();
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
  // Destroy old players
  screens.forEach(s => {
    if (s.player && typeof s.player.destroy === 'function') {
      try { s.player.destroy(); } catch (e) {}
    }
  });

  screens = vids.map((v, i) => ({
    vid: v,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    player: null,
    isMuted: true,
    volume: 100,
    errorCount: 0
  }));

  rebuildDOM();
  updateUILists();
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
    tile.id = `holo-screen-${i}`;

    // Top overlay badge row
    const topBar = document.createElement('div');
    topBar.className = 'screen-top-bar';

    const badge = document.createElement('div');
    badge.className = 'screen-badge';
    badge.textContent = `#${String(i+1).padStart(2,'0')} · ${(s.vid.ch || 'YouTube').slice(0, 16)}`;

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

    topBar.appendChild(badge);
    topBar.appendChild(audioPill);
    topBar.appendChild(swapBtn);

    // Title ticker bar
    const titleBar = document.createElement('div');
    titleBar.className = 'screen-title-bar';
    titleBar.textContent = s.vid.title || 'Live YouTube Feed';

    // Player wrapper container
    const playerContainer = document.createElement('div');
    playerContainer.className = 'player-embed-box';
    const iframeId = `yt-iframe-slot-${i}-${Date.now()}`;
    playerContainer.id = iframeId;

    tile.appendChild(topBar);
    tile.appendChild(playerContainer);
    tile.appendChild(titleBar);

    // Click handler: focus screen AND click-to-unmute
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.screen-audio-btn, .screen-action-btn')) return;
      focusScreen(i);
      if (s.isMuted) {
        unmuteScreen(i);
      }
    });

    s.el = tile;
    s.slotId = iframeId;
    cluster.appendChild(tile);

    // Initialize YouTube player instance
    initPlayerForScreen(i);
  });

  applyLayout();
  updateUILists();
}

// ── Initialize YouTube Player instance via YT.Player ───────────────────────
function initPlayerForScreen(idx) {
  const s = screens[idx];
  if (!s || !s.vid || !s.vid.id) return;
  const slotId = s.slotId;
  if (!document.getElementById(slotId)) return;

  if (window.YT && window.YT.Player) {
    try {
      s.player = new YT.Player(slotId, {
        videoId: s.vid.id,
        playerVars: {
          autoplay: 1,
          mute: s.isMuted ? 1 : 0,
          loop: 1,
          playlist: s.vid.id,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            if (s.isMuted) {
              event.target.mute();
            } else {
              event.target.unMute();
              event.target.setVolume(Math.round((s.volume * masterVolume) / 100));
            }
            event.target.playVideo();
          },
          onError: (event) => {
            // Error codes: 2 (invalid id), 5 (HTML5 error), 100 (not found/deleted), 101/150 (embedding disabled by owner)
            console.warn(`[MitC] Screen #${idx+1} player error ${event.data} on video ${s.vid.id} (${s.vid.title})`);
            silentlyCycleScreen(idx);
          }
        }
      });
    } catch (e) {
      console.error('[MitC] Failed to create YT.Player instance:', e);
      fallbackIframe(idx);
    }
  } else {
    // If YT API script is still loading, use direct iframe
    fallbackIframe(idx);
  }
}

// Fallback iframe embedding if YT JS API not loaded
function fallbackIframe(idx) {
  const s = screens[idx];
  if (!s || !s.el) return;
  const box = s.el.querySelector('.player-embed-box');
  if (!box) return;
  box.innerHTML = `<iframe src="https://www.youtube.com/embed/${s.vid.id}?autoplay=1&mute=${s.isMuted?1:0}&loop=1&playlist=${s.vid.id}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
}

// ── Silent Video Replacement (Pulls next video from deep search list) ───────
function silentlyCycleScreen(idx) {
  if (!screens[idx]) return;
  screens[idx].errorCount = (screens[idx].errorCount || 0) + 1;

  // Collect all currently playing video IDs so we don't pick duplicates
  const currentIds = screens.map(s => s.vid.id);
  const nextVid = YT.getNextResult(currentIds);

  console.log(`[MitC] Silently replacing Screen #${idx+1} with next search result: "${nextVid.title}" (${nextVid.id})`);
  replaceScreenVideo(idx, nextVid);
}

// Manual cycle requested by user
function cycleScreen(idx) {
  if (!screens[idx]) return;
  const currentIds = screens.map(s => s.vid.id);
  const nextVid = YT.getNextResult(currentIds);
  replaceScreenVideo(idx, nextVid);
  if (typeof toast === 'function') toast(`↻ Screen #${idx+1} swapped: ${nextVid.title.slice(0, 25)}...`);
}

// Replace video on an existing screen
function replaceScreenVideo(idx, newVid) {
  const s = screens[idx];
  if (!s) return;
  s.vid = newVid;

  // Update badge and title DOM
  if (s.el) {
    const badge = s.el.querySelector('.screen-badge');
    if (badge) badge.textContent = `#${String(idx+1).padStart(2,'0')} · ${(newVid.ch || 'YouTube').slice(0, 16)}`;
    const titleBar = s.el.querySelector('.screen-title-bar');
    if (titleBar) titleBar.textContent = newVid.title || 'YouTube Feed';
  }

  // Load in player if instance exists
  if (s.player && typeof s.player.loadVideoById === 'function') {
    try {
      s.player.loadVideoById({
        videoId: newVid.id,
        suggestedQuality: 'hd720'
      });
      if (s.isMuted) s.player.mute(); else s.player.unMute();
      s.player.playVideo();
    } catch (e) {
      initPlayerForScreen(idx);
    }
  } else {
    // Re-init player
    const box = s.el.querySelector('.player-embed-box');
    if (box) {
      const newSlotId = `yt-iframe-slot-${idx}-${Date.now()}`;
      box.id = newSlotId;
      s.slotId = newSlotId;
      initPlayerForScreen(idx);
    }
  }

  updateUILists();
}

// ── Audio & Volume Mixer Controls ───────────────────────────────────────────
function unmuteScreen(idx) {
  const s = screens[idx];
  if (!s) return;

  if (soloAudioMode) {
    // Mute all other screens
    screens.forEach((other, oIdx) => {
      if (oIdx !== idx) muteScreen(oIdx);
    });
  }

  s.isMuted = false;
  if (s.player && typeof s.player.unMute === 'function') {
    try {
      s.player.unMute();
      s.player.setVolume(Math.round((s.volume * masterVolume) / 100));
    } catch (e) {}
  } else if (s.el) {
    postMessageToIframe(s.el, { event: 'command', func: 'unMute', args: [] });
    postMessageToIframe(s.el, { event: 'command', func: 'setVolume', args: [Math.round((s.volume * masterVolume) / 100)] });
  }

  updateScreenAudioUI(idx);
  updateUILists();
  if (typeof toast === 'function') toast(`🔊 Screen #${idx+1} Audio Active (${s.vid.title.slice(0, 22)}...)`);
}

function muteScreen(idx) {
  const s = screens[idx];
  if (!s) return;
  s.isMuted = true;
  if (s.player && typeof s.player.mute === 'function') {
    try { s.player.mute(); } catch (e) {}
  } else if (s.el) {
    postMessageToIframe(s.el, { event: 'command', func: 'mute', args: [] });
  }
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
    if (s.player && typeof s.player.setVolume === 'function') {
      try { s.player.setVolume(effective); } catch (e) {}
    } else if (s.el) {
      postMessageToIframe(s.el, { event: 'command', func: 'setVolume', args: [effective] });
    }
  }
  updateUILists();
}

function setMasterVolume(vol) {
  masterVolume = Math.max(0, Math.min(100, parseInt(vol, 10)));
  screens.forEach((s, i) => {
    if (!s.isMuted) {
      const effective = Math.round((s.volume * masterVolume) / 100);
      if (s.player && typeof s.player.setVolume === 'function') {
        try { s.player.setVolume(effective); } catch (e) {}
      } else if (s.el) {
        postMessageToIframe(s.el, { event: 'command', func: 'setVolume', args: [effective] });
      }
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
    audioPillText(audioBtn, s.isMuted);
  }
}

function audioPillText(btn, isMuted) {
  btn.innerHTML = isMuted ? '🔇' : '🔊';
  btn.title = isMuted ? 'Click to Unmute' : 'Muted';
}

function postMessageToIframe(tileEl, data) {
  const iframe = tileEl.querySelector('iframe');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    } catch (e) {}
  }
}

// ── 3D Layout Arrangements ──────────────────────────────────────────────────
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
      const xOff = (col - 1) * 465 + c.x;
      const yOff = (row === 0 ? -145 : 165) + c.y;
      const zOff = (col === 1 ? -500 : -545) + c.z;
      t = `translate3d(${xOff}px,${yOff}px,${zOff}px) rotateY(${-a}deg) scale(${c.scale})`;

    } else if (layout === 'flat') {
      const cols = 3, col = i % cols, row = Math.floor(i / cols);
      const xOff = (col - 1) * 460 + c.x;
      const yOff = (row === 0 ? -145 : 165) + c.y;
      t = `translate3d(${xOff}px,${yOff}px,${-490 + c.z}px) rotateY(${c.rot}deg) scale(${c.scale})`;

    } else if (layout === 'ring') {
      const a = (i / n) * 360 + c.rot;
      t = `rotateY(${a}deg) translateZ(${690 + c.z}px) translateY(${c.y}px) scale(${c.scale})`;
    }

    s.el.style.transform = t;
  });
}

// ── Focus & Camera ─────────────────────────────────────────────────────────
function focusScreen(idx) {
  focusedIdx = idx;
  screens.forEach((s, i) => s.el && s.el.classList.toggle('focused', i === idx));

  // Lean camera toward focused tile
  const vp = document.getElementById('viewport');
  if (vp && cameraMode === 'chair') {
    const col = idx % 3;
    const angles = [-28, 0, 28];
    const r = -(angles[col] || 0);
    vp.style.transform = `rotateX(0deg) rotateY(${r}deg) translateZ(190px)`;
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
      !e.target.closest('.right-panel,#playlist-panel,#mixer-panel,.top-hud,.pills-bar,.bottom-bar')) {
    unfocus();
  }
});

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

function setLayout(l) { layout = l; applyLayout(); }

function resetLayout() {
  screens.forEach(s => { s.custom = { scale: 1, x: 0, y: 0, z: 0, rot: 0 }; });
  applyLayout();
}

// ── Screen Management (Add / Remove) ─────────────────────────────────────────
function addScreen(vid) {
  screens.push({
    vid,
    custom: { scale: 1, x: 0, y: 0, z: 0, rot: 0 },
    player: null,
    isMuted: true,
    volume: 100,
    errorCount: 0
  });
  rebuildDOM();
}

function removeScreen(idx) {
  if (screens[idx] && screens[idx].player && typeof screens[idx].player.destroy === 'function') {
    try { screens[idx].player.destroy(); } catch (e) {}
  }
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
      player: null,
      isMuted: true,
      volume: s.volume || 100,
      errorCount: 0
    }));
    rebuildDOM();
    return true;
  } catch (e) { return false; }
}

// ── UI Synchronization (Playlist list & Volume Mixer sync) ──────────────────
function updateUILists() {
  // 1. Update bottom counter
  const statEl = document.getElementById('stat-count');
  if (statEl) statEl.textContent = screens.length;

  // 2. Render Playlist Panel list
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
      queueInfo.textContent = `Queue: ${queueStats.remaining} more live results buffered for "${YT.currentQuery || 'live topics'}"`;
    }
  }

  // 3. Render Volume Mixer strips
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

  // Update Master Mute button icon
  const muteAllBtn = document.getElementById('btn-mute-all');
  if (muteAllBtn) {
    const anyUnmuted = screens.some(s => !s.isMuted);
    muteAllBtn.innerHTML = anyUnmuted ? '🔊 AUDIO ON' : '🔇 MUTE ALL';
    muteAllBtn.classList.toggle('active', anyUnmuted);
  }
}

function glitch(ms = 400) {
  screens.forEach(s => {
    if (!s.el) return;
    const rx = (Math.random() - 0.5) * 35, ry = (Math.random() - 0.5) * 35;
    s.el.style.transform = `scale(1.06) translate(${rx}px,${ry}px)`;
  });
  setTimeout(applyLayout, ms);
}
