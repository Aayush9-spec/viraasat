"""Install and exercise the APK on an isolated Android emulator.

This changes the emulator's browser availability temporarily. Physical devices
are deliberately rejected. It verifies the native launcher, not live checkout.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    parser.add_argument('--serial', required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if not args.serial.startswith('emulator-'):
        parser.error('Use an isolated emulator; this test temporarily disables its browser.')
    sdk = Path(os.environ.get('ANDROID_SDK_ROOT', '/missing-android-sdk'))
    adb = Path(os.environ.get('ADB', str(sdk / 'platform-tools/adb')))
    build_tools = Path(os.environ.get('ANDROID_BUILD_TOOLS', str(sdk / 'build-tools/35.0.0')))
    args.report.parent.mkdir(parents=True, exist_ok=True)
    result = {'apk': args.apk.name, 'sha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(),
              'serial': args.serial, 'passed': False, 'checks': [], 'liveWebsiteVerified': False}

    def run(*command, timeout=90):
        try:
            return subprocess.check_output([str(x) for x in command], timeout=timeout, stderr=subprocess.STDOUT).decode()
        except subprocess.CalledProcessError as error:
            raise RuntimeError(f'{error.cmd[0]} failed: {error.output.decode()}') from error

    def device(*command, timeout=90):
        return run(adb, '-s', args.serial, *command, timeout=timeout)

    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        result['checks'].append(name)
        print('PASS: ' + name, flush=True)

    def hierarchy(name):
        for _ in range(3):
            device('shell', 'uiautomator', 'dump', '/sdcard/viraasat-test.xml')
            text = device('shell', 'cat', '/sdcard/viraasat-test.xml')
            tree = ET.fromstring(text)
            if not any(n.get('text') == "System UI isn't responding" for n in tree.iter('node')):
                break
            waits = [n for n in tree.iter('node') if n.get('text') == 'Wait']
            if not waits:
                break
            result['systemUiInterruptions'] = result.get('systemUiInterruptions', 0) + 1
            bounds = [int(v) for v in re.findall(r'\d+', waits[0].get('bounds'))]
            device('shell', 'input', 'tap', str((bounds[0] + bounds[2]) // 2), str((bounds[1] + bounds[3]) // 2))
            time.sleep(1)
        (args.report.parent / (name + '.xml')).write_text(text)
        screenshot = subprocess.check_output([str(adb), '-s', args.serial, 'exec-out', 'screencap', '-p'], timeout=60)
        (args.report.parent / (name + '.png')).write_bytes(screenshot)
        return ET.fromstring(text)

    browser = 'com.android.chrome'
    disabled = False
    other_browsers = []
    try:
        deadline = time.monotonic() + 600
        while device('shell', 'getprop', 'sys.boot_completed', timeout=20).strip() != '1':
            if time.monotonic() > deadline:
                raise RuntimeError('Emulator did not finish booting within the test timeout')
            time.sleep(5)
        result['androidVersion'] = device('shell', 'getprop', 'ro.build.version.release').strip()
        result['apiLevel'] = device('shell', 'getprop', 'ro.build.version.sdk').strip()
        badging = run(build_tools / 'aapt2', 'dump', 'badging', args.apk)
        package = re.search(r"package: name='([^']+)'", badging).group(1)
        activity = re.search(r"launchable-activity: name='([^']+)'", badging).group(1)
        result['package'] = package
        check('APK installs successfully', 'Success' in device('install', '-r', '--no-streaming', args.apk, timeout=300))
        check('Chrome is available for browser handoff', browser in device('shell', 'pm', 'list', 'packages', '-e', browser))
        handlers = device('shell', 'cmd', 'package', 'query-activities', '--brief', '-a', 'android.intent.action.VIEW',
                          '-c', 'android.intent.category.BROWSABLE', '-d', 'https://virrasat.in/')
        for candidate in sorted(set(re.findall(r'^\s*([\w.]+)/\S+$', handlers, re.MULTILINE))):
            if candidate != browser:
                device('shell', 'pm', 'disable-user', '--user', '0', candidate)
                other_browsers.append(candidate)
        result['browserFixture'] = {'browser': browser, 'temporarilyDisabledAlternatives': other_browsers}
        device('shell', 'input', 'keyevent', '82')
        started_at = int(device('shell', 'date', '+%s').strip())
        result['startedAtDeviceEpoch'] = started_at

        def app_crashed():
            logs = device('logcat', '-d', '-v', 'epoch', '-s', 'AndroidRuntime:E', 'ActivityManager:E', 'ActivityTaskManager:E')
            (args.report.parent / 'runtime-log.txt').write_text(logs)
            return any((f'Process: {package}' in line or f'ANR in {package}' in line) and float(line.split()[0]) >= started_at
                       for line in logs.splitlines() if re.match(r'^\s*\d+\.\d+\s', line))

        def browser_handoff(activities):
            # A browser's first-run activity can remove the original URL from
            # the task stack; Android's START record still records its handoff.
            events = device('logcat', '-d', '-v', 'epoch', '-s', 'ActivityManager:I', 'ActivityTaskManager:I')
            (args.report.parent / 'browser-intents.txt').write_text(events)
            recent = '\n'.join(line for line in events.splitlines()
                               if re.match(r'^\s*\d+\.\d+\s', line) and float(line.split()[0]) >= started_at)
            return browser in activities and ('https://virrasat.in/' in activities or 'dat=https://virrasat.in/' in recent)
        device('shell', 'am', 'force-stop', package)
        # This launcher immediately opens a different Activity. Waiting for the
        # initial Activity to draw (-W) can time out despite a successful handoff.
        launched = device('shell', 'am', 'start', '-n', f'{package}/{activity}')
        check('Android starts the launcher activity', 'Starting: Intent' in launched and 'Error:' not in launched)
        handed_off = False
        for _ in range(12):
            activities = device('shell', 'dumpsys', 'activity', 'activities')
            if browser_handoff(activities):
                handed_off = True
                break
            time.sleep(2)
        (args.report.parent / 'browser-handoff.txt').write_text(activities)
        check('Launcher hands the correct HTTPS URL to the browser', handed_off)
        check('Launch produces no app runtime crash', not app_crashed())

        # Temporarily disable the test emulator browser to exercise recovery.
        device('shell', 'am', 'force-stop', browser)
        device('shell', 'pm', 'disable-user', '--user', '0', browser)
        disabled = True
        device('shell', 'am', 'force-stop', package)
        device('shell', 'am', 'start', '-W', '-n', f'{package}/{activity}')
        tree = hierarchy('browser-unavailable')
        check('Missing browser shows an actionable recovery dialog', any(n.get('text') == 'A browser is required' for n in tree.iter('node')))
        device('shell', 'input', 'keyevent', '4')
        tree = hierarchy('native-welcome')
        check('Welcome screen exposes the Viraasat logo', any(n.get('content-desc') == 'Viraasat logo' for n in tree.iter('node')))
        buttons = [n for n in tree.iter('node') if n.get('text', '').lower() == 'open viraasat']
        check('Welcome screen offers the Open Viraasat button', len(buttons) == 1)
        device('shell', 'pm', 'enable', '--user', '0', browser)
        disabled = False
        bounds = [int(v) for v in re.findall(r'\d+', buttons[0].get('bounds'))]
        started_at = int(device('shell', 'date', '+%s').strip())
        device('shell', 'input', 'tap', str((bounds[0] + bounds[2]) // 2), str((bounds[1] + bounds[3]) // 2))
        recovered = False
        for _ in range(12):
            activities = device('shell', 'dumpsys', 'activity', 'activities')
            if browser_handoff(activities):
                recovered = True
                break
            time.sleep(2)
        (args.report.parent / 'recovery-handoff.txt').write_text(activities)
        check('Open button recovers after the browser is re-enabled', recovered)
        check('Recovery produces no app runtime crash', not app_crashed())
        result['passed'] = True
    except Exception as error:
        result['error'] = str(error)
        raise
    finally:
        if disabled:
            device('shell', 'pm', 'enable', '--user', '0', browser)
        for candidate in other_browsers:
            device('shell', 'pm', 'enable', '--user', '0', candidate)
        args.report.write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    main()
