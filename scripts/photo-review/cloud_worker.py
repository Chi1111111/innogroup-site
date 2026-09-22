"""Local in-memory photo processor with private cloud upload; no photo files written."""
import argparse
import base64
import http.client
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
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import threading
from datetime import datetime, timezone

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


class WorkerTrace:
    def __init__(self):
        self.lock = threading.Lock()
        self.active = {}
        self.last_error = None

    def stage(self, job, stage):
        with self.lock:
            self.active[job['id']] = {'id': job['id'], 'vehicle': job.get('vehicle',''),
                'host': urlsplit(job['url']).hostname, 'stage': stage,
                'since': datetime.now(timezone.utc).isoformat()}

    def error(self, stage, error, job=None, secret=''):
        message = str(error)
        if secret:
            message = message.replace(secret, '[redacted]')
        if isinstance(error, HTTPError) and stage == 'download':
            message = f'SOURCE_HTTP_{error.code}: {urlsplit(job["url"]).hostname if job else "source"}'
        message = message[:500]
        detail = {'stage': stage, 'message': message, 'occurredAt': datetime.now(timezone.utc).isoformat(),
                  'httpStatus': error.code if isinstance(error, HTTPError) else None}
        if job:
            detail.update({'jobId': job['id'], 'host': urlsplit(job['url']).hostname})
        with self.lock:
            self.last_error = detail
        return detail

    def done(self, job):
        with self.lock:
            self.active.pop(job['id'], None)

    def snapshot(self):
        with self.lock:
            return {'version': 'worker-details-1', 'active': list(self.active.values())[:3], 'lastError': self.last_error}


class Cloud:
    def __init__(self, config_path):
        self.config = json.loads(Path(config_path).read_text(encoding='utf8'))
        self.connections = threading.local()
        self.trace = WorkerTrace()
        p = urlsplit(self.config['endpoint'])
        if p.scheme != 'https' or not p.hostname.endswith('.supabase.co') or p.path != '/functions/v1/japan-photo-review':
            raise ValueError('Unexpected photo endpoint')

    def call(self, action, **payload):
        # HTTPSConnection reuses TLS/TCP connections. Each worker owns its own
        # connection so concurrent uploads never share request/response state.
        if action == 'claim':
            payload['sourceGroup'] = self.config.get('sourceGroup', 'windows')
            if hasattr(self, 'trace') and time.monotonic() >= getattr(self, '_next_report', 0):
                payload['runtime'] = self.trace.snapshot()
                self._next_report = time.monotonic() + 15
        if action == 'pause-source':
            payload['sourceGroup'] = self.config.get('sourceGroup', 'windows')
            if hasattr(self, 'trace'):
                payload['diagnostic'] = self.trace.snapshot().get('lastError')
        endpoint = urlsplit(self.config['endpoint'])
        connection = getattr(self.connections, 'connection', None)
        if connection is None:
            connection = http.client.HTTPSConnection(endpoint.hostname, timeout=90)
            self.connections.connection = connection
        try:
            connection.request('POST', endpoint.path, body=json.dumps({'action': action, **payload}).encode(), headers={
                'Content-Type': 'application/json', 'X-Photo-Token': self.config['token']})
            response = connection.getresponse()
            raw = response.read()
            try:
                result = json.loads(raw)
            except (ValueError, UnicodeError):
                raise RuntimeError(f'Cloud HTTP {response.status}: invalid response') from None
            if response.status >= 400:
                raise RuntimeError(result.get('error', f'Cloud HTTP {response.status}') if isinstance(result, dict) else f'Cloud HTTP {response.status}')
            return result
        except Exception as error:
            if hasattr(self, 'trace'):
                self.trace.error('cloud_'+action,error,secret=self.config.get('token',''))
            connection.close()
            self.connections.connection = None
            # Do not blindly replay mutations after an uncertain network result.
            raise


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


def process(cloud, job, source=None):
    import cv2
    import numpy as np
    identity = {'id': job['id'], 'lease': job['lease']}
    stage = 'download'
    trace = getattr(cloud, 'trace', None)
    def mark(value):
        nonlocal stage
        stage = value
        if trace: trace.stage(job, value)
    try:
        mark('download')
        data = source.fetch(job['url']) if source else download(job['url'])
        mark('decode')
        im = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if im is None or im.shape[0]*im.shape[1] > 40_000_000:
            raise ValueError('Invalid or oversized photo')
        mime = 'image/jpeg' if data[:2] == b'\xff\xd8' else 'image/png' if data[:4] == b'\x89PNG' else 'image/webp'
        mark('detect')
        detection = detect(im)
        output = im
        if detection['detected']:
            mark('upload_original')
            cloud.call('original', **identity, data=base64.b64encode(data).decode(), mime=mime)
            mark('repair')
            output, mask = repair(im, detection)
            detection['outsideMaskUnchangedBeforeEncoding'] = True
        else:
            detection['note'] = 'No confirmed known watermark; eligible for automatic approval under owner policy.'
        mark('encode')
        ok, encoded = cv2.imencode('.webp', output, [cv2.IMWRITE_WEBP_QUALITY, 85])
        if not ok:
            raise ValueError('WebP encoding failed')
        check = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if check is None or check.shape != im.shape:
            raise ValueError('WebP dimensions failed validation')
        detection.update({'format': 'webp', 'quality': 85, 'lossyCompression': True,
                          'width': im.shape[1], 'height': im.shape[0],
                          'originalBytes': len(data), 'candidateBytes': len(encoded)})
        mark('upload_verify')
        return cloud.call('complete', **identity, data=base64.b64encode(encoded.tobytes()).decode(), mime='image/webp', detection=detection)
    except Exception as error:
        message = f'SOURCE_HTTP_{error.code}: {urlsplit(job["url"]).hostname}' if isinstance(error, HTTPError) else str(error)
        diagnostic = trace.error(stage,error,job,secret=getattr(cloud,'config',{}).get('token','')) if trace else {'stage':stage}
        cloud.call('fail', **identity, error=message[:500], diagnostic=diagnostic)
        return {'status': 'failed', 'error': message}
    finally:
        if trace: trace.done(job)


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


class SourceGate:
    """One source download at a time; cloud uploads may overlap it."""
    def __init__(self, interval):
        self.interval = interval
        self.lock = threading.Lock()
        self.last_start = None
        self.stopped = threading.Event()

    def fetch(self, url):
        with self.lock:
            if self.stopped.is_set():
                raise RuntimeError('SOURCE_PAUSED')
            if self.last_start is not None:
                time.sleep(max(0, self.interval - (time.monotonic() - self.last_start)))
            if self.stopped.is_set():
                raise RuntimeError('SOURCE_PAUSED')
            self.last_start = time.monotonic()
            try:
                return download(url)
            except HTTPError as error:
                if error.code in (401, 403, 429):
                    self.stopped.set()
                raise


def work(cloud, limit, max_seconds=2400, interval=1.5, daemon=False):
    import cv2
    if interval < 1.5:
        raise ValueError('Source interval must be at least 1.5 seconds')
    source = SourceGate(interval)
    started = time.monotonic()
    deadline = started + max_seconds if max_seconds else float('inf')
    count = submitted = 0
    pending = set()
    drained = False
    pause_pending = False
    paused = False
    with ThreadPoolExecutor(max_workers=3) as pool:
        while pending or source.stopped.is_set() or pause_pending or (not drained and time.monotonic() < deadline and (limit == 0 or submitted < limit)):
            if source.stopped.is_set() and not paused:
                pause_pending = True
            if pause_pending:
                try:
                    cloud.call('pause-source')
                    pause_pending = False
                    paused = True
                    print(json.dumps({'paused': True, 'reason': 'Source denied or rate-limited download.'}), flush=True)
                except Exception as error:
                    print(json.dumps({'pausePending': True, 'error': str(error)}), flush=True)
                    time.sleep(5)
            if paused and not pending:
                if not daemon:
                    break
                source = SourceGate(interval)
                paused = False
                time.sleep(15)
            can_claim = not pause_pending and not source.stopped.is_set() and not drained and len(pending) < 3 and time.monotonic() < deadline and (limit == 0 or submitted < limit)
            if can_claim:
                try:
                    result = cloud.call('claim')
                    if result.get('job'):
                        pending.add(pool.submit(process, cloud, result['job'], source))
                        submitted += 1
                        continue
                    if not daemon:
                        drained = True
                    elif not pending:
                        time.sleep(15)
                except Exception as error:
                    print(json.dumps({'waiting': 'cloud connection', 'error': str(error)}), flush=True)
                    if not daemon:
                        raise
                    time.sleep(5)
            if not pending:
                continue
            done, pending = wait(pending, timeout=1, return_when=FIRST_COMPLETED)
            for future in done:
                count += 1
                try:
                    outcome = future.result()
                except Exception as error:
                    outcome = {'status': 'lease_retry', 'error': str(error)}
                print(json.dumps({'processed': count, 'elapsedSeconds': round(time.monotonic()-started, 2), **outcome}), flush=True)
                if str(outcome.get('error', '')).startswith(('SOURCE_HTTP_403:', 'SOURCE_HTTP_401:', 'SOURCE_HTTP_429:')):
                    source.stopped.set()
                if outcome.get('error') == 'PHOTO_CAPACITY_LIMIT' and not daemon:
                    drained = True
                if count % 100 == 0:
                    try:
                        print(json.dumps(cloud.call('cleanup-approved')), flush=True)
                    except Exception as error:
                        print(json.dumps({'cleanupDeferred': True, 'error': str(error)}), flush=True)


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
    parser.add_argument('--interval', type=float, default=1.5)
    parser.add_argument('--daemon', action='store_true')
    parser.add_argument('--port', type=int, default=17832)
    args = parser.parse_args()
    if args.limit < 0 or args.max_seconds < 0 or args.interval < 1.5:
        parser.error('limit and max-seconds must be nonnegative; interval must be at least 1.5')
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
