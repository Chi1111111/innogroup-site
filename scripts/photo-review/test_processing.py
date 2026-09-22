import unittest
import tempfile
import threading
from urllib.error import HTTPError
import numpy as np
import cv2
from pathlib import Path
from image_processing import detect, repair, classify
from cloud_worker import safe_url, enqueue, process, work, single_worker, SourceGate
from unittest.mock import patch


class ProcessingTests(unittest.TestCase):
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

    def test_two_stage_overlap_is_bounded(self):
        started = threading.Barrier(2)
        class Cloud:
            def call(self, action, **data): return {'job': {'id': 'test'}}
        def fake_process(*args):
            started.wait(timeout=2)
            return {'status':'approved'}
        with patch('cloud_worker.process', side_effect=fake_process) as process_mock:
            work(Cloud(), 2)
        self.assertEqual(process_mock.call_count, 2)

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
