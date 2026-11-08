# Viraasat 2.0 – Theme Audit & Complete Enhancement Report

**Date:** 2026-11-08  
**Project:** Viraasat 2.0 (Authentic Indian Artisan Marketplace)  
**Production Site:** [virasat.in](https://virasat.in)  
**Repository:** [github.com/Aayush9-spec/viraasat](https://github.com/Aayush9-spec/viraasat)

---

## 1. Executive Summary & Root Cause Analysis

### The Problem
When testing the customer dashboard on `/dashboard?tab=profile` (and across the site):
- Selecting **Light Mode** in the Theme Switcher changed the top navigation bar to light ivory, but the dashboard main canvas, sidebar, cards, and input fields remained pitch obsidian dark.
- Switching to **Dark Mode** left other pages (such as the Homepage, Shop Catalog, and About Us) stuck in stark bright white/cream.

### Root Cause Diagnosis
1. **Tailwind CSS v4 Variant Mechanism**:
   - The project uses `@tailwindcss/postcss ^4.3.3` (Tailwind CSS v4).
   - In Tailwind v4, without the explicit custom variant definition `@custom-variant dark (&:where(.dark, .dark *));`, the `dark:` selector is interpreted as `@media (prefers-color-scheme: dark)`.
   - On any device or operating system running in dark mode (such as macOS/Android in dark theme), the browser media query activated all `dark:...` CSS classes regardless of the `<html class="light">` root class set by `next-themes`!
2. **Hardcoded Dark/Light Container Classes**:
   - `frontend/src/app/dashboard/layout.tsx` hardcoded `dark:bg-[#181310]`, forcing obsidian backgrounds whenever the media query fired.
   - `frontend/src/app/page.tsx` and `frontend/src/app/shop/page.tsx` contained hardcoded `#FAF7F2`, `#FAF8F5`, `#F3EDE2`, `#221C18`, and `#655B53` color classes with no dark counterparts, causing them to stay bright ivory when Dark mode was chosen.
3. **Legacy Theme Settings & Storage Key**:
   - `frontend/src/app/layout.tsx` initially included a hardcoded `clay` class on `<html>`.
   - The Theme Switcher did not have an intuitive 3-option toggle (`Light`, `Dark`, `System`) with active state indicators and fallback normalization.

---

## 2. Technical Architecture & Implementations

### A. Tailwind CSS v4 Custom Variant & Color System (`globals.css`)
In [`frontend/src/app/globals.css`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/globals.css):
```css
@import "tailwindcss";

/* Ensure Tailwind v4 uses class-based dark mode (.dark) instead of OS prefers-color-scheme */
@custom-variant dark (&:where(.dark, .dark *));
```

#### Light Mode Palette (Indian Heritage Warm Ivory & Terracotta)
- **Background**: Warm Ivory `#F8F5EF` (`hsl(40 33% 96%)`)
- **Card**: Pure White `#FFFFFF` (`hsl(0 0% 100%)`)
- **Secondary**: `#F0EAE0` (`hsl(38 35% 91%)`)
- **Primary Text**: Deep Charcoal `#29231F` (`hsl(24 14% 14%)`)
- **Secondary Text**: Muted Earth `#756B61` (`hsl(30 9% 42%)`)
- **Primary Brand**: Terracotta `#8B3A32` (`hsl(5 47% 37%)`)
- **Accent**: Antique Gold `#B18A45` (`hsl(38 44% 48%)`)
- **Borders**: Soft Parchment `#E5DDD1` (`hsl(36 27% 86%)`)

#### Dark Mode Palette (Obsidian Charcoal & Warm Gold)
- **Background**: Obsidian Charcoal `#14100E` (`hsl(24 22% 7%)`)
- **Card**: Deep Bronze Charcoal `#1E1815` (`hsl(24 18% 10%)`)
- **Secondary**: `#28211C` (`hsl(24 17% 13%)`)
- **Primary Text**: Warm Ivory `#FAF7F2` (`hsl(40 33% 96%)`)
- **Secondary Text**: Soft Stone `#A89F91` (`hsl(36 12% 61%)`)
- **Primary Brand**: Antique Gold `#C59B4B` (`hsl(38 52% 53%)`)
- **Accent**: Warm Terracotta `#A04328` (`hsl(13 60% 39%)`)
- **Borders**: Subtle Bronze `#332822` (`hsl(24 20% 17%)`)

### B. Root Layout & Provider Normalization
- [`frontend/src/app/layout.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/layout.tsx): Cleaned `<html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>`. Removed static theme classes from SSR markup.
- [`frontend/src/core/providers.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/core/providers.tsx): Configured `ThemeProvider` with:
  - `attribute="class"`
  - `defaultTheme="system"`
  - `enableSystem={true}`
  - `storageKey="viraasat-theme"`
  - `themes={["light", "dark", "system", "clay"]}`

### C. Tri-State Theme Switcher (`theme-switcher.tsx`)
In [`frontend/src/components/shared/navigation/theme-switcher.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/components/shared/navigation/theme-switcher.tsx):
- Dedicated, accessible dropdown menu with:
  1. **Light**: Crisp daylight ivory aesthetic
  2. **Dark**: Obsidian night palette
  3. **System**: Automatic synchronization with OS preference (dynamic status: `Auto (light)` or `Auto (dark)`)
- Automatic migration hook for legacy localStorage keys.
- Checkmark indicator highlighting current active option.

### D. Component Color Modernization
Semantic theme classes (`bg-background`, `bg-card`, `bg-secondary`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-primary`, `text-accent`) were applied across:
1. **Homepage** ([`frontend/src/app/page.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/page.tsx)):
   - Hero Section, Regional GI Crafts Carousel, Curated Heirlooms, Neural Recommendations
   - Master Artisans Spotlight, Why Viraasat / Philosophy, Testimonials, Heritage Journal
   - Quick View Modal, Master Artisan Story Modal, and Guild Induction Modal
2. **Shop Catalog** ([`frontend/src/app/shop/page.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/shop/page.tsx)):
   - Editorial Header, Search Bar, Desktop & Mobile Filter Sidebar, Layout Grid Switcher
   - Product Grid Cards, Empty States, Provenance Quick Inspect Modal
3. **Product Card** ([`frontend/src/features/marketplace/components/product-card.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/features/marketplace/components/product-card.tsx)):
   - Adapted to `bg-card`, `border-border`, `text-foreground`, `text-primary`.
4. **Customer Dashboard** ([`frontend/src/app/dashboard/layout.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/dashboard/layout.tsx)):
   - Updated layout container to responsive semantic tokens `bg-background text-foreground`.
5. **About Us** ([`frontend/src/app/about/page.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/app/about/page.tsx)):
   - Header, Manifesto card, and 4 Pillars grid.
6. **AI Assistant Chatbot** ([`frontend/src/features/ai/components/ai-assistant.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/features/ai/components/ai-assistant.tsx)):
   - Chat message background, markdown highlights, and suggested product cards.
7. **Royal Auctions** ([`frontend/src/features/auctions/components/unique-art-auction-section.tsx`](file:///Users/aayushkumarsingh/Desktop/viraasat/viraasat/frontend/src/features/auctions/components/unique-art-auction-section.tsx)):
   - Live auction cards, filter tabs, create auction modal, bid modal, and ledger dialog.

---

## 3. Verification & Test Results

| Check | Tool / Suite | Result |
|---|---|---|
| **TypeScript Typecheck** | `tsc --noEmit` | **0 errors** |
| **ESLint Audit** | `eslint .` | **0 errors, 0 warnings** |
| **Jest Unit Test Suite** | `jest --runInBand --forceExit` | **16/16 passed (115/115 tests)** |
| **Production Build** | `next build` (Turbopack) | **Compiled successfully** |

---

## 4. Key Takeaways & Best Practices
- **Never rely on media queries when supporting a manual theme switcher in Tailwind v4**: Always specify `@custom-variant dark (&:where(.dark, .dark *));`.
- **Use HSL CSS Variables**: Enables smooth theme transitions with zero runtime CSS-in-JS overhead.
- **Consistent Storage Key**: `viraasat-theme` is synchronized across SSR and client-side hydration with `suppressHydrationWarning`.

