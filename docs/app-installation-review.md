# Viraasat app installation repair

Date: 2026-10-30. This change addresses the download-page claims, app branding and installation behavior. It is not a claim that the deployed website, AI models or live payment providers were validated.

## Findings and fixes

The former 2.9 MB APK contained a 460-byte DEX with one class and two constructor methods. It had no `onCreate` screen, website-opening logic or functioning app workflow. Its manifest did not reference the bundled launcher images, its unused configuration pointed to `viraasat.org`, and its build script announced success even if signing failed. A signing key and password had been committed alongside it.

The claimed GI camera scanner, instant direct-to-artisan settlement, full offline order queue and “Safe & Verified Package” badge had no supporting implementation in that APK. They have been removed, along with the advertised release/version/size and instructions to bypass browser download warnings. The page now explains the existing marketplace, account and approved-artisan studio, internet requirements and actual browser installation options. The release APK section explicitly says no release is available until one is built with private signing configuration.

The old PNG filenames contained JPEG data; `icon-512x512.png` was actually 1024×1024. Viraasat logo artwork has been adapted for a square icon and exported as valid, correctly sized PNGs. The manifest, Apple home-screen icon, favicon, install banner, offline screen and Android launcher now use the same branding. A separate maskable asset has padding for launcher masks. Broken screenshot references and the incorrect artisan shortcut were removed from the manifest.

Browser install offers are captured once at application startup and retained across navigation. The page and banner use that shared state, handle dismissal/failure and wait for `appinstalled` before reporting completion. Browsers without an automatic prompt receive manual Android, iPhone/iPad and desktop instructions. The banner no longer promises offline shopping or unmeasured speed improvements.

Service-worker registration now works even when React mounts after the window load event. Update timers and listeners are cleaned up. There is no forced page reload during checkout. The worker stores only a standalone connection-help screen, its retry script and branding; account pages, orders, API responses and Next.js payloads are not cached. Activating it removes legacy Viraasat caches. Offline navigation displays the actual cached help screen instead of an incomplete React page or stale private content. Worker cache versions are deterministic across identical builds.

## Android replacement

`android/app/src/main` contains a real browser-backed launcher with a branded screen, a working Open Viraasat action and recovery when no browser can handle the URL. It opens `https://virrasat.in/` in the system browser/Custom Tabs, preserving browser-owned authentication and checkout. It does not provide native GI scanning, a settlement engine or offline orders.

The new build uses Android AAPT2, a Java compiler and D8, then aligns, signs and verifies the APK with official SDK tools. An isolated preview package (`org.viraasat.heritage.preview`) was compiled successfully. It is approximately 353 KiB, contains 6,512 bytes of compiled DEX with 63 methods, and has valid v2/v3 signatures. The embedded logo pixels match the website icon. These build checks are not real-device runtime tests.

Preview artifact: `/workspace/reports/app-review/viraasat-2.4.1-preview.apk`. This is a test build with a temporary signature, not a production release or a compatible update to existing installs. Real-device/browser/provider acceptance testing remains outstanding; no Android emulator or device was available here. See [Android build and release instructions](../android/README.md).

The empty public APKs, obsolete test APKs and exposed signing key were removed from the current tree. Both old APK URLs redirect to `/download`. The key remains in Git history and must not be treated as secret. Release publication refuses missing credentials, refuses preview publication and updates actual version/size/checksum metadata only after a verified signed build. Do not reuse the former public key. Plan signing compatibility for any old installations separately.

## Validation

- 120 frontend tests passed, including prompt retention/dismissal/failure, late worker registration, no private-page caching, real icon dimensions and release metadata validation.
- Production Webpack build and TypeScript passed. ESLint has zero errors and one pre-existing warning in the ignored onboarding Playwright helper. The existing Sentry/OpenTelemetry build warning remains.
- 19 browser tests passed; authenticated checkout remains skipped without configured test credentials. Five installation tests cover the actual offline fallback, branding and retired APK redirects, plus simulated browser install events to verify UI transitions without claiming a real device installation.
- Download page checked at 320, 390, 768, 1440 and 1920 pixels: no horizontal overflow, page runtime errors or serious/critical axe findings. Chrome in an isolated normal profile reported no manifest or installation-eligibility errors. Headless Chrome did not emit an automatic installation offer during that observation; installation itself was not completed. Private browser contexts correctly disallow installation.
- Android compiler/resource/signature/alignment checks passed. Missing release signing configuration and attempting to publish a preview both fail without changing the advertised release.
- Two consecutive service-worker builds produced identical output.

Screenshots and machine-readable observations are under `/workspace/reports/app-review/`. The live domain remains blocked by this cloud environment's network policy. No production deployment, release signing or live login/payment verification is claimed.
