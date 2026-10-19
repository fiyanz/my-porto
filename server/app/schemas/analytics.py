from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PageViewCreate(BaseModel):
    path: str
    referrer: Optional[str] = None

class PageViewResponse(BaseModel):
    id: int
    path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PageViewStats(BaseModel):
    path: str
    total_views: int
    unique_visitors: int

class ReferrerStats(BaseModel):
    referrer: str
    count: int

class AnalyticsSummary(BaseModel):
    total_views: int
    today_views: int
    unique_visitors_today: int
    top_pages: List[PageViewStats]
    top_referrers: List[ReferrerStats]
