'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    adminFetch('/admin/stats').then(r => r.ok ? r.json() : null).then(data => data && setStats(data)).catch(() => {});
    adminFetch('/analytics/summary').then(r => r.ok ? r.json() : null).then(data => data && setAnalytics(data)).catch(() => {});
    adminFetch('/contact/').then(r => r.ok ? r.json() : null).then(d => d && setMessages(d.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your portfolio content.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Views', value: analytics?.total_views ?? '—', icon: 'fa-chart-line', href: '/admin/analytics' },
          { label: 'Projects', value: stats?.projects_count ?? '—', icon: 'fa-folder-open', href: '/admin/projects' },
          { label: 'Skills', value: stats?.skills_count ?? '—', icon: 'fa-code', href: '/admin/skills' },
          { label: 'Experiences', value: stats?.experiences_count ?? '—', icon: 'fa-briefcase', href: '/admin/experiences' },
          { label: 'Unread Messages', value: stats?.unread_messages_count ?? '—', icon: 'fa-envelope', href: '/admin/messages' },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="border-2 border-black bg-white p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center">
                <i className={`fa-solid ${card.icon} text-sm`}></i>
              </div>
              <span className="text-3xl font-black">{card.value}</span>
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Add Project', icon: 'fa-plus', href: '/admin/projects' },
          { label: 'Add Skill', icon: 'fa-plus', href: '/admin/skills' },
          { label: 'Add Experience', icon: 'fa-plus', href: '/admin/experiences' },
        ].map((action) => (
          <Link key={action.label} href={action.href} className="border-2 border-black bg-gray-900 text-white p-4 hover:bg-gray-700 flex items-center gap-3">
            <i className={`fa-solid ${action.icon} text-xs`}></i>
            <span className="text-sm font-bold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Messages */}
      <div className="border-2 border-black bg-white p-5">
        <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2 flex items-center gap-2">
          <i className="fa-solid fa-envelope text-gray-500"></i> Recent Messages
        </h3>
        {messages.length > 0 ? (
          <div className="flex flex-col gap-2">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`border-2 border-black p-3 flex items-center justify-between ${msg.is_read ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {!msg.is_read && <div className="w-2 h-2 bg-gray-900 rounded-full shrink-0"></div>}
                  <div>
                    <div className="text-sm font-black">{msg.name}</div>
                    <div className="text-xs text-gray-500">{msg.email} · {msg.purpose || 'General'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mono">{new Date(msg.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No messages yet.</p>
        )}
      </div>
    </>
  );
}
