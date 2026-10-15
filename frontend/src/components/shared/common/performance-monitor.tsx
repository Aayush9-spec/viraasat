'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return;
    }

    try {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('📊 LCP:', Math.round(entry.startTime), 'ms');
            } else if (entry.entryType === 'first-input') {
              const fid = (entry as any).processingStart - entry.startTime;
              console.log('📊 FID:', Math.round(fid), 'ms');
            } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              console.log('📊 CLS delta:', (entry as any).value);
            }
          }
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'first-input', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });
      }

      window.addEventListener('load', () => {
        setTimeout(() => {
          const navEntries = performance.getEntriesByType('navigation');
          if (navEntries.length > 0) {
            const nav = navEntries[0] as PerformanceNavigationTiming;
            console.log('📊 Performance Metrics:');
            console.log(`Page Load Time: ${Math.round(nav.loadEventEnd - nav.startTime)}ms`);
            console.log(`Connect Time: ${Math.round(nav.responseEnd - nav.requestStart)}ms`);
            console.log(`DOM Complete: ${Math.round(nav.domComplete - nav.startTime)}ms`);
          }
        }, 0);
      });
    } catch {
      // Ignore performance monitoring errors in non-supporting browsers
    }
  }, []);

  return null;
}
