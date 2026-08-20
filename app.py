import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from twitter_scraper import TwitterScraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("holo_app")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Holographic Twitter Surveillance Command Bridge", version="1.0.0")
scraper = TwitterScraper()

class ExtractRequest(BaseModel):
    url: str

@app.get("/api/search")
async def search_endpoint(q: str = Query(..., min_length=1), count: int = Query(6, ge=1, le=12)):
    try:
        results = await scraper.search_topic(q, count=count)
        return {
            "success": True,
            "query": q,
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.exception(f"Error searching topic '{q}':")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trending")
async def trending_endpoint():
    try:
        trending = scraper.get_trending()
        return {
            "success": True,
            "count": len(trending),
            "results": trending
        }
    except Exception as e:
        logger.exception("Error getting trending:")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-url")
async def extract_url_endpoint(req: ExtractRequest):
    try:
        item = await scraper.extract_from_tweet_url(req.url)
        if not item:
            raise HTTPException(status_code=404, detail="No video stream could be extracted from the specified URL")
        return {
            "success": True,
            "item": item
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error extracting URL {req.url}:")
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
async def root():
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Holographic server running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=False)
