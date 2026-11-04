'use client';

import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#181310] text-[#221C18] dark:text-[#FAF7F2] transition-colors duration-300 selection:bg-[#C59B4B]/30 selection:text-[#701D24]">
      {children}
    </div>
  );
}
