"""Inspect an explicitly selected APK with the official Android SDK tools."""
import argparse
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('apk', type=Path)
args = parser.parse_args()
sdk = Path(os.environ.get('ANDROID_SDK_ROOT', os.environ.get('ANDROID_HOME', '/missing-android-sdk')))
tools = Path(os.environ.get('ANDROID_BUILD_TOOLS', str(sdk / 'build-tools/35.0.0')))
for command in [
    [tools / 'apksigner', 'verify', '--verbose', args.apk],
    [tools / 'zipalign', '-c', '4', args.apk],
    [tools / 'aapt2', 'dump', 'badging', args.apk],
]:
    subprocess.run([str(arg) for arg in command], check=True)
