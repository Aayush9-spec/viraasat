'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Suppress React 19 / Next.js 16 false-positive warnings and browser extension DOM mutations
if (typeof console !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
        const firstArg = typeof args[0] === 'string' ? args[0] : '';
        const allArgsStr = args.map(a => String(a)).join(' ');
        if (
            firstArg.includes('Encountered a script tag while rendering React component') ||
            firstArg.includes('Scripts inside React components are never executed') ||
            allArgsStr.includes('chrome-extension://') ||
            allArgsStr.includes('injectedScript') ||
            allArgsStr.includes('pageProvider.js') ||
            allArgsStr.includes('booster_root') ||
            (firstArg.includes('A tree hydrated but some attributes of the server rendered HTML') &&
             (allArgsStr.includes('injectedScript') || allArgsStr.includes('chrome-extension') || allArgsStr.includes('booster_root'))) ||
            (firstArg.includes('Hydration failed because the server rendered HTML') &&
             (allArgsStr.includes('booster_root') || allArgsStr.includes('injectedScript') || allArgsStr.includes('chrome-extension')))
        ) {
            return;
        }
        originalConsoleError.apply(console, args);
    };
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
