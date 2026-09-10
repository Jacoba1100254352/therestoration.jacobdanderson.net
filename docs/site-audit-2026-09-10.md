# Site audit: 10 September 2026

The audit started from clean `main` at `38a2b0e`. The initial install, lint, typecheck, placeholder front-end tests, API tests, and build passed. Inspection of the generated HTML and actual browser behavior exposed issues beyond those checks.

## Fixes

| Finding | Change and regression coverage |
| --- | --- |
| The app used Unhead 3 while Vite SSG 28 installed Unhead 2. Generated HTML omitted the app's canonical, social, and structured metadata. | Align `@unhead/vue` to `^2.1.17`, add distinct page titles/descriptions, and check generated HTML directly. Dependabot defers this major upgrade until the static generator supports it. |
| The generated sitemap used `http://localhost`, included the internal README, and overwrote the source crawler policy. | Generate exactly six public URLs on the production origin, preserve `public/robots.txt`, and keep route documentation in Markdown. |
| Missing pages returned HTTP 200 with the home page. `/api` also entered that fallback. | Serve a generated, noindex 404 with a home link; return JSON 404 for API misses. Redirect existing `.html` and trailing-slash page URLs to their canonical routes. Cover GET, HEAD, query preservation, and content negotiation. |
| The mobile menu was a clickable `div` without keyboard operation or expanded-state announcements; it could overlap the header or sit behind the map. | Use a labeled button, expanded state, Escape/focus handling, route-derived active state, and correct positioning. Add skip links, distinct navigation landmarks, page-change focus, and scroll restoration. |
| The contact form treated any HTTP success as delivery confirmation and could clear the draft after receiving an HTML error page. | Require `{ ok: true }`, guard duplicate submits, make fields read-only during delivery, preserve drafts after failures, and announce results through a persistent status region. Distinguish unconfirmed timeout delivery. |
| Map coordinate updates accumulated markers, and an asynchronously created watcher outlived its component. | Keep the watcher in the component lifecycle, replace the marker group on updates, use plain text for popup content, and label markers with location names. |
| Browser checks used development/preview servers, desktop-only accessibility scans, and placeholder front-end unit assertions. | Test the compiled Express application and production assets. Add real contact/map/metadata tests, mobile keyboard checks, production metadata validation, and missing-page coverage to CI. |
| The app referenced nonexistent SVG favicons and an empty mask-icon URL. | Use the existing local PNG icons and validate generated local asset references. |

## Visual review

The 1280px desktop home layout is unchanged in the before/after comparison. At 390px, the navigation button has a usable hit area and each featured-link label stays together. Other visible changes are keyboard focus indicators, underlined map attribution links, and a usable missing-page screen.

- [Desktop before](audit-2026-09-10/before-desktop.png) / [Desktop after](audit-2026-09-10/after-desktop.png)
- [Mobile before](audit-2026-09-10/before-mobile.png) / [Mobile after](audit-2026-09-10/after-mobile.png)

## Validation

Verified using Node 24.18.1 and npm 12.0.2:

- Root `npm ci` succeeds; manifest and lockfile versions are `4.0.2`.
- Lint, both workspace typechecks, both builds, native Linux ARM64 lockfile checks, deployment-asset checks, and generated-site checks pass.
- 35 automated unit/API/repository checks: 16 front-end, 17 back-end, and 2 deployment configuration tests.
- 14 Cypress browser tests pass against the compiled Express server in Chrome. Tests wait for Vue to mount before interacting with prerendered HTML; the contact recovery test also delays its route script to exercise startup timing.
- 28 axe scenarios pass: seven routes, desktop/mobile, light/dark preferences. The mobile scenarios also exercise Enter, Space, Tab, and Escape; the home scenarios exercise the skip link. No horizontal overflow, uncaught browser errors, or failed local asset requests were observed.
- `npm audit` reports zero vulnerabilities across production and development dependencies. Registry verification covers 918 package signatures and 277 attestations.
- `actionlint` passes for the changed CI workflow.

The optional guarded Oxlint, zizmor, and OSV wrappers declined to run because installed versions differ from their approved versions. Those checks are not counted as passes. The repository's ESLint, native validation, npm audit/signature checks, and browser checks provide the recorded evidence.

Dependency freshness was reviewed for the root and both workspaces. This release corrects the demonstrated Unhead incompatibility. Node/TypeScript and native bindings retain the repository's supported baselines; other non-security upgrades remain in the regular dependency-update flow.

## Release and rollout

This is the `v4.0.2` visitor reliability and search-metadata milestone, following `v4.0.1` monitoring work. Deploy the matching front-end and back-end builds together because the server now requires the generated `404.html` fallback. No environment or data migration is required. The existing direct-runtime preparation and promotion checks remain authoritative for deployment.

Before publishing this release, the public `/healthz` and `/readyz` probes returned HTTP 200, and `/release.json` identified `v4.0.1` at `91366665ab34eb158024d4730f3651eed31f64f6`. Source publication and production promotion are separate steps.

The browser tests isolate third-party tiles and analytics and intercept contact submissions. They do not establish live SMTP delivery, external analytics availability, map-tile availability, or production promotion. Manual VoiceOver/NVDA review remains useful alongside the automated accessibility checks.

## Reference guidance

The keyboard behavior follows the [W3C disclosure navigation pattern](https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/disclosure/disclosure-navigation.html). The marker watcher follows [Vue's watcher ownership guidance](https://vuejs.org/guide/essentials/watchers.html). Missing-page responses follow [Google's guidance on soft 404s](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors).
