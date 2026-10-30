# Android release validation

Date: 2026-10-30. Prepared on top of `main` commit `2ba69a9`, preserving its newer Expo, AI and translation work. The downloadable APK is the browser-backed launcher in `android/`, not a compiled Expo application.

## Artifact and runtime checks

The preview artifact is `viraasat-2.4.1-preview.apk`, package `org.viraasat.heritage.preview`, SHA-256 `a82e6636bbc5ceb84a130b93d2a3e220e873e6420bcd79bd8291f3544308feb5`. Signature and alignment checks passed. All ten native checks passed on Android 8/API 26 using the exact APK downloaded from the local website. Android 15/API 35 verified installation, browser launch, the missing-browser dialog, logo and welcome button during partial automated runs. Its final recovery action was checked directly using a screenshot, ADB tap and a fresh browser intent, with no app runtime error observed. The complete Android 15 automated suite did not pass: UIAutomator was killed with exit 137. Detailed results, including `android-35/manual-recovery.json`, are saved under `/workspace/reports/app-review/`.

These are software emulators without KVM. Their System UI produced timeout dialogs during startup. Animations and system error dialogs were disabled for the test fixtures, and Android 15's development watchdog was disabled to let startup complete. App crash logs and actual UI assertions remain part of the tests. These checks do not establish performance on physical devices.

`scripts/test-android-apk.py` records the exact APK hash and tests install, browser handoff to `https://virrasat.in/`, missing-browser recovery, the Viraasat logo, the Open Viraasat button, and app crash logs. Alternative browsers are temporarily disabled to make the fixture deterministic and are restored afterward. Browser first-run screens are handled using Android's recorded launch intent. Live website navigation and authenticated provider flows remain unverified because the environment blocks the live domain.

## Website delivery

APK downloads use the Android package content type and attachment header. The download page and static APK are public. Stable old APK URLs redirect to the versioned release only when the verified release manifest is available. Browser tests verify downloaded bytes against the advertised size and SHA-256 when a release exists; this check remains skipped while signing is unavailable.

The actual preview APK was served through a temporary file on the local production website. HTTP 200, `application/vnd.android.package-archive`, the attachment header, all 361,017 bytes and the exact SHA-256 were verified. The downloaded copy is saved at `/workspace/reports/app-review/downloaded-test.apk`. The temporary public fixture was removed afterward; it was never published as a production release.

The release build now requires `--publish --device emulator-PORT`. It signs and verifies the APK, rejects the known publicly exposed certificate even if the key file has been renamed, and runs the emulator test on that exact signed APK before copying it to the website. Missing signing configuration or a failed test leaves the website release manifest unchanged.

The latest main branch also contained deployment blockers, fixed here: misplaced client directives, a server-only Clerk import in a browser-shared module, an unsupported page export, and the missing Toaster import after applying the installation patch. A missing translation memo dependency and the Node test-environment setup were corrected. These changes do not apply the earlier commerce/database migrations.

Validation: 76 unit tests passed; production build and TypeScript passed; five installation browser tests passed. The signed-release download test is skipped until the release key is configured. ESLint has no errors; the ignored onboarding helper retains its existing warning. Build warnings remain for Sentry/OpenTelemetry and the optional `@react-email/render` dependency.

## Remaining release inputs

The owner chose an existing private release key stored on their computer. No replacement release key was generated. A local signing kit is prepared at `/workspace/reports/app-review/viraasat-signing-kit.zip`. Its production DEX and logo bytes match the tested preview; its unsigned SHA-256 is `06c0c26713f98302e3155fd73dc290c9b5234c5ee7fe7d1e91953df369f1ab92`. The owner can sign locally with Java and return only `viraasat-signed.apk`; keystore and passwords stay on their computer.

The Bash signing helper was tested with an ephemeral test key that was deleted afterward. Publication guards rejected an unavailable emulator, a signed preview package, an unsigned APK and modified code, leaving the website manifest unchanged. PowerShell was not installed here, so that helper was reviewed but not executed; the kit also includes a direct Java command. The public release remains unavailable until the owner-signed APK is received and passes the final signature, payload and device checks described in `android/README.md`.

The runtime still denies `virrasat.in`. The environment configuration draft could not be edited in its published state, so a network change was not saved or applied. The requested host list is preserved in `/workspace/reports/app-review/network-access-needed.json`. Live deployment and download verification cannot be claimed from these local checks.
