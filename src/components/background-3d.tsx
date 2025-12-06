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

    const rotateX = mousePosition.y * 10; // Max 10 degrees
    const rotateY = mousePosition.x * 10; // Max 10 degrees

    return (
        <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none perspective-container bg-background"
            style={{
                perspective: '1000px'
            }}>
            <div
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={{
                    transform: `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`
                }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] opacity-20 transform-style-3d animate-slow-spin">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full animate-reverse-spin"></div>
                    <div className="absolute inset-10 border-[1px] border-accent/20 rounded-full animate-spin-slow"></div>

                    {/* 3D Cube Structure */}
                    <div className="absolute top-1/2 left-1/2 w-[20vw] h-[20vw] max-w-32 max-h-32 -translate-x-1/2 -translate-y-1/2 transform-style-3d animate-tumble">
                        <div className="cube-face front bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                        <div className="cube-face back bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                        <div className="cube-face right bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                        <div className="cube-face left bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                        <div className="cube-face top bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                        <div className="cube-face bottom bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    </div>
                </div>

                {/* Floating Particles or Elements - with parallax */}
                <div
                    className="absolute top-1/4 left-1/4 w-4 h-4 bg-accent/30 rounded-full blur-sm animate-float-1"
                    style={{ transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)` }}
                ></div>
                <div
                    className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-primary/20 rounded-full blur-md animate-float-2"
                    style={{ transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)` }}
                ></div>
                <div
                    className="absolute top-1/3 right-1/3 w-3 h-3 bg-foreground/10 rounded-full blur-sm animate-float-3"
                    style={{ transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)` }}
                ></div>
            </div>
        </div>
    );
}
