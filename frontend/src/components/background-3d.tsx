"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';

export function Background3D() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const rafId = useRef<number | null>(null);
    const lastUpdateTime = useRef<number>(0);

    useEffect(() => {
        let pendingUpdate = { x: 0, y: 0 };
        let isUpdateScheduled = false;

        const handleMouseMove = (event: MouseEvent) => {
            pendingUpdate = {
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: (event.clientY / window.innerHeight) * 2 - 1
            };

            // Throttle updates to 60fps max
            if (!isUpdateScheduled) {
                isUpdateScheduled = true;
                rafId.current = requestAnimationFrame((timestamp) => {
                    // Only update if at least 16ms have passed (60fps)
                    if (timestamp - lastUpdateTime.current >= 16) {
                        setMousePosition(pendingUpdate);
                        lastUpdateTime.current = timestamp;
                    }
                    isUpdateScheduled = false;
                });
            }
        };

        // Use passive listener for better scroll performance
        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId.current !== null) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    const rotateX = useMemo(() => mousePosition.y * 5, [mousePosition.y]);
    const rotateY = useMemo(() => mousePosition.x * 5, [mousePosition.x]);

    return (
        <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none perspective-container bg-background/50"
            style={{
                perspective: '1200px',
                willChange: 'transform'
            }}>
            <div
                className="absolute inset-0 transition-transform duration-300 ease-out"
                style={{
                    transform: `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`,
                    willChange: 'transform'
                }}
            >
                {/* Central Ornamental Frame - Refined */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-[65vh] max-w-[800px] max-h-[600px] opacity-20 transform-style-3d">
                    <div className="absolute inset-0 border border-amber-500/20 rounded-2xl shadow-2xl animate-pulse-slow backdrop-blur-[1px]"
                        style={{
                            boxShadow: '0 0 60px rgba(251, 191, 36, 0.05), inset 0 0 20px rgba(251, 191, 36, 0.05)'
                        }}>
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-16 h-16 border-t border-l border-amber-500/40 rounded-tl-2xl"></div>
                        <div className="absolute -top-1 -right-1 w-16 h-16 border-t border-r border-amber-500/40 rounded-tr-2xl"></div>
                        <div className="absolute -bottom-1 -left-1 w-16 h-16 border-b border-l border-amber-500/40 rounded-bl-2xl"></div>
                        <div className="absolute -bottom-1 -right-1 w-16 h-16 border-b border-r border-amber-500/40 rounded-br-2xl"></div>
                    </div>
                </div>

                {/* Floating Glass Panels - Top Left */}
                <div
                    className="absolute top-[15%] left-[10%] w-64 h-48 opacity-20 transform-style-3d animate-float-1"
                    style={{
                        transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) translateZ(50px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    }}
                >
                    <div className="absolute inset-0 border border-orange-400/30 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent backdrop-blur-sm shadow-lg"></div>
                </div>

                {/* Floating Glass Panels - Top Right */}
                <div
                    className="absolute top-[20%] right-[12%] w-56 h-56 opacity-20 transform-style-3d animate-float-2"
                    style={{
                        transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -15}px) translateZ(80px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg)`,
                    }}
                >
                    <div className="absolute inset-0 border border-amber-600/30 rotate-12 rounded-3xl bg-gradient-to-br from-amber-700/10 to-transparent backdrop-blur-sm shadow-xl">
                        <div className="absolute inset-6 border border-amber-500/20 rounded-2xl"></div>
                    </div>
                </div>

                {/* Floating Glass Panels - Bottom Left */}
                <div
                    className="absolute bottom-[20%] left-[15%] w-72 h-40 opacity-20 transform-style-3d animate-float-3"
                    style={{
                        transform: `translate(${mousePosition.x * -25}px, ${mousePosition.y * -25}px) translateZ(60px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    }}
                >
                    <div className="absolute inset-0 border border-red-400/30 -rotate-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-sm shadow-lg"></div>
                </div>

                {/* Floating Glass Panels - Bottom Right */}
                <div
                    className="absolute bottom-[25%] right-[8%] w-48 h-64 opacity-20 transform-style-3d animate-float-1"
                    style={{
                        transform: `translate(${mousePosition.x * -35}px, ${mousePosition.y * -20}px) translateZ(100px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`,
                    }}
                >
                    <div className="absolute inset-0 border border-amber-400/30 rotate-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-sm shadow-xl">
                        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-amber-400/20 rounded-full"></div>
                    </div>
                </div>

                {/* Circular Rings - Refined */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] opacity-10 pointer-events-none">
                    <div className="absolute inset-0 border border-primary/20 rounded-full animate-reverse-spin" style={{ animationDuration: '60s' }}></div>
                    <div className="absolute inset-20 border border-accent/10 rounded-full animate-spin-slow" style={{ animationDuration: '45s' }}></div>
                </div>

                {/* 3D Cube Structure - Glassy */}
                <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 transform-style-3d animate-tumble opacity-25">
                    <div className="cube-face front bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-400/20 backdrop-blur-md rounded-lg"></div>
                    <div className="cube-face back bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-400/20 backdrop-blur-md rounded-lg"></div>
                    <div className="cube-face right bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-400/20 backdrop-blur-md rounded-lg"></div>
                    <div className="cube-face left bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-400/20 backdrop-blur-md rounded-lg"></div>
                    <div className="cube-face top bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-400/20 backdrop-blur-md rounded-lg"></div>
                    <div className="cube-face bottom bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-400/20 backdrop-blur-md rounded-lg"></div>
                </div>

                {/* Ambient Glow Particles */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>
        </div>
    );
}
