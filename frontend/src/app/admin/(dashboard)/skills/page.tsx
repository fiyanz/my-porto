'use client';
import { useEffect, useState, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

interface Skill {
  id: number;
  category: string;
  name: string;
  level: number;
  icon: string | null;
  is_primary: boolean;
  display_order: number;
}

const CATEGORIES = [
  'Languages',
  'ML / Data',
  'Backend / Infra',
  'IoT / Embedded',
  'Mobile / Web3',
  'Tooling / OS',
];

const PRESET_SUGGESTIONS: Record<string, string[]> = {
  Languages: ['Python', 'TypeScript', 'Go', 'Rust', 'C++', 'JavaScript', 'SQL'],
  'ML / Data': ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'OpenCV', 'Hugging Face'],
  'Backend / Infra': ['FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'Nginx', 'Linux', 'REST API'],
  'IoT / Embedded': ['ESP32', 'Arduino', 'MQTT', 'Raspberry Pi', 'C / C++', 'Sensors'],
  'Mobile / Web3': ['React Native', 'Flutter', 'Solidity', 'Web3.js', 'Ethers.js'],
  'Tooling / OS': ['Neovim', 'Git', 'Linux', 'Postman', 'Tmux', 'Hyprland', 'Bash'],
};

const ICON_MAP: Record<string, string> = {
  python: 'fa-brands fa-python',
  javascript: 'fa-brands fa-js',
  typescript: 'fa-brands fa-js',
  react: 'fa-brands fa-react',
  'next.js': 'fa-brands fa-react',
  nextjs: 'fa-brands fa-react',
  vue: 'fa-brands fa-vuejs',
  node: 'fa-brands fa-node-js',
  'node.js': 'fa-brands fa-node-js',
  docker: 'fa-brands fa-docker',
  git: 'fa-brands fa-git-alt',
  github: 'fa-brands fa-github',
  linux: 'fa-brands fa-linux',
  ubuntu: 'fa-brands fa-ubuntu',
  rust: 'fa-brands fa-rust',
  golang: 'fa-brands fa-golang',
  go: 'fa-brands fa-golang',
  aws: 'fa-brands fa-aws',
  html: 'fa-brands fa-html5',
  css: 'fa-brands fa-css3-alt',
  java: 'fa-brands fa-java',
  php: 'fa-brands fa-php',
  laravel: 'fa-brands fa-laravel',
  android: 'fa-brands fa-android',
  apple: 'fa-brands fa-apple',
  database: 'fa-solid fa-database',
  postgres: 'fa-solid fa-database',
  postgresql: 'fa-solid fa-database',
  mysql: 'fa-solid fa-database',
  redis: 'fa-solid fa-server',
  fastapi: 'fa-solid fa-bolt',
};

function detectIcon(name: string): string {
  const clean = name.toLowerCase().trim();
  if (ICON_MAP[clean]) return ICON_MAP[clean];
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (clean.includes(key)) return icon;
  }
  return 'fa-solid fa-code';
}

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [mode, setMode] = useState<'none' | 'single' | 'batch'>('none');
  const [editing, setEditing] = useState<Skill | null>(null);

  // Single Form State
  const [form, setForm] = useState({
    category: 'Languages',
    name: '',
    level: 75,
    is_primary: false,
    display_order: 0,
    icon: '',
  });

  // Batch Form State
  const [batchCategory, setBatchCategory] = useState<string>('Languages');
  const [batchInput, setBatchInput] = useState<string>('');
  const [batchLevel, setBatchLevel] = useState<number>(75);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const load = () => {
    adminFetch('/skills/')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSkills(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      category: 'Languages',
      name: '',
      level: 75,
      is_primary: false,
      display_order: 0,
      icon: '',
    });
    setEditing(null);
    setMode('none');
  };

  const handleSaveSingle = async () => {
    if (!form.name.trim()) return;
    const icon = form.icon || detectIcon(form.name);
    const payload = { ...form, icon };

    if (editing) {
      await adminFetch(`/skills/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch('/skills/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  };

  const handleSaveBatch = async () => {
    if (!batchInput.trim()) return;
    setBatchSubmitting(true);
    try {
      const names = batchInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Deduplicate against existing in category
      const existingNames = new Set(
        skills.filter((s) => s.category === batchCategory).map((s) => s.name.toLowerCase())
      );
      const uniqueNames = names.filter((n) => !existingNames.has(n.toLowerCase()));

      if (uniqueNames.length === 0) {
        alert('All specified skills already exist in this category.');
        setBatchSubmitting(false);
        return;
      }

      const batchPayload = uniqueNames.map((name, idx) => ({
        category: batchCategory,
        name,
        level: batchLevel,
        is_primary: false,
        display_order: skills.length + idx,
        icon: detectIcon(name),
      }));

      // Try batch endpoint, fallback to parallel requests
      const res = await adminFetch('/skills/batch', {
        method: 'POST',
        body: JSON.stringify(batchPayload),
      });

      if (!res.ok) {
        await Promise.all(
          batchPayload.map((item) =>
            adminFetch('/skills/', {
              method: 'POST',
              body: JSON.stringify(item),
            })
          )
        );
      }

      setBatchInput('');
      setMode('none');
      load();
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleTogglePrimary = async (s: Skill) => {
    const updated = !s.is_primary;
    // Optimistic UI
    setSkills((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, is_primary: updated } : item))
    );
    await adminFetch(`/skills/${s.id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_primary: updated }),
    });
    load();
  };

  const handleQuickLevelChange = async (s: Skill, newLevel: number) => {
    setSkills((prev) =>
      prev.map((item) => (item.id === s.id ? { ...item, level: newLevel } : item))
    );
    await adminFetch(`/skills/${s.id}`, {
      method: 'PUT',
      body: JSON.stringify({ level: newLevel }),
    });
  };

  const handleEdit = (s: Skill) => {
    setEditing(s);
    setForm({
      category: s.category,
      name: s.name,
      level: s.level,
      is_primary: s.is_primary,
      display_order: s.display_order,
      icon: s.icon || '',
    });
    setMode('single');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this skill?')) return;
    await adminFetch(`/skills/${id}`, { method: 'DELETE' });
    load();
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchCat = activeTab === 'All' || s.category === activeTab;
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [skills, activeTab, search]);

  const primaryCount = skills.filter((s) => s.is_primary).length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Skills Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {skills.length} skills registered · {primaryCount} marked primary · {CATEGORIES.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setMode('batch');
            }}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-800 transition"
          >
            <i className="fa-solid fa-layer-group text-xs"></i> Quick Batch Add
          </button>
          <button
            onClick={() => {
              resetForm();
              setMode('single');
            }}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 transition"
          >
            <i className="fa-solid fa-plus text-xs"></i> Add Single
          </button>
        </div>
      </div>

      {/* Batch Add Modal / Panel */}
      {mode === 'batch' && (
        <div className="border-2 border-black bg-white p-5 mb-5 rounded-none shadow-sm">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <div>
              <h3 className="font-black text-sm">Quick Batch Add Skills</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Type or paste multiple skill names separated by commas.
              </p>
            </div>
            <button
              onClick={() => setMode('none')}
              className="text-gray-400 hover:text-black text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Target Category</label>
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-bold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-600 block mb-1">
                Default Proficiency Level ({batchLevel}%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={batchLevel}
                  onChange={(e) => setBatchLevel(parseInt(e.target.value))}
                  className="flex-1 accent-black"
                />
                <div className="flex gap-1">
                  {[50, 75, 90].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setBatchLevel(lvl)}
                      className={`text-xs px-2 py-0.5 border border-black font-mono font-bold ${
                        batchLevel === lvl ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold text-gray-600 block mb-1">
              Skill Names (Comma-separated)
            </label>
            <textarea
              rows={3}
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder="e.g. FastAPI, Docker, PostgreSQL, Redis, Nginx"
              className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Quick Click Suggestions */}
          {PRESET_SUGGESTIONS[batchCategory] && (
            <div className="mb-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Quick Preset Suggestions (Click to append):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUGGESTIONS[batchCategory].map((sug) => {
                  const alreadyAdded = skills.some(
                    (s) => s.category === batchCategory && s.name.toLowerCase() === sug.toLowerCase()
                  );
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => {
                        const parts = batchInput
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean);
                        if (!parts.includes(sug)) {
                          setBatchInput(parts.length > 0 ? `${parts.join(', ')}, ${sug}` : sug);
                        }
                      }}
                      className={`text-xs px-2.5 py-1 border border-black font-medium transition ${
                        alreadyAdded
                          ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveBatch}
              disabled={batchSubmitting || !batchInput.trim()}
              className="bg-gray-900 text-white px-5 py-2 text-sm font-bold border-2 border-black hover:bg-gray-800 disabled:opacity-50"
            >
              {batchSubmitting ? 'Adding...' : 'Batch Add Skills'}
            </button>
            <button
              onClick={() => setMode('none')}
              className="bg-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Single Add / Edit Form */}
      {mode === 'single' && (
        <div className="border-2 border-black bg-white p-5 mb-5">
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
            <h3 className="font-black text-sm">{editing ? 'Edit Skill' : 'New Single Skill'}</h3>
            <button
              onClick={() => setMode('none')}
              className="text-gray-400 hover:text-black text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Skill Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-bold focus:outline-none"
                placeholder="e.g. Python"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-bold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                Level ({form.level}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.level}
                onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                className="w-full accent-black mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">FontAwesome Icon</label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-mono"
                placeholder={detectIcon(form.name || 'code')}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm({ ...form, display_order: parseInt(e.target.value) || 0 })
                }
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                  className="w-4 h-4 border-2 border-black accent-black"
                />
                <span className="text-xs font-bold text-gray-700">Primary (Most Used Hero)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveSingle}
              className="bg-gray-900 text-white px-5 py-2 text-sm font-bold border-2 border-black hover:bg-gray-800"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => setMode('none')}
              className="bg-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {['All', ...CATEGORIES].map((cat) => {
            const count =
              cat === 'All' ? skills.length : skills.filter((s) => s.category === cat).length;
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`text-xs font-bold px-3 py-1.5 border-2 border-black transition ${
                  isActive ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                {cat} <span className="opacity-70 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter skills..."
            className="w-full border-2 border-black bg-white px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Skills Table List */}
      <div className="border-2 border-black bg-white divide-y-2 divide-gray-100">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
            >
              {/* Left Column: Icon + Name + Category */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleTogglePrimary(s)}
                  title={s.is_primary ? 'Primary (Click to demote)' : 'Mark as Primary (Click to promote)'}
                  className={`w-7 h-7 border-2 border-black flex items-center justify-center shrink-0 cursor-pointer transition ${
                    s.is_primary ? 'bg-black text-yellow-400' : 'bg-gray-100 text-gray-400 hover:text-black'
                  }`}
                >
                  <i className={`fa-${s.is_primary ? 'solid' : 'regular'} fa-star text-xs`}></i>
                </button>

                <div className="w-7 h-7 bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0">
                  <i className={`${s.icon || detectIcon(s.name)} text-xs text-gray-800`}></i>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900 truncate">{s.name}</span>
                    {s.is_primary && (
                      <span className="text-[10px] font-mono uppercase font-black bg-black text-white px-1.5 py-0.2">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">{s.category}</span>
                </div>
              </div>

              {/* Middle Column: Proficiency Bar with Inline Stepper */}
              <div className="hidden sm:flex items-center gap-3 w-48 shrink-0">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={s.level}
                  onChange={(e) => handleQuickLevelChange(s, parseInt(e.target.value))}
                  className="w-24 accent-black"
                  title={`Proficiency: ${s.level}%`}
                />
                <span className="text-xs font-mono font-bold w-10 text-right text-gray-700">
                  {s.level}%
                </span>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-1.5 ml-3 shrink-0">
                <button
                  onClick={() => handleEdit(s)}
                  className="w-7 h-7 border-2 border-black bg-white hover:bg-gray-100 flex items-center justify-center text-xs"
                  title="Edit"
                >
                  <i className="fa-solid fa-pen text-gray-700"></i>
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="w-7 h-7 border-2 border-black bg-white hover:bg-red-50 flex items-center justify-center text-xs text-red-600"
                  title="Delete"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            No skills found {search && `matching "${search}"`}.
          </div>
        )}
      </div>
    </>
  );
}
