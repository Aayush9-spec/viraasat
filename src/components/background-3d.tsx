"use client";

import React, { useEffect, useState } from 'react';

export function Background3D() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({
                x: (event.clientX / window.innerWidth) * 2 - 1,
                y: (event.clientY / window.innerHeight) * 2 - 1
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const rotateX = mousePosition.y * 8;
    const rotateY = mousePosition.x * 8;

    return (
        <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none perspective-container bg-background"
            style={{
                perspective: '1200px'
            }}>
            <div
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`
                }}
            >
                {/* Central Ornamental Frame */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] max-w-[800px] max-h-[600px] opacity-15 transform-style-3d">
                    {/* Decorative Frame Border */}
                    <div className="absolute inset-0 border-2 border-amber-500/40 rounded-lg shadow-2xl animate-pulse-slow"
                        style={{
                            boxShadow: '0 0 40px rgba(251, 191, 36, 0.2), inset 0 0 40px rgba(251, 191, 36, 0.1)'
                        }}>
                        {/* Corner Ornaments */}
                        <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-orange-400/60 rounded-tl-lg"></div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 border-t-2 border-r-2 border-orange-400/60 rounded-tr-lg"></div>
                        <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-2 border-l-2 border-orange-400/60 rounded-bl-lg"></div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-orange-400/60 rounded-br-lg"></div>
                    </div>

                    {/* Inner Frame */}
                    <div className="absolute inset-8 border border-emerald-500/30 rounded-md"></div>
                </div>

                {/* Floating 3D Frames - Top Left */}
                <div
                    className="absolute top-[15%] left-[10%] w-64 h-48 opacity-10 transform-style-3d animate-float-1"
                    style={{
                        transform: `translate(${mousePosition.x * -25}px, ${mousePosition.y * -25}px) rotateX(${rotateX * 1.5}deg) rotateY(${rotateY * 1.5}deg)`
                    }}
                >
                    <div className="absolute inset-0 border-2 border-teal-400/50 rounded-xl bg-gradient-to-br from-teal-500/5 to-transparent backdrop-blur-sm">
                        <div className="absolute inset-3 border border-teal-300/30 rounded-lg"></div>
                    </div>
                </div>

                {/* Floating 3D Frames - Top Right */}
                <div
                    className="absolute top-[20%] right-[12%] w-56 h-56 opacity-12 transform-style-3d animate-float-2"
                    style={{
                        transform: `translate(${mousePosition.x * -35}px, ${mousePosition.y * -20}px) rotateX(${-rotateX * 1.2}deg) rotateY(${-rotateY * 1.2}deg)`
                    }}
                >
                    <div className="absolute inset-0 border-2 border-amber-400/50 rotate-12 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent">
                        <div className="absolute inset-4 border border-orange-300/30 rounded-xl"></div>
                        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500/40"></div>
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500/40"></div>
                    </div>
                </div>

                {/* Floating 3D Frames - Bottom Left */}
                <div
                    className="absolute bottom-[15%] left-[15%] w-72 h-40 opacity-10 transform-style-3d animate-float-3"
                    style={{
                        transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -30}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
                    }}
                >
                    <div className="absolute inset-0 border-2 border-orange-400/50 -rotate-6 rounded-xl bg-gradient-to-br from-orange-500/5 to-transparent">
                        <div className="absolute inset-2 border border-orange-300/30 rounded-lg"></div>
                    </div>
                </div>

                {/* Floating 3D Frames - Bottom Right */}
                <div
                    className="absolute bottom-[25%] right-[8%] w-48 h-64 opacity-10 transform-style-3d animate-float-1"
                    style={{
                        transform: `translate(${mousePosition.x * -28}px, ${mousePosition.y * -22}px) rotateX(${-rotateX}deg) rotateY(${rotateY * 1.3}deg)`
                    }}
                >
                    <div className="absolute inset-0 border-2 border-emerald-400/50 rotate-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent">
                        <div className="absolute inset-3 border border-emerald-300/30 rounded-xl"></div>
                        <div className="absolute w-full h-full flex items-center justify-center">
                            <div className="w-20 h-20 border border-emerald-400/40 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Circular Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[700px] max-h-[700px] opacity-8">
                    <div className="absolute inset-0 border border-primary/20 rounded-full animate-reverse-spin"></div>
                    <div className="absolute inset-16 border border-accent/15 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-32 border border-primary/10 rounded-full animate-reverse-spin"></div>
                </div>

                {/* 3D Cube Structure */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 transform-style-3d animate-tumble opacity-15">
                    <div className="cube-face front bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-400/30 backdrop-blur-sm"></div>
                    <div className="cube-face back bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-400/30"></div>
                    <div className="cube-face right bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-400/30"></div>
                    <div className="cube-face left bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-400/30"></div>
                    <div className="cube-face top bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-400/30"></div>
                    <div className="cube-face bottom bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-400/30"></div>
                </div>

                {/* Floating Geometric Elements */}
                <div
                    className="absolute top-[30%] left-[20%] w-6 h-6 border-2 border-amber-400/40 rotate-45 animate-float-1"
                    style={{ transform: `translate(${mousePosition.x * -18}px, ${mousePosition.y * -18}px) rotate(45deg)` }}
                ></div>
                <div
                    className="absolute top-[60%] right-[25%] w-8 h-8 border-2 border-emerald-400/40 rounded-full animate-float-2"
                    style={{ transform: `translate(${mousePosition.x * -25}px, ${mousePosition.y * -25}px)` }}
                ></div>
                <div
                    className="absolute bottom-[40%] left-[30%] w-5 h-5 bg-orange-400/20 rotate-12 animate-float-3"
                    style={{ transform: `translate(${mousePosition.x * -22}px, ${mousePosition.y * -22}px) rotate(12deg)` }}
                ></div>
                <div
                    className="absolute top-[45%] right-[18%] w-10 h-10 border border-teal-400/30 rounded-lg animate-float-1"
                    style={{ transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)` }}
                ></div>

                {/* Ambient Particles */}
                <div
                    className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400/30 rounded-full blur-sm animate-float-1"
                    style={{ transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)` }}
                ></div>
                <div
                    className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-emerald-400/25 rounded-full blur-md animate-float-2"
                    style={{ transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)` }}
                ></div>
                <div
                    className="absolute top-1/3 right-1/3 w-3 h-3 bg-orange-300/20 rounded-full blur-sm animate-float-3"
                    style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)` }}
                ></div>
                <div
                    className="absolute top-2/3 left-2/3 w-5 h-5 bg-teal-400/20 rounded-full blur-md animate-float-1"
                    style={{ transform: `translate(${mousePosition.x * -25}px, ${mousePosition.y * -25}px)` }}
                ></div>
            </div>
        </div>
    );
}
