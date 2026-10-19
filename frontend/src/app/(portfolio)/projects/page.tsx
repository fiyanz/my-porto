import ProjectList from './ProjectList';
import { getServerApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getProjects() {
  try {
    const res = await fetch(`${getServerApiUrl()}/projects/`, {
      next: { revalidate: 0 }
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.map((p: any) => ({
      ...p,
      tags: p.technologies || []
    }));
  } catch {
    return [];
  }
}

export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [projects, params] = await Promise.all([
    getProjects(),
    searchParams
  ]);

  const query = params?.q || '';

  return (
    <>
      {/* Page heading + summary stats */}
      <div id="page-header" className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">All Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Everything built and synced from GitHub repositories.</p>
        </div>
        {/* Summary stat pills */}
        <div className="flex gap-3">
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{projects.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">
              {new Set(projects.flatMap((p: any) => p.domains || [])).size}
            </div>
            <div className="text-xs text-gray-500">Domains</div>
          </div>
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">
              {projects.filter((p: any) => p.status === 'Ongoing').length}
            </div>
            <div className="text-xs text-gray-500">Ongoing</div>
          </div>
        </div>
      </div>

      <ProjectList initialProjects={projects} initialQuery={query} />
    </>
  );
}
