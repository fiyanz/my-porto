import { NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = getServerApiUrl();
    const res = await fetch(`${backendUrl}/health`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          success: false,
          status: res.status,
          message: 'Backend health check failed',
          error: errorText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      backend: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Could not connect to backend',
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
