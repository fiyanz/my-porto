import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import os
from sqlalchemy.orm import Session
from app.models.project import Project

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", None)
GITHUB_USERNAME = "Fiyanz"

cache = {
    "stats": None,
    "last_updated": 0
}

CACHE_TTL = 3600  # 1 hour

def get_github_headers() -> Dict[str, str]:
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

async def fetch_github_stats() -> Dict[str, Any]:
    current_time = datetime.now(timezone.utc).timestamp()
    if cache["stats"] and (current_time - cache["last_updated"]) < CACHE_TTL:
        return cache["stats"]

    headers = get_github_headers()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Fetch user data
        user_resp = await client.get(f"https://api.github.com/users/{GITHUB_USERNAME}", headers=headers)
        if user_resp.status_code != 200:
            return {
                "public_repos": 0,
                "followers": 0,
                "total_stars": 0,
                "prs_merged": 0,
            }

        user_data = user_resp.json()

        # Fetch repos to count stars
        repos_resp = await client.get(f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page=100", headers=headers)
        repos_data = repos_resp.json() if repos_resp.status_code == 200 and isinstance(repos_resp.json(), list) else []

        total_stars = sum(repo.get("stargazers_count", 0) for repo in repos_data)

        # Fetch merged PRs count from real search API
        prs_merged = 0
        try:
            pr_resp = await client.get(
                f"https://api.github.com/search/issues?q=author:{GITHUB_USERNAME}+type:pr+is:merged",
                headers=headers
            )
            if pr_resp.status_code == 200:
                prs_merged = pr_resp.json().get("total_count", 0)
        except Exception:
            prs_merged = 0

        stats = {
            "public_repos": user_data.get("public_repos", 0),
            "followers": user_data.get("followers", 0),
            "total_stars": total_stars,
            "prs_merged": prs_merged,
        }

        cache["stats"] = stats
        cache["last_updated"] = current_time
        return stats

def infer_category_and_icon(language: Optional[str], topics: List[str]) -> tuple[str, str, List[str]]:
    lang = (language or "").lower()
    t_set = set(t.lower() for t in topics)

    if any(k in t_set for k in ["machine-learning", "deep-learning", "ml", "ai", "computer-vision", "nlp"]) or lang in ["jupyter notebook"]:
        return "ML / AI", "fa-brain", ["ML", "AI"]
    if any(k in t_set for k in ["iot", "embedded", "esp32", "arduino", "micropython", "robotics"]) or lang in ["c", "c++"]:
        return "IoT", "fa-microchip", ["IoT", "Embedded"]
    if any(k in t_set for k in ["web3", "blockchain", "solidity", "smart-contracts", "ethereum"]) or lang in ["solidity"]:
        return "Web3", "fa-cube", ["Web3", "Blockchain"]
    if any(k in t_set for k in ["mobile", "android", "ios", "flutter", "react-native"]) or lang in ["dart", "kotlin", "swift"]:
        return "Mobile", "fa-mobile-screen", ["Mobile", "App"]
    if any(k in t_set for k in ["frontend", "react", "nextjs", "vue", "tailwind", "ui", "css"]) or lang in ["typescript", "javascript", "html", "css"]:
        return "Frontend", "fa-code", ["Frontend", "Web"]
    if any(k in t_set for k in ["backend", "api", "fastapi", "django", "express", "database", "redis", "postgres"]) or lang in ["python", "go", "rust", "sql"]:
        return "Backend", "fa-server", ["API", "Backend"]

    return "Backend", "fa-folder-open", [language] if language else ["Code"]

def format_repo_title(repo_name: str) -> str:
    cleaned = repo_name.replace("-", " ").replace("_", " ")
    return " ".join(word.capitalize() for word in cleaned.split())

async def sync_github_repositories(db: Session) -> Dict[str, Any]:
    headers = get_github_headers()

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"https://api.github.com/users/{GITHUB_USERNAME}/repos?sort=updated&per_page=100",
            headers=headers
        )
        if resp.status_code != 200:
            raise Exception(f"Failed to fetch repositories from GitHub (status {resp.status_code})")

        repos = resp.json()
        if not isinstance(repos, list):
            raise Exception("Invalid GitHub API response")

    created_count = 0
    updated_count = 0

    for repo in repos:
        # Ignore forks to only feature original repos
        if repo.get("fork", False):
            continue

        repo_name = repo.get("name", "")
        slug = repo_name.lower()
        html_url = repo.get("html_url", f"https://github.com/{GITHUB_USERNAME}/{repo_name}")
        description = repo.get("description") or f"Public GitHub repository: {repo_name}"
        lang = repo.get("language")
        topics = repo.get("topics") or []

        category, icon, default_domains = infer_category_and_icon(lang, topics)
        technologies = list(dict.fromkeys(([lang] if lang else []) + topics))

        existing = db.query(Project).filter(
            (Project.slug == slug) | (Project.github_url == html_url)
        ).first()

        if existing:
            # Update metadata
            if not existing.description or existing.description.startswith("Public GitHub repository"):
                existing.description = description
            if not existing.technologies and technologies:
                existing.technologies = technologies
            if not existing.github_url:
                existing.github_url = html_url
            db.add(existing)
            updated_count += 1
        else:
            new_project = Project(
                title=format_repo_title(repo_name),
                slug=slug,
                category=category,
                status="Completed",
                description=description,
                icon=icon,
                domains=default_domains,
                technologies=technologies,
                github_url=html_url,
                live_url=repo.get("homepage") or None,
            )
            db.add(new_project)
            created_count += 1

    db.commit()

    return {
        "status": "success",
        "total_repos": len(repos),
        "created_count": created_count,
        "updated_count": updated_count,
    }

async def fetch_repo_details(github_url: str) -> Optional[Dict[str, Any]]:
    parts = github_url.rstrip("/").split("/")
    if len(parts) < 2:
        return None

    owner = parts[-2]
    repo = parts[-1]

    headers = get_github_headers()

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
        if resp.status_code != 200:
            return None

        data = resp.json()
        return {
            "title": data.get("name", repo),
            "description": data.get("description", ""),
            "stars": data.get("stargazers_count", 0),
            "forks": data.get("forks_count", 0),
            "language": data.get("language", ""),
            "updated_at": data.get("updated_at", "")
        }
