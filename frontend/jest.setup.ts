import '@testing-library/jest-dom';

// jsdom does not implement IntersectionObserver (used by LazyCarousel).
// A no-op stub keeps component tests focused on rendering, not viewport math.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Clerk needs a browser + provider; unit tests provide neither. Sign-in
// state defaults to an anonymous, signed-out user.
jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(() => ({ setActive: jest.fn() })),
  useSignIn: jest.fn(() => ({ signIn: null })),
  useSignUp: jest.fn(() => ({ signUp: null })),
  useUser: () => ({ isLoaded: true, isSignedIn: false, user: null }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    getToken: () => Promise.resolve(null),
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  Show: ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) =>
    fallback ?? children,
  SignInButton: () => null,
  SignUpButton: () => null,
  UserButton: () => null,
}));

// Mock Genkit for unit tests so flows can be tested with isolated mocked prompts & flows
jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn((config) => {
      return jest.fn(async (input: any) => ({
        output: null,
      }));
    }),
    defineFlow: jest.fn((config, fn) => {
      return jest.fn(async (input: any) => fn(input));
    }),
    generate: jest.fn(async () => ({
      text: 'Mocked Gemini response',
    })),
  },
  isGeminiConfigured: jest.fn(() => false),
  getGeminiApiKey: jest.fn(() => null),
}));

// Fluid cache clear between tests (firestore hooks cache product lookups).
afterEach(() => {
  window.localStorage.clear();
});
