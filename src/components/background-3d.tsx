"use client";

import React from 'react';

export function Background3D() {
    return (
        <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none perspective-container bg-background">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20 transform-style-3d animate-slow-spin">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full animate-reverse-spin"></div>
                <div className="absolute inset-10 border-[1px] border-accent/20 rounded-full animate-spin-slow"></div>

                {/* 3D Cube Structure */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 transform-style-3d animate-tumble">
                    <div className="cube-face front bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    <div className="cube-face back bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    <div className="cube-face right bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    <div className="cube-face left bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    <div className="cube-face top bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                    <div className="cube-face bottom bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"></div>
                </div>
            </div>

            {/* Floating Particles or Elements */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-accent/30 rounded-full blur-sm animate-float-1"></div>
            <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-primary/20 rounded-full blur-md animate-float-2"></div>
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-foreground/10 rounded-full blur-sm animate-float-3"></div>

        </div>
    );
}
