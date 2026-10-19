import GithubCalendarClient from '@/components/GithubCalendarClient';
import Link from 'next/link';
import { getServerApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getGithubStats() {
  try {
    const res = await fetch(`${getServerApiUrl()}/github/stats`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProfile() {
  try {
    const res = await fetch(`${getServerApiUrl()}/admin/profile`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSkills() {
  try {
    const res = await fetch(`${getServerApiUrl()}/skills/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getProjects() {
  try {
    const res = await fetch(`${getServerApiUrl()}/projects/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getTelemetry() {
  try {
    const res = await fetch(`${getServerApiUrl()}/telemetry/coding-stats`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatHours(raw: string | undefined): string {
  if (!raw) return '0h';
  return raw
    .replace(/\s*hrs?/gi, 'h')
    .replace(/\s*mins?/gi, 'm')
    .replace(/\s*sec(onds?)?/gi, 's')
    .trim();
}

export default async function Home() {
  const [statsData, profile, skills, allProjects, telemetryData] = await Promise.all([
    getGithubStats(),
    getProfile(),
    getSkills(),
    getProjects(),
    getTelemetry()
  ]);

  const telemetry = telemetryData || {
    weekly_hours: profile?.weekly_hours_fallback || "38.5 hrs",
    weekly_hours_full: profile?.weekly_hours_fallback || "38.5 hrs",
    daily_driver: profile?.daily_driver || "Neovim + Hyprland",
    top_stack: "Python · TypeScript",
    coding_status: profile?.coding_status || "Active Coding",
    is_live: false,
    source: "database"
  };

  const stats = statsData || {
    public_repos: allProjects.length || 0,
    total_stars: 0,
    followers: 0,
    prs_merged: 0
  };

  // Compute distinct domains dynamically from projects and skills
  const dynamicDomains = Array.from(
    new Set([
      ...allProjects.flatMap((p: any) => p.domains || []),
      ...skills.map((s: any) => s.category)
    ].filter(Boolean))
  );

  const domainIcons: Record<string, string> = {
    'Machine Learning': 'fa-brain',
    'ML / AI': 'fa-brain',
    'Backend': 'fa-server',
    'Backend / API': 'fa-server',
    'Backend / Infra': 'fa-server',
    'IoT': 'fa-microchip',
    'IoT / Embedded': 'fa-microchip',
    'Mobile': 'fa-mobile-screen',
    'Web3': 'fa-cube',
    'Languages': 'fa-terminal',
    'Frontend': 'fa-code',
  };

  const domainList = dynamicDomains.length > 0
    ? dynamicDomains.slice(0, 6).map((d: any) => ({ name: String(d), icon: domainIcons[String(d)] || 'fa-layer-group' }))
    : [
        { name: 'Machine Learning', icon: 'fa-brain' },
        { name: 'Backend / API', icon: 'fa-server' },
        { name: 'IoT / Embedded', icon: 'fa-microchip' },
        { name: 'Mobile', icon: 'fa-mobile-screen' },
        { name: 'Web3', icon: 'fa-cube' }
      ];

  const githubUsername = profile?.github_url
    ? profile.github_url.replace(/\/$/, '').split('/').pop() || 'Fiyanz'
    : 'Fiyanz';

  return (
    <>
      <h1 id="page-title" className="text-3xl font-black tracking-tight mb-5">Portfolio Overview</h1>

      {/* Top Row: Hero Card + Domains Card */}
      <div id="top-row" className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div id="hero-card" className="col-span-1 lg:col-span-2 border-2 border-black rounded-2xl bg-white p-5">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-52 h-52 bg-gray-200 rounded-xl border-2 border-black shrink-0 overflow-hidden flex items-end justify-center">
              <img
                src={profile?.avatar_url || "https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=99"}
                className="w-full h-full object-cover"
                alt="Avatar"
              />
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-0">
                <div>
                  <h2 className="text-xl font-black leading-tight">{profile?.name || 'Bagus Alfiyan'}</h2>
                  <p className="text-gray-500 text-sm font-medium">{profile?.email || 'bagusalfiyanyusuf@gmail.com'}</p>
                </div>
                <div className="flex gap-2 justify-center md:justify-end">
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-900 transition-colors" title="GitHub">
                      <i className="fa-brands fa-github text-xs"></i>
                    </a>
                  )}
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-900 transition-colors" title="LinkedIn">
                      <i className="fa-brands fa-linkedin text-xs"></i>
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-900 transition-colors" title="Instagram">
                      <i className="fa-brands fa-instagram text-xs"></i>
                    </a>
                  )}
                  {profile?.email && (
                    <a href={`mailto:${profile.email}`} className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-900 transition-colors" title="Email">
                      <i className="fa-solid fa-envelope text-xs"></i>
                    </a>
                  )}
                </div>
              </div>

              {/* Developer Telemetry HUD */}
              <div className="flex items-center justify-between mt-4 md:mt-3 mb-1.5">
                <span className="text-[10px] font-mono uppercase font-black text-gray-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt text-gray-600 text-[10px]"></i>
                  Telemetry & Activity
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-500 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${telemetry.is_live ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {telemetry.is_live ? 'WakaTime Live' : 'Dev Telemetry'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="border-2 border-black rounded-xl p-2 text-center bg-gray-50 flex flex-col justify-center min-w-0" title={telemetry.weekly_hours_full || telemetry.weekly_hours}>
                  <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight flex items-center justify-center gap-1">
                    <i className="fa-solid fa-clock text-[10px] text-gray-500 shrink-0"></i>
                    <span className="truncate">{formatHours(telemetry.weekly_hours)}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1 truncate">Coding Time (7d)</div>
                </div>

                <div className="border-2 border-black rounded-xl p-2 text-center bg-gray-50 flex flex-col justify-center min-w-0" title={telemetry.daily_driver}>
                  <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                    {telemetry.daily_driver}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1 truncate">Daily Driver</div>
                </div>

                <div className="border-2 border-black rounded-xl p-2 text-center bg-gray-50 flex flex-col justify-center min-w-0" title={telemetry.top_stack}>
                  <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                    {telemetry.top_stack}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1 truncate">Active Stack</div>
                </div>

                <div className="border-2 border-black rounded-xl p-2 text-center bg-gray-50 flex flex-col justify-center min-w-0" title={telemetry.coding_status}>
                  <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight flex items-center justify-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${telemetry.is_live ? 'bg-green-500 animate-pulse' : 'bg-emerald-600'}`}></span>
                    <span className="truncate">{telemetry.coding_status}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1 truncate">Session Status</div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {profile?.bio || 'CS student building at the intersection of ML, Backend, IoT, and Web3.'}
              </p>

              <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-3">
                <a href={profile?.cv_url || "/api/files/cv"} target="_blank" className="flex items-center justify-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-800 transition">
                  <i className="fa-solid fa-download"></i>
                  Download CV
                </a>
                <Link href="/projects" className="flex items-center justify-center gap-2 bg-white text-xs font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-50 transition">
                  <i className="fa-solid fa-layer-group"></i>
                  View Projects
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Domains I Touch */}
        <div id="domains-card" className="border-2 border-black rounded-2xl bg-white p-4 flex flex-col gap-3 h-full">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-400">Domains I Touch</h3>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {domainList.map((domain, i) => (
              <div key={i} className="flex items-center gap-2 border-2 border-black rounded-xl px-3 py-2 bg-gray-100">
                <i className={`fa-solid ${domain.icon} text-sm`}></i>
                <span className="text-xs font-bold">{domain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Projects Heading */}
      <div id="projects-heading" className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-black">Featured Projects</h2>
        <Link href="/projects" className="text-xs font-semibold border-2 border-black px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50">View all</Link>
      </div>

      {/* Featured Projects Grid */}
      <div id="project-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {allProjects.length > 0 ? (
          allProjects.slice(0, 3).map((proj: any) => (
            <div key={proj.id} className="border-2 border-black rounded-2xl bg-white p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-gray-200 border-2 border-black rounded-xl flex items-center justify-center">
                  <i className={`fa-solid ${proj.icon || 'fa-folder'} text-sm`}></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-black rounded bg-gray-100">
                  {proj.category}
                </span>
              </div>
              <h4 className="font-black text-sm leading-tight mb-1">{proj.title}</h4>
              <p className="text-xs text-gray-500 leading-snug mb-3 flex-1">{proj.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {(proj.technologies || []).slice(0, 4).map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 font-mono">{tag}</span>
                ))}
              </div>
              <div className="flex border-2 border-black rounded-lg overflow-hidden text-xs font-bold mt-auto">
                <a href={proj.github_url || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 py-1.5 bg-gray-900 text-white text-center hover:bg-gray-800">
                  <i className="fa-brands fa-github mr-1"></i> Code
                </a>
                <Link href="/projects" className="flex-1 py-1.5 bg-white text-center hover:bg-gray-50 block border-l-2 border-black">Deep Dive</Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border-2 border-dashed border-gray-400 p-8 text-center bg-white rounded-2xl">
            <div className="w-12 h-12 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-brands fa-github text-xl text-gray-700"></i>
            </div>
            <h3 className="font-black text-base mb-1">No Projects Added Yet</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              Auto-import all your public repositories from GitHub directly via the Admin panel.
            </p>
            <Link href="/admin/projects" className="inline-flex items-center gap-2 border-2 border-black bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800">
              <i className="fa-solid fa-arrows-rotate"></i> Sync Repositories in Admin
            </Link>
          </div>
        )}
      </div>

      {/* GitHub Live Stats & Contribution */}
      <div id="bottom-row" className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div id="github-stats-card" className="border-2 border-black rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm">GitHub Live Stats</h3>
            <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-xs border-2 border-black rounded-lg px-2 py-1 font-semibold hover:bg-gray-50">
              @{githubUsername}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl font-black">{stats.public_repos}</div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <i className="fa-solid fa-box-archive text-gray-700 text-sm"></i>
                <span className="font-bold text-sm text-gray-700">Repositories</span>
              </div>
              <p className="text-xs text-gray-400">Public GitHub repos</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
              <span className="text-gray-500 font-medium">Total Stars</span>
              <span className="font-black flex items-center">{stats.total_stars} <i className="fa-solid fa-star text-xs ml-1 text-gray-700"></i></span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
              <span className="text-gray-500 font-medium">Followers</span>
              <span className="font-black">{stats.followers}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
              <span className="text-gray-500 font-medium">PRs Merged</span>
              <span className="font-black">{stats.prs_merged}</span>
            </div>
          </div>
        </div>

        <div id="contribution-graph" className="col-span-1 lg:col-span-2 border-2 border-black rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm">Contribution Activity</h3>
            <span className="text-xs font-mono text-gray-500">github.com/{githubUsername}</span>
          </div>

          <div className="w-full flex items-center justify-center mb-4 overflow-x-auto">
            <GithubCalendarClient username={githubUsername} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border-2 border-black rounded-xl p-2.5 flex items-center gap-2.5 bg-gray-50">
              <div className="w-7 h-7 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-box-archive text-xs text-gray-600"></i>
              </div>
              <div>
                <div className="text-xs font-black">{stats.public_repos}</div>
                <div className="text-[10px] text-gray-400">Public Repos</div>
              </div>
            </div>
            <div className="border-2 border-black rounded-xl p-2.5 flex items-center gap-2.5 bg-gray-50">
              <div className="w-7 h-7 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-star text-xs text-gray-600"></i>
              </div>
              <div>
                <div className="text-xs font-black">{stats.total_stars}</div>
                <div className="text-[10px] text-gray-400">Total Stars</div>
              </div>
            </div>
            <div className="border-2 border-black rounded-xl p-2.5 flex items-center gap-2.5 bg-gray-50">
              <div className="w-7 h-7 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-users text-xs text-gray-600"></i>
              </div>
              <div>
                <div className="text-xs font-black">{stats.followers}</div>
                <div className="text-[10px] text-gray-400">Followers</div>
              </div>
            </div>
            <div className="border-2 border-black rounded-xl p-2.5 flex items-center gap-2.5 bg-gray-50">
              <div className="w-7 h-7 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-code-pull-request text-xs text-gray-600"></i>
              </div>
              <div>
                <div className="text-xs font-black">{stats.prs_merged}</div>
                <div className="text-[10px] text-gray-400">PRs Merged</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
