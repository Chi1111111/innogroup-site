"""Local in-memory photo processor with private cloud upload; no photo files written."""
import argparse
import base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import sys
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen, HTTPRedirectHandler, build_opener
from image_processing import detect, repair
from contextlib import contextmanager

HOSTS = {'vimg.gabs.biz', 'www.919919.jp', 'www.japancars.co.jp', 'site.gabs.biz', 'bidimg.gabs.biz'}


def safe_url(url):
    p = urlsplit(url)
    if p.scheme != 'https' or p.hostname not in HOSTS or p.username or p.password or p.port not in (None, 443):
        raise ValueError('Unsupported image URL')
    return url


class CheckedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, safe_url(newurl))


def download(url):
    with build_opener(CheckedRedirect()).open(Request(safe_url(url), headers={'User-Agent': 'InnoGroup-PhotoReview/1.0'}), timeout=30) as response:
        if not response.headers.get('Content-Type', '').startswith('image/'):
            raise ValueError('Source returned non-image content')
        data = response.read(10_000_001)
        if len(data) > 10_000_000:
            raise ValueError('Photo exceeds 10 MB')
        return data


class Cloud:
    def __init__(self, config_path):
        self.config = json.loads(Path(config_path).read_text(encoding='utf8'))
        p = urlsplit(self.config['endpoint'])
        if p.scheme != 'https' or not p.hostname.endswith('.supabase.co') or p.path != '/functions/v1/japan-photo-review':
            raise ValueError('Unexpected photo endpoint')

    def call(self, action, **payload):
        req = Request(self.config['endpoint'], data=json.dumps({'action': action, **payload}).encode(), headers={
            'Content-Type': 'application/json', 'X-Photo-Token': self.config['token']})
        try:
            with urlopen(req, timeout=90) as response:
                return json.load(response)
        except HTTPError as error:
            try:
                message = json.load(error).get('error', f'Cloud HTTP {error.code}')
            except (ValueError, AttributeError):
                message = f'Cloud HTTP {error.code}'
            raise RuntimeError(message) from None


def enqueue(cloud, vehicles):
    photos = {}
    for v in vehicles:
        for url in [v.get('imageUrl'), *(v.get('imageUrls') or [])]:
            if not url:
                continue
            try:
                safe_url(url)
            except (ValueError, TypeError):
                continue
            photos[url] = {'url': url, 'vehicle': f"{v.get('id','')} · {v.get('year','')} {v.get('make','')} {v.get('model','')}"}
    values = list(photos.values())
    for offset in range(0, len(values), 500):
        cloud.call('enqueue', photos=values[offset:offset+500])
    return {'submitted': len(values)}


def process(cloud, job):
    import cv2
    import numpy as np
    identity = {'id': job['id'], 'lease': job['lease']}
    try:
        data = download(job['url'])
        im = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if im is None or im.shape[0]*im.shape[1] > 40_000_000:
            raise ValueError('Invalid or oversized photo')
        mime = 'image/jpeg' if data[:2] == b'\xff\xd8' else 'image/png' if data[:4] == b'\x89PNG' else 'image/webp'
        cloud.call('original', **identity, data=base64.b64encode(data).decode(), mime=mime)
        detection = detect(im)
        output = im
        if detection['detected']:
            output, mask = repair(im, detection)
            detection['outsideMaskUnchangedBeforeEncoding'] = True
        else:
            detection['note'] = 'No confident match; compressed only. Check for other watermarks.'
        ok, encoded = cv2.imencode('.webp', output, [cv2.IMWRITE_WEBP_QUALITY, 85])
        if not ok:
            raise ValueError('WebP encoding failed')
        check = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if check is None or check.shape != im.shape:
            raise ValueError('WebP dimensions failed validation')
        detection.update({'format': 'webp', 'quality': 85, 'lossyCompression': True,
                          'width': im.shape[1], 'height': im.shape[0],
                          'originalBytes': len(data), 'candidateBytes': len(encoded)})
        cloud.call('candidate', **identity, data=base64.b64encode(encoded.tobytes()).decode(), mime='image/webp')
        return cloud.call('finish', **identity, detection=detection)
    except Exception as error:
        message = f'SOURCE_HTTP_{error.code}: {urlsplit(job["url"]).hostname}' if isinstance(error, HTTPError) else str(error)
        cloud.call('fail', **identity, error=message[:500])
        return {'status': 'failed', 'error': message}


@contextmanager
def single_worker(config_path):
    """OS lock released even after a crash; prevents double-click duplicate workers."""
    lock_path = Path(config_path).resolve().with_suffix('.worker.lock')
    with open(lock_path, 'a+b') as handle:
        if handle.tell() == 0:
            handle.write(b'0')
            handle.flush()
        handle.seek(0)
        try:
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except (OSError, BlockingIOError):
            raise RuntimeError('A local photo worker is already running.') from None
        try:
            yield
        finally:
            handle.seek(0)
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def work(cloud, limit, max_seconds=2400, interval=2, daemon=False):
    import cv2  # Ensure dependencies exist before claiming any cloud jobs.
    if interval < 2:
        raise ValueError('Source interval must be at least 2 seconds')
    count = 0
    deadline = time.monotonic() + max_seconds if max_seconds else float('inf')
    while time.monotonic() < deadline and (limit == 0 or count < limit):
        try:
            result = cloud.call('claim')
        except Exception as error:
            print(json.dumps({'waiting': 'cloud connection', 'error': str(error)}), flush=True)
            if not daemon:
                raise
            time.sleep(30)
            continue
        if not result['job']:
            if daemon:
                time.sleep(15)
                continue
            print(json.dumps({'processed': count, 'capacityReached': result.get('capacityReached', False)}), flush=True)
            break
        outcome = process(cloud, result['job'])
        count += 1
        print(json.dumps({'processed': count, **outcome}), flush=True)
        if str(outcome.get('error', '')).startswith(('SOURCE_HTTP_403:', 'SOURCE_HTTP_401:', 'SOURCE_HTTP_429:')):
            cloud.call('pause-source')
            print(json.dumps({'paused': True, 'reason': 'Source denied or rate-limited download; resume manually from Admin.'}), flush=True)
            if not daemon:
                break
        if outcome.get('error') == 'PHOTO_CAPACITY_LIMIT' and not daemon:
            break
        if count % 100 == 0:
            print(json.dumps(cloud.call('cleanup-approved')), flush=True)
        # Wait AFTER completion too: download starts are always >= 2 seconds apart.
        time.sleep(interval)


def review(cloud, port):
    token = secrets.token_hex(24)
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send(self, code, data, mime='application/json'):
            self.send_response(code)
            self.send_header('Content-Type', mime)
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'nonce-" + token + "'; style-src 'unsafe-inline'; img-src 'self' https://*.supabase.co; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(data if isinstance(data, bytes) else json.dumps(data).encode())

        def do_GET(self):
            if self.headers.get('Host') != f'127.0.0.1:{port}':
                return self.send(403, {'error': 'Local access only'})
            if self.path != '/':
                return self.send(404, {'error': 'Not found'})
            html = Path(__file__).with_name('review.html').read_text(encoding='utf8').replace('__TOKEN__', token)
            self.send(200, html.encode(), 'text/html; charset=utf-8')

        def do_POST(self):
            if self.headers.get('Host') != f'127.0.0.1:{port}' or self.headers.get('Origin') != f'http://127.0.0.1:{port}' or self.headers.get('X-Review-Token') != token:
                return self.send(403, {'error': 'Invalid review request'})
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if size < 1 or size > 16384:
                    raise ValueError('Invalid request size')
                body = json.loads(self.rfile.read(size))
                if self.path == '/api/list':
                    return self.send(200, cloud.call('list', offset=body.get('offset', 0), status=body.get('status', ''), pageSize=body.get('pageSize', 50)))
                if self.path == '/api/review-batch':
                    return self.send(200, cloud.call('decide-batch', ids=body['ids'], decision=body['decision']))
                if self.path == '/api/review':
                    return self.send(200, cloud.call('decide', id=body['id'], decision=body['decision']))
                return self.send(404, {'error': 'Not found'})
            except Exception as error:
                return self.send(400, {'error': str(error)})
    print(f'Review: http://127.0.0.1:{port} (images and records stored privately in Supabase)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['init', 'enqueue', 'work', 'status', 'review', 'retry', 'snapshot', 'verify-existing', 'cleanup-approved'])
    parser.add_argument('--config', default=os.environ.get('JAPAN_MARKET_PHOTO_CONFIG', str(Path(__file__).resolve().parents[3] / 'private-config/japan-photo-review.json')))
    parser.add_argument('--input')
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--max-seconds', type=int, default=2400)
    parser.add_argument('--interval', type=float, default=2)
    parser.add_argument('--daemon', action='store_true')
    parser.add_argument('--port', type=int, default=17832)
    args = parser.parse_args()
    if args.limit < 0 or args.max_seconds < 0 or args.interval < 2:
        parser.error('limit and max-seconds must be nonnegative; interval must be at least 2')
    cloud = Cloud(args.config)
    if args.command == 'snapshot':
        root = Path(args.input or 'public/data/japan-market/details')
        total = 0
        for shard in sorted(root.glob('*.json')):
            vehicles = json.loads(shard.read_text(encoding='utf8'))['vehicles']
            for offset in range(0, len(vehicles), 20):
                cloud.call('register-vehicles', vehicles=vehicles[offset:offset+20])
            enqueue(cloud, vehicles)
            total += len(vehicles)
            print(json.dumps({'registeredVehicles': total}), flush=True)
    elif args.command == 'enqueue':
        payload = json.loads(Path(args.input).read_text(encoding='utf8') if args.input else sys.stdin.read())
        vehicles = payload if isinstance(payload, list) else payload['vehicles']
        for offset in range(0, len(vehicles), 20):
            cloud.call('register-vehicles', vehicles=vehicles[offset:offset+20])
        print(json.dumps(enqueue(cloud, vehicles)))
    elif args.command == 'work':
        with single_worker(args.config):
            work(cloud, args.limit, args.max_seconds, args.interval, args.daemon)
    elif args.command == 'review':
        review(cloud, args.port)
    else:
        result = cloud.call('list' if args.command == 'status' else args.command)
        if args.command == 'status':
            result.pop('items', None)
        print(json.dumps(result))


if __name__ == '__main__':
    main()
