import { getServerApiUrl } from '@/lib/api';
import { getLocalCertificates, CertificateItem } from '@/lib/certificates';
import CertificateCard from './CertificateCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDbCertificates(): Promise<CertificateItem[]> {
  try {
    const res = await fetch(`${getServerApiUrl()}/certificates/`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getDriveCertificates(): Promise<any[]> {
  try {
    const res = await fetch(`${getServerApiUrl()}/certificates/drive-certs`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Certificates() {
  const [dbCerts, localCerts, driveCerts] = await Promise.all([
    getDbCertificates(),
    getLocalCertificates(),
    getDriveCertificates(),
  ]);

  // Combine and deduplicate
  const existingTitles = new Set([
    ...driveCerts.map((c) => c.title?.toLowerCase().trim()),
    ...localCerts.map((c) => c.title?.toLowerCase().trim()),
  ]);

  const filteredDbCerts = dbCerts.filter(
    (c) => !existingTitles.has(c.title?.toLowerCase().trim())
  );

  const certificates = [...driveCerts, ...localCerts, ...filteredDbCerts];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Certificates & Credentials</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified certifications, courses, and credentials auto-synced from Google Drive & storage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="border-2 border-black bg-white px-4 py-2 text-center">
            <div className="text-xl font-black">{certificates.length}</div>
            <div className="text-xs text-gray-500 font-bold">Total Certificates</div>
          </div>
          {driveCerts.length > 0 && (
            <div className="border-2 border-black bg-gray-50 px-3 py-2 text-center flex flex-col justify-center">
              <div className="text-xs font-mono font-bold text-gray-800 flex items-center gap-1 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                {driveCerts.length} Drive Synced
              </div>
              <div className="text-[10px] text-gray-400">Google Drive</div>
            </div>
          )}
          {localCerts.length > 0 && (
            <div className="border-2 border-black bg-gray-50 px-3 py-2 text-center flex flex-col justify-center">
              <div className="text-xs font-mono font-bold text-gray-800 flex items-center gap-1 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {localCerts.length} Folder
              </div>
              <div className="text-[10px] text-gray-400">local storage</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificates.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} />
        ))}

        {certificates.length === 0 && (
          <div className="col-span-full p-8 border-2 border-dashed border-gray-400 text-center bg-white">
            <div className="w-12 h-12 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-certificate text-xl text-gray-400"></i>
            </div>
            <h3 className="font-black text-base mb-1">No Certificates Detected</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-3">
              Connect your Google Drive folder link in the Admin panel, or drop files into{' '}
              <code className="font-mono bg-gray-100 px-1 border border-gray-300">
                frontend/public/certificates/
              </code>.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
