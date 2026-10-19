import httpx
import base64
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.skill import Skill
from app.core.config import settings

cache = {
    "telemetry": None,
    "last_updated": 0
}

CACHE_TTL = 3600  # 1 hour

def get_wakatime_auth_header(api_key: str) -> Dict[str, str]:
    encoded_key = base64.b64encode(api_key.strip().encode("utf-8")).decode("utf-8")
    return {
        "Authorization": f"Basic {encoded_key}",
        "Accept": "application/json"
    }

def format_compact_hours(raw_hours: str) -> str:
    if not raw_hours:
        return "0h"
    return (
        raw_hours.replace(" hrs", "h")
        .replace(" hr", "h")
        .replace(" mins", "m")
        .replace(" min", "m")
        .strip()
    )

async def fetch_wakatime_stats(api_key: str) -> Optional[Dict[str, Any]]:
    headers = get_wakatime_auth_header(api_key)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://wakatime.com/api/v1/users/current/stats/last_7_days",
                headers=headers
            )
            if resp.status_code == 200:
                body = resp.json()
                data = body.get("data", {})

                # Human readable weekly total
                raw_weekly = data.get("human_readable_total") or "0 hrs"
                weekly_hours = format_compact_hours(raw_weekly)
                daily_average = data.get("daily_average_text") or "0 hrs"

                # Top languages
                languages = data.get("languages", [])
                top_langs = [l.get("name") for l in languages[:2] if l.get("name")]
                top_stack = " · ".join(top_langs) if top_langs else "Python · Go"

                # Editors & OS
                editors = data.get("editors", [])
                top_editor = editors[0].get("name") if editors else "Neovim"

                os_list = data.get("operating_systems", [])
                top_os = os_list[0].get("name") if os_list else "Linux"

                daily_driver = f"{top_editor} + {top_os}" if top_os and top_os != "Unknown" else top_editor

                return {
                    "weekly_hours": weekly_hours,
                    "weekly_hours_full": raw_weekly,
                    "daily_driver": daily_driver,
                    "top_stack": top_stack,
                    "coding_status": "WakaTime Live",
                    "daily_average": daily_average,
                    "is_live": True,
                    "source": "wakatime"
                }
    except Exception:
        pass
    return None

def get_database_fallback_telemetry(db: Session) -> Dict[str, Any]:
    profile = db.query(Profile).first()

    # Extract top skills from database
    primary_skills = db.query(Skill).filter(Skill.is_primary == True).order_by(Skill.display_order).limit(2).all()
    if not primary_skills:
        primary_skills = db.query(Skill).order_by(Skill.display_order).limit(2).all()

    top_stack = " · ".join([s.name for s in primary_skills]) if primary_skills else "Python · TypeScript"

    raw_weekly = (profile.weekly_hours_fallback if profile and profile.weekly_hours_fallback else "38.5 hrs")
    weekly_hours = format_compact_hours(raw_weekly)
    daily_driver = (profile.daily_driver if profile and profile.daily_driver else "Neovim + Hyprland")
    coding_status = (profile.coding_status if profile and profile.coding_status else "Active Coding")

    return {
        "weekly_hours": weekly_hours,
        "weekly_hours_full": raw_weekly,
        "daily_driver": daily_driver,
        "top_stack": top_stack,
        "coding_status": coding_status,
        "daily_average": "~5.5 hrs/day",
        "is_live": False,
        "source": "database"
    }

async def get_coding_telemetry(db: Session) -> Dict[str, Any]:
    current_time = datetime.now(timezone.utc).timestamp()
    if cache["telemetry"] and (current_time - cache["last_updated"]) < CACHE_TTL:
        return cache["telemetry"]

    wakatime_key = settings.WAKATIME_API_KEY or os.getenv("WAKATIME_API_KEY")

    if wakatime_key:
        waka_stats = await fetch_wakatime_stats(wakatime_key)
        if waka_stats:
            cache["telemetry"] = waka_stats
            cache["last_updated"] = current_time
            return waka_stats

    # Fallback to database
    db_telemetry = get_database_fallback_telemetry(db)
    cache["telemetry"] = db_telemetry
    cache["last_updated"] = current_time
    return db_telemetry

def invalidate_telemetry_cache():
    cache["telemetry"] = None
    cache["last_updated"] = 0
