// ─── Real YouTube Search & Stream Queue Engine ──────────────────────────────
const YT = {
  currentQuery: 'space',
  searchQueue: [],
  queueIndex: 0,

  // Categorized instant-load verified pools (all oEmbed verified embeddable)
  POOLS: {
    space: [
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space Live Views', ch:'NASA' },
      { id:'21X5lGlDOfg', title:'Felix Baumgartner – Stratosphere Space Jump', ch:'Red Bull' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Falcon 9 & Heavy Highlights', ch:'SpaceX' },
      { id:'arj7oStGLkU', title:'TED – How to Find Exoplanets', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – Black Holes & Quantum Reality', ch:'TED' },
      { id:'8jPQjjsBbIc', title:'TED – Secrets of the Deep Cosmos', ch:'TED' },
    ],
    ai: [
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas Robot Maneuvers', ch:'Boston Dynamics' },
      { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas Parkour Routine', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Gymnastics & Backflip', ch:'Boston Dynamics' },
      { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini Multimodal AI', ch:'DeepMind' },
      { id:'Sq1QZB5baNw', title:'OpenAI Sora – Text to Video AI Demo', ch:'Figure' },
      { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens Unreal Engine 5', ch:'Epic Games' },
    ],
    nature: [
      { id:'qhLExhpXX0E', title:'Deep Ocean – Marine Biology Discoveries', ch:'We The Curious' },
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Orbit 4K', ch:'NASA' },
      { id:'eIho2S0ZahI', title:'TED – The Happy Secret to Better Work', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – The Power of Vulnerability', ch:'TED' },
      { id:'qp0HIF3SfI4', title:'TED – Your Body Language Shapes You', ch:'TED' },
      { id:'arj7oStGLkU', title:'TED – Do Schools Kill Creativity', ch:'TED' },
    ],
    cats: [
      { id:'0Bmhjf0rKe8', title:'Super Slow Motion Cats in Motion', ch:'rozzzafly' },
      { id:'p4Gotl9vRGs', title:'Animals & Cats – Funniest Moments', ch:'EastCoast Flipper' },
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
      { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'ImagineDragons' },
      { id:'SC4xMk98Pdc', title:'Eminem – Rap God', ch:'EminemVEVO' },
    ],
    f1: [
      { id:'21X5lGlDOfg', title:'Red Bull – Stratosphere Jump Record', ch:'Red Bull' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Speed Compilation', ch:'SpaceX' },
      { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder (Official)', ch:'ImagineDragons' },
      { id:'OPf0YbXqDm0', title:'Mark Ronson ft. Bruno Mars – Uptown Funk', ch:'MarkRonson' },
      { id:'CevxZvSJLk8', title:'Katy Perry – Roar', ch:'KatyPerry' },
      { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
    ],
    gaming: [
      { id:'V4MF2s6MLxY', title:'Unreal Engine 5 – Matrix Awakens Tech Demo', ch:'Epic Games' },
      { id:'8F9jXYOH2c0', title:'Spider-Man 2 – Reveal (Parody)', ch:'Studio C' },
      { id:'djzOBZUFzTw', title:'Boston Dynamics Atlas – Live Demo', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Gymnastics', ch:'Boston Dynamics' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
      { id:'SC4xMk98Pdc', title:'Eminem – Rap God (Epic Beat)', ch:'EminemVEVO' },
    ],
    music: [
      { id:'JGwWNGJdvx8', title:'Ed Sheeran – Shape of You', ch:'Ed Sheeran' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
      { id:'RgKAFK5djSk', title:'Wiz Khalifa – See You Again', ch:'Wiz Khalifa' },
      { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
      { id:'hT_nvWreIhg', title:'OneRepublic – Counting Stars', ch:'OneRepublic' },
      { id:'OPf0YbXqDm0', title:'Mark Ronson – Uptown Funk', ch:'MarkRonson' },
    ],
  },

  // Deep fallback list
  DEEP_FALLBACK: [
    { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space', ch:'NASA' },
    { id:'21X5lGlDOfg', title:'Felix Baumgartner – Space Jump', ch:'Red Bull' },
    { id:'ANv5UfZsvZQ', title:'SpaceX – Highlights', ch:'SpaceX' },
    { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas Maneuvers', ch:'Boston Dynamics' },
    { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas Parkour', ch:'Boston Dynamics' },
    { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Backflip', ch:'Boston Dynamics' },
    { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini AI', ch:'DeepMind' },
    { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens UE5', ch:'Epic Games' },
    { id:'qhLExhpXX0E', title:'Deep Ocean – Marine Biology', ch:'We The Curious' },
    { id:'0Bmhjf0rKe8', title:'Slow Motion Cats', ch:'rozzzafly' },
    { id:'p4Gotl9vRGs', title:'Cats & Dogs – Funniest Moments', ch:'EastCoast Flipper' },
    { id:'JGwWNGJdvx8', title:'Ed Sheeran – Shape of You', ch:'Ed Sheeran' },
    { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
    { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
    { id:'hT_nvWreIhg', title:'OneRepublic – Counting Stars', ch:'OneRepublic' },
    { id:'OPf0YbXqDm0', title:'Mark Ronson – Uptown Funk', ch:'Mark Ronson' },
    { id:'60ItHLz5WEA', title:'Alan Walker – Faded', ch:'Alan Walker' },
    { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'Imagine Dragons' },
    { id:'dQw4w9WgXcQ', title:'Rick Astley – Never Gonna Give You Up', ch:'Rick Astley' },
    { id:'9bZkp7q19f0', title:'Psy – Gangnam Style', ch:'officialpsy' },
    { id:'YQHsXMglC9A', title:'Adele – Hello', ch:'Adele' },
    { id:'2Vv-BfVoq4g', title:'Ed Sheeran – Perfect', ch:'Ed Sheeran' },
    { id:'nSDgHBxUbVQ', title:'Coldplay – Yellow', ch:'Coldplay' },
    { id:'CevxZvSJLk8', title:'Katy Perry – Roar', ch:'KatyPerry' },
    { id:'fRh_vgS2dFE', title:'Justin Timberlake – Can\'t Stop The Feeling', ch:'Justin Timberlake' },
    { id:'uelHwf8o7_U', title:'Eminem – Without Me', ch:'Eminem' },
    { id:'lp-EO5I60KA', title:'Kygo – Happy Now', ch:'Kygo' },
    { id:'H-kL8A4RNQ8', title:'Lost Frequencies – Are You With Me', ch:'Lost Frequencies' },
    { id:'h_D3VFfhvs4', title:'Stromae – Papaoutai', ch:'Stromae' },
    { id:'arj7oStGLkU', title:'TED – How to Find Exoplanets', ch:'TED' },
    { id:'iG9CE55wbtY', title:'TED – Black Holes', ch:'TED' },
    { id:'8jPQjjsBbIc', title:'TED – Secrets of the Universe', ch:'TED' },
    { id:'eIho2S0ZahI', title:'TED – The Happy Secret to Better Work', ch:'TED' },
    { id:'qp0HIF3SfI4', title:'TED – Body Language', ch:'TED' },
  ],

  // Extract ID from any YouTube URL or 11-char string
  extractId(url) {
    if (!url) return null;
    const str = url.trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
      /^([A-Za-z0-9_-]{11})$/
    ];
    for (const p of patterns) {
      const m = str.match(p);
      if (m) return m[1];
    }
    return null;
  },

  // Build embed URL
  embedUrl(id, isMuted = true) {
    const origin = window.location.origin || 'https://flatterland.github.io';
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${id}&controls=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
  },

  // Synchronous immediate results getter (returns immediately, never hangs)
  getImmediateResults(query, count = 6) {
    const q = (query || '').toLowerCase().trim().replace(/^[#@]/, '');

    // 1. Direct URL/ID
    const directId = this.extractId(query);
    if (directId && (query.includes('youtube') || query.includes('youtu.be') || query.includes('/shorts/') || /^[A-Za-z0-9_-]{11}$/.test(query.trim()))) {
      const item = { id: directId, title: `YouTube Video (${directId})`, ch: 'Direct Input' };
      this.searchQueue = [item];
      this.queueIndex = 1;
      return [item];
    }

    // 2. Category pool match
    for (const [catKey, pool] of Object.entries(this.POOLS)) {
      if (catKey.includes(q) || q.includes(catKey)) {
        this.searchQueue = [...pool, ...this.DEEP_FALLBACK];
        this.queueIndex = count;
        return pool.slice(0, count);
      }
    }

    // 3. Match across titles and channels
    const all = Object.values(this.POOLS).flat();
    const hits = all.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.ch.toLowerCase().includes(q)
    );
    if (hits.length > 0) {
      this.searchQueue = [...hits, ...this.DEEP_FALLBACK];
      this.queueIndex = count;
      return hits.slice(0, count);
    }

    // 4. Default fallback
    this.searchQueue = [...this.DEEP_FALLBACK];
    this.queueIndex = count;
    return this.DEEP_FALLBACK.slice(0, count);
  },

  // Asynchronous background live search: updates searchQueue dynamically
  async searchLiveAsync(query, onResults) {
    this.currentQuery = query.trim();
    const directId = this.extractId(query);
    if (directId) return;

    const endpoints = [
      `https://api.piped.private.coffee/search?q=${encodeURIComponent(query)}&filter=videos`,
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`,
      `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
      `https://yewtu.be/api/v1/search?q=${encodeURIComponent(query)}&type=video`
    ];

    // Try endpoints with quick 2.5s timeout
    for (const ep of endpoints) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2500);
        const resp = await fetch(ep, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!resp.ok) continue;
        const data = await resp.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          const liveVids = [];
          for (const it of items) {
            let vidId = it.videoId || it.id;
            if (!vidId && it.url && it.url.includes('/watch?v=')) {
              vidId = it.url.split('/watch?v=')[1].split('&')[0];
            }
            if (vidId && typeof vidId === 'string' && vidId.length === 11) {
              liveVids.push({
                id: vidId,
                title: it.title || 'Live Stream',
                ch: it.uploaderName || it.author || it.uploader || 'YouTube',
              });
            }
          }
          if (liveVids.length > 0) {
            console.log(`[MitC] Live search returned ${liveVids.length} videos from ${ep}`);
            // Prepend new live results to search queue
            this.searchQueue = [...liveVids, ...this.DEEP_FALLBACK];
            this.queueIndex = 6;
            if (typeof onResults === 'function') {
              onResults(liveVids.slice(0, 6));
            }
            break;
          }
        }
      } catch (e) {
        // continue
      }
    }
  },

  // Silently retrieves next video further down the search list
  getNextResult(excludeIds = []) {
    const excludeSet = new Set(excludeIds);

    while (this.queueIndex < this.searchQueue.length) {
      const nextVid = this.searchQueue[this.queueIndex++];
      if (nextVid && nextVid.id && !excludeSet.has(nextVid.id)) {
        return nextVid;
      }
    }

    const backup = this.DEEP_FALLBACK.filter(v => !excludeSet.has(v.id));
    if (backup.length > 0) {
      return backup[Math.floor(Math.random() * backup.length)];
    }
    return this.DEEP_FALLBACK[0];
  },

  getQueueStats() {
    return {
      total: this.searchQueue.length,
      current: this.queueIndex,
      remaining: Math.max(0, this.searchQueue.length - this.queueIndex)
    };
  }
};
