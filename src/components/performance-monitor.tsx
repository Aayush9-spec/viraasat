'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV === 'development') {
            // Monitor Web Vitals
            if (typeof window !== 'undefined') {
                import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
                    onCLS(console.log);
                    onFID(console.log);
                    onFCP(console.log);
                    onLCP(console.log);
                    onTTFB(console.log);
                });
            }

            // Log performance metrics
            if (window.performance && window.performance.timing) {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        const perfData = window.performance.timing;
                        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                        const connectTime = perfData.responseEnd - perfData.requestStart;
                        const renderTime = perfData.domComplete - perfData.domLoading;

                        console.log('📊 Performance Metrics:');
                        console.log(`Page Load Time: ${pageLoadTime}ms`);
                        console.log(`Connect Time: ${connectTime}ms`);
                        console.log(`Render Time: ${renderTime}ms`);
                    }, 0);
                });
            }
        }
    }, []);

    return null;
}
