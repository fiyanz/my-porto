'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/admin';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${baseUrl}/auth/login/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try {
          const data = await res.json();
          msg = data.detail || msg;
        } catch {
          msg = `Server returned ${res.status} (${res.statusText || 'Endpoint not found or unreachable'})`;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      setToken(data.access_token);
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="border-2 border-black bg-white p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-white text-xs font-bold">&lt;/&gt;</div>
          <span className="font-black text-xl tracking-tight">ADMIN</span>
        </div>

        <h1 className="text-2xl font-black mb-1">Sign In</h1>
        <p className="text-sm text-gray-500 mb-6">Access the portfolio admin panel.</p>

        {error && (
          <div className="border-2 border-black bg-red-50 text-red-700 text-xs font-bold px-3 py-2 mb-4">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-gray-600 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white px-5 py-2.5 text-sm font-bold border-2 border-black hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="mono text-gray-400 text-xs">$</span> authenticating…</>
            ) : (
              <><span className="mono text-gray-400 text-xs">$</span> login<i className="fa-solid fa-arrow-right text-xs"></i></>
            )}
          </button>
        </form>
      </div>

      <div className="text-center mt-4">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-700 font-medium">
          ← Back to Portfolio
        </a>
      </div>
    </div>
  );
}
