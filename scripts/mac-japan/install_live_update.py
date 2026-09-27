"""Install only collector telemetry. Preserve existing Mac launch/Python fixes and pause."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import time


def digest(path):
    return hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest()


def main():
    if platform.system() != 'Darwin':
        raise RuntimeError('Run this update on the Mac only.')
    root = Path.home() / 'Library/Application Support/INNO Japan Pipeline'
    package = Path(__file__).resolve().parents[2]
    baseline = json.loads((package / 'scripts/mac-japan/live-update-base.json').read_text())
    paths = [*baseline, 'scripts/mac-japan/live-reporter.mjs']
    for name, expected in baseline.items():
        if not (root / name).is_file() or digest(root / name) not in (expected, digest(package / name)):
            raise RuntimeError(f'{name} has other changes. Stop and ask Mac Codex to merge the telemetry update; do not overwrite it.')
    label = f'gui/{os.getuid()}/nz.co.innogroup.japan.collector'
    loaded = subprocess.run(['launchctl', 'print', label], capture_output=True).returncode == 0
    if loaded and not (root / 'collector-paused.json').exists():
        raise RuntimeError('Collector may be running. Wait for it to pause before applying; this update will not interrupt an active collection.')
    backup = root / 'backups' / ('collector-live-' + str(int(time.time())))
    backup.mkdir(parents=True, mode=0o700)
    for name in paths:
        if (root / name).exists():
            target = backup / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(root / name, target)
    if loaded:
        subprocess.run(['launchctl', 'bootout', label], check=True)
    try:
        for name in paths:
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(package / name, target)
    except Exception:
        for name in paths:
            if (backup / name).exists():
                shutil.copy2(backup / name, root / name)
        raise
    finally:
        if loaded:
            subprocess.run(['launchctl', 'bootstrap', f'gui/{os.getuid()}', str(Path.home() / 'Library/LaunchAgents/nz.co.innogroup.japan.collector.plist')], check=True)
    print('Realtime log update installed. Existing pause is preserved. Photos were not restarted.')
    print('Open Admin and wait up to 30 seconds for the Mac heartbeat. Backup:', backup)


if __name__ == '__main__':
    main()
