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

After real-device acceptance checks, run `python3 scripts/package-apk.py --publish`. It refuses missing signing configuration, compiles and verifies the package, copies it to `frontend/public/download/`, and updates `frontend/src/config/android-release.json` with the actual version, size and checksum. Rebuild/deploy the website to show the download. Preview builds cannot be published through this command. No unsigned fallback is provided.

A different signing key cannot update old installs using the same package ID. Plan that migration explicitly; do not tell users an incompatible update was verified.

## Device acceptance checks

Install the preview with `adb install <apk>`. Confirm the logo, app label and launch screen; opening should target `https://virrasat.in/`. Test the default browser, Custom Tabs, no-browser recovery, Back navigation, offline/reconnect, Clerk login/OAuth and Razorpay test-mode checkout on Android 8+ and current Android. Compilation and signature verification alone do not prove those device/provider flows. The cloud workspace has no Android emulator/device or production service credentials, and its proxy currently blocks the live website.
