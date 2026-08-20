import re
import logging
import asyncio
import httpx
from typing import List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("twitter_scraper")

LOCAL_STREAMS = [
    "/static/assets/videos/cyber_grid.mp4",
    "/static/assets/videos/neural_matrix.mp4",
    "/static/assets/videos/radar_sweep.mp4",
    "/static/assets/videos/space_nebula.mp4",
    "/static/assets/videos/quantum_core.mp4",
    "/static/assets/videos/feline_telemetry.mp4"
]

TOPIC_DATABASE = {
    "cat": [
        {
            "author_name": "Feline Quantum Watch",
            "author_handle": "@DailyCatsX",
            "avatar": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop",
            "text": "Ninja cat calculated the jump trajectory with microsecond precision! 🐾 #CatsOfTwitter",
            "video_url": "/static/assets/videos/feline_telemetry.mp4",
            "views": "2.8M", "likes": "94K", "retweets": "18K", "category": "Cats", "timestamp": "3m ago"
        },
        {
            "author_name": "Cute Cat Daily",
            "author_handle": "@CuteCatsHub",
            "avatar": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=100&h=100&fit=crop",
            "text": "Kitten tracking holographic laser dot across the command bridge. Chaos engaged! 🐱",
            "video_url": "/static/assets/videos/quantum_core.mp4",
            "views": "1.2M", "likes": "52K", "retweets": "9.4K", "category": "Cats", "timestamp": "18m ago"
        },
        {
            "author_name": "Meow Matrix",
            "author_handle": "@MeowMatrix",
            "avatar": "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=100&h=100&fit=crop",
            "text": "Sleeping in zero gravity: ultimate comfort mode activated 😴 #Cats",
            "video_url": "/static/assets/videos/space_nebula.mp4",
            "views": "980K", "likes": "41K", "retweets": "7.1K", "category": "Cats", "timestamp": "45m ago"
        },
        {
            "author_name": "Cat Central",
            "author_handle": "@CatCentral_HQ",
            "avatar": "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=100&h=100&fit=crop",
            "text": "Synchronized head movements when the bird outside lands on the orbital observation window! 🐦",
            "video_url": "/static/assets/videos/cyber_grid.mp4",
            "views": "1.5M", "likes": "68K", "retweets": "12K", "category": "Cats", "timestamp": "1h ago"
        }
    ],
    "dog": [
        {
            "author_name": "Golden Retrievers Online",
            "author_handle": "@GoldenVibes",
            "avatar": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop",
            "text": "Teaching the puppy how to fetch the hypersonic disc! 🐶 #Dogs",
            "video_url": "/static/assets/videos/radar_sweep.mp4",
            "views": "3.1M", "likes": "130K", "retweets": "25K", "category": "Dogs", "timestamp": "10m ago"
        },
        {
            "author_name": "K9 Agility League",
            "author_handle": "@K9Agility",
            "avatar": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop",
            "text": "Border Collie sets world obstacle course record in 14.2 seconds! Insane agility ⚡",
            "video_url": "/static/assets/videos/quantum_core.mp4",
            "views": "2.4M", "likes": "88K", "retweets": "19K", "category": "Dogs", "timestamp": "35m ago"
        }
    ],
    "ai": [
        {
            "author_name": "OpenAI & Robotics Research",
            "author_handle": "@OpenAI_Vision",
            "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
            "text": "Autonomous bipedal robot neural locomotion testing in real-world unstructured terrain #AI #Robotics",
            "video_url": "/static/assets/videos/neural_matrix.mp4",
            "views": "1.4M", "likes": "45.2K", "retweets": "9.8K", "category": "AI & Robotics", "timestamp": "12m ago"
        },
        {
            "author_name": "Cybernetic Systems Lab",
            "author_handle": "@CyberSys_X",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
            "text": "Multi-agent drone swarm performing spatial geometry and obstacle avoidance in zero-visibility conditions #SwarmAI",
            "video_url": "/static/assets/videos/cyber_grid.mp4",
            "views": "890K", "likes": "24.1K", "retweets": "5.3K", "category": "AI & Robotics", "timestamp": "42m ago"
        },
        {
            "author_name": "Quantum Neural Tech",
            "author_handle": "@QuantumNeural",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
            "text": "Real-time volumetric 3D reconstruction from single optical sensor feeds using next-gen transformer weights #MachineLearning",
            "video_url": "/static/assets/videos/quantum_core.mp4",
            "views": "2.1M", "likes": "68.4K", "retweets": "14.2K", "category": "AI & Robotics", "timestamp": "1h ago"
        },
        {
            "author_name": "Atlas Dynamics",
            "author_handle": "@AtlasRobotics",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
            "text": "Precision high-speed manipulation tests: picking and sorting complex micro-components at 120 FPS.",
            "video_url": "/static/assets/videos/radar_sweep.mp4",
            "views": "420K", "likes": "18.9K", "retweets": "3.1K", "category": "AI & Robotics", "timestamp": "2h ago"
        }
    ],
    "space": [
        {
            "author_name": "Orbital Watch HQ",
            "author_handle": "@OrbitalWatch",
            "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
            "text": "Spectacular booster separation captured from the orbital recovery vessel cameras. All 33 engines nominal! 🚀",
            "video_url": "/static/assets/videos/space_nebula.mp4",
            "views": "4.2M", "likes": "140K", "retweets": "32K", "category": "Space", "timestamp": "5m ago"
        },
        {
            "author_name": "James Webb Deep Sky",
            "author_handle": "@JWST_Observations",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
            "text": "3D volumetric fly-through reconstructed from infrared telemetry of the Carina Nebula star-forming region. 🌌",
            "video_url": "/static/assets/videos/quantum_core.mp4",
            "views": "1.8M", "likes": "89K", "retweets": "21K", "category": "Space", "timestamp": "30m ago"
        },
        {
            "author_name": "ISS Live Stream",
            "author_handle": "@SpaceStationLive",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
            "text": "Aurora Borealis dancing across the northern hemisphere as seen from 400km above Earth. #Aurora #ISS",
            "video_url": "/static/assets/videos/cyber_grid.mp4",
            "views": "3.5M", "likes": "112K", "retweets": "28K", "category": "Space", "timestamp": "1h ago"
        },
        {
            "author_name": "Mars Rover Horizon",
            "author_handle": "@PerseveranceNav",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
            "text": "Sol 1240 panoramic scan across Jezero crater ancient river delta. Core sample safely sealed.",
            "video_url": "/static/assets/videos/neural_matrix.mp4",
            "views": "760K", "likes": "35K", "retweets": "7.4K", "category": "Space", "timestamp": "3h ago"
        }
    ],
    "cyberpunk": [
        {
            "author_name": "Neo Tokyo Signals",
            "author_handle": "@NeoTokyoGrid",
            "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
            "text": "Central sector nighttime traffic telemetry and biometric billboard scan in rain district. Sector 09 clear. #Cyberpunk",
            "video_url": "/static/assets/videos/cyber_grid.mp4",
            "views": "1.1M", "likes": "54K", "retweets": "12K", "category": "Cyberpunk", "timestamp": "8m ago"
        },
        {
            "author_name": "Neural Interface Corp",
            "author_handle": "@NeuralLink_Dev",
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            "text": "Real-time synaptic signal decoding displaying synthetic vision feed rendered at 240Hz direct to cortex. #BCI",
            "video_url": "/static/assets/videos/neural_matrix.mp4",
            "views": "2.8M", "likes": "94K", "retweets": "22K", "category": "Cyberpunk", "timestamp": "25m ago"
        }
    ],
    "gaming": [
        {
            "author_name": "Unreal Engine 5 Showcase",
            "author_handle": "@NextGenRenders",
            "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&h=100&fit=crop",
            "text": "Lumen dynamic global illumination and Nanite micropolygon geometry benchmark running at 4K 120FPS. 🎮",
            "video_url": "/static/assets/videos/quantum_core.mp4",
            "views": "3.1M", "likes": "125K", "retweets": "27K", "category": "Gaming", "timestamp": "15m ago"
        },
        {
            "author_name": "Mecha Combat League",
            "author_handle": "@MechaArena",
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            "text": "Heavy mech aerial evasion maneuver and laser barrage combo during championship finals! 💥",
            "video_url": "/static/assets/videos/radar_sweep.mp4",
            "views": "1.7M", "likes": "78K", "retweets": "16K", "category": "Gaming", "timestamp": "50m ago"
        }
    ]
}

class TwitterScraper:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    async def search_topic(self, topic: str, count: int = 6) -> List[Dict[str, Any]]:
        """Searches for video feeds matching a topic keyword, hashtag, or category."""
        topic_clean = topic.strip().lstrip("#").lstrip("@")
        topic_lower = topic_clean.lower()
        results = []

        # 1. Database Keyword Matching
        for key, items in TOPIC_DATABASE.items():
            if key in topic_lower or topic_lower in key:
                results.extend(items)
                
        if not results:
            for key, items in TOPIC_DATABASE.items():
                for item in items:
                    if (topic_lower in item["text"].lower() or 
                        topic_lower in item["author_name"].lower() or 
                        topic_lower in item["category"].lower()):
                        results.append(item)

        # 2. Dynamic Topic Generator with Rotating Local Streams
        if len(results) < count:
            import hashlib
            seed = int(hashlib.md5(topic_lower.encode()).hexdigest(), 16)
            
            handles = ["@QuantumFeeds", "@OrbitalMatrix", "@CyberIntel_HQ", "@GlobalScanner", "@AlphaStreamX", "@EchoTelemetry"]
            authors = [f"{topic_clean.title()} Tactical Feed", f"{topic_clean.title()} Radar Network", f"{topic_clean.title()} Live Wire", f"Daily {topic_clean.title()} Stream", f"{topic_clean.title()} Deep Scan", f"Global {topic_clean.title()} Channel"]
            
            snippets = [
                f"High-resolution real-time optical capture for #{topic_clean.upper()}. Telemetry tracking nominal.",
                f"Multi-angle orbital surveillance intercepted video stream discussing #{topic_clean.upper()}.",
                f"Breaking visual data feed: high engagement surge on #{topic_clean.upper()} across all nodes.",
                f"Live broadcast feed verified: automated tactical analysis active for #{topic_clean.upper()}.",
                f"Quantum frequency relay streaming high-bandwidth visual feed #{topic_clean.upper()}.",
                f"Field transmission locked on #{topic_clean.upper()} with full 60 FPS clarity."
            ]
            
            for i in range(count - len(results)):
                idx = (seed + i) % len(LOCAL_STREAMS)
                results.append({
                    "id": f"dyn_{topic_lower}_{i}",
                    "author_name": authors[i % len(authors)],
                    "author_handle": handles[i % len(handles)],
                    "avatar": f"https://images.unsplash.com/photo-{1500000000000 + (seed % 999999)}?w=100&h=100&fit=crop",
                    "text": snippets[i % len(snippets)],
                    "video_url": LOCAL_STREAMS[idx],
                    "views": f"{((seed + i * 37) % 800 + 100) / 10:.1f}M",
                    "likes": f"{((seed + i * 19) % 900 + 50) / 10:.1f}K",
                    "retweets": f"{((seed + i * 13) % 200 + 10) / 10:.1f}K",
                    "category": topic_clean.title(),
                    "timestamp": f"{(i * 7 + 2)}m ago"
                })

        return results[:count]

    def get_trending(self) -> List[Dict[str, Any]]:
        """Returns trending surveillance channels."""
        trending_list = []
        for cat in ["ai", "space", "cyberpunk", "gaming", "cat", "dog"]:
            if cat in TOPIC_DATABASE:
                trending_list.extend(TOPIC_DATABASE[cat][:1])
        return trending_list
