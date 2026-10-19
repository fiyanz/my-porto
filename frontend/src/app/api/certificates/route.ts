import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLocalCertificates, parseCertificateFilename } from '@/lib/certificates';

export async function GET() {
  const certs = await getLocalCertificates();
  return NextResponse.json(certs);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const certsDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certsDir)) {
      await fs.promises.mkdir(certsDir, { recursive: true });
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_\s]/g, '_');
    const targetPath = path.join(certsDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(targetPath, buffer);

    const meta = parseCertificateFilename(safeName);
    const ext = path.extname(safeName).toLowerCase();

    return NextResponse.json({
      success: true,
      item: {
        id: `local-${Date.now()}-${safeName}`,
        title: meta.title,
        issuer: meta.issuer,
        date: meta.date,
        file_name: safeName,
        file_url: `/certificates/${encodeURIComponent(safeName)}`,
        file_type: ext === '.pdf' ? 'pdf' : 'image',
        is_local_file: true,
        icon: meta.icon,
      },
    });
  } catch (err: any) {
    console.error('Error saving certificate:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('filename');

    if (!fileName) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Prevent directory traversal
    const safeName = path.basename(fileName);
    const targetPath = path.join(process.cwd(), 'public', 'certificates', safeName);

    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return NextResponse.json({ success: true, message: 'File deleted' });
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: 500 });
  }
}
