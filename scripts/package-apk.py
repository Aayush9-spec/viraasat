"""Compile real Android resources and bytecode; never publish a placeholder APK.

Required: Android SDK API 35 + build-tools 35.0.0, Java and javac (or ECJ_JAR).
Preview: python3 scripts/package-apk.py --preview
Release: supply VIRAASAT_ANDROID_KEYSTORE, VIRAASAT_ANDROID_KEY_ALIAS,
VIRAASAT_ANDROID_STORE_PASSWORD and VIRAASAT_ANDROID_KEY_PASSWORD, then --publish.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ANDROID = ROOT / 'android/app/src/main'
PUBLIC = ROOT / 'frontend/public'
ANDROID_NS = '{http://schemas.android.com/apk/res/android}'
EXPOSED_CERTIFICATE = '9cf5e12ff01abad7acbe612ce31500809187a5912d6b801904ad1bde4602c5b0'


def run(*args, env=None):
    subprocess.run([str(arg) for arg in args], check=True, env=env)


def build(preview=False, publish=False, device=None, prepare_signing=False):
    if prepare_signing and (preview or publish or device):
        raise ValueError('--prepare-signing creates an unsigned handoff; it cannot publish or install it')
    if preview and publish:
        raise ValueError('Preview APKs cannot be published as production releases')
    if publish and not device:
        raise ValueError('Publishing requires --device emulator-PORT to test the exact signed release first')
    sdk = Path(os.environ.get('ANDROID_SDK_ROOT', os.environ.get('ANDROID_HOME', '/missing-android-sdk')))
    tools = Path(os.environ.get('ANDROID_BUILD_TOOLS', str(sdk / 'build-tools/35.0.0')))
    platform = Path(os.environ.get('ANDROID_PLATFORM_JAR', str(sdk / 'platforms/android-35/android.jar')))
    for required in [tools / 'aapt2', tools / 'd8', tools / 'zipalign', tools / 'apksigner', platform]:
        if not required.is_file():
            raise ValueError(f'Missing Android SDK tool: {required}')
    env = dict(os.environ)
    if not preview and not prepare_signing:
        for name in ['VIRAASAT_ANDROID_KEYSTORE', 'VIRAASAT_ANDROID_KEY_ALIAS', 'VIRAASAT_ANDROID_STORE_PASSWORD', 'VIRAASAT_ANDROID_KEY_PASSWORD']:
            if not env.get(name):
                raise ValueError(f'{name} is required for a release; use --preview for local validation')
        if Path(env['VIRAASAT_ANDROID_KEYSTORE']).resolve() == ROOT / 'scripts/viraasat.keystore':
            raise ValueError('The previously committed key cannot be used for a trusted release')
    output = ROOT / 'android/build/outputs'
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='viraasat-android-') as temporary:
        work = Path(temporary)
        resources = work / 'res'
        shutil.copytree(ANDROID / 'res', resources)
        (resources / 'drawable-nodpi').mkdir()
        shutil.copyfile(PUBLIC / 'icons/viraasat-512.png', resources / 'drawable-nodpi/viraasat_logo.png')
        manifest = ET.parse(ANDROID / 'AndroidManifest.xml')
        version = manifest.getroot().get(ANDROID_NS + 'versionName')
        if preview:
            manifest.getroot().set('package', 'org.viraasat.heritage.preview')
            labels = ET.parse(resources / 'values/strings.xml')
            labels.find("string[@name='app_name']").text = 'Viraasat Preview'
            labels.write(resources / 'values/strings.xml', encoding='utf-8', xml_declaration=True)
        ET.register_namespace('android', 'http://schemas.android.com/apk/res/android')
        manifest_path = work / 'AndroidManifest.xml'
        manifest.write(manifest_path, encoding='utf-8', xml_declaration=True)
        run(tools / 'aapt2', 'compile', '--dir', resources, '-o', work / 'resources.zip')
        generated = work / 'generated'; generated.mkdir()
        unsigned = work / 'unsigned.apk'
        run(tools / 'aapt2', 'link', '-o', unsigned, '-I', platform, '--manifest', manifest_path,
            '--java', generated, '--custom-package', 'org.viraasat.heritage.app', work / 'resources.zip')
        classes = work / 'classes'; classes.mkdir()
        sources = [*ANDROID.rglob('*.java'), *generated.rglob('*.java')]
        compiler = ['javac'] if shutil.which('javac') else ['java', '-jar', env.get('ECJ_JAR', '/missing-ecj.jar'), '-proc:none']
        run(*compiler, '-source', '8', '-target', '8', '-bootclasspath', platform, '-d', classes, *sources)
        dex = work / 'dex'; dex.mkdir()
        run(tools / 'd8', '--release', '--min-api', '26', '--lib', platform, '--output', dex, *classes.rglob('*.class'))
        with zipfile.ZipFile(unsigned, 'a', compression=zipfile.ZIP_DEFLATED) as apk:
            apk.write(dex / 'classes.dex', 'classes.dex')
        aligned = work / 'aligned.apk'
        run(tools / 'zipalign', '-p', '-f', '4', unsigned, aligned)
        if prepare_signing:
            target = output / f'viraasat-{version}-unsigned.apk'
            shutil.copyfile(aligned, target)
            run(tools / 'zipalign', '-c', '4', target)
            print(f'Prepared {target} for signing on the owner\'s computer; production download unchanged')
            return target
        if preview:
            env['VIRAASAT_ANDROID_STORE_PASSWORD'] = secrets.token_urlsafe(32)
            env['VIRAASAT_ANDROID_KEY_PASSWORD'] = env['VIRAASAT_ANDROID_STORE_PASSWORD']
            env['VIRAASAT_ANDROID_KEYSTORE'] = str(work / 'preview.p12')
            env['VIRAASAT_ANDROID_KEY_ALIAS'] = 'preview'
            run('keytool', '-genkeypair', '-keystore', env['VIRAASAT_ANDROID_KEYSTORE'], '-alias', 'preview',
                '-storepass:env', 'VIRAASAT_ANDROID_STORE_PASSWORD', '-keypass:env', 'VIRAASAT_ANDROID_KEY_PASSWORD',
                '-keyalg', 'RSA', '-keysize', '2048', '-validity', '30', '-dname', 'CN=Viraasat Local Preview', env=env)
        target = output / (f'viraasat-{version}-preview.apk' if preview else f'viraasat-{version}.apk')
        run(tools / 'apksigner', 'sign', '--ks', env['VIRAASAT_ANDROID_KEYSTORE'], '--ks-key-alias', env['VIRAASAT_ANDROID_KEY_ALIAS'],
            '--ks-pass', 'env:VIRAASAT_ANDROID_STORE_PASSWORD', '--key-pass', 'env:VIRAASAT_ANDROID_KEY_PASSWORD', '--out', target, aligned, env=env)
        run(tools / 'apksigner', 'verify', '--verbose', target)
        certificate = subprocess.check_output([str(tools / 'apksigner'), 'verify', '--print-certs', str(target)], text=True)
        if EXPOSED_CERTIFICATE in certificate.lower():
            raise ValueError('This APK uses the publicly exposed signing certificate; use a private release key')
        run(tools / 'zipalign', '-c', '4', target)
        run(tools / 'aapt2', 'dump', 'badging', target)
        if device:
            report = ROOT / 'android/build/reports' / target.stem / 'runtime.json'
            run(sys.executable, ROOT / 'scripts/test-android-apk.py', target, '--serial', device, '--report', report, env=env)
        metadata = {'available': True, 'version': version, 'bytes': target.stat().st_size,
                    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'url': f'/download/{target.name}',
                    'minAndroid': '8.0', 'website': 'https://virrasat.in/'}
        (output / (target.stem + '.json')).write_text(json.dumps(metadata, indent=2) + '\n')
        if publish:
            (PUBLIC / 'download').mkdir(exist_ok=True)
            shutil.copyfile(target, PUBLIC / 'download' / target.name)
            (ROOT / 'frontend/src/config/android-release.json').write_text(json.dumps(metadata, indent=2) + '\n')
        print(f'Built {target}; production download {"published" if publish else "unchanged"}')
        return target


def publish_signed(candidate, expected_unsigned, device):
    """Accept the owner's signature only when all compiled payload bytes match."""
    if not device:
        raise ValueError('Publishing requires --device emulator-PORT')
    sdk = Path(os.environ.get('ANDROID_SDK_ROOT', os.environ.get('ANDROID_HOME', '/missing-android-sdk')))
    tools = Path(os.environ.get('ANDROID_BUILD_TOOLS', str(sdk / 'build-tools/35.0.0')))
    source_manifest = ET.parse(ANDROID / 'AndroidManifest.xml').getroot()
    package = source_manifest.get('package')
    version = source_manifest.get(ANDROID_NS + 'versionName')
    code = source_manifest.get(ANDROID_NS + 'versionCode')
    badging = subprocess.check_output([str(tools / 'aapt2'), 'dump', 'badging', str(candidate)], text=True)
    identity = re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'", badging)
    if not identity or identity.groups() != (package, code, version):
        raise ValueError('Signed APK does not match the production package and version; preview APKs cannot be published')
    with zipfile.ZipFile(expected_unsigned) as expected, zipfile.ZipFile(candidate) as signed:
        if len(signed.namelist()) != len(set(signed.namelist())) or set(expected.namelist()) != set(signed.namelist()):
            raise ValueError('Signed APK entries differ from the prepared release; use the provided v2/v3 signing command')
        if any(expected.read(name) != signed.read(name) for name in expected.namelist()):
            raise ValueError('Signed APK code or resources differ from the prepared release')
    run(tools / 'apksigner', 'verify', '--verbose', candidate)
    certificate = subprocess.check_output([str(tools / 'apksigner'), 'verify', '--print-certs', str(candidate)], text=True)
    if EXPOSED_CERTIFICATE in certificate.lower():
        raise ValueError('This APK uses the publicly exposed signing certificate')
    run(tools / 'zipalign', '-c', '4', candidate)
    run(sys.executable, ROOT / 'scripts/test-android-apk.py', candidate, '--serial', device,
        '--report', ROOT / 'android/build/reports/signed-release/runtime.json')
    target = PUBLIC / 'download' / f'viraasat-{version}.apk'
    metadata = {'available': True, 'version': version, 'bytes': candidate.stat().st_size,
                'sha256': hashlib.sha256(candidate.read_bytes()).hexdigest(), 'url': f'/download/{target.name}',
                'minAndroid': '8.0', 'website': 'https://virrasat.in/'}
    target.parent.mkdir(exist_ok=True)
    shutil.copyfile(candidate, target)
    (ROOT / 'frontend/src/config/android-release.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'Published tested, owner-signed release: {target}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', action='store_true', help='Use an isolated preview package and temporary test signature')
    parser.add_argument('--publish', action='store_true', help='Publish a signed release and its verified download metadata')
    parser.add_argument('--device', help='Isolated emulator serial for native runtime checks; required to publish')
    parser.add_argument('--prepare-signing', action='store_true', help='Prepare an aligned production APK for signing on the owner\'s computer')
    parser.add_argument('--publish-signed', type=Path, help='Verify and test an APK signed by the owner before publishing')
    parser.add_argument('--expected-unsigned', type=Path, help='Original prepared APK whose payload must match the signed APK')
    args = parser.parse_args()
    try:
        if args.publish_signed:
            if not args.expected_unsigned or args.preview or args.publish or args.prepare_signing:
                raise ValueError('--publish-signed requires --expected-unsigned and cannot be combined with build modes')
            publish_signed(args.publish_signed, args.expected_unsigned, args.device)
        else:
            build(args.preview, args.publish, args.device, args.prepare_signing)
    except (ValueError, OSError, zipfile.BadZipFile, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Android build failed: {error}\n')
