'use client';

import React from 'react';
import { AppShell } from './app-shell';

export function MainContent({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default MainContent;
