'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken } from '@/lib/admin';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/admin/login');
    } else {
      setReady(true);
    }
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/admin/login');
  };

  const links = [
    { href: '/admin', icon: 'fa-gauge-high', label: 'Dashboard' },
    { href: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { href: '/admin/skills', icon: 'fa-code', label: 'Skills' },
    { href: '/admin/learning', icon: 'fa-bolt', label: 'Learning' },
    { href: '/admin/experiences', icon: 'fa-briefcase', label: 'Experience' },
    { href: '/admin/certificates', icon: 'fa-certificate', label: 'Certificates' },
    { href: '/admin/projects', icon: 'fa-folder-open', label: 'Projects' },
    { href: '/admin/messages', icon: 'fa-envelope', label: 'Messages' },
    { href: '/admin/profile', icon: 'fa-user', label: 'Profile' },
  ];

  if (!ready) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-52 border-r-2 border-black bg-white flex flex-col py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 mb-10 border-2 border-black rounded-lg px-3 py-2">
          <div className="w-7 h-7 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">&lt;/&gt;</div>
          <span className="font-black text-lg tracking-tight">ADMIN</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-gray-900 text-white font-semibold' : 'hover:bg-gray-100 font-medium text-gray-600'}`}
              >
                <i className={`fa-solid ${link.icon} text-xs`}></i>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="flex-1"></div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-sm text-gray-500"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
              <span>Back to Portfolio</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 font-medium text-sm text-red-500 w-full text-left"
            >
              <i className="fa-solid fa-right-from-bracket text-xs"></i>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="border-b-2 border-black bg-white px-6 py-3 flex items-center justify-between">
          <span className="font-black text-sm">Admin Panel</span>
          <div className="text-sm font-black text-gray-800 flex items-center gap-2">
            <span className="text-base">👋</span> Hai, Fian!
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
