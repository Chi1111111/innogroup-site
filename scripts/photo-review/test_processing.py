import unittest
import tempfile
import threading
from urllib.error import HTTPError
import numpy as np
import cv2
from pathlib import Path
from image_processing import detect, repair, classify
from cloud_worker import safe_url, enqueue, process, work, single_worker, SourceGate, Cloud, WorkerTrace
from unittest.mock import patch


class ProcessingTests(unittest.TestCase):
    def test_verified_image_redirect_host_only(self):
        url = 'https://tmpimg.gabs.biz/aucnet/photo.jpg'
        self.assertEqual(safe_url(url, redirect=True), url)
        with self.assertRaises(ValueError):
            safe_url(url)
        for url in ['http://tmpimg.gabs.biz/a.jpg', 'https://tmpimg.gabs.biz.evil.test/a.jpg', 'https://127.0.0.1/a.jpg', 'https://user@tmpimg.gabs.biz/a.jpg']:
            with self.assertRaises(ValueError):
                safe_url(url, redirect=True)

    def test_detection_and_lossless_outside_mask(self):
        rng = np.random.default_rng(5)
        original = rng.integers(30, 200, (480, 640, 3), dtype=np.uint8)
        logo = cv2.imread(str(Path(__file__).with_name('japancars-template.png')))
        original[443:471, 499:627] = logo
        detection = detect(original)
        self.assertTrue(detection['detected'])
        result, mask = repair(original, detection)
        saved = cv2.imdecode(cv2.imencode('.png', result)[1], cv2.IMREAD_COLOR)
        self.assertEqual(saved.shape, original.shape)
        self.assertTrue(np.array_equal(original[mask == 0], saved[mask == 0]))

    def test_classification_is_conservative(self):
        self.assertEqual(classify(.39,640,480), 'no_known_watermark')
        self.assertEqual(classify(.40,640,480), 'uncertain')
        self.assertEqual(classify(.88,640,480), 'watermark')
        self.assertEqual(classify(.1,200,200), 'uncertain')

    def test_no_watermark_does_not_match(self):
        plain = np.full((480, 640, 3), 110, dtype=np.uint8)
        self.assertFalse(detect(plain)['detected'])

    def test_worker_compresses_without_model_calls(self):
        image = np.full((480, 640, 3), 110, dtype=np.uint8)
        source = cv2.imencode('.jpg', image)[1].tobytes()
        class Cloud:
            def __init__(self): self.calls = []
            def call(self, action, **data):
                self.calls.append((action, data))
                return {'status': 'needs_inspection'}
        cloud = Cloud()
        with patch('cloud_worker.download', return_value=source), patch('builtins.open', side_effect=AssertionError('Photo processing must not write files')), patch.object(Path, 'write_bytes', side_effect=AssertionError('Photo processing must not write files')):
            process(cloud, {'id': 'test', 'lease': 'lease', 'url': 'https://vimg.gabs.biz/a.jpg'})
        self.assertEqual([c[0] for c in cloud.calls], ['complete'])
        self.assertEqual(cloud.calls[0][1]['mime'], 'image/webp')
        self.assertFalse(cloud.calls[0][1]['detection']['detected'])
        self.assertTrue(cloud.calls[0][1]['detection']['lossyCompression'])

    def test_rate_limit_waits_one_point_five_seconds_between_photos(self):
        gate = SourceGate(1.5)
        with patch('cloud_worker.download', return_value=b'photo'), patch('cloud_worker.time.monotonic', side_effect=[0, .5, 1.5]), patch('cloud_worker.time.sleep') as sleep:
            gate.fetch('https://vimg.gabs.biz/a.jpg')
            gate.fetch('https://vimg.gabs.biz/b.jpg')
        sleep.assert_called_once_with(1.0)

    def test_source_429_blocks_other_downloads_and_pauses(self):
        class Cloud:
            def __init__(self): self.actions = []
            def call(self, action, **data):
                self.actions.append(action)
                return {'job': {'id':'a','lease':'l','url':'https://vimg.gabs.biz/a.jpg'}}
        cloud = Cloud()
        with patch('cloud_worker.download', side_effect=HTTPError('https://vimg.gabs.biz/a.jpg',429,'Rate limit',{},None)) as download:
            work(cloud, 2)
        self.assertEqual(download.call_count, 1)
        self.assertIn('pause-source', cloud.actions)

    def test_three_stage_overlap_is_bounded(self):
        started = threading.Barrier(3)
        class Cloud:
            def call(self, action, **data): return {'job': {'id': 'test'}}
        def fake_process(*args):
            started.wait(timeout=2)
            return {'status':'approved'}
        with patch('cloud_worker.process', side_effect=fake_process) as process_mock:
            work(Cloud(), 3)
        self.assertEqual(process_mock.call_count, 3)

    def test_watermarked_photo_keeps_original(self):
        image=np.full((480,640,3),110,dtype=np.uint8)
        source=cv2.imencode('.jpg',image)[1].tobytes()
        class Cloud:
            def __init__(self): self.actions=[]
            def call(self,action,**data): self.actions.append(action); return {'status':'pending_review'}
        cloud=Cloud()
        with patch('cloud_worker.download',return_value=source), patch('cloud_worker.detect',return_value={'detected':True,'box':[500,440,630,470]}):
            process(cloud,{'id':'a','lease':'l','url':'https://vimg.gabs.biz/a.jpg'})
        self.assertEqual(cloud.actions,['original','complete'])

    def test_cloud_reuses_connection_and_discards_on_failure(self):
        cloud=Cloud.__new__(Cloud)
        cloud.config={'endpoint':'https://example.supabase.co/functions/v1/japan-photo-review','token':'test'}
        cloud.connections=threading.local()
        with patch('cloud_worker.http.client.HTTPSConnection') as factory:
            connection=factory.return_value
            response=connection.getresponse.return_value
            response.status=200
            response.read.return_value=b'{"ok":true}'
            cloud.call('status'); cloud.call('status')
            self.assertEqual(factory.call_count,1)
            connection.request.side_effect=ConnectionResetError('reset')
            with self.assertRaises(ConnectionResetError): cloud.call('claim')
            connection.close.assert_called_once()
            self.assertIsNone(cloud.connections.connection)
            self.assertEqual(connection.request.call_count,3)

    def test_mac_claim_includes_source_group(self):
        import json
        cloud=Cloud.__new__(Cloud)
        cloud.config={'endpoint':'https://example.supabase.co/functions/v1/japan-photo-review','token':'test','sourceGroup':'mac'}
        cloud.connections=threading.local()
        with patch('cloud_worker.http.client.HTTPSConnection') as factory:
            response=factory.return_value.getresponse.return_value
            response.status=200
            response.read.return_value=b'{"job":null}'
            cloud.call('claim')
            payload=json.loads(factory.return_value.request.call_args.kwargs['body'])
            self.assertEqual(payload['sourceGroup'],'mac')

    def test_mac_launch_agent_paths_and_limits(self):
        import plistlib
        from mac_setup import make_plist
        root=Path('/Users/example/Library/Application Support/INNO Photo Worker')
        config=plistlib.loads(plistlib.dumps(make_plist(root)))
        args=config['ProgramArguments']
        self.assertEqual(args[0],'/usr/bin/caffeinate')
        self.assertEqual(args[args.index('--interval')+1],'1.5')
        self.assertEqual(args[args.index('--config')+1],str(root/'connection.json'))
        self.assertTrue(config['RunAtLoad'])

    def test_worker_trace_tracks_stage_and_redacts_secret(self):
        trace=WorkerTrace()
        job={'id':'a','vehicle':'Toyota','url':'https://www.japancars.co.jp/a.jpg'}
        trace.stage(job,'upload_verify')
        self.assertEqual(trace.snapshot()['active'][0]['stage'],'upload_verify')
        trace.error('upload_verify',RuntimeError('secret-token failed'),job,secret='secret-token')
        self.assertNotIn('secret-token',trace.snapshot()['lastError']['message'])
        trace.done(job)
        self.assertEqual(trace.snapshot()['active'],[])
        self.assertEqual(trace.snapshot()['lastError']['jobId'],'a')

    def test_single_worker_lock(self):
        with tempfile.TemporaryDirectory() as directory:
            config = str(Path(directory)/'config.json')
            with single_worker(config):
                with self.assertRaises(RuntimeError):
                    with single_worker(config): pass

    def test_rejects_non_source_urls(self):
        for url in ('http://127.0.0.1/a', 'https://vimg.gabs.biz.evil.test/a', 'https://user:pw@vimg.gabs.biz/a', 'https://vimg.gabs.biz:444/a', 'file:///etc/passwd'):
            with self.assertRaises(ValueError):
                safe_url(url)

    def test_enqueue_deduplicates_without_mutating_vehicle(self):
        class Cloud:
            def __init__(self): self.calls = []
            def call(self, action, **data): self.calls.append((action, data))
        cloud = Cloud()
        url = 'https://vimg.gabs.biz/AJN335/l/1.jpeg'
        vehicle = {'id': 'TEST', 'imageUrl': url, 'imageUrls': [url]}
        result = enqueue(cloud, [vehicle, vehicle])
        self.assertEqual(result['submitted'], 1)
        self.assertEqual(vehicle['imageUrl'], url)
        self.assertEqual(cloud.calls[0][0], 'enqueue')


if __name__ == '__main__':
    unittest.main()
