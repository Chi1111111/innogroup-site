"""Install/manage the per-user macOS photo worker without sudo."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys
import venv

LABEL = 'nz.co.innogroup.photo-worker'
ROOT = Path.home() / 'Library/Application Support/INNO Photo Worker'
PLIST = Path.home() / 'Library/LaunchAgents' / (LABEL + '.plist')
FILES = ('cloud_worker.py', 'image_processing.py', 'japancars-template.png', 'requirements.txt')


def make_plist(root):
    return {
        'Label': LABEL,
        'ProgramArguments': ['/usr/bin/caffeinate', '-i', str(root / 'venv/bin/python'),
            str(root / 'cloud_worker.py'), 'work', '--config', str(root / 'connection.json'),
            '--limit', '0', '--max-seconds', '0', '--interval', '1.5', '--daemon'],
        'WorkingDirectory': str(root), 'RunAtLoad': True, 'KeepAlive': True,
        'ThrottleInterval': 30,
        'StandardOutPath': str(root / 'logs/worker.log'),
        'StandardErrorPath': str(root / 'logs/worker.error.log'),
        'EnvironmentVariables': {'PYTHONUNBUFFERED': '1', 'PYTHONDONTWRITEBYTECODE': '1'},
    }


def service(action):
    domain = f'gui/{os.getuid()}'
    if action == 'stop':
        result = subprocess.run(['launchctl', 'bootout', domain, str(PLIST)], capture_output=True)
        if result.returncode and subprocess.run(['launchctl', 'print', domain + '/' + LABEL], capture_output=True).returncode == 0:
            raise RuntimeError('Could not stop the existing worker. Check launchctl before retrying.')
    elif action == 'start':
        if not PLIST.exists():
            raise RuntimeError('Install first.')
        running = subprocess.run(['launchctl', 'print', domain + '/' + LABEL], capture_output=True)
        if running.returncode == 0:
            print('Service is already loaded. No second process started.')
            return
        subprocess.run(['launchctl', 'bootstrap', domain, str(PLIST)], check=True)
    elif action == 'status':
        subprocess.run(['launchctl', 'print', domain + '/' + LABEL], check=True)


def install(config_path):
    if not (3, 10) <= sys.version_info[:2] <= (3, 13):
        raise RuntimeError('Use Python 3.10–3.13; Python 3.12 is recommended for this pinned package.')
    config = json.loads(Path(config_path).expanduser().read_text(encoding='utf-8-sig'))
    if config.get('endpoint') != 'https://prgjtdndhkeceikrthal.supabase.co/functions/v1/japan-photo-review':
        raise RuntimeError('Unexpected endpoint; use the provided private connection file.')
    token = config.get('token', '')
    if len(token) != 64 or any(c not in '0123456789abcdef' for c in token):
        raise RuntimeError('Invalid photo token; do not paste credentials into logs or chat.')
    config = {'endpoint': config['endpoint'], 'token': token, 'enabled': True, 'sourceGroup': 'mac'}
    for name in FILES:
        if not Path(__file__).with_name(name).is_file():
            raise RuntimeError(f'Missing package file: {name}')
    os.umask(0o077)
    service('stop')
    ROOT.mkdir(parents=True, exist_ok=True)
    ROOT.chmod(0o700)
    (ROOT / 'logs').mkdir(exist_ok=True)
    for name in FILES:
        shutil.copy2(Path(__file__).with_name(name), ROOT / name)
    secret = ROOT / 'connection.json'
    secret.write_text(json.dumps(config), encoding='utf-8')
    secret.chmod(0o600)
    if not (ROOT / 'venv/bin/python').exists():
        venv.EnvBuilder(with_pip=True).create(ROOT / 'venv')
    python = str(ROOT / 'venv/bin/python')
    subprocess.run([python, '-m', 'pip', 'install', '--only-binary=:all:', '-r', str(ROOT / 'requirements.txt')], check=True)
    subprocess.run([python, '-c', 'import cv2,numpy; print("Image dependencies OK")'], check=True)
    # Read-only preflight: no job claim and no handover yet.
    subprocess.run([python, '-c',
        'from cloud_worker import Cloud; import sys; c=Cloud(sys.argv[1]); r=c.call("status"); print("Cloud connection OK; processing enabled:", r.get("processingEnabled"))',
        str(secret)], cwd=ROOT, check=True)
    PLIST.parent.mkdir(parents=True, exist_ok=True)
    PLIST.write_bytes(plistlib.dumps(make_plist(ROOT)))
    subprocess.run(['plutil', '-lint', str(PLIST)], check=True)
    service('start')
    print('Installed. Mac claims Japan Cars only; Windows keeps the other sources.')
    print('Admin: https://www.innogroup.co.nz/admin/photos')
    print('Logs:', ROOT / 'logs')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['install', 'start', 'stop', 'status'])
    parser.add_argument('--config')
    args = parser.parse_args()
    if sys.platform != 'darwin':
        parser.error('This installer must run on the target Mac, inside its logged-in user session.')
    if args.action == 'install':
        if not args.config:
            parser.error('--config is required for installation')
        install(args.config)
    else:
        service(args.action)


if __name__ == '__main__':
    main()
