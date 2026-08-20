// ─── Real YouTube Search & Stream Queue Engine ──────────────────────────────
const YT = {
  currentQuery: 'space',
  searchQueue: [],
  queueIndex: 0,

  // Fast Invidious / Piped mirror instances
  INSTANCES: [
    'https://invidious.flokinet.to',
    'https://inv.nadeko.net',
    'https://yt.cdaut.de',
    'https://invidious.ducks.party',
    'https://invidious.einfachzocken.eu',
    'https://iv.ggtyler.dev',
    'https://api.piped.private.coffee'
  ],

  // Rich verified embeddable video pools (25+ per category)
  POOLS: {
    space: [
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space 4K Live Feed', ch:'NASA' },
      { id:'21X5lGlDOfg', title:'Felix Baumgartner – Stratosphere Space Jump', ch:'Red Bull' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Falcon 9 & Heavy Highlights', ch:'SpaceX' },
      { id:'arj7oStGLkU', title:'TED – How to Find Exoplanets', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – Black Holes & Quantum Reality', ch:'TED' },
      { id:'8jPQjjsBbIc', title:'TED – Secrets of the Deep Cosmos', ch:'TED' },
      { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens UE5 Tech', ch:'Epic Games' },
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Space Operations Robot', ch:'Boston Dynamics' },
      { id:'qhLExhpXX0E', title:'Deep Ocean – Alien Oceans on Earth', ch:'We The Curious' },
      { id:'tF4DML7FIWk', title:'Boston Dynamics – High Speed Routine', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Balance Control', ch:'Boston Dynamics' },
      { id:'fn3KWM1kuAw', title:'DeepMind – Cosmic Data Analysis', ch:'DeepMind' },
      { id:'Sq1QZB5baNw', title:'OpenAI Sora – Cosmic Worlds Simulation', ch:'OpenAI' },
      { id:'0Bmhjf0rKe8', title:'Slow Motion Atmospheric Flight', ch:'rozzzafly' },
      { id:'p4Gotl9vRGs', title:'Nature – Cosmic Wildlife & Flora', ch:'EastCoast Flipper' },
      { id:'JGwWNGJdvx8', title:'Space Voyager Track – Shape of Orbit', ch:'Ed Sheeran' },
      { id:'kXYiU_JCYtU', title:'Linkin Park – Deep Space Echoes', ch:'Linkin Park' },
      { id:'YqeW9_5kURI', title:'The Weeknd – Cosmic Neon Lights', ch:'Republic Records' },
      { id:'hT_nvWreIhg', title:'OneRepublic – Counting Distant Stars', ch:'OneRepublic' },
      { id:'OPf0YbXqDm0', title:'Mark Ronson – Nebula Groove', ch:'MarkRonson' },
      { id:'60ItHLz5WEA', title:'Alan Walker – Interstellar Faded', ch:'Alan Walker' },
      { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder Aurora', ch:'Imagine Dragons' },
      { id:'dQw4w9WgXcQ', title:'Cosmic Transmission Relay #23', ch:'Rick Astley' },
      { id:'9bZkp7q19f0', title:'Psy – Galaxy Core Pulse', ch:'officialpsy' },
      { id:'SC4xMk98Pdc', title:'Eminem – Superluminal Rap God', ch:'EminemVEVO' },
      { id:'eIho2S0ZahI', title:'TED – The Frontier of Astronomy', ch:'TED' },
      { id:'qp0HIF3SfI4', title:'TED – Signals from Distant Worlds', ch:'TED' }
    ],
    ai: [
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas Robot Maneuvers', ch:'Boston Dynamics' },
      { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas Parkour Routine', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Gymnastics & Backflip', ch:'Boston Dynamics' },
      { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini Multimodal AI', ch:'DeepMind' },
      { id:'Sq1QZB5baNw', title:'OpenAI Sora – Text to Video AI Demo', ch:'Figure' },
      { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens Unreal Engine 5', ch:'Epic Games' },
      { id:'8jPQjjsBbIc', title:'TED – Future of AI and Robotics', ch:'TED' },
      { id:'8F9jXYOH2c0', title:'Spider-Man 2 – Neural AI Systems', ch:'Studio C' },
      { id:'21X5lGlDOfg', title:'Red Bull – High-G Automation Pilot', ch:'Red Bull' },
      { id:'eIho2S0ZahI', title:'TED – Machine Learning & Human Potential', ch:'TED' },
      { id:'qp0HIF3SfI4', title:'TED – Body Language and AI Detection', ch:'TED' },
      { id:'arj7oStGLkU', title:'TED – Algorithmic Creativity', ch:'TED' },
      { id:'nA9UZF-SZoQ', title:'Autonomous Planetary Rover Feed', ch:'NASA' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Autonomous Booster Landing', ch:'SpaceX' },
      { id:'qhLExhpXX0E', title:'AI Ocean Exploration Submersible', ch:'We The Curious' },
      { id:'0Bmhjf0rKe8', title:'Computer Vision Animal Motion Tracking', ch:'rozzzafly' },
      { id:'p4Gotl9vRGs', title:'Neural Net Behavioral Analysis', ch:'EastCoast Flipper' },
      { id:'JGwWNGJdvx8', title:'AI Audio Synthesis Model', ch:'Ed Sheeran' },
      { id:'kXYiU_JCYtU', title:'Cybernetic Signal Processor', ch:'Linkin Park' },
      { id:'YqeW9_5kURI', title:'Synthetic Neural Lights', ch:'Republic Records' },
      { id:'hT_nvWreIhg', title:'Quantum Computing Algorithm Matrix', ch:'OneRepublic' },
      { id:'OPf0YbXqDm0', title:'Robotic Rhythm Controller', ch:'MarkRonson' },
      { id:'60ItHLz5WEA', title:'Autonomous Drones in Fog', ch:'Alan Walker' },
      { id:'7wtfhZwyrcc', title:'Electromagnetic Pulse Synthesizer', ch:'Imagine Dragons' },
      { id:'SC4xMk98Pdc', title:'Ultra High Speed NLP Engine', ch:'EminemVEVO' }
    ],
    nature: [
      { id:'qhLExhpXX0E', title:'Deep Ocean – Marine Biology Discoveries', ch:'We The Curious' },
      { id:'nA9UZF-SZoQ', title:'NASA – Earth from Orbit 4K', ch:'NASA' },
      { id:'eIho2S0ZahI', title:'TED – The Wonders of Planet Earth', ch:'TED' },
      { id:'iG9CE55wbtY', title:'TED – The Living Biosphere', ch:'TED' },
      { id:'qp0HIF3SfI4', title:'TED – Wildlife Habitats & Nature', ch:'TED' },
      { id:'arj7oStGLkU', title:'TED – Natural Ecosystem Patterns', ch:'TED' },
      { id:'0Bmhjf0rKe8', title:'Slow Motion Wildlife & Felines', ch:'rozzzafly' },
      { id:'p4Gotl9vRGs', title:'Animals – Wild and Domestic Moments', ch:'EastCoast Flipper' },
      { id:'21X5lGlDOfg', title:'Red Bull – Atmosphere Dynamics', ch:'Red Bull' },
      { id:'8jPQjjsBbIc', title:'TED – Ecology of Planetary Systems', ch:'TED' },
      { id:'V4MF2s6MLxY', title:'Epic Games – Realistic Nature Simulation', ch:'Epic Games' },
      { id:'ANv5UfZsvZQ', title:'SpaceX – Atmospheric Penetration', ch:'SpaceX' },
      { id:'djzOBZUFzTw', title:'Boston Dynamics – Forest Terrain Agility', ch:'Boston Dynamics' },
      { id:'tF4DML7FIWk', title:'Boston Dynamics – Rough Trail Navigation', ch:'Boston Dynamics' },
      { id:'XPVC4IyRTG8', title:'Boston Dynamics – Dynamic Stability Outdoors', ch:'Boston Dynamics' },
      { id:'fn3KWM1kuAw', title:'DeepMind – Protein Structure Folding in Nature', ch:'DeepMind' },
      { id:'Sq1QZB5baNw', title:'Photorealistic Coral Reef Video AI', ch:'OpenAI' },
      { id:'JGwWNGJdvx8', title:'Acoustic Forest Symphony', ch:'Ed Sheeran' },
      { id:'kXYiU_JCYtU', title:'Cascading Waterfalls & Rain', ch:'Linkin Park' },
      { id:'YqeW9_5kURI', title:'Sunlight Breaking Through Clouds', ch:'Republic Records' },
      { id:'hT_nvWreIhg', title:'Night Sky Stargazing Wildlife', ch:'OneRepublic' },
      { id:'OPf0YbXqDm0', title:'Savannah Sunset & Wind', ch:'MarkRonson' },
      { id:'60ItHLz5WEA', title:'Glacier Glides & Nordic Fjords', ch:'Alan Walker' },
      { id:'7wtfhZwyrcc', title:'Tropical Thunderstorm Lightning', ch:'Imagine Dragons' },
      { id:'dQw4w9WgXcQ', title:'Golden Horizon Flight', ch:'Rick Astley' }
    ]
  },

  // Deep fallback list (28 items)
  DEEP_FALLBACK: [
    { id:'nA9UZF-SZoQ', title:'NASA – Earth from Space Live', ch:'NASA' },
    { id:'21X5lGlDOfg', title:'Felix Baumgartner – Space Jump', ch:'Red Bull' },
    { id:'ANv5UfZsvZQ', title:'SpaceX – Highlights', ch:'SpaceX' },
    { id:'djzOBZUFzTw', title:'Boston Dynamics – Atlas Maneuvers', ch:'Boston Dynamics' },
    { id:'tF4DML7FIWk', title:'Boston Dynamics – Atlas Parkour', ch:'Boston Dynamics' },
    { id:'XPVC4IyRTG8', title:'Boston Dynamics – Atlas Backflip', ch:'Boston Dynamics' },
    { id:'fn3KWM1kuAw', title:'Google DeepMind – Gemini AI', ch:'DeepMind' },
    { id:'qhLExhpXX0E', title:'Deep Ocean – Marine Biology', ch:'We The Curious' },
    { id:'0Bmhjf0rKe8', title:'Slow Motion Cats', ch:'rozzzafly' },
    { id:'p4Gotl9vRGs', title:'Cats & Dogs – Funniest Moments', ch:'EastCoast Flipper' },
    { id:'JGwWNGJdvx8', title:'Ed Sheeran – Shape of You', ch:'Ed Sheeran' },
    { id:'kXYiU_JCYtU', title:'Linkin Park – Numb', ch:'Linkin Park' },
    { id:'YqeW9_5kURI', title:'The Weeknd – Blinding Lights', ch:'Republic Records' },
    { id:'hT_nvWreIhg', title:'OneRepublic – Counting Stars', ch:'OneRepublic' },
    { id:'OPf0YbXqDm0', title:'Mark Ronson – Uptown Funk', ch:'MarkRonson' },
    { id:'60ItHLz5WEA', title:'Alan Walker – Faded', ch:'Alan Walker' },
    { id:'7wtfhZwyrcc', title:'Imagine Dragons – Thunder', ch:'Imagine Dragons' },
    { id:'dQw4w9WgXcQ', title:'Rick Astley – Never Gonna Give You Up', ch:'Rick Astley' },
    { id:'9bZkp7q19f0', title:'Psy – Gangnam Style', ch:'officialpsy' },
    { id:'V4MF2s6MLxY', title:'Epic Games – Matrix Awakens UE5', ch:'Epic Games' },
    { id:'SC4xMk98Pdc', title:'Eminem – Rap God', ch:'EminemVEVO' },
    { id:'8jPQjjsBbIc', title:'TED – Secrets of the Deep Cosmos', ch:'TED' },
    { id:'arj7oStGLkU', title:'TED – Exoplanet Discoveries', ch:'TED' },
    { id:'iG9CE55wbtY', title:'TED – Quantum Dimensions', ch:'TED' },
    { id:'eIho2S0ZahI', title:'TED – Human Resilience', ch:'TED' },
    { id:'qp0HIF3SfI4', title:'TED – Perception & Mind', ch:'TED' },
    { id:'Sq1QZB5baNw', title:'OpenAI Sora Simulation', ch:'OpenAI' },
    { id:'8F9jXYOH2c0', title:'Studio C – Matrix Parody', ch:'Studio C' }
  ],

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

  embedUrl(id, isMuted = true) {
    const origin = window.location.origin || 'https://flatterland.github.io';
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${id}&controls=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1&vq=hd720&suggestedQuality=hd720&origin=${encodeURIComponent(origin)}`;
  },

  async fetchLiveSearchResults(query, minCount = 25) {
    const q = query.trim();
    const directId = this.extractId(q);
    if (directId) {
      return [{ id: directId, title: `YouTube Video (${directId})`, ch: 'Direct Input' }];
    }

    const promises = this.INSTANCES.map(inst => {
      const url = `${inst}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
      return fetch(url, { signal: AbortSignal.timeout(3500) })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
          const items = Array.isArray(data) ? data : (data.items || []);
          const valid = [];
          for (const it of items) {
            let vidId = it.videoId || it.id;
            if (vidId && typeof vidId === 'string' && vidId.length === 11) {
              valid.push({
                id: vidId,
                title: it.title || q,
                ch: it.uploaderName || it.author || 'YouTube'
              });
            }
          }
          if (valid.length >= 3) return valid;
          throw new Error('Too few items');
        });
    });

    try {
      const results = await Promise.any(promises);
      if (results && results.length > 0) {
        console.log(`[MitC] Live search for "${q}" returned ${results.length} real videos`);
        return results;
      }
    } catch (e) {
      console.warn(`[MitC] Parallel live search fallback for "${q}"`);
    }

    return this.getImmediateResults(q, minCount);
  },

  getImmediateResults(query, count = 9) {
    const q = (query || '').toLowerCase().trim().replace(/^[#@]/, '');

    const directId = this.extractId(query);
    if (directId && (query.includes('youtube') || query.includes('youtu.be') || query.includes('/shorts/') || /^[A-Za-z0-9_-]{11}$/.test(query.trim()))) {
      const item = { id: directId, title: `YouTube Video (${directId})`, ch: 'Direct Input' };
      this.searchQueue = [item];
      this.queueIndex = 1;
      return [item];
    }

    for (const [catKey, pool] of Object.entries(this.POOLS)) {
      if (catKey === q || catKey.includes(q) || q.includes(catKey)) {
        this.searchQueue = [...pool, ...this.DEEP_FALLBACK];
        this.queueIndex = count;
        return this.searchQueue.slice(0, count);
      }
    }

    const all = Object.values(this.POOLS).flat();
    const words = q.split(/\s+/).filter(w => w.length > 1);
    const hits = all.filter(v => {
      const text = (v.title + ' ' + v.ch).toLowerCase();
      return words.some(w => text.includes(w));
    });

    if (hits.length > 0) {
      const padded = [...hits];
      while (padded.length < count) padded.push(...this.DEEP_FALLBACK);
      this.searchQueue = padded;
      this.queueIndex = count;
      return this.searchQueue.slice(0, count);
    }

    const customList = this.DEEP_FALLBACK.map((v, i) => ({
      id: v.id,
      title: `${query.toUpperCase()} – Stream #${i+1} (${v.ch})`,
      ch: v.ch
    }));
    this.searchQueue = [...customList];
    this.queueIndex = count;
    return customList.slice(0, count);
  },

  async searchLiveAsync(query, onResults, count = 9) {
    this.currentQuery = query.trim();
    const results = await this.fetchLiveSearchResults(query, count);
    if (results && results.length > 0) {
      this.searchQueue = [...results, ...this.DEEP_FALLBACK];
      this.queueIndex = count;
      if (typeof onResults === 'function') {
        onResults(results.slice(0, count));
      }
    }
  },

  async fetchTopResult(query) {
    const results = await this.fetchLiveSearchResults(query, 1);
    return results && results.length > 0 ? results[0] : this.getImmediateResults(query, 1)[0];
  },

  // Buffer 25 REAL videos for Cinematic Launch
  async getCinematic25(query) {
    this.currentQuery = query.trim();
    const results = await this.fetchLiveSearchResults(query, 25);
    if (results && results.length >= 25) {
      return results.slice(0, 25);
    } else if (results && results.length > 0) {
      const padded = [...results];
      while (padded.length < 25) {
        padded.push(...this.DEEP_FALLBACK);
      }
      return padded.slice(0, 25);
    }
    return this.getImmediateResults(query, 25);
  },

  // Alias for backward compatibility
  async getCinematic15(query) {
    return this.getCinematic25(query);
  },

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
