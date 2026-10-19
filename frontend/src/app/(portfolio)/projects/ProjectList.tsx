'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function ProjectList({
  initialProjects,
  initialQuery = ''
}: {
  initialProjects: any[];
  initialQuery?: string;
}) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchFilter, setSearchFilter] = useState(initialQuery);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [openDeepDive, setOpenDeepDive] = useState<number | null>(null);

  const tabs = ['All', 'ML / AI', 'Backend', 'IoT', 'Mobile', 'Web3', 'Frontend'];

  const filteredProjects = useMemo(() => {
    return initialProjects.filter(p => {
      // Tab filter
      const matchesTab = activeTab === 'All' ||
        (p.category && p.category.toLowerCase().includes(activeTab.toLowerCase())) ||
        (p.domains && p.domains.some((d: string) => d.toLowerCase().includes(activeTab.toLowerCase()))) ||
        (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(activeTab.toLowerCase())));

      // Search query filter
      const q = searchFilter.trim().toLowerCase();
      const matchesSearch = !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)));

      return matchesTab && matchesSearch;
    });
  }, [initialProjects, activeTab, searchFilter]);

  return (
    <>
      {/* Search notice if filtered by query */}
      {searchFilter && (
        <div className="flex items-center justify-between bg-white border-2 border-black p-3 mb-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-gray-500"></i>
            <span>Filtering by query: &ldquo;{searchFilter}&rdquo; ({filteredProjects.length} found)</span>
          </div>
          <button
            onClick={() => setSearchFilter('')}
            className="border-2 border-black px-2 py-0.5 bg-gray-100 hover:bg-gray-200"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* FILTER + VIEW BAR */}
      <div id="filter-bar" className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-5 gap-3">
        {/* Domain filter tabs */}
        <div className="flex flex-wrap border-2 border-black overflow-hidden text-xs font-bold bg-white">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 ${idx !== 0 ? 'border-l-2 border-black' : ''} ${
                activeTab === tab ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex border-2 border-black overflow-hidden bg-white">
            <button
              className={`w-8 h-8 flex items-center justify-center ${view === 'grid' ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => setView('grid')}
              title="Grid View"
            >
              <i className="fa-solid fa-grip text-xs"></i>
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center border-l-2 border-black ${view === 'list' ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => setView('list')}
              title="List View"
            >
              <i className="fa-solid fa-list text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* PROJECT GRID / LIST */}
      {filteredProjects.length > 0 ? (
        <div id="project-grid" className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6' : 'grid grid-cols-1 gap-4 mb-6'}>
          {filteredProjects.map((proj) => {
            const isDeep = openDeepDive === proj.id;
            return (
              <div key={proj.id} className="border-2 border-black bg-white flex flex-col">
                <div className="bg-gray-200 border-b-2 border-black px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                      <i className={`fa-solid ${proj.icon || 'fa-folder'} text-sm`}></i>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wide">{proj.category}</span>
                  </div>
                  <span className={`text-xs border-2 border-black px-2 py-0.5 font-bold ${proj.status === 'Completed' ? 'bg-white' : 'bg-gray-900 text-white'}`}>
                    {proj.status}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-black text-base leading-tight mb-1">{proj.title}</h4>
                  <p className="text-xs text-gray-500 leading-snug mb-3 flex-1">{proj.description}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(proj.tags || []).slice(0, 6).map((tag: string) => (
                      <span key={tag} className="text-xs bg-gray-100 border border-gray-300 px-1.5 py-0.5 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex border-2 border-black overflow-hidden text-xs font-bold mb-3">
                    <button
                      className={`flex-1 py-1.5 text-center ${!isDeep ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setOpenDeepDive(null)}
                    >
                      Quick View
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-center border-l-2 border-black ${isDeep ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setOpenDeepDive(isDeep ? null : proj.id)}
                    >
                      Details
                    </button>
                  </div>

                  {!isDeep ? (
                    <div className="text-xs text-gray-600 leading-relaxed flex flex-col gap-1.5 pt-1">
                      {proj.outcome && (
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-bullseye text-gray-400 shrink-0"></i>
                          <span className="line-clamp-1"><b>Outcome:</b> {proj.outcome}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        {proj.github_url ? (
                          <a
                            href={proj.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-gray-900 hover:underline flex items-center gap-1.5"
                          >
                            <i className="fa-brands fa-github text-sm"></i>
                            View on GitHub →
                          </a>
                        ) : (
                          <span className="text-gray-400">Internal project</span>
                        )}
                        {proj.live_url && (
                          <a
                            href={proj.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 leading-relaxed border-t-2 border-dashed border-gray-300 pt-3 flex flex-col gap-2">
                      <div>
                        <p className="font-bold text-gray-900 mb-0.5">The Challenge:</p>
                        <p>{proj.challenge || 'Engineering architecture and robust pipeline setup.'}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-0.5">Key Learning:</p>
                        <p>{proj.learning || 'Full-stack resilience, type safety, and real-world deployment.'}</p>
                      </div>
                      {proj.github_url && (
                        <a
                          href={proj.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-gray-900 hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <i className="fa-brands fa-github text-sm"></i> GitHub Source →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-400 p-12 text-center bg-white mb-6">
          <i className="fa-solid fa-folder-open text-3xl text-gray-400 mb-3 block"></i>
          <h3 className="font-black text-base mb-1">No Projects Found</h3>
          <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
            {searchFilter || activeTab !== 'All'
              ? 'No projects match your current filter criteria.'
              : 'No projects added yet. Import your repositories from GitHub in the admin panel.'}
          </p>
          {searchFilter || activeTab !== 'All' ? (
            <button
              onClick={() => { setActiveTab('All'); setSearchFilter(''); }}
              className="border-2 border-black px-4 py-2 text-xs font-bold bg-gray-900 text-white hover:bg-gray-800"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-2 border-2 border-black bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800"
            >
              <i className="fa-solid fa-arrows-rotate"></i> Sync from GitHub in Admin
            </Link>
          )}
        </div>
      )}

      {/* FOOTER STATS */}
      <div id="pagination" className="flex items-center justify-between border-t-2 border-black pt-4">
        <span className="text-xs text-gray-500 font-medium">
          Showing {filteredProjects.length} of {initialProjects.length} projects
        </span>
      </div>
    </>
  );
}
