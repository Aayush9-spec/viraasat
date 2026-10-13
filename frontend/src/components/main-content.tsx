'use client';

import React from 'react';
import { AppShell } from './layout/app-shell';

export function MainContent({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default MainContent;
