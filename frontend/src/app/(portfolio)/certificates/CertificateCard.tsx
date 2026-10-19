'use client';
import { useState } from 'react';

interface CertificateProps {
  id: string | number;
  title: string;
  issuer: string;
  date?: string | null;
  credential_url?: string | null;
  file_name?: string;
  file_url?: string;
  file_type?: string;
  thumbnail_url?: string;
  direct_thumbnail_url?: string;
  is_drive?: boolean;
  is_local_file?: boolean;
  icon?: string;
}

export default function CertificateCard({ cert }: { cert: CertificateProps }) {
  const isDrive = Boolean(cert.is_drive);
  const isPdf = cert.file_type === 'pdf';
  const initialThumb =
    cert.thumbnail_url ||
    cert.direct_thumbnail_url ||
    (cert.file_type === 'image' && cert.file_url ? cert.file_url : null);

  const [imgSrc, setImgSrc] = useState<string | null>(initialThumb);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const link = cert.file_url || cert.credential_url;

  const handleImgError = () => {
    // If backend proxy failed, try direct Google CDN
    if (imgSrc === cert.thumbnail_url && cert.direct_thumbnail_url) {
      setImgSrc(cert.direct_thumbnail_url);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="border-2 border-black bg-white rounded-none p-4 flex flex-col justify-between hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div>
        {/* Document Thumbnail / Card Header */}
        <div className="w-full h-44 bg-slate-100 border-2 border-black mb-3 overflow-hidden flex items-center justify-center relative group select-none">
          {/* Fallback Vector & Icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-none flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
              <i
                className={`fa-solid ${
                  isPdf
                    ? 'fa-file-pdf text-red-600'
                    : isDrive
                    ? 'fa-brands fa-google-drive text-blue-600'
                    : 'fa-certificate text-amber-500'
                } text-xl`}
              ></i>
            </div>
            <div className="text-xs font-black uppercase text-gray-800 tracking-wider">
              {isPdf ? 'PDF Document' : 'Verified Certificate'}
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
              {cert.issuer}
            </div>
          </div>

          {/* Real Thumbnail (Bypasses Google Referer Block) */}
          {imgSrc && !imgError && (
            <img
              src={imgSrc}
              alt={cert.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={handleImgError}
              className={`w-full h-full object-cover relative z-10 transition-opacity duration-200 group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Drive Badge */}
          {isDrive && (
            <span className="absolute top-2 right-2 z-20 bg-white border border-black px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm">
              <i className="fa-brands fa-google-drive text-blue-600"></i> Drive
            </span>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="flex items-start gap-3 w-full">
          <div className="w-9 h-9 bg-gray-100 border-2 border-black flex items-center justify-center shrink-0">
            <i
              className={`fa-solid ${
                isDrive
                  ? isPdf ? 'fa-file-pdf text-red-600' : 'fa-certificate text-gray-800'
                  : cert.icon || (isPdf ? 'fa-file-pdf text-red-600' : 'fa-certificate text-gray-800')
              } text-xs`}
            ></i>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-black text-sm leading-snug text-gray-900 break-words line-clamp-2">
              {cert.title}
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5 truncate">
              {cert.issuer}
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {cert.date && (
                <span className="text-[10px] font-mono font-bold text-gray-700 border border-gray-300 px-1.5 py-0.5 bg-gray-50">
                  {cert.date}
                </span>
              )}
              {isDrive && (
                <span className="text-[10px] font-mono text-blue-700 border border-blue-200 px-1.5 py-0.5 bg-blue-50 font-bold">
                  {isPdf ? 'PDF' : 'IMAGE'}
                </span>
              )}
              {cert.is_local_file && (
                <span className="text-[10px] font-mono text-gray-500 border border-gray-200 px-1.5 py-0.5 bg-white">
                  LOCAL
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 border-2 border-black px-3 py-2 text-center transition-colors flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <span>{isDrive ? 'Open on Google Drive' : isPdf ? 'View PDF Certificate' : 'View Credential'}</span>
          <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
      ) : (
        <div className="mt-4 text-xs font-medium text-gray-400 italic text-center py-1 border border-dashed border-gray-200">
          Verified In-House
        </div>
      )}
    </div>
  );
}
