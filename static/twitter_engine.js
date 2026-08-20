
// Official Twitter / X Embed Ingestion & 3D Rendering Engine
const TwitterEngine = {
    // Real verified Tweet IDs with official video playback
    TWEET_COLLECTION: [
        // Space
        { id: "1798696803276685412", category: "space", tags: ["space", "spacex", "starship", "rocket", "elon"] },
        { id: "1768305886476681600", category: "space", tags: ["space", "spacex", "starship", "booster"] },
        { id: "1594326500581781504", category: "space", tags: ["space", "nasa", "moon", "artemis"] },
        { id: "1546922187895054336", category: "space", tags: ["space", "webb", "jwst", "telescope", "stars"] },
        
        // AI & Robotics
        { id: "1758202954848313397", category: "ai", tags: ["ai", "openai", "sora", "video", "chatgpt"] },
        { id: "1780612458428387584", category: "ai", tags: ["ai", "robotics", "robot", "bostondynamics", "atlas"] },
        { id: "1705758364801655198", category: "ai", tags: ["ai", "tesla", "optimus", "robot"] },
        { id: "1788226065582375330", category: "ai", tags: ["ai", "deepmind", "google", "alphafold"] },

        // Cats
        { id: "1689255288280735744", category: "cat", tags: ["cat", "cats", "kitten", "pets", "animals"] },
        { id: "1734241775837311100", category: "cat", tags: ["cat", "cats", "cute", "kitten"] },
        { id: "1671926667954331650", category: "cat", tags: ["cat", "cats", "funny"] },

        // Dogs
        { id: "1665406086702678018", category: "dog", tags: ["dog", "dogs", "puppy", "goldenretriever"] },
        { id: "1657802874130698240", category: "dog", tags: ["dog", "dogs", "agility", "k9"] },

        // Gaming & F1
        { id: "1511352467389816834", category: "gaming", tags: ["gaming", "unreal", "ue5", "graphics"] },
        { id: "1645791244349833216", category: "gaming", tags: ["gaming", "cyberpunk", "nightcity", "rtx"] },
        { id: "1662855146812207106", category: "f1", tags: ["f1", "racing", "cars", "formula1", "monaco"] }
    ],

    // Extract Tweet ID from any Twitter/X URL
    extractTweetId(url) {
        const match = url.match(/(?:twitter|x)\.com\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/i);
        return match ? match[1] : null;
    },

    // Search matching Tweet IDs
    search(query, count = 6) {
        const clean = query.trim().replace(/^[#@]/, '');
        const lower = clean.toLowerCase();

        // 1. Direct Tweet URL
        const directId = this.extractTweetId(clean);
        if (directId) {
            return [{ id: directId, category: "custom", tags: [clean] }];
        }

        // 2. Keyword Match in Collection
        const matched = this.TWEET_COLLECTION.filter(t => {
            return (
                t.tags.some(tag => tag.includes(lower) || lower.includes(tag)) ||
                t.category.toLowerCase().includes(lower)
            );
        });

        if (matched.length >= count) {
            return matched.slice(0, count);
        }

        // Fill remaining with other tweets from collection
        const results = [...matched];
        for (const item of this.TWEET_COLLECTION) {
            if (!results.some(r => r.id === item.id)) {
                results.push(item);
                if (results.length >= count) break;
            }
        }

        return results.slice(0, count);
    }
};
