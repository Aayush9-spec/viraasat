# Accessibility (a11y) Guide

Viraasat aims for **WCAG 2.1 AA** compliance. Radix UI primitives help, but they don't guarantee it — every contributor is responsible for verifying the accessibility of the components and pages they touch.

## Automated tests

We ship two Playwright + axe-core suites that run against a local dev server:

```bash
# Install browser binaries once:
cd frontend && npx playwright install chromium

# a11y scan: flags serious/critical WCAG 2.1 AA violations across key pages
npm run test:a11y

# Keyboard-only smoke test
npm run test:keyboard
```

Both suites are wired into CI. They are not sufficient on their own — see the manual checklist below.

## Release checklist (run before every public deploy)

For each new or changed page, verify the following manually with the browser's accessibility inspector, the keyboard, and (if you have one) a screen reader.

### Keyboard

- [ ] All interactive elements are reachable with `Tab` in DOM order.
- [ ] The focused element has a visible focus ring (browser default is fine if a global outline is set in `globals.css`).
- [ ] No keyboard trap. `Tab`/`Shift+Tab` always moves focus out of any region.
- [ ] `Esc` closes overlays (modals, sheets, dialogs).
- [ ] Enter / Space activate buttons; arrow keys navigate menus, tabs, and radio groups.

### Semantics

- [ ] Every `<button>` has a real label (visible text, `aria-label`, or `aria-labelledby`).
- [ ] No `<div onClick>` — use `<button>` or a typed `<Link>`.
- [ ] Forms: each input has a `<label>`; required fields are announced; errors are linked with `aria-describedby`.
- [ ] Headings are hierarchical (`h1` → `h2` → `h3`); never skip a level.
- [ ] Decorative images use `alt=""`; meaningful images have descriptive `alt` text.

### Color & contrast

- [ ] Text contrast meets 4.5:1 (3:1 for large text). Verify with the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- [ ] No information conveyed by color alone (e.g. error states need an icon or text too).

### Motion

- [ ] Respect `prefers-reduced-motion`. The `framer-motion` and Radix animations already do, but check custom CSS.
- [ ] No flashing content faster than 3 Hz (WCAG 2.3.1).

### Mobile / touch

- [ ] Touch targets are at least 44×44 px.
- [ ] Pinch-to-zoom is not disabled.

### Screen reader (VoiceOver / NVDA / TalkBack)

- [ ] Page has a unique, descriptive `<title>`.
- [ ] Landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) are used instead of bare `<div>`s.
- [ ] Live regions (`aria-live="polite"`) for toast notifications and dynamic content.

## Reporting issues

Open a GitHub issue with the label `a11y`. Include:

- The page URL and a description of the user impact.
- The browser + assistive technology in use.
- Whether `npm run test:a11y` reproduces the problem.

## Tooling reference

- [axe DevTools browser extension](https://www.deque.com/axe/devtools/) — in-browser scanner.
- [WAVE](https://wave.webaim.org/) — quick online audit.
- Lighthouse a11y audit (built into Chrome DevTools).
