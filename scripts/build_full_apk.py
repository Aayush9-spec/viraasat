import os
import sys
import shutil
import subprocess
import zipfile

def main():
    print("=== Building Native Viraasat Android APK ===")
    
    sdk_root = os.path.expanduser("~/Library/Android/sdk")
    
    # Dynamically locate latest build-tools (aapt2, d8)
    aapt2 = None
    d8 = None
    bt_root = os.path.join(sdk_root, "build-tools")
    if os.path.exists(bt_root):
        for v in sorted(os.listdir(bt_root), reverse=True):
            cand_aapt2 = os.path.join(bt_root, v, "aapt2")
            cand_d8 = os.path.join(bt_root, v, "d8")
            if os.path.exists(cand_aapt2) and os.path.exists(cand_d8):
                aapt2 = cand_aapt2
                d8 = cand_d8
                break

    # Dynamically locate latest android.jar
    platform_jar = None
    plat_root = os.path.join(sdk_root, "platforms")
    if os.path.exists(plat_root):
        for p in sorted(os.listdir(plat_root), reverse=True):
            cand_jar = os.path.join(plat_root, p, "android.jar")
            if os.path.exists(cand_jar):
                platform_jar = cand_jar
                break

    if not aapt2 or not platform_jar:
        print(f"Error: aapt2 ({aapt2}) or android.jar ({platform_jar}) not found!")
        sys.exit(1)
        
    print(f"Found aapt2: {aapt2}")
    print(f"Found android.jar: {platform_jar}")
    
    work_dir = "/tmp/viraasat_apk_build"
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)
    
    # 1. Create Java source
    src_dir = os.path.join(work_dir, "src", "org", "viraasat", "heritage", "app")
    os.makedirs(src_dir, exist_ok=True)
    
    java_file = os.path.join(src_dir, "MainActivity.java")
    with open(java_file, "w") as f:
        f.write('''package org.viraasat.heritage.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String APP_URL = "https://www.virrasat.in/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#FAF7F2"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(false);
        settings.setUserAgentString(settings.getUserAgentString() + " ViraasatAndroidApp/2.4.0");

        // Enable cookies & third-party cookies for Clerk / Supabase auth
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(view, request.getUrl().toString());
            }

            private boolean handleUrl(WebView view, String url) {
                if (url == null) return false;
                // External protocols (UPI, telephone, email, WhatsApp)
                if (url.startsWith("tel:") || url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") || url.startsWith("upi:") ||
                    url.startsWith("intent:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        view.getContext().startActivity(intent);
                    } catch (Exception e) {
                        // ignore if no handler installed
                    }
                    return true;
                }

                // Security: Validate domain to prevent open redirect and session theft
                try {
                    Uri parsedUri = Uri.parse(url);
                    String host = parsedUri.getHost();
                    if (host != null) {
                        host = host.toLowerCase();
                        boolean isTrusted = host.endsWith("virrasat.in") ||
                                           host.endsWith("viraasat.in") ||
                                           host.endsWith("clerk.accounts.dev") ||
                                           host.endsWith("clerk.com") ||
                                           host.endsWith("razorpay.com");
                        if (!isTrusted) {
                            Intent extIntent = new Intent(Intent.ACTION_VIEW, parsedUri);
                            view.getContext().startActivity(extIntent);
                            return true;
                        }
                    }
                } catch (Exception ignored) {}

                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);
        webView.loadUrl(APP_URL);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
''')
    print("1. Java source written.")
    
    # 2. Compile Java to .class
    classes_dir = os.path.join(work_dir, "classes")
    os.makedirs(classes_dir, exist_ok=True)
    subprocess.check_call([
        "javac", "-source", "1.8", "-target", "1.8",
        "-cp", platform_jar,
        "-d", classes_dir,
        java_file
    ])
    print("2. Java classes compiled successfully.")
    
    # 3. Convert .class to classes.dex using d8
    dex_dir = os.path.join(work_dir, "dex")
    os.makedirs(dex_dir, exist_ok=True)
    class_files = []
    for root, _, files in os.walk(classes_dir):
        for file in files:
            if file.endsWith(".class") if hasattr(file, 'endsWith') else file.endswith(".class"):
                class_files.append(os.path.join(root, file))
                
    subprocess.check_call([
        d8, "--release",
        "--min-api", "26",
        "--output", dex_dir,
        *class_files
    ])
    dex_path = os.path.join(dex_dir, "classes.dex")
    print(f"3. Dalvik executable built: {os.path.getsize(dex_path)} bytes.")
    
    # 4. Prepare resources
    res_dir = os.path.join(work_dir, "res")
    for density, size in [("mdpi", "72x72"), ("hdpi", "96x96"), ("xhdpi", "144x144"), ("xxhdpi", "192x192"), ("xxxhdpi", "512x512")]:
        mipmap_dir = os.path.join(res_dir, f"mipmap-{density}")
        os.makedirs(mipmap_dir, exist_ok=True)
        src_icon = f"frontend/public/icons/icon-{size}.png"
        if not os.path.exists(src_icon):
            src_icon = "frontend/public/icons/icon-192x192.png"
        shutil.copyfile(src_icon, os.path.join(mipmap_dir, "ic_launcher.png"))
        
    compiled_res = os.path.join(work_dir, "compiled_res.zip")
    subprocess.check_call([
        aapt2, "compile", "--dir", res_dir, "-o", compiled_res
    ])
    print("4. Android resources compiled with aapt2.")
    
    # 5. Manifest
    manifest_xml = os.path.join(work_dir, "AndroidManifest.xml")
    with open(manifest_xml, "w") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.viraasat.heritage.app"
    android:versionCode="240"
    android:versionName="2.4.0">

    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="Viraasat"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@android:style/Theme.NoTitleBar">
        <activity
            android:name="org.viraasat.heritage.app.MainActivity"
            android:label="Viraasat"
            android:icon="@mipmap/ic_launcher"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')
    
    # 6. Link APK with aapt2
    unaligned_apk = os.path.join(work_dir, "unaligned.apk")
    subprocess.check_call([
        aapt2, "link",
        "-I", platform_jar,
        "--manifest", manifest_xml,
        "-o", unaligned_apk,
        compiled_res
    ])
    print("5. APK linked with aapt2.")
    
    # 7. Add classes.dex into unaligned.apk
    with zipfile.ZipFile(unaligned_apk, 'a') as z:
        z.write(dex_path, "classes.dex")
    print("6. classes.dex embedded into APK.")
    
    # 8. Sign and align using uber-apk-signer
    uber_jar = "scripts/uber-apk-signer.jar"
    keystore_path = "scripts/viraasat.keystore"
    signed_dir = os.path.join(work_dir, "signed")
    os.makedirs(signed_dir, exist_ok=True)
    
    subprocess.check_call([
        "java", "-jar", uber_jar,
        "-a", unaligned_apk,
        "--allowResign",
        "--ks", keystore_path,
        "--ksAlias", "viraasat",
        "--ksPass", "viraasat123",
        "--ksKeyPass", "viraasat123",
        "-o", signed_dir,
        "--verbose"
    ])
    
    final_signed_apk = os.path.join(signed_dir, "unaligned-aligned-signed.apk")
    if not os.path.exists(final_signed_apk):
        raise FileNotFoundError(f"Could not find signed APK at {final_signed_apk}")
        
    print(f"7. Successfully aligned & signed APK: {os.path.getsize(final_signed_apk)} bytes.")
    
    # 9. Copy to target destinations
    targets = [
        "frontend/public/download/viraasat.apk",
        "frontend/public/viraasat.apk"
    ]
    for target in targets:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copyfile(final_signed_apk, target)
        print(f"Published to: {target} ({os.path.getsize(target)} bytes)")
        
    print("=== Native Viraasat APK Build Completed Successfully! ===")

if __name__ == "__main__":
    main()
