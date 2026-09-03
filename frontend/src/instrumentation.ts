export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await import('@sentry/nextjs').then((Sentry) => {
      const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';
      if (environment === 'development') return;
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment,
        tracesSampleRate: 0.1,
      });
    });
  }
}
