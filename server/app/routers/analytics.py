from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib

from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_current_active_superuser
from app.models.user import User
from app.models.analytics import PageView
from app.schemas.analytics import PageViewCreate, PageViewStats, ReferrerStats, AnalyticsSummary

router = APIRouter()

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def compute_visitor_hash(ip: str, user_agent: str) -> str:
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    raw = f"{settings.SECRET_KEY}:{ip}:{user_agent}:{today_str}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

@router.post("/view")
def record_page_view(data: PageViewCreate, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent", "")
    visitor_hash = compute_visitor_hash(ip, ua)

    # 30-minute anti-spam debounce window per path per visitor
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
    recent = (
        db.query(PageView.id)
        .filter(
            PageView.path == data.path,
            PageView.visitor_hash == visitor_hash,
            PageView.created_at >= cutoff
        )
        .first()
    )

    if recent:
        return {"status": "debounced"}

    view = PageView(
        path=data.path[:255],
        visitor_hash=visitor_hash,
        referrer=data.referrer[:500] if data.referrer else None,
        user_agent=ua[:255] if ua else None
    )
    db.add(view)
    db.commit()
    return {"status": "recorded"}

@router.get("/stats", response_model=PageViewStats)
def get_page_stats(path: str, db: Session = Depends(get_db)):
    total_views = db.query(func.count(PageView.id)).filter(PageView.path == path).scalar() or 0
    unique_visitors = (
        db.query(func.count(func.distinct(PageView.visitor_hash)))
        .filter(PageView.path == path)
        .scalar() or 0
    )
    return PageViewStats(path=path, total_views=total_views, unique_visitors=unique_visitors)

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    total_views = db.query(func.count(PageView.id)).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_views = (
        db.query(func.count(PageView.id))
        .filter(PageView.created_at >= today_start)
        .scalar() or 0
    )
    unique_visitors_today = (
        db.query(func.count(func.distinct(PageView.visitor_hash)))
        .filter(PageView.created_at >= today_start)
        .scalar() or 0
    )

    top_pages_rows = (
        db.query(
            PageView.path,
            func.count(PageView.id).label("total"),
            func.count(func.distinct(PageView.visitor_hash)).label("uniques")
        )
        .group_by(PageView.path)
        .order_by(text("total DESC"))
        .limit(10)
        .all()
    )

    top_pages = [
        PageViewStats(path=row[0], total_views=row[1], unique_visitors=row[2])
        for row in top_pages_rows
    ]

    top_referrers_rows = (
        db.query(
            PageView.referrer,
            func.count(PageView.id).label("cnt")
        )
        .filter(PageView.referrer.isnot(None), PageView.referrer != "")
        .group_by(PageView.referrer)
        .order_by(text("cnt DESC"))
        .limit(10)
        .all()
    )

    top_referrers = [
        ReferrerStats(referrer=row[0], count=row[1])
        for row in top_referrers_rows
    ]

    return AnalyticsSummary(
        total_views=total_views,
        today_views=today_views,
        unique_visitors_today=unique_visitors_today,
        top_pages=top_pages,
        top_referrers=top_referrers
    )
