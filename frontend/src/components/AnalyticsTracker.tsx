'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) {
      return;
    }

    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    const referrer = typeof document !== 'undefined' ? document.referrer : null;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';
    const endpoint = `${baseUrl}/analytics/view`;
    const payload = JSON.stringify({ path: fullPath, referrer });

    // 1. Internal DB Telemetry (sendBeacon or fetch keepalive)
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking silent fail
    }

    // 2. PostHog Client Telemetry (if initialized)
    try {
      const ph = typeof window !== 'undefined' ? (window as unknown as { posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void } }).posthog : undefined;
      if (ph && typeof ph.capture === 'function') {
        ph.capture('$pageview', {
          $current_url: window.location.href,
          path: fullPath,
        });
      }
    } catch {
      // Non-blocking silent fail
    }
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
