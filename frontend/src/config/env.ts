/**
 * Centralized, type-safe environment configuration.
 * Validates and provides sensible fallbacks for both client-side and server-side environments.
 */

function getEnvVar(key: string, fallback = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
}

const isProduction = getEnvVar('NODE_ENV') === 'production';
const isDevelopment = !isProduction;

export const env = {
  isProduction,
  isDevelopment,
  app: {
    url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:9002'),
    commitSha:
      getEnvVar('VERCEL_GIT_COMMIT_SHA') ||
      getEnvVar('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA') ||
      'dev',
    environment: getEnvVar('NEXT_PUBLIC_VERCEL_ENV', getEnvVar('NODE_ENV', 'development')),
  },
  clerk: {
    publishableKey: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', ''),
    secretKey: getEnvVar('CLERK_SECRET_KEY', ''),
    signInUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    signUpUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL', '/sign-up'),
    signInFallbackRedirect: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL', '/'),
    signUpFallbackRedirect: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL', '/'),
  },
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', ''),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    get isConfigured(): boolean {
      return Boolean(this.url && this.anonKey);
    },
  },
  firebase: {
    apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'viraasat-ai'),
    storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', ''),
    serviceAccountJson: getEnvVar('FIREBASE_SERVICE_ACCOUNT_JSON', ''),
    get isConfigured(): boolean {
      return Boolean(this.apiKey && this.projectId);
    },
  },
  backend: {
    url: getEnvVar('NEXT_PUBLIC_BACKEND_URL', 'https://viraasat-backend-f0c1.onrender.com'),
  },
  razorpay: {
    keyId: getEnvVar('NEXT_PUBLIC_RAZORPAY_KEY_ID', getEnvVar('RAZORPAY_KEY_ID', '')),
    keySecret: getEnvVar('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: getEnvVar('RAZORPAY_WEBHOOK_SECRET', ''),
    get isConfigured(): boolean {
      return Boolean(this.keyId && this.keySecret);
    },
  },
  ai: {
    geminiApiKey:
      getEnvVar('GEMINI_API_KEY') ||
      getEnvVar('GOOGLE_API_KEY') ||
      getEnvVar('GOOGLE_GENAI_API_KEY', ''),
    mockAi: getEnvVar('MOCK_AI') === 'true',
    chatDailyLimit: Number(getEnvVar('CHAT_DAILY_LIMIT', '30')),
  },
  email: {
    resendApiKey: getEnvVar('RESEND_API_KEY', ''),
    from: getEnvVar('EMAIL_FROM', 'Viraasat <noreply@viraasat.in>'),
    replyTo: getEnvVar('EMAIL_REPLY_TO', 'care@viraasat.in'),
  },
  ecommerce: {
    gstRate: Number(getEnvVar('NEXT_PUBLIC_GST_RATE', '0.18')),
  },
} as const;

export default env;
