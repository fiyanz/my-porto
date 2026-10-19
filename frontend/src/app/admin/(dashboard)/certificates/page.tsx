'use client';
import { useEffect, useState, useRef } from 'react';
import { adminFetch } from '@/lib/admin';

interface Cert {
  id: number;
  title: string;
  issuer: string;
  date: string | null;
  credential_url: string | null;
  icon: string;
  display_order: number;
}

interface LocalCert {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'image';
  icon: string;
}

interface DriveCert {
  id: string;
  title: string;
  issuer: string;
  date: string | null;
  file_name: string;
  file_id: string;
  file_type: string;
  file_url: string;
  thumbnail_url: string;
  is_drive: boolean;
}

export default function AdminCertificates() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [localCerts, setLocalCerts] = useState<LocalCert[]>([]);
  const [driveCerts, setDriveCerts] = useState<DriveCert[]>([]);
  const [loading, setLoading] = useState(false);

  // Google Drive State
  const [driveUrl, setDriveUrl] = useState('');
  const [driveApiKey, setDriveApiKey] = useState('');
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveSaved, setDriveSaved] = useState(false);

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [form, setForm] = useState({
    title: '',
    issuer: '',
    date: '',
    credential_url: '',
    icon: 'fa-certificate',
    display_order: 0,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Load Drive settings & certs
      const [driveSetRes, driveCertsRes, dbRes, localRes] = await Promise.all([
        adminFetch('/certificates/drive-settings').catch(() => null),
        adminFetch('/certificates/drive-certs').catch(() => null),
        adminFetch('/certificates/').catch(() => null),
        fetch('/api/certificates').catch(() => null),
      ]);

      if (driveSetRes && driveSetRes.ok) {
        const dSet = await driveSetRes.json();
        setDriveUrl(dSet.folder_url || '');
        setDriveFolderId(dSet.folder_id || null);
      }

      if (driveCertsRes && driveCertsRes.ok) {
        const dCerts = await driveCertsRes.json();
        if (Array.isArray(dCerts)) setDriveCerts(dCerts);
      }

      if (dbRes && dbRes.ok) {
        const data = await dbRes.json();
        if (Array.isArray(data)) setCerts(data);
      }

      if (localRes && localRes.ok) {
        const localData = await localRes.json();
        if (Array.isArray(localData)) setLocalCerts(localData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveDriveSettings = async () => {
    if (!driveUrl.trim()) return;
    setDriveSaving(true);
    setDriveSaved(false);
    try {
      const res = await adminFetch('/certificates/drive-settings', {
        method: 'POST',
        body: JSON.stringify({
          folder_url: driveUrl.trim(),
          api_key: driveApiKey.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.certs)) setDriveCerts(data.certs);
        setDriveSaved(true);
        setTimeout(() => setDriveSaved(false), 3000);
      } else {
        alert('Failed to save Google Drive settings');
      }
    } catch {
      alert('Error updating Google Drive settings');
    } finally {
      setDriveSaving(false);
    }
  };

  const handleSyncDriveNow = async () => {
    setDriveSaving(true);
    try {
      const res = await adminFetch('/certificates/drive-sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.certs)) setDriveCerts(data.certs);
      }
    } finally {
      setDriveSaving(false);
    }
  };

  const handleUploadFolderCert = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload certificate');
      }
    } catch {
      alert('Error uploading certificate file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLocalCert = async (fileName: string) => {
    if (!confirm(`Delete ${fileName} from public/certificates folder?`)) return;
    try {
      const res = await fetch(`/api/certificates?filename=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadAll();
      }
    } catch {
      alert('Error deleting file');
    }
  };

  const resetManualForm = () => {
    setForm({
      title: '',
      issuer: '',
      date: '',
      credential_url: '',
      icon: 'fa-certificate',
      display_order: 0,
    });
    setEditing(null);
    setShowManualForm(false);
  };

  const handleSaveManual = async () => {
    if (!form.title.trim()) return;
    if (editing) {
      await adminFetch(`/certificates/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
    } else {
      await adminFetch('/certificates/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }
    resetManualForm();
    loadAll();
  };

  const handleEditManual = (c: Cert) => {
    setEditing(c);
    setForm({
      title: c.title,
      issuer: c.issuer,
      date: c.date || '',
      credential_url: c.credential_url || '',
      icon: c.icon,
      display_order: c.display_order,
    });
    setShowManualForm(true);
  };

  const handleDeleteDbCert = async (id: number) => {
    if (!confirm('Delete this certificate?')) return;
    await adminFetch(`/certificates/${id}`, { method: 'DELETE' });
    loadAll();
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Certificates Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {driveCerts.length} from Google Drive · {localCerts.length} from Local Folder · {certs.length} in Database
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetManualForm();
              setShowManualForm(!showManualForm);
            }}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100 transition"
          >
            <i className="fa-solid fa-plus text-xs"></i> Add Database Link
          </button>
        </div>
      </div>

      {/* 1. GOOGLE DRIVE FOLDER AUTO-SYNC CARD */}
      <div className="border-2 border-black bg-white p-5 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${driveCerts.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                <i className="fa-brands fa-google-drive text-blue-600 text-base"></i>
                Google Drive Folder Auto-Sync (1 Link &rarr; Auto Display)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Paste your Google Drive folder link. All certificates in the folder will automatically display on your portfolio one by one.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {driveFolderId && (
              <button
                onClick={handleSyncDriveNow}
                disabled={driveSaving}
                className="border-2 border-black bg-white hover:bg-gray-100 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                <i className={`fa-solid fa-arrows-rotate ${driveSaving ? 'fa-spin' : ''}`}></i>
                Sync Now
              </button>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Google Drive Folder Link or Folder ID
            </label>
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/1ABCxyz... or folder ID"
              className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Google API Key (Optional)
            </label>
            <input
              type="password"
              value={driveApiKey}
              onChange={(e) => setDriveApiKey(e.target.value)}
              placeholder="Optional: Google Drive API Key"
              className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-xs font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleSaveDriveSettings}
            disabled={driveSaving || !driveUrl.trim()}
            className="bg-gray-900 text-white px-5 py-2 text-xs font-bold border-2 border-black hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            {driveSaving ? 'Syncing Drive...' : driveSaved ? '✓ Saved & Synced!' : 'Save & Sync Drive Folder'}
          </button>
          <span className="text-[11px] text-gray-500">
            Ensure folder access is set to <strong>"Anyone with the link can view"</strong> in Google Drive.
          </span>
        </div>

        {/* Detected Drive Certificates List */}
        <div className="border-2 border-black divide-y divide-gray-200">
          <div className="px-4 py-2 bg-blue-50 border-b border-black text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>Detected Certificates in Google Drive ({driveCerts.length})</span>
            {driveFolderId && <span className="font-mono text-[10px] text-blue-700">Folder ID: {driveFolderId}</span>}
          </div>
          {driveCerts.length > 0 ? (
            driveCerts.map((dc) => (
              <div
                key={dc.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 border border-black flex items-center justify-center shrink-0">
                    <i
                      className={`fa-solid ${
                        dc.file_type === 'pdf' ? 'fa-file-pdf text-red-600' : 'fa-image text-blue-600'
                      } text-sm`}
                    ></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-gray-900 flex items-center gap-2 truncate">
                      <span className="truncate">{dc.title}</span>
                      <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 border border-blue-300 px-1 py-0.2">
                        {dc.file_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {dc.issuer} {dc.date && `· ${dc.date}`} · <span className="text-gray-400">{dc.file_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a
                    href={dc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-black bg-white hover:bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800 flex items-center gap-1"
                  >
                    <span>View Drive</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              {driveFolderId
                ? 'No files detected yet. Check if folder is shared publicly or click "Sync Now".'
                : 'Enter your Google Drive folder link above to automatically display your certificates.'}
            </div>
          )}
        </div>
      </div>

      {/* 2. LOCAL FOLDER AUTO-SYNC SECTION */}
      <div className="border-2 border-black bg-white p-5 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <h3 className="font-black text-sm uppercase tracking-wide">
                Local Folder Storage (<code className="font-mono text-xs">frontend/public/certificates</code>)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Drop any <code className="font-mono bg-gray-100 px-1">.pdf</code>,{' '}
              <code className="font-mono bg-gray-100 px-1">.png</code>, or{' '}
              <code className="font-mono bg-gray-100 px-1">.jpg</code> into the local folder.
            </p>
          </div>

          {/* Quick upload file input */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
            >
              <i className="fa-solid fa-file-arrow-up"></i>
              {uploadFile ? uploadFile.name : 'Choose File'}
            </button>
            {uploadFile && (
              <button
                onClick={handleUploadFolderCert}
                disabled={uploading}
                className="border-2 border-black bg-gray-900 text-white hover:bg-gray-800 px-3 py-1.5 text-xs font-bold"
              >
                {uploading ? 'Uploading...' : 'Save to Folder'}
              </button>
            )}
          </div>
        </div>

        {/* Local Folder List */}
        <div className="border-2 border-black divide-y divide-gray-200">
          {localCerts.length > 0 ? (
            localCerts.map((lc) => (
              <div
                key={lc.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 border border-black flex items-center justify-center shrink-0">
                    <i
                      className={`fa-solid ${
                        lc.file_type === 'pdf' ? 'fa-file-pdf text-red-600' : 'fa-image text-blue-600'
                      } text-sm`}
                    ></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-gray-900 flex items-center gap-2 truncate">
                      <span className="truncate">{lc.title}</span>
                      <span className="text-[10px] font-mono uppercase bg-gray-100 border border-gray-300 px-1 py-0.2">
                        {lc.file_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {lc.issuer} {lc.date && `· ${lc.date}`} · <span className="text-gray-400">{lc.file_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <a
                    href={lc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 border-2 border-black bg-white hover:bg-gray-100 flex items-center justify-center text-xs text-gray-800"
                    title="Preview File"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                  <button
                    onClick={() => handleDeleteLocalCert(lc.file_name)}
                    className="w-7 h-7 border-2 border-black bg-white hover:bg-red-50 flex items-center justify-center text-xs text-red-600"
                    title="Delete File"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              No files in <code className="font-mono">frontend/public/certificates/</code>.
            </div>
          )}
        </div>
      </div>

      {/* 3. MANUAL DATABASE CERTIFICATES SECTION */}
      {showManualForm && (
        <div className="border-2 border-black bg-white p-5 mb-5">
          <h3 className="font-black text-sm mb-3 border-b-2 border-black pb-2">
            {editing ? 'Edit Database Certificate' : 'New Database Certificate (External Link)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none"
                placeholder="AI/ML Bootcamp"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Issuer</label>
              <input
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none"
                placeholder="Dicoding / Coursera"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Date</label>
              <input
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Credential URL</label>
              <input
                value={form.credential_url}
                onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Icon</label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full border-2 border-black bg-gray-50 px-3 py-2 text-sm font-mono"
                placeholder="fa-certificate"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveManual}
              className="bg-gray-900 text-white px-5 py-2 text-sm font-bold border-2 border-black hover:bg-gray-800"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetManualForm}
              className="bg-white px-4 py-2 text-sm font-bold border-2 border-black hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Database Certs List */}
      <div className="border-2 border-black bg-white">
        <div className="px-4 py-2.5 bg-gray-50 border-b-2 border-black font-black text-xs uppercase tracking-wider text-gray-600">
          Database Registered Records ({certs.length})
        </div>
        {certs.map((cert, i) => (
          <div
            key={cert.id}
            className={`flex items-center justify-between px-4 py-2.5 ${
              i !== certs.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-gray-100 border-2 border-black flex items-center justify-center shrink-0">
                <i className={`fa-solid ${cert.icon} text-gray-800 text-xs`}></i>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black truncate">{cert.title}</div>
                <div className="text-xs text-gray-500 font-mono">
                  {cert.issuer} {cert.date ? `· ${cert.date}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <button
                onClick={() => handleEditManual(cert)}
                className="w-7 h-7 border-2 border-black bg-white flex items-center justify-center hover:bg-gray-50 text-xs"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
              <button
                onClick={() => handleDeleteDbCert(cert.id)}
                className="w-7 h-7 border-2 border-black bg-white flex items-center justify-center hover:bg-red-50 text-xs text-red-600"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
        {certs.length === 0 && (
          <div className="px-4 py-4 text-center text-xs text-gray-400">
            No database certificates added yet.
          </div>
        )}
      </div>
    </>
  );
}
