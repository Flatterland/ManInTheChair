import asyncio
from twitter_scraper import TwitterScraper

async def test_scraper():
    scraper = TwitterScraper()
    
    # 1. Test Trending
    trending = scraper.get_trending()
    print(f"Trending items count: {len(trending)}")
    assert len(trending) > 0, "No trending items returned"
    assert "video_url" in trending[0], "Missing video_url"
    
    # 2. Test Search
    results = await scraper.search_topic("Space", count=4)
    print(f"Search results count: {len(results)}")
    assert len(results) == 4, f"Expected 4 results, got {len(results)}"
    assert "space" in results[0]["category"].lower() or "space" in results[0]["text"].lower()
    
    print("ALL UNIT TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_scraper())
