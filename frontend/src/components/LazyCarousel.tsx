import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';

const Carousel3DWrapper = dynamic(
  () => import('./carousel-3d-wrapper').then(mod => ({ default: mod.Carousel3DWrapper || mod.default })),
  {
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center">Loading…</div>,
  }
);

export default function LazyCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{isInView && <Carousel3DWrapper />}</div>;
}