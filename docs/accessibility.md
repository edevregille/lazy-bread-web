# Accessibility verification (WCAG 2.2 AA)

This project aims for [WCAG 2.2 Level AA](https://www.w3.org/WAI/WCAG22/quickref/). Code changes do not replace a full audit; use this checklist before releases.

## Automated checks

- Run `npm run lint` — extends `plugin:jsx-a11y/recommended` (via `eslint-config-next`’s dependency chain) for common JSX issues.
- In Chrome: install [axe DevTools](https://www.deque.com/axe/devtools/) and scan **Home**, **Order**, **Payment**, **Dashboard**, **About**, **Find us**, and **Inspiration**.

## Manual checks

1. **Keyboard**: Tab through each page; ensure focus order is logical, focus is visible, and no traps (dialogs close with Escape and restore focus).
2. **Zoom**: Pinch-zoom or browser zoom to ~200%; layout should remain usable (viewport must not block zoom).
3. **Skip link**: Tab from the top of the page — “Skip to main content” should appear and move focus to `#main-content`.
4. **Forms**: Every control has a visible or screen-reader label; errors are announced (try with VoiceOver or NVDA).
5. **Contrast**: Spot-check primary text and buttons with a contrast checker (e.g. WebAIM).

## Optional CI

For regression testing, consider `@axe-core/playwright` against critical URLs after `next build` + `next start` in CI.

## Third parties

- **reCAPTCHA**: Google provides accessibility alternatives; document support contacts if users cannot complete verification.
- **Stripe Elements**: Rely on Stripe’s accessible defaults; retest after UI changes.
