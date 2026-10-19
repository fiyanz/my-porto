import React from 'react';
import { getServerApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getSkills() {
  try {
    const res = await fetch(`${getServerApiUrl()}/skills/`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getLearning() {
  try {
    const res = await fetch(`${getServerApiUrl()}/learning/`, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Skills() {
  const [skills, learningItems] = await Promise.all([
    getSkills(),
    getLearning()
  ]);

  const categories = [
    { name: 'Languages', icon: 'fa-terminal' },
    { name: 'ML / Data', icon: 'fa-brain' },
    { name: 'Backend / Infra', icon: 'fa-server' },
    { name: 'IoT / Embedded', icon: 'fa-microchip' },
    { name: 'Mobile / Web3', icon: 'fa-mobile-screen' },
    { name: 'Tooling / OS', icon: 'fa-screwdriver-wrench' }
  ];

  const groupedSkills = categories.map(cat => ({
    ...cat,
    skills: skills
      .filter((s: any) => s.category === cat.name)
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }));

  // Compute Domain Proficiency exclusively from database skills
  const getProficiency = (categoryName: string) => {
    const categorySkills = groupedSkills.find(c => c.name === categoryName)?.skills || [];
    if (categorySkills.length === 0) return 0;
    const totalLevel = categorySkills.reduce((sum: number, skill: any) => sum + (skill.level || 0), 0);
    return Math.round(totalLevel / categorySkills.length);
  };

  const domainProficiencies = [
    { name: 'Machine Learning / AI', icon: 'fa-brain', level: getProficiency('ML / Data') },
    { name: 'Backend / API', icon: 'fa-server', level: getProficiency('Backend / Infra') },
    { name: 'IoT / Embedded', icon: 'fa-microchip', level: getProficiency('IoT / Embedded') },
    { name: 'Mobile & Web3', icon: 'fa-mobile-screen', level: getProficiency('Mobile / Web3') },
    { name: 'Languages & Core', icon: 'fa-terminal', level: getProficiency('Languages') },
  ].filter(d => d.level > 0 || skills.length === 0);

  const totalCategories = new Set(skills.map((s: any) => s.category).filter(Boolean)).size;

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Skills & Stack</h1>
          <p className="text-sm text-gray-500 mt-1">Tools, languages, and frameworks registered in portfolio database.</p>
        </div>
        <div className="flex gap-3">
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{skills.length}</div>
            <div className="text-xs text-gray-500">Technologies</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{totalCategories}</div>
            <div className="text-xs text-gray-500">Categories</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{learningItems.length}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
        </div>
      </div>

      {/* TOP ROW: Proficiency Radar + Top Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div id="proficiency-card" className="col-span-2 border-2 border-black bg-white p-5">
          <h3 className="font-black text-sm mb-4 flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-gray-500"></i> Domain Proficiency (Average by Stack)
          </h3>
          <div className="flex flex-col gap-4">
            {domainProficiencies.length > 0 ? (
              domainProficiencies.map((domain) => (
                <div key={domain.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${domain.icon} text-sm text-gray-600`}></i>
                      <span className="text-sm font-bold">{domain.name}</span>
                    </div>
                    <span className="text-xs font-black mono">{domain.level}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 border border-gray-300">
                    <div className="h-full bg-gray-800 transition-all duration-500" style={{ width: `${domain.level}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic p-3 border-2 border-dashed border-gray-300 text-center">
                No skill proficiencies recorded yet.
              </div>
            )}
          </div>
        </div>

        <div id="learning-card" className="border-2 border-black bg-white p-4 flex flex-col gap-3">
          <h3 className="font-black text-sm flex items-center gap-2">
            <i className="fa-solid fa-bolt text-gray-500"></i> Currently Learning
          </h3>
          <div className="flex flex-col gap-2">
            {learningItems.length > 0 ? learningItems.map((item: any) => (
              <div key={item.id} className="border-2 border-black p-3 bg-gray-50">
                <div className="text-xs font-black mb-0.5">{item.title}</div>
                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                <div className="w-full h-1.5 bg-gray-200 mt-2">
                  <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
            )) : (
              <div className="text-xs text-gray-500 p-3 border-2 border-dashed border-gray-300 text-center bg-gray-50">
                No items added yet. Add some in the Admin panel!
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-black mb-3">Technology Stack</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {groupedSkills.map((category) => {
          const primarySkills = category.skills.filter((s: any) => s.is_primary);
          const topSkills = category.skills.slice(0, 2);
          const mostUsedText = primarySkills.length > 0
            ? primarySkills.map((s: any) => s.name).join(' · ')
            : topSkills.length > 0
            ? topSkills.map((s: any) => s.name).join(' · ')
            : '—';

          return (
            <div key={category.name} className="border-2 border-black bg-white p-4">
              <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-2">
                <div className="w-8 h-8 bg-gray-200 border-2 border-black flex items-center justify-center">
                  <i className={`fa-solid ${category.icon} text-sm`}></i>
                </div>
                <span className="font-black text-sm">{category.name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.skills.length > 0 ? category.skills.map((skill: any) => (
                  <span
                    key={skill.id}
                    className={`border-2 border-black px-2 py-1 text-xs font-bold mono ${
                      skill.is_primary ? 'bg-gray-900 text-white font-black' : 'bg-gray-100'
                    }`}
                  >
                    {skill.name}
                  </span>
                )) : (
                  <span className="text-xs text-gray-500 italic">No skills added yet</span>
                )}
              </div>
              <div className="mt-3 border-t border-gray-200 pt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Most used:</span>
                <span className="text-xs font-black mono truncate">{mostUsedText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
