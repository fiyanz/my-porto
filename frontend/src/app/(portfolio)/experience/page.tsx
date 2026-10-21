import { getServerApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getExperiences() {
  try {
    const res = await fetch(`${getServerApiUrl()}/experiences/`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

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

export default async function Experience() {
  const [experiences, statsData] = await Promise.all([
    getExperiences(),
    getGithubStats()
  ]);

  const stats = statsData || {
    public_repos: 0,
    total_stars: 0,
    followers: 0,
    prs_merged: 0
  };

  const orgs = Array.from(new Set(experiences.map((e: any) => e.institution).filter(Boolean))) as string[];

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Experience</h1>
          <p className="text-sm text-gray-500 mt-1">Education, bootcamps, org involvement & open source activity.</p>
        </div>
        <div className="flex gap-3">
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{experiences.length}</div>
            <div className="text-xs text-gray-500">Milestones</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{orgs.length}</div>
            <div className="text-xs text-gray-500">Institutions</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{stats.prs_merged}</div>
            <div className="text-xs text-gray-500">PRs Merged</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Timeline */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-0">
          <h2 className="text-lg font-black mb-4">Timeline</h2>

          <div className="timeline-line flex flex-col gap-0 relative">
            {/* Timeline line behind */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-black z-0"></div>

            {experiences.length > 0 ? experiences.map((exp: any, index: number) => {
              const isLast = index === experiences.length - 1;
              const isCurrent = exp.status === 'Current' || exp.status === 'Ongoing';

              return (
                <div key={exp.id} className={`flex gap-4 relative z-10 ${!isLast ? 'pb-6' : ''}`}>
                  <div className={`w-10 h-10 ${exp.icon_bg || 'bg-gray-900'} border-2 border-black flex items-center justify-center shrink-0 z-10`}>
                    <i className={`fa-solid ${exp.icon || 'fa-briefcase'} ${exp.icon_bg?.includes('white') ? 'text-gray-900' : 'text-white'} text-sm`}></i>
                  </div>
                  <div className="flex-1 border-2 border-black bg-white p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-black text-base">{exp.title}</h3>
                        <p className="text-xs text-gray-500 font-medium">{exp.institution}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs border-2 border-black px-2 py-0.5 font-bold mono ${isCurrent ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                          {exp.status}
                        </span>
                        <span className="text-xs text-gray-400 mono">{exp.time_range}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {exp.description}
                    </p>

                    {exp.outcome && (
                      <div className="border-2 border-black p-2 bg-gray-50 flex items-center gap-2 mb-3">
                        <i className="fa-solid fa-trophy text-xs text-gray-600"></i>
                        <span className="text-xs font-bold">Outcome: </span>
                        <span className="text-xs text-gray-600">{exp.outcome}</span>
                      </div>
                    )}

                    {exp.tags && exp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exp.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-xs border border-gray-300 px-1.5 py-0.5 bg-gray-50 mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-4 border-2 border-dashed border-gray-400 text-center text-sm text-gray-500 bg-white relative z-10">
                No experiences found.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Stats sidebar */}
        <div className="flex flex-col gap-4">
          <div id="involvement-card" className="border-2 border-black bg-white p-4">
            <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2">Org & Institutions</h3>
            <div className="flex flex-col gap-3">
              {orgs.length > 0 ? (
                orgs.map((org, idx) => {
                  const match = experiences.find((e: any) => e.institution === org);
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 border-2 border-black flex items-center justify-center shrink-0">
                        <i className={`fa-solid ${match?.icon || 'fa-building-columns'} text-sm`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-black truncate">{org}</div>
                        <div className="text-xs text-gray-400 truncate">{match?.title || 'Contributor'}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500 italic p-2 border-2 border-dashed border-gray-300 text-center">
                  No institutions recorded.
                </div>
              )}
            </div>
          </div>

          <div id="philosophy-card" className="border-2 border-black bg-white p-4">
            <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2">Engineering Philosophy</h3>
            <div className="flex flex-col gap-3">
              <div className="border-l-4 border-black pl-3">
                <p className="text-xs text-gray-700 italic leading-relaxed">"Deeply understand before execute — not just make it work, but know why it works."</p>
              </div>
              <div className="border-l-4 border-gray-400 pl-3">
                <p className="text-xs text-gray-700 italic leading-relaxed">"The debugging story is often more valuable than the final commit."</p>
              </div>
              <div className="border-l-4 border-gray-300 pl-3">
                <p className="text-xs text-gray-700 italic leading-relaxed">"Cross-domain thinking is a superpower — ML + IoT + Backend isn't scattered, it's full-stack systems thinking."</p>
              </div>
            </div>
          </div>

          <div id="badge-card" className="border-2 border-black bg-white p-4">
            <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2">GitHub Live Metrics</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-box-archive text-gray-700"></i>
                  <span className="font-bold">Public Repos</span>
                </div>
                <span className="font-black mono">{stats.public_repos}</span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-star text-gray-700"></i>
                  <span className="font-bold">Total Stars</span>
                </div>
                <span className="font-black mono">{stats.total_stars} ★</span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-code-pull-request text-gray-700"></i>
                  <span className="font-bold">Merged PRs</span>
                </div>
                <span className="font-black mono">{stats.prs_merged}</span>
              </div>
              <div className="flex items-center justify-between border-2 border-black p-2 bg-gray-50 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-users text-gray-700"></i>
                  <span className="font-bold">Followers</span>
                </div>
                <span className="font-black mono">{stats.followers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
