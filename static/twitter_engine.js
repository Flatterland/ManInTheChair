
// Standalone Client-Side Twitter / X Ingestion & Search Engine
const TwitterEngine = {
    LOCAL_VIDEO_POOL: [
        "./static/assets/videos/cyber_grid.mp4",
        "./static/assets/videos/neural_matrix.mp4",
        "./static/assets/videos/radar_sweep.mp4",
        "./static/assets/videos/space_nebula.mp4",
        "./static/assets/videos/quantum_core.mp4",
        "./static/assets/videos/feline_telemetry.mp4"
    ],

    TOPIC_DATABASE: {
        "cat": [
            {
                "id": "cat_1",
                "author_name": "Feline Quantum Watch",
                "author_handle": "@DailyCatsX",
                "avatar": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop",
                "text": "Ninja cat calculated the jump trajectory with microsecond precision! 🐾 #CatsOfTwitter",
                "video_url": "./static/assets/videos/feline_telemetry.mp4",
                "views": "2.8M", "likes": "94K", "retweets": "18K", "category": "Cats", "timestamp": "3m ago"
            },
            {
                "id": "cat_2",
                "author_name": "Cute Cat Daily",
                "author_handle": "@CuteCatsHub",
                "avatar": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=100&h=100&fit=crop",
                "text": "Kitten tracking holographic laser dot across the command bridge. Chaos engaged! 🐱",
                "video_url": "./static/assets/videos/quantum_core.mp4",
                "views": "1.2M", "likes": "52K", "retweets": "9.4K", "category": "Cats", "timestamp": "18m ago"
            },
            {
                "id": "cat_3",
                "author_name": "Meow Matrix",
                "author_handle": "@MeowMatrix",
                "avatar": "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=100&h=100&fit=crop",
                "text": "Sleeping in zero gravity: ultimate comfort mode activated 😴 #Cats",
                "video_url": "./static/assets/videos/space_nebula.mp4",
                "views": "980K", "likes": "41K", "retweets": "7.1K", "category": "Cats", "timestamp": "45m ago"
            },
            {
                "id": "cat_4",
                "author_name": "Cat Central",
                "author_handle": "@CatCentral_HQ",
                "avatar": "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=100&h=100&fit=crop",
                "text": "Synchronized head movements when the bird outside lands on the observation window! 🐦",
                "video_url": "./static/assets/videos/cyber_grid.mp4",
                "views": "1.5M", "likes": "68K", "retweets": "12K", "category": "Cats", "timestamp": "1h ago"
            }
        ],
        "dog": [
            {
                "id": "dog_1",
                "author_name": "Golden Retrievers Online",
                "author_handle": "@GoldenVibes",
                "avatar": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop",
                "text": "Teaching the puppy how to fetch the hypersonic disc! 🐶 #Dogs",
                "video_url": "./static/assets/videos/radar_sweep.mp4",
                "views": "3.1M", "likes": "130K", "retweets": "25K", "category": "Dogs", "timestamp": "10m ago"
            },
            {
                "id": "dog_2",
                "author_name": "K9 Agility League",
                "author_handle": "@K9Agility",
                "avatar": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop",
                "text": "Border Collie sets world obstacle course record in 14.2 seconds! Insane agility ⚡",
                "video_url": "./static/assets/videos/quantum_core.mp4",
                "views": "2.4M", "likes": "88K", "retweets": "19K", "category": "Dogs", "timestamp": "35m ago"
            }
        ],
        "ai": [
            {
                "id": "ai_1",
                "author_name": "OpenAI & Robotics Research",
                "author_handle": "@OpenAI_Vision",
                "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
                "text": "Autonomous bipedal robot neural locomotion testing in real-world unstructured terrain #AI #Robotics",
                "video_url": "./static/assets/videos/neural_matrix.mp4",
                "views": "1.4M", "likes": "45.2K", "retweets": "9.8K", "category": "AI & Robotics", "timestamp": "12m ago"
            },
            {
                "id": "ai_2",
                "author_name": "Cybernetic Systems Lab",
                "author_handle": "@CyberSys_X",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                "text": "Multi-agent drone swarm performing spatial geometry and obstacle avoidance #SwarmAI",
                "video_url": "./static/assets/videos/cyber_grid.mp4",
                "views": "890K", "likes": "24.1K", "retweets": "5.3K", "category": "AI & Robotics", "timestamp": "42m ago"
            },
            {
                "id": "ai_3",
                "author_name": "Quantum Neural Tech",
                "author_handle": "@QuantumNeural",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                "text": "Real-time volumetric 3D reconstruction from optical sensor feeds using next-gen transformer weights #MachineLearning",
                "video_url": "./static/assets/videos/quantum_core.mp4",
                "views": "2.1M", "likes": "68.4K", "retweets": "14.2K", "category": "AI & Robotics", "timestamp": "1h ago"
            }
        ],
        "space": [
            {
                "id": "space_1",
                "author_name": "Orbital Watch HQ",
                "author_handle": "@OrbitalWatch",
                "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
                "text": "Spectacular booster separation captured from the orbital recovery vessel cameras. All 33 engines nominal! 🚀",
                "video_url": "./static/assets/videos/space_nebula.mp4",
                "views": "4.2M", "likes": "140K", "retweets": "32K", "category": "Space", "timestamp": "5m ago"
            },
            {
                "id": "space_2",
                "author_name": "James Webb Deep Sky",
                "author_handle": "@JWST_Observations",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                "text": "3D volumetric fly-through reconstructed from infrared telemetry of the Carina Nebula star-forming region. 🌌",
                "video_url": "./static/assets/videos/quantum_core.mp4",
                "views": "1.8M", "likes": "89K", "retweets": "21K", "category": "Space", "timestamp": "30m ago"
            },
            {
                "id": "space_3",
                "author_name": "ISS Live Stream",
                "author_handle": "@SpaceStationLive",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                "text": "Aurora Borealis dancing across the northern hemisphere as seen from 400km above Earth. #Aurora #ISS",
                "video_url": "./static/assets/videos/cyber_grid.mp4",
                "views": "3.5M", "likes": "112K", "retweets": "28K", "category": "Space", "timestamp": "1h ago"
            }
        ],
        "cyberpunk": [
            {
                "id": "cyber_1",
                "author_name": "Neo Tokyo Signals",
                "author_handle": "@NeoTokyoGrid",
                "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
                "text": "Central sector nighttime traffic telemetry and biometric billboard scan in rain district. Sector 09 clear. #Cyberpunk",
                "video_url": "./static/assets/videos/cyber_grid.mp4",
                "views": "1.1M", "likes": "54K", "retweets": "12K", "category": "Cyberpunk", "timestamp": "8m ago"
            },
            {
                "id": "cyber_2",
                "author_name": "Neural Interface Corp",
                "author_handle": "@NeuralLink_Dev",
                "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                "text": "Real-time synaptic signal decoding displaying synthetic vision feed rendered at 240Hz direct to cortex. #BCI",
                "video_url": "./static/assets/videos/neural_matrix.mp4",
                "views": "2.8M", "likes": "94K", "retweets": "22K", "category": "Cyberpunk", "timestamp": "25m ago"
            }
        ],
        "gaming": [
            {
                "id": "game_1",
                "author_name": "Unreal Engine 5 Showcase",
                "author_handle": "@NextGenRenders",
                "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
                "text": "Lumen dynamic global illumination and Nanite micropolygon geometry benchmark running at 4K 120FPS. 🎮",
                "video_url": "./static/assets/videos/quantum_core.mp4",
                "views": "3.1M", "likes": "125K", "retweets": "27K", "category": "Gaming", "timestamp": "15m ago"
            },
            {
                "id": "game_2",
                "author_name": "Mecha Combat League",
                "author_handle": "@MechaArena",
                "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                "text": "Heavy mech aerial evasion maneuver and laser barrage combo during championship finals! 💥",
                "video_url": "./static/assets/videos/radar_sweep.mp4",
                "views": "1.7M", "likes": "78K", "retweets": "16K", "category": "Gaming", "timestamp": "50m ago"
            }
        ]
    },

    // Extract direct video stream from Twitter/X URL via public open APIs (FxTwitter / VxTwitter / Syndication)
    async extractTwitterUrl(url) {
        console.log('[TWITTER-ENGINE] Extracting direct video from URL:', url);
        const match = url.match(/(?:twitter|x)\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i);
        if (!match) return null;

        const handle = match[1];
        const tweetId = match[2];

        // 1. Try FxTwitter API
        try {
            const fxRes = await fetch(`https://api.fxtwitter.com/${handle}/status/${tweetId}`);
            if (fxRes.ok) {
                const fxData = await fxRes.json();
                if (fxData.tweet && fxData.tweet.media && fxData.tweet.media.videos) {
                    const videoObj = fxData.tweet.media.videos[0];
                    return {
                        id: `tw_${tweetId}`,
                        author_name: fxData.tweet.author.name || handle,
                        author_handle: `@${fxData.tweet.author.screen_name || handle}`,
                        avatar: fxData.tweet.author.avatar_url || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
                        text: fxData.tweet.text || "Captured Twitter/X video stream",
                        video_url: videoObj.url,
                        views: `${(fxData.tweet.views || 500000) / 1000}K`,
                        likes: `${(fxData.tweet.likes || 12000) / 1000}K`,
                        retweets: `${(fxData.tweet.retweets || 2400) / 1000}K`,
                        category: "Twitter Stream",
                        timestamp: "Live"
                    };
                }
            }
        } catch (e) {
            console.warn('[TWITTER-ENGINE] FxTwitter extract error:', e);
        }

        // 2. Try VxTwitter API
        try {
            const vxRes = await fetch(`https://api.vxtwitter.com/${handle}/status/${tweetId}`);
            if (vxRes.ok) {
                const vxData = await vxRes.json();
                if (vxData.media_extended && vxData.media_extended.length > 0) {
                    const videoObj = vxData.media_extended.find(m => m.type === 'video' || m.type === 'gif');
                    if (videoObj) {
                        return {
                            id: `tw_${tweetId}`,
                            author_name: vxData.user_name || handle,
                            author_handle: `@${vxData.user_screen_name || handle}`,
                            avatar: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
                            text: vxData.text || "Captured Twitter/X video stream",
                            video_url: videoObj.url,
                            views: "Live",
                            likes: `${(vxData.likes || 10000) / 1000}K`,
                            retweets: `${(vxData.retweets || 1500) / 1000}K`,
                            category: "Twitter Stream",
                            timestamp: "Live"
                        };
                    }
                }
            }
        } catch (e) {
            console.warn('[TWITTER-ENGINE] VxTwitter extract error:', e);
        }

        return null;
    },

    // Search or generate 6 streams for any query
    async search(query, count = 6) {
        const clean = query.trim().replace(/^[#@]/, '');
        const lower = clean.toLowerCase();

        // 1. Direct URL check
        if (clean.startsWith('http://') || clean.startsWith('https://')) {
            const direct = await this.extractTwitterUrl(clean);
            if (direct) return [direct];
        }

        // 2. Database Keyword match
        let results = [];
        for (const [k, items] of Object.entries(this.TOPIC_DATABASE)) {
            if (k.includes(lower) || lower.includes(k)) {
                results.push(...items);
            }
        }

        if (!results.length) {
            for (const [k, items] of Object.entries(this.TOPIC_DATABASE)) {
                for (const it of items) {
                    if (it.text.toLowerCase().includes(lower) || it.author_name.toLowerCase().includes(lower)) {
                        results.push(it);
                    }
                }
            }
        }

        // 3. Dynamic Synthetic Topic Generation for any custom query
        if (results.length < count) {
            let seed = 0;
            for (let i = 0; i < lower.length; i++) seed += lower.charCodeAt(i) * (i + 1);

            const authors = [
                `${clean.toUpperCase()} Tactical Feed`,
                `Live #${clean} Relay`,
                `Daily ${clean} Stream`,
                `${clean} Orbital Watch`,
                `${clean} Signal Hub`,
                `Sector ${clean} Feed`
            ];
            const handles = [`@${lower}_intel`, `@Daily_${lower}`, `@${lower}_matrix`, `@${lower}_hub`, `@${lower}_network`, `@${lower}_live`];
            const snippets = [
                `Real-time optical feed tracking high engagement surges across #${clean.toUpperCase()}.`,
                `Orbital satellite telemetry locked on #${clean.toUpperCase()} signal nodes.`,
                `Neural analysis stream processing dynamic visual tracking for #${clean.toUpperCase()}.`,
                `Tactical surveillance feed broadcasting high-bandwidth data for #${clean.toUpperCase()}.`,
                `Quantum channel streaming verified video packets regarding #${clean.toUpperCase()}.`,
                `Live interception feed online with automated pattern detection on #${clean.toUpperCase()}.`
            ];

            const needed = count - results.length;
            for (let i = 0; i < needed; i++) {
                const vidIdx = (seed + i) % this.LOCAL_VIDEO_POOL.length;
                results.push({
                    id: `dyn_${lower}_${i}`,
                    author_name: authors[i % authors.length],
                    author_handle: handles[i % handles.length],
                    avatar: `https://images.unsplash.com/photo-${1500000000000 + (seed % 999999)}?w=100&h=100&fit=crop`,
                    text: snippets[i % snippets.length],
                    video_url: this.LOCAL_VIDEO_POOL[vidIdx],
                    views: `${(((seed + i * 37) % 800 + 100) / 10).toFixed(1)}M`,
                    likes: `${(((seed + i * 19) % 900 + 50) / 10).toFixed(1)}K`,
                    retweets: `${(((seed + i * 13) % 200 + 10) / 10).toFixed(1)}K`,
                    category: clean,
                    timestamp: `${i * 7 + 2}m ago`
                });
            }
        }

        return results.slice(0, count);
    }
};
