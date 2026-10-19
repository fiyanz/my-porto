'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin';

interface PageStat {
  path: string;
  total_views: number;
  unique_visitors: number;
}

interface ReferrerStat {
  referrer: string;
  count: number;
}

interface AnalyticsData {
  total_views: number;
  today_views: number;
  unique_visitors_today: number;
  top_pages: PageStat[];
  top_referrers: ReferrerStat[];
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = () => {
    setLoading(true);
    adminFetch('/analytics/summary')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load analytics summary');
        return res.json();
      })
      .then((json: AnalyticsData) => {
        setData(json);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Error loading analytics');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Analytics & Telemetry</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time visitor logs and page performance.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="border-2 border-black bg-white px-4 py-2 font-bold text-xs uppercase tracking-wide hover:bg-gray-100 flex items-center gap-2"
        >
          <i className="fa-solid fa-arrows-rotate"></i> Refresh
        </button>
      </div>

      {error && (
        <div className="border-2 border-red-500 bg-red-50 text-red-700 p-4 mb-6 font-medium text-sm">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Page Views', value: loading ? '—' : data?.total_views ?? 0, icon: 'fa-eye' },
          { label: "Today's Page Views", value: loading ? '—' : data?.today_views ?? 0, icon: 'fa-calendar-day' },
          { label: 'Unique Visitors Today', value: loading ? '—' : data?.unique_visitors_today ?? 0, icon: 'fa-users' },
        ].map((card) => (
          <div key={card.label} className="border-2 border-black bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center">
                <i className={`fa-solid ${card.icon} text-sm`}></i>
              </div>
              <span className="text-3xl font-black">{card.value}</span>
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top Pages */}
        <div className="border-2 border-black bg-white p-5">
          <h3 className="font-black text-sm mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
            <i className="fa-solid fa-file-lines text-gray-500"></i> Most Visited Pages
          </h3>
          {loading ? (
            <div className="text-xs text-gray-400 py-4">Loading stats...</div>
          ) : !data?.top_pages?.length ? (
            <div className="text-xs text-gray-400 py-4">No page visits recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase">
                    <th className="py-2">Path</th>
                    <th className="py-2 text-right">Views</th>
                    <th className="py-2 text-right">Uniques</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {data.top_pages.map((p) => (
                    <tr key={p.path} className="hover:bg-gray-50">
                      <td className="py-2.5 truncate max-w-[200px]" title={p.path}>
                        {p.path}
                      </td>
                      <td className="py-2.5 text-right font-bold">{p.total_views}</td>
                      <td className="py-2.5 text-right text-gray-500">{p.unique_visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="border-2 border-black bg-white p-5">
          <h3 className="font-black text-sm mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
            <i className="fa-solid fa-arrow-up-right-from-square text-gray-500"></i> Top Referrers
          </h3>
          {loading ? (
            <div className="text-xs text-gray-400 py-4">Loading stats...</div>
          ) : !data?.top_referrers?.length ? (
            <div className="text-xs text-gray-400 py-4">No referrers logged yet (direct visits).</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase">
                    <th className="py-2">Source</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {data.top_referrers.map((r) => (
                    <tr key={r.referrer} className="hover:bg-gray-50">
                      <td className="py-2.5 truncate max-w-[240px]" title={r.referrer}>
                        {r.referrer}
                      </td>
                      <td className="py-2.5 text-right font-bold">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
