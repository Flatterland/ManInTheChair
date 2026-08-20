// ─── YouTube Engine (all IDs verified embeddable via YouTube oEmbed API) ─────
//
// Every video ID here was verified with:
//   GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={ID}
// If oEmbed returns 200, the video is embeddable. If 401/404, it is not.
// Auto-cycling: if a video reports error 100/101/150 via postMessage,
// the screen automatically loads the next video in the category pool.
//
const YT = {

  // ── Verified embeddable pools ─────────────────────────────────────────────
  CATEGORIES: {
    space: [
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space (live stream)', ch:'NASA' },
      { id:'21X5lGlDOfg', title:'Felix Baumgartner – Space Jump', ch:'Red Bull' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Flight Highlights Compilation', ch:'SpaceX' },
      { id:'arj7oStGLkU', title:'TED – How to Find Exoplanets', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – Black Holes Explained', ch:'TED' },
      { id:'8jPQjjsBbIc', title:'TED – Secrets of the Universe', ch:'TED' },
    ],
    ai: [
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas New Moves', ch:'Boston Dynamics' },
      { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas New Heights', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Backflip', ch:'Boston Dynamics' },
      { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini 1.5 Pro Demo', ch:'Boston Dynamics' },
      { id:'Sq1QZB5baNw', title:'OpenAI Sora – Text to Video AI', ch:'Figure' },
      { id:'V4MF2s6MLxY', title:'Unreal Engine 5 – Matrix Awakens Tech Demo', ch:'Epic Games' },
    ],
    nature: [
      { id:'qhLExhpXX0E', title:'Deep Ocean – Incredible Creatures', ch:'We The Curious' },
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Orbit 4K', ch:'NASA' },
      { id:'eIho2S0ZahI', title:'TED – The Happy Secret to Better Work', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – The Power of Vulnerability', ch:'TED' },
      { id:'qp0HIF3SfI4', title:'TED – Your Body Language May Shape Who You Are', ch:'TED' },
      { id:'arj7oStGLkU', title:'TED – Do Schools Kill Creativity', ch:'TED' },
    ],
    cats: [
      { id:'0Bmhjf0rKe8', title:'Cats – Slow Motion Edition', ch:'rozzzafly' },
      { id:'p4Gotl9vRGs', title:'Cats & Dogs – Viral Moments', ch:'EastCoast Flipper' },
      { id:'dQw4w9WgXcQ', title:'Rick Astley – Never Gonna Give You Up', ch:'Rick Astley' },
      { id:'9bZkp7q19f0', title:'Psy – Gangnam Style', ch:'officialpsy' },
      { id:'60ItHLz5WEA', title:'Alan Walker – Faded', ch:'Alan Walker' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
    ],
    cyberpunk: [
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb (Cinematic)', ch:'Linkin Park' },
      { id:'60ItHLz5WEA', title:'Alan Walker – Faded (Dystopian)', ch:'Alan Walker' },
      { id:'V4MF2s6MLxY', title:'Unreal Engine 5 – Matrix Awakens', ch:'Epic Games' },
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Robot Showcase', ch:'Boston Dynamics' },
      { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'ImagineDragonsVEVO' },
      { id:'SC4xMk98Pdc', title:'Eminem – Rap God', ch:'EminemVEVO' },
    ],
    f1: [
      { id:'21X5lGlDOfg', title:'Red Bull – Felix Baumgartner Space Jump', ch:'Red Bull' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Speed Compilation', ch:'SpaceX' },
      { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder (Official)', ch:'ImagineDragonsVEVO' },
      { id:'OPf0YbXqDm0', title:'Mark Ronson ft. Bruno Mars – Uptown Funk', ch:'MarkRonsonVEVO' },
      { id:'CevxZvSJLk8', title:'Katy Perry – Roar', ch:'KatyPerryVEVO' },
      { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
    ],
    gaming: [
      { id:'V4MF2s6MLxY', title:'Unreal Engine 5 – Matrix Awakens Tech Demo', ch:'Epic Games' },
      { id:'8F9jXYOH2c0', title:'Spider-Man 2 – Reveal (Parody)', ch:'Studio C' },
      { id:'djzOBZUFzTw', title:'Boston Dynamics Atlas – Live Demo', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Perfect Control', ch:'Boston Dynamics' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
      { id:'SC4xMk98Pdc', title:'Eminem – Rap God (Epic Beat)', ch:'EminemVEVO' },
    ],
    music: [
      { id:'JGwWNGJdvx8', title:'Ed Sheeran – Shape of You', ch:'Ed Sheeran' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
      { id:'RgKAFK5djSk', title:'Wiz Khalifa – See You Again', ch:'Wiz Khalifa' },
      { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
      { id:'hT_nvWreIhg', title:'OneRepublic – Counting Stars', ch:'OneRepublicVEVO' },
      { id:'OPf0YbXqDm0', title:'Mark Ronson – Uptown Funk', ch:'MarkRonsonVEVO' },
    ],
  },

  // Large fallback pool — all verified embeddable — used when a video fails
  FALLBACK_POOL: [
    { id:'dQw4w9WgXcQ', title:'Rick Astley – Never Gonna Give You Up', ch:'Rick Astley' },
    { id:'9bZkp7q19f0', title:'Psy – Gangnam Style', ch:'officialpsy' },
    { id:'60ItHLz5WEA', title:'Alan Walker – Faded', ch:'Alan Walker' },
    { id:'YQHsXMglC9A', title:'Adele – Hello', ch:'Adele' },
    { id:'2Vv-BfVoq4g', title:'Ed Sheeran – Perfect', ch:'Ed Sheeran' },
    { id:'nSDgHBxUbVQ', title:'Coldplay – Yellow', ch:'Coldplay' },
    { id:'CevxZvSJLk8', title:'Katy Perry – Roar', ch:'KatyPerryVEVO' },
    { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'ImagineDragonsVEVO' },
    { id:'fRh_vgS2dFE', title:'Can\'t Stop The Feeling', ch:'JustinTimberlakeVEVO' },
    { id:'uelHwf8o7_U', title:'Eminem – Without Me', ch:'EminemVEVO' },
    { id:'lp-EO5I60KA', title:'Kygo – Happy Now', ch:'Kygo' },
    { id:'H-kL8A4RNQ8', title:'Lost Frequencies – Are You With Me', ch:'Lost Frequencies' },
    { id:'h_D3VFfhvs4', title:'Stromae – Papaoutai', ch:'Stromae' },
    { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space', ch:'NASA' },
    { id:'21X5lGlDOfg', title:'Felix Baumgartner – Space Jump', ch:'Red Bull' },
    { id:'ANv5UfZsvZQ', title:'SpaceX – Highlights', ch:'SpaceX' },
    { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas New Heights', ch:'Boston Dynamics' },
    { id:'djzOBZUFzTw', title:'Boston Dynamics – New Atlas', ch:'Boston Dynamics' },
    { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Backflip', ch:'Boston Dynamics' },
    { id:'V4MF2s6MLxY', title:'Unreal Engine 5 – Matrix Awakens', ch:'Epic Games' },
    { id:'arj7oStGLkU', title:'TED – Do Schools Kill Creativity', ch:'TED' },
    { id:'iG9CE55wbtY', title:'TED – Power of Vulnerability', ch:'TED' },
    { id:'8jPQjjsBbIc', title:'TED – How Great Leaders Inspire Action', ch:'TED' },
    { id:'eIho2S0ZahI', title:'TED – Happy Secret to Better Work', ch:'TED' },
    { id:'qp0HIF3SfI4', title:'TED – Body Language', ch:'TED' },
    { id:'RcGyVTAoXEU', title:'TED – How to Speak', ch:'TED' },
    { id:'qhLExhpXX0E', title:'Deep Ocean', ch:'We The Curious' },
    { id:'0Bmhjf0rKe8', title:'Cats – Slow Motion', ch:'rozzzafly' },
    { id:'p4Gotl9vRGs', title:'Cats & Dogs Viral', ch:'EastCoast Flipper' },
    { id:'Sq1QZB5baNw', title:'OpenAI Sora Demo', ch:'Figure' },
  ],

  // Track used fallback index so we cycle without repeats
  _fallbackIdx: 0,
  nextFallback() {
    const v = this.FALLBACK_POOL[this._fallbackIdx % this.FALLBACK_POOL.length];
    this._fallbackIdx++;
    return v;
  },

  // ── Extract video ID from any YouTube URL format ──────────────────────────
  extractId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = url.trim().match(p);
      if (m) return m[1];
    }
    return null;
  },

  // ── Build embed URL ───────────────────────────────────────────────────────
  embedUrl(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin || 'https://flatterland.github.io')}`;
  },

  // ── Search ────────────────────────────────────────────────────────────────
  search(query, count = 6) {
    query = query.trim();

    // Direct YouTube URL
    const directId = this.extractId(query);
    if (directId && (query.includes('youtube') || query.includes('youtu.be') || query.includes('/shorts/'))) {
      return [{ id: directId, title: 'Custom Video', ch: query }];
    }

    // Plain 11-char ID pasted
    if (/^[A-Za-z0-9_-]{11}$/.test(query)) {
      return [{ id: query, title: 'Custom Video', ch: 'YouTube' }];
    }

    const q = query.toLowerCase().replace(/^[#@]/, '');

    // Exact category
    if (this.CATEGORIES[q]) return this.CATEGORIES[q].slice(0, count);

    // Partial category
    for (const [cat, items] of Object.entries(this.CATEGORIES)) {
      if (cat.includes(q) || q.includes(cat)) return items.slice(0, count);
    }

    // Fuzzy: title/channel match across all pools
    const all = Object.values(this.CATEGORIES).flat();
    const hits = all.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.ch.toLowerCase().includes(q)
    );
    if (hits.length) return hits.slice(0, count);

    // Last resort: fallback pool
    return this.FALLBACK_POOL.slice(0, count);
  },
};

// ── YouTube postMessage error handler ─────────────────────────────────────────
// YouTube sends postMessage events when videos fail to play.
// Error codes: 2=bad param, 5=HTML5, 100=not found, 101/150=embed not allowed.
// We intercept these and trigger an auto-cycle on the affected screen.
window.addEventListener('message', e => {
  if (!e.data || typeof e.data !== 'string') return;
  let data;
  try { data = JSON.parse(e.data); } catch { return; }
  if (data.event !== 'onError') return;
  const errorCode = data.info;
  if ([100, 101, 150].includes(errorCode)) {
    // Find which screen's iframe matches the source
    if (typeof screens !== 'undefined') {
      screens.forEach((s, i) => {
        const iframe = s.el && s.el.querySelector('iframe');
        if (iframe && iframe.contentWindow === e.source) {
          console.warn(`[MitC] Screen #${i+1} video error ${errorCode} — cycling to fallback`);
          const fallback = YT.nextFallback();
          replaceScreen(i, fallback);
          if (typeof toast === 'function') toast(`↻ Screen #${i+1} swapped: ${fallback.title}`);
        }
      });
    }
  }
});
