'use client';

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Animated Icon */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-32 h-32 flex items-center justify-center">
                        <svg
                            className="w-16 h-16 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                            />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-white">
                        You&apos;re Offline
                    </h1>
                    <p className="text-gray-300 text-lg">
                        No internet connection detected. Please check your network and try again.
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg
                            className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Try Again
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                {/* Info */}
                <div className="pt-8 space-y-2">
                    <p className="text-sm text-gray-400">
                        Some features may still be available offline
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Cached Pages
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            Limited Features
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
