// ─── Real YouTube Search & Stream Queue Engine ──────────────────────────────
// Features:
// 1. Real-time dynamic search across live public mirrors (Piped, Invidious, Suggest).
// 2. Extracts direct video URLs and IDs.
// 3. Maintains a deep search queue (20+ items) per query.
// 4. Provides getNextResult() so failing/blocked videos are SILENTLY replaced
//    with the next item further down the search list.
// 5. Rich verified fallback pool for offline/emergency situations.

const YT = {
  currentQuery: '',
  searchQueue: [],
  queueIndex: 0,
  isSearching: false,

  // Fallback verified embeddable pool
  VERIFIED_BACKUP: [
    { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space Live Views', ch:'NASA' },
    { id:'21X5lGlDOfg', title:'Felix Baumgartner – Stratosphere Space Jump', ch:'Red Bull' },
    { id:'ANv5UfZsvZQ', title:'SpaceX – Falcon 9 & Heavy Highlights', ch:'SpaceX' },
    { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas Robot Maneuvers', ch:'Boston Dynamics' },
    { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas Parkour Routine', ch:'Boston Dynamics' },
    { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Gymnastics & Backflip', ch:'Boston Dynamics' },
    { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini Multimodal AI', ch:'DeepMind' },
    { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens Unreal Engine 5', ch:'Epic Games' },
    { id:'qhLExhpXX0E', title:'Deep Ocean – Marine Biology Discoveries', ch:'We The Curious' },
    { id:'0Bmhjf0rKe8', title:'Super Slow Motion Cats in Motion', ch:'rozzzafly' },
    { id:'p4Gotl9vRGs', title:'Animals & Cats – Funniest Moments', ch:'EastCoast Flipper' },
    { id:'JGwWNGJdvx8', title:'Ed Sheeran – Shape of You', ch:'Ed Sheeran' },
    { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
    { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
    { id:'hT_nvWreIhg', title:'OneRepublic – Counting Stars', ch:'OneRepublic' },
    { id:'OPf0YbXqDm0', title:'Mark Ronson ft. Bruno Mars – Uptown Funk', ch:'Mark Ronson' },
    { id:'60ItHLz5WEA', title:'Alan Walker – Faded', ch:'Alan Walker' },
    { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'Imagine Dragons' },
    { id:'dQw4w9WgXcQ', title:'Rick Astley – Never Gonna Give You Up', ch:'Rick Astley' },
    { id:'9bZkp7q19f0', title:'Psy – Gangnam Style', ch:'officialpsy' },
    { id:'arj7oStGLkU', title:'TED – How to Find Exoplanets', ch:'TED' },
    { id:'iG9CE55wbtY', title:'TED – Black Holes & Quantum Reality', ch:'TED' },
    { id:'8jPQjjsBbIc', title:'TED – Secrets of the Deep Cosmos', ch:'TED' },
    { id:'eIho2S0ZahI', title:'TED – The Happy Secret to Better Work', ch:'TED' },
    { id:'qp0HIF3SfI4', title:'TED – Your Body Language Shapes Who You Are', ch:'TED' }
  ],

  // Live search API endpoints to cascade through
  SEARCH_ENDPOINTS: [
    'https://api.piped.private.coffee/search?q={Q}&filter=videos',
    'https://pipedapi.kavin.rocks/search?q={Q}&filter=videos',
    'https://piped.video/api/v1/search?q={Q}&filter=videos',
    'https://invidious.nerdvpn.de/api/v1/search?q={Q}&type=video',
    'https://inv.nadeko.net/api/v1/search?q={Q}&type=video',
    'https://yewtu.be/api/v1/search?q={Q}&type=video'
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

  // Main search function: returns array of videos and stores remaining in queue
  async search(query, targetCount = 6) {
    this.currentQuery = query.trim();
    this.isSearching = true;

    // 1. Direct URL or Video ID check
    const directId = this.extractId(this.currentQuery);
    if (directId && (this.currentQuery.includes('youtube') || this.currentQuery.includes('youtu.be') || this.currentQuery.includes('/shorts/') || /^[A-Za-z0-9_-]{11}$/.test(this.currentQuery))) {
      const single = [{
        id: directId,
        title: `YouTube Video (${directId})`,
        ch: 'Direct Link',
        thumb: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`
      }];
      this.searchQueue = single;
      this.queueIndex = 1;
      this.isSearching = false;
      return single;
    }

    let results = [];

    // 2. Query live search APIs
    const encoded = encodeURIComponent(this.currentQuery);
    for (const endpoint of this.SEARCH_ENDPOINTS) {
      try {
        const url = endpoint.replace('{Q}', encoded);
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3500);
        const resp = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!resp.ok) continue;
        const data = await resp.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          for (const it of items) {
            let vidId = it.videoId || it.id;
            if (!vidId && it.url && it.url.includes('/watch?v=')) {
              vidId = it.url.split('/watch?v=')[1].split('&')[0];
            }
            if (vidId && typeof vidId === 'string' && vidId.length === 11) {
              results.push({
                id: vidId,
                title: it.title || 'YouTube Stream',
                ch: it.uploaderName || it.author || it.uploader || 'YouTube Channel',
                thumb: it.thumbnail || (it.thumbnails && it.thumbnails[0] ? it.thumbnails[0].url : `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`)
              });
            }
          }
        }
        if (results.length >= 6) {
          console.log(`[MitC] Search successful via ${endpoint} (${results.length} results)`);
          break;
        }
      } catch (err) {
        // try next endpoint
      }
    }

    // 3. Fallback: filter verified backup pool by query or theme
    if (results.length === 0) {
      console.warn('[MitC] Live API search returned 0 items; falling back to verified pool');
      const q = this.currentQuery.toLowerCase();
      const filtered = this.VERIFIED_BACKUP.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.ch.toLowerCase().includes(q)
      );
      results = filtered.length > 0 ? filtered : [...this.VERIFIED_BACKUP].sort(() => Math.random() - 0.5);
    }

    // Deduplicate results by ID
    const seen = new Set();
    this.searchQueue = results.filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    this.queueIndex = Math.min(targetCount, this.searchQueue.length);
    this.isSearching = false;

    // Return the first slice
    return this.searchQueue.slice(0, targetCount);
  },

  // Silently retrieves the next video further down the search list
  getNextResult(excludeIds = []) {
    const excludeSet = new Set(excludeIds);

    // Look in remaining search queue
    while (this.queueIndex < this.searchQueue.length) {
      const nextVid = this.searchQueue[this.queueIndex++];
      if (!excludeSet.has(nextVid.id)) {
        return nextVid;
      }
    }

    // If search queue exhausted, pick from verified backup pool
    const backupCandidates = this.VERIFIED_BACKUP.filter(v => !excludeSet.has(v.id));
    if (backupCandidates.length > 0) {
      return backupCandidates[Math.floor(Math.random() * backupCandidates.length)];
    }

    // Absolute fallback
    return this.VERIFIED_BACKUP[0];
  },

  // Get total queue stats for UI
  getQueueStats() {
    return {
      total: this.searchQueue.length,
      current: this.queueIndex,
      remaining: Math.max(0, this.searchQueue.length - this.queueIndex)
    };
  }
};
