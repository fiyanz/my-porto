import fs from 'fs';
import path from 'path';

export interface CertificateItem {
  id: string | number;
  title: string;
  issuer: string;
  date: string | null;
  credential_url?: string | null;
  file_name?: string;
  file_url?: string;
  file_type?: 'pdf' | 'image' | 'link';
  is_local_file?: boolean;
  icon?: string;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

/**
 * Parses file name into structured certificate data.
 * Examples:
 * - "2024 - Dicoding - Machine Learning Specialization.pdf" -> Date: 2024, Issuer: Dicoding, Title: Machine Learning Specialization
 * - "Coursera - Deep Learning.png" -> Issuer: Coursera, Title: Deep Learning
 * - "aws-certified-solutions-architect.pdf" -> Title: Aws Certified Solutions Architect, Issuer: Certificate
 */
export function parseCertificateFilename(fileName: string): {
  title: string;
  issuer: string;
  date: string | null;
  icon: string;
} {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext).trim();

  // Pattern 1: [Year] - [Issuer] - [Title]
  const match3 = base.match(/^(\d{4})\s*[-_–]\s*([^-–_]+)\s*[-_–]\s*(.+)$/);
  if (match3) {
    return {
      date: match3[1].trim(),
      issuer: match3[2].trim(),
      title: match3[3].trim(),
      icon: ext.toLowerCase() === '.pdf' ? 'fa-file-pdf' : 'fa-certificate',
    };
  }

  // Pattern 2: [Issuer] - [Title]
  const match2 = base.match(/^([^-–_]+)\s*[-_–]\s*(.+)$/);
  if (match2) {
    const first = match2[1].trim();
    if (/^\d{4}$/.test(first)) {
      return {
        date: first,
        issuer: 'Certificate',
        title: match2[2].trim(),
        icon: ext.toLowerCase() === '.pdf' ? 'fa-file-pdf' : 'fa-certificate',
      };
    }
    return {
      date: null,
      issuer: first,
      title: match2[2].trim(),
      icon: ext.toLowerCase() === '.pdf' ? 'fa-file-pdf' : 'fa-certificate',
    };
  }

  // Fallback: clean words
  const cleanTitle = base
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .filter(Boolean)
    .join(' ');

  return {
    date: null,
    issuer: 'Certification',
    title: cleanTitle || 'Certificate',
    icon: ext.toLowerCase() === '.pdf' ? 'fa-file-pdf' : 'fa-certificate',
  };
}

export async function getLocalCertificates(): Promise<CertificateItem[]> {
  try {
    const certsDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certsDir)) {
      return [];
    }

    const files = await fs.promises.readdir(certsDir);
    const validFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext) && !f.startsWith('.');
    });

    return validFiles.map((fileName, idx) => {
      const ext = path.extname(fileName).toLowerCase();
      const meta = parseCertificateFilename(fileName);
      return {
        id: `local-${idx}-${fileName}`,
        title: meta.title,
        issuer: meta.issuer,
        date: meta.date,
        file_name: fileName,
        file_url: `/certificates/${encodeURIComponent(fileName)}`,
        file_type: ext === '.pdf' ? 'pdf' : 'image',
        is_local_file: true,
        icon: meta.icon,
      };
    });
  } catch (err) {
    console.error('Error reading certificates directory:', err);
    return [];
  }
}
