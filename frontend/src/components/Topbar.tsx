'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header id="topbar" className="flex items-center justify-end mb-6">
      <div className="flex items-center gap-2 md:gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 border-2 border-black rounded-lg px-3 py-1.5 bg-white w-48 md:w-64 focus-within:ring-2 focus-within:ring-black">
          <i className="fa-solid fa-magnifying-glass text-gray-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search projects, stack…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs text-gray-700 outline-none w-full bg-transparent"
          />
        </form>

        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 border-2 border-black rounded-lg flex items-center justify-center bg-white hover:bg-gray-100 cursor-pointer transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
        </button>
      </div>
    </header>
  );
}
