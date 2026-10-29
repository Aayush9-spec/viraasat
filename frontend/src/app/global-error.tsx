'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-serif antialiased bg-[#FAF7F2] text-[#221C18] flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6 border border-[#E8DCCB] p-8 rounded-2xl bg-white shadow-sm">
          <div className="w-16 h-16 bg-[#8C2B2B]/10 text-[#8C2B2B] rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#221C18]">Application Synchronization Pause</h1>
          <p className="text-sm text-[#655B53]">
            A temporary connection pause occurred. Please reload to reconnect with the heritage guild network.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-[#8C2B2B] hover:bg-[#702222] text-white font-medium rounded-xl shadow-sm transition-colors text-xs uppercase tracking-widest font-sans font-semibold cursor-pointer"
          >
            Reload Heritage Studio
          </button>
        </div>
      </body>
    </html>
  );
}
