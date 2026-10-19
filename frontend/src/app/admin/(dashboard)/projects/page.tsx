'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin';

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', category: '', status: 'Completed', description: '', technologies: '', domains: '', icon: 'fa-folder', outcome: '', github_url: '', challenge: '', learning: '' });

  const load = () => adminFetch('/projects/').then(r => r.json()).then(setProjects).catch(() => {});
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ title: '', slug: '', category: '', status: 'Completed', description: '', technologies: '', domains: '', icon: 'fa-folder', outcome: '', github_url: '', challenge: '', learning: '' }); setEditing(null); setShowForm(false); };

  const handleSyncGithub = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminFetch('/projects/sync-github', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Sync failed');
      setSyncResult(`✓ Synced ${data.total_repos} repos (${data.created_count} new imported, ${data.updated_count} updated)`);
      load();
      setTimeout(() => setSyncResult(null), 6000);
    } catch (err: any) {
      setSyncResult(`✗ Sync error: ${err.message}`);
      setTimeout(() => setSyncResult(null), 6000);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    const body = { ...form, technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean), domains: form.domains.split(',').map(t => t.trim()).filter(Boolean), slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-') };
    if (editing) {
      await adminFetch(`/projects/${editing.slug}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await adminFetch('/projects/', { method: 'POST', body: JSON.stringify(body) });
    }
    resetForm(); load();
  };

  const handleEdit = (p: any) => { setEditing(p); setForm({ title: p.title, slug: p.slug, category: p.category, status: p.status, description: p.description, technologies: (p.technologies || []).join(', '), domains: (p.domains || []).join(', '), icon: p.icon || 'fa-folder', outcome: p.outcome || '', github_url: p.github_url || '', challenge: p.challenge || '', learning: p.learning || '' }); setShowForm(true); };

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this project?')) return;
    await adminFetch(`/projects/${slug}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Manage Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} projects in your portfolio.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncGithub}
            disabled={syncing}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <i className={`fa-brands fa-github ${syncing ? 'animate-spin' : ''}`}></i>
            {syncing ? 'Syncing...' : 'Sync from GitHub'}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-700">
            <i className="fa-solid fa-plus text-xs"></i> Add Project
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`border-2 border-black p-3 mb-5 text-xs font-bold ${syncResult.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {syncResult}
        </div>
      )}

      {showForm && (
        <div className="border-2 border-black bg-white p-5 mb-5">
          <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2">{editing ? 'Edit Project' : 'New Project'}</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" /></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Category</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm" placeholder="ML / AI, Backend, IoT" /></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm">{['Completed', 'Ongoing', 'Planned'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="mb-3"><label className="text-xs font-bold text-gray-600 block mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm h-20 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Technologies (comma-separated)</label><input value={form.technologies} onChange={e => setForm({ ...form, technologies: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">GitHub URL</label><input value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Outcome</label><input value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Icon</label><input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm" placeholder="fa-seedling" /></div>
          </div>
          <div className="mb-3"><label className="text-xs font-bold text-gray-600 block mb-1">Challenge</label><textarea value={form.challenge} onChange={e => setForm({ ...form, challenge: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm h-16 resize-none" /></div>
          <div className="mb-4"><label className="text-xs font-bold text-gray-600 block mb-1">Learning</label><textarea value={form.learning} onChange={e => setForm({ ...form, learning: e.target.value })} className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm h-16 resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-gray-900 text-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-700">{editing ? 'Update' : 'Create'}</button>
            <button onClick={resetForm} className="bg-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="border-2 border-black bg-white">
            <div className="bg-gray-200 border-b-2 border-black px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center"><i className={`fa-solid ${p.icon} text-sm`}></i></div>
                <span className="text-xs font-black uppercase tracking-wide">{p.category}</span>
              </div>
              <span className={`text-xs border-2 border-black px-2 py-0.5 font-bold ${p.status === 'Ongoing' ? 'bg-gray-900 text-white' : 'bg-white'}`}>{p.status}</span>
            </div>
            <div className="p-4">
              <h4 className="font-black text-base mb-1">{p.title}</h4>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">{(p.technologies || []).map((t: string) => <span key={t} className="text-xs bg-gray-100 border border-gray-300 px-1.5 py-0.5 mono">{t}</span>)}</div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(p)} className="flex-1 border-2 border-black bg-white py-1.5 text-xs font-bold hover:bg-gray-50"><i className="fa-solid fa-pen mr-1"></i>Edit</button>
                <button onClick={() => handleDelete(p.slug)} className="border-2 border-black bg-white px-3 py-1.5 text-xs font-bold hover:bg-red-50 text-red-500"><i className="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div className="col-span-2 border-2 border-dashed border-gray-400 p-8 text-center text-sm text-gray-500">No projects yet.</div>}
      </div>
    </>
  );
}
