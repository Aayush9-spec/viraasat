# Viraasat Android launcher

This is a real, small Android application that opens `https://virrasat.in/` using the installed browser (Custom Tabs when supported). The browser owns login cookies, payments and camera/microphone prompts. There is no embedded WebView, offline order queue, GI camera verification or direct settlement engine in this launcher. The Viraasat artwork is used for its adaptive launcher icon and welcome screen.

The old downloadable package was hand-assembled with a single constructor and no app screen or website-opening code. It and its exposed signing key have been withdrawn. Old download URLs redirect to the installation page. The previously committed signing key must not be reused as a trusted release key; removing it here does not remove it from Git history.

## Build a preview

Install Java and Android SDK API 35/build-tools 35.0.0. Set `ANDROID_SDK_ROOT`; use `javac` or set `ECJ_JAR` to the Eclipse Java compiler. Optional `ANDROID_BUILD_TOOLS` and `ANDROID_PLATFORM_JAR` select nonstandard SDK locations.

Run from the repository root:

```sh
python3 scripts/package-apk.py --preview
```

The script compiles resources with AAPT2, Java source with javac/ECJ, and bytecode with D8, then zip-aligns, signs and verifies the APK. Output is under ignored `android/build/outputs`. Preview builds use `org.viraasat.heritage.preview` and a temporary test key, so they do not replace an installed production app. Each preview has a new temporary signing key; uninstall a previous preview before installing another. These are test artifacts, not release downloads.

## Publish a release

Configure these secret values in the release environment, without committing them:

- `VIRAASAT_ANDROID_KEYSTORE`: path to a private release signing key
- `VIRAASAT_ANDROID_KEY_ALIAS`
- `VIRAASAT_ANDROID_STORE_PASSWORD`
- `VIRAASAT_ANDROID_KEY_PASSWORD`

Run `python3 scripts/package-apk.py --publish --device emulator-5554` with an isolated emulator already booted. It refuses missing signing configuration and the exposed certificate, compiles and verifies the package, and tests the exact signed artifact before publication. Only a successful native test allows copying it to `frontend/public/download/` and updating `frontend/src/config/android-release.json` with the actual version, size and checksum. Rebuild/deploy the website to show the download. Preview builds cannot be published through this command. No unsigned fallback is provided.

The keystore file must be available at `VIRAASAT_ANDROID_KEYSTORE`; passwords are read from the local process environment, not from chat or Git. An HTTP proxy credential placeholder cannot unlock a local keystore. Use your existing private release key when available; do not generate a replacement merely because signing configuration is missing.

A different signing key cannot update old installs using the same package ID. Plan that migration explicitly; do not tell users an incompatible update was verified.

## Keep an existing key on the owner's computer

Use `python3 scripts/package-apk.py --prepare-signing` to compile and align the production package without signing or publishing it. The local signing kit contains that unsigned APK, Google's `apksigner.jar`, license notices, and the `sign-apk-locally.sh` / `.ps1` helpers. It requires Java 17 or later on the owner's computer, but no Android SDK. The helpers prompt locally for the keystore and alias; the signing tool prompts locally for passwords. Only the signed APK needs to be returned.

After receiving it, run:

```sh
python3 scripts/package-apk.py \
  --publish-signed /path/to/viraasat-signed.apk \
  --expected-unsigned android/build/outputs/viraasat-2.4.1-unsigned.apk \
  --device emulator-5556
```

Publication checks the production package/version, every compiled payload entry, signatures, the exposed-certificate block, alignment and native tests. It rejects preview packages, modified code and unsigned files. Keep the original prepared APK so the returned file can be compared with the exact payload supplied for signing.

## Device acceptance checks

Run `python3 scripts/test-android-apk.py <apk> --serial emulator-5554 --report android/build/reports/runtime.json`. It checks installation, the HTTPS browser handoff, crash logs, missing-browser recovery, the Viraasat logo and the Open Viraasat button. It temporarily disables alternative browser handlers on this isolated emulator and restores them afterward. Physical devices are deliberately rejected by this fixture.

Also check Back navigation, offline/reconnect, Clerk login/OAuth and Razorpay test-mode checkout on physical devices before claiming those provider flows work. The cloud workspace can now run Android 8 and Android 15 through software emulation; its proxy still blocks the live website and no production service credentials are configured. See `docs/android-release-validation.md` for current results and limitations.
